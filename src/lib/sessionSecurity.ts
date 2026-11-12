import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus, Platform } from "react-native";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";

import {
  auth,
  firebaseSetAccountPassword,
  firebaseSignOut,
  getUserAuthProviderInfo
} from "@/lib/firebase/auth";
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  isBiometricEnabled
} from "@/lib/biometrics";
import { checkRateLimit, recordRateLimitAttempt, resetRateLimit } from "@/lib/rateLimiter";

export { getUserAuthProviderInfo };

const TIMEOUT_MINUTES_KEY = "@smag_session_timeout_minutes";
const LAST_ACTIVE_KEY = "@smag_last_active_timestamp";
const BACKGROUNDED_AT_KEY = "@smag_backgrounded_at_timestamp";
const SESSION_LOCKED_KEY = "@smag_session_is_locked";

export const DEFAULT_TIMEOUT_MINUTES = 5; // 5 minutes standard background timeout

let currentTimeoutMs = DEFAULT_TIMEOUT_MINUTES * 60 * 1000;
let lastActiveTimestamp = Date.now();
let backgroundedAtTimestamp: number | null = null;
let isSessionLockedState = false;
let isInitialized = false;

type LockListener = (isLocked: boolean) => void;
const lockListeners = new Set<LockListener>();

function notifyListeners(locked: boolean) {
  isSessionLockedState = locked;
  lockListeners.forEach((listener) => {
    try {
      listener(locked);
    } catch {
      // Ignore listener error
    }
  });
}

/**
 * Subscribe to session lock changes (used by SessionLockOverlay).
 */
export function subscribeSessionLock(listener: LockListener): () => void {
  lockListeners.add(listener);
  listener(isSessionLockedState);
  return () => {
    lockListeners.delete(listener);
  };
}

export function isSessionLocked(): boolean {
  return isSessionLockedState;
}

/**
 * Get configured session timeout in minutes.
 */
export async function getSessionTimeoutMinutes(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(TIMEOUT_MINUTES_KEY);
    if (!raw) return DEFAULT_TIMEOUT_MINUTES;
    const val = parseInt(raw, 10);
    return isNaN(val) ? DEFAULT_TIMEOUT_MINUTES : val;
  } catch {
    return DEFAULT_TIMEOUT_MINUTES;
  }
}

/**
 * Set configured session timeout in minutes (0 means disabled).
 */
export async function setSessionTimeoutMinutes(minutes: number): Promise<void> {
  const safeMins = Math.max(0, minutes);
  currentTimeoutMs = safeMins * 60 * 1000;
  try {
    await AsyncStorage.setItem(TIMEOUT_MINUTES_KEY, safeMins.toString());
  } catch {
    // Non-fatal
  }
}

/**
 * Record user activity to refresh last active timestamp.
 */
export function recordUserActivity(): void {
  lastActiveTimestamp = Date.now();
  void AsyncStorage.setItem(LAST_ACTIVE_KEY, lastActiveTimestamp.toString()).catch(() => {});
}

/**
 * Manually lock session.
 */
export async function lockSession(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return; // Do not lock unauthenticated users
  isSessionLockedState = true;
  notifyListeners(true);
  try {
    await AsyncStorage.setItem(SESSION_LOCKED_KEY, "1");
  } catch {
    // Non-fatal
  }
}

/**
 * Unlock session using password with rate limiting.
 */
export async function unlockSessionWithPassword(password: string): Promise<{
  success: boolean;
  message?: string;
  isLockedOut?: boolean;
}> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    return { success: false, message: "No active user session found. Please sign in again." };
  }

  const authInfo = getUserAuthProviderInfo();
  if (!authInfo.hasPassword && authInfo.hasGoogle) {
    return {
      success: false,
      message: "This account was created with Google and has no password. Please unlock with Google or set an account password."
    };
  }

  // 1. Rate Limit Check
  const rateLimitStatus = await checkRateLimit("session_unlock", user.uid);
  if (!rateLimitStatus.allowed) {
    return {
      success: false,
      message: rateLimitStatus.message || "Too many failed attempts. Please try again later.",
      isLockedOut: true
    };
  }

  // 2. Authenticate
  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Reset rate limiter & clear lock state
    await recordRateLimitAttempt("session_unlock", user.uid, true);
    recordUserActivity();
    backgroundedAtTimestamp = null;
    isSessionLockedState = false;
    notifyListeners(false);
    await AsyncStorage.removeItem(SESSION_LOCKED_KEY);

    return { success: true };
  } catch {
    // Record failed attempt
    const postAttemptStatus = await recordRateLimitAttempt("session_unlock", user.uid, false);
    return {
      success: false,
      message: postAttemptStatus.message || "Incorrect password. Please try again.",
      isLockedOut: postAttemptStatus.isLocked
    };
  }
}

/**
 * Unlock session using device biometrics or device PIN/passcode.
 */
export async function unlockSessionWithBiometrics(): Promise<{ success: boolean; message?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, message: "No active user session found." };
  }

  const available = await isBiometricAvailable();
  if (!available) {
    return { success: false, message: "Device security authentication is not available on this device." };
  }

  const success = await authenticateWithBiometrics();
  if (success) {
    await resetRateLimit("session_unlock", user.uid);
    recordUserActivity();
    backgroundedAtTimestamp = null;
    isSessionLockedState = false;
    notifyListeners(false);
    await AsyncStorage.removeItem(SESSION_LOCKED_KEY);
    return { success: true };
  }

  return { success: false, message: "Device authentication was cancelled or failed." };
}

/**
 * Unlock session using Google OAuth re-authentication.
 */
export async function unlockSessionWithGoogle(): Promise<{
  success: boolean;
  message?: string;
}> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, message: "No active user session found." };
  }

  const rateLimitStatus = await checkRateLimit("session_unlock", user.uid);
  if (!rateLimitStatus.allowed) {
    return {
      success: false,
      message: rateLimitStatus.message || "Too many failed attempts. Please try again later."
    };
  }

  try {
    if (Platform.OS === "web") {
      const { signInWithPopup } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      if (result.user.uid !== user.uid) {
        return {
          success: false,
          message: "Selected Google account does not match this session."
        };
      }
    } else {
      const Constants = (await import("expo-constants")).default;
      if (Constants.appOwnership === "expo") {
        // Fallback in Expo Go where native Google module is not bundled
        const success = await authenticateWithBiometrics();
        if (!success) {
          return {
            success: false,
            message: "Google verification inside Expo Go requires device authentication."
          };
        }
      } else {
        const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
        const webClientId =
          process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
          process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
        const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

        if (webClientId) {
          GoogleSignin.configure({
            webClientId,
            iosClientId: Platform.OS === "ios" ? iosClientId : undefined,
            offlineAccess: false
          });
        }

        if (Platform.OS === "android") {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        }

        const signInResult = await GoogleSignin.signIn();
        const token =
          signInResult.data?.idToken ||
          (signInResult as unknown as { idToken?: string })?.idToken;

        if (!token) {
          return { success: false, message: "No Google credentials returned." };
        }

        const credential = GoogleAuthProvider.credential(token);
        await reauthenticateWithCredential(user, credential);
      }
    }

    await recordRateLimitAttempt("session_unlock", user.uid, true);
    recordUserActivity();
    backgroundedAtTimestamp = null;
    isSessionLockedState = false;
    notifyListeners(false);
    await AsyncStorage.removeItem(SESSION_LOCKED_KEY);
    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const code = errorObj?.code || "";
    const msg = errorObj?.message || "";

    if (
      code === "SIGN_IN_CANCELLED" ||
      msg.includes("12501") ||
      msg.toLowerCase().includes("cancelled") ||
      msg.toLowerCase().includes("canceled")
    ) {
      return { success: false, message: "Google unlock was cancelled." };
    }

    if (code === "auth/user-mismatch") {
      return {
        success: false,
        message: "The Google account selected does not match this session."
      };
    }

    const postAttemptStatus = await recordRateLimitAttempt("session_unlock", user.uid, false);
    return {
      success: false,
      message: postAttemptStatus.message || "Google verification failed. Please try again."
    };
  }
}

/**
 * Set a password for an account created with OAuth and immediately unlock the session.
 */
export async function setPasswordAndUnlockSession(newPassword: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    return { success: false, message: "No active user session found." };
  }

  try {
    await firebaseSetAccountPassword(newPassword);
    await recordRateLimitAttempt("session_unlock", user.uid, true);
    recordUserActivity();
    backgroundedAtTimestamp = null;
    isSessionLockedState = false;
    notifyListeners(false);
    await AsyncStorage.removeItem(SESSION_LOCKED_KEY);
    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    return {
      success: false,
      message: errorObj?.message || "Could not set account password. Please try again."
    };
  }
}

/**
 * Sign out and clear session lock (allows user to switch accounts).
 */
export async function signOutAndExitSession(onSignedOut?: () => void): Promise<void> {
  isSessionLockedState = false;
  notifyListeners(false);
  backgroundedAtTimestamp = null;
  try {
    await AsyncStorage.multiRemove([SESSION_LOCKED_KEY, LAST_ACTIVE_KEY, BACKGROUNDED_AT_KEY]);
    await firebaseSignOut();
    onSignedOut?.();
  } catch {
    onSignedOut?.();
  }
}

/**
 * Initialize session security lifecycle listeners.
 */
export function initSessionSecurity(): () => void {
  if (isInitialized) {
    return () => {};
  }
  isInitialized = true;

  // Load saved timeout preference
  void getSessionTimeoutMinutes().then((mins) => {
    currentTimeoutMs = mins * 60 * 1000;
  });

  // Check if session was locked prior to app launch / background kill
  void AsyncStorage.getItem(SESSION_LOCKED_KEY).then((val) => {
    if (val === "1" && auth.currentUser) {
      isSessionLockedState = true;
      notifyListeners(true);
    }
  });

  let previousState: AppStateStatus = AppState.currentState;

  const appStateSub = AppState.addEventListener("change", async (nextState: AppStateStatus) => {
    const user = auth.currentUser;

    if (previousState === "active" && (nextState === "background" || nextState === "inactive")) {
      // Transitioning away from app: mark timestamp
      const now = Date.now();
      backgroundedAtTimestamp = now;
      await AsyncStorage.setItem(BACKGROUNDED_AT_KEY, now.toString());
    } else if ((previousState === "background" || previousState === "inactive") && nextState === "active") {
      // Returning to app: evaluate time away
      const now = Date.now();
      let awayStart = backgroundedAtTimestamp;
      if (!awayStart) {
        const stored = await AsyncStorage.getItem(BACKGROUNDED_AT_KEY);
        if (stored) awayStart = parseInt(stored, 10);
      }

      if (user && currentTimeoutMs > 0 && awayStart) {
        const elapsed = now - awayStart;
        if (elapsed >= currentTimeoutMs) {
          await lockSession();
        }
      }
      backgroundedAtTimestamp = null;
      await AsyncStorage.removeItem(BACKGROUNDED_AT_KEY);
    }

    previousState = nextState;
  });

  return () => {
    appStateSub.remove();
    isInitialized = false;
  };
}
