import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
  OAuthProvider,
  onAuthStateChanged,
  PhoneAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User
} from "firebase/auth";
import { Platform } from "react-native";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { firebaseConfig } from "./config";
import { db } from "./firestore";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch {
    return getAuth(app);
  }
})();

let authReadyPromise: Promise<User | null> | null = null;

export function waitForAuthReady() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!authReadyPromise) {
    authReadyPromise = new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
  return authReadyPromise;
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function forceTokenRefresh(): Promise<boolean> {
  try {
    if (!auth.currentUser) return false;
    await auth.currentUser.getIdToken(true);
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (
      e?.code === "auth/user-token-expired" ||
      e?.code === "auth/user-disabled" ||
      e?.code === "auth/user-not-found"
    ) {
      await signOut(auth);
      return false;
    }
    return true;
  }
}

export async function syncGoogleUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        fullName: user.displayName || "Gourmet Guest",
        email: user.email || "",
        phone: user.phoneNumber || "",
        birthday: "",
        address: "",
        avatarUri: user.photoURL || "",
        role: "customer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      const data = snap.data();
      const updates: Record<string, unknown> = {};
      if (!data?.avatarUri && user.photoURL) updates.avatarUri = user.photoURL;
      if (!data?.fullName && user.displayName) updates.fullName = user.displayName;
      if (!data?.email && user.email) updates.email = user.email;
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        await setDoc(userRef, updates, { merge: true });
      }
    }
  } catch (err) {
    console.warn("[syncGoogleUserProfile] Could not sync user profile:", err);
  }
}

export async function firebaseSignUp(email: string, password: string, displayName?: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }
  return credential.user;
}

export async function firebaseSignIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function firebaseSignInWithGoogle(idToken?: string): Promise<User> {
  // If an explicit ID token was passed, use it directly (e.g. from a custom provider or test)
  if (idToken) {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    await syncGoogleUserProfile(result.user);
    return result.user;
  }

  // Web environment: browser popup flow
  if (Platform.OS === "web") {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    await syncGoogleUserProfile(result.user);
    return result.user;
  }

  // Mobile environment: native Google Sign-In
  const Constants = (await import("expo-constants")).default;
  if (Constants.appOwnership === "expo") {
    throw new Error(
      "Google Sign-In on mobile requires a development build (run:android / eas build) or web test, as native Google Sign-In is not supported inside Expo Go."
    );
  }

  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured.");
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId: Platform.OS === "ios" ? iosClientId : undefined,
    offlineAccess: false
  });

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const signInResult = await GoogleSignin.signIn();
  const token =
    signInResult.data?.idToken ||
    (signInResult as unknown as { idToken?: string })?.idToken;

  if (!token) {
    throw new Error("Google Sign-In failed: no ID token returned.");
  }

  const credential = GoogleAuthProvider.credential(token);
  const result = await signInWithCredential(auth, credential);
  await syncGoogleUserProfile(result.user);
  return result.user;
}

export async function firebaseSignInWithGoogleNative(): Promise<User> {
  return firebaseSignInWithGoogle();
}

export async function firebaseSignInWithApple(identityToken: string, nonce: string): Promise<User> {
  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function firebaseSendPhoneOtp(phoneNumber: string, recaptchaToken: string): Promise<string> {
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber(
    { phoneNumber, session: recaptchaToken as never },
    recaptchaToken as never
  );
  return verificationId;
}

export async function firebaseVerifyPhoneOtp(verificationId: string, otp: string): Promise<User> {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function firebaseUpdatePassword(currentPassword: string, nextPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error("You need to sign in with email before changing your password.");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, nextPassword);
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

const ERROR_MAP: Record<string, string> = {
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-password": "Password is required.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account exists with this email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password is too weak. Use at least 8 characters.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/invalid-verification-code": "Invalid OTP code. Please try again.",
  "auth/code-expired": "OTP code has expired. Please request a new one.",
  "auth/requires-recent-login": "Please sign in again before changing your password.",
  "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
  "auth/popup-blocked": "Sign-in popup was blocked by your browser. Please allow popups.",
  "auth/cancelled-popup-request": "Sign-in popup request was cancelled.",
  "auth/account-exists-with-different-credential": "An account already exists with the same email using a different sign-in method.",
  "auth/credential-already-in-use": "This account is already linked to another profile.",
  "SIGN_IN_CANCELLED": "Sign-in was cancelled.",
  "IN_PROGRESS": "Sign-in is already in progress.",
  "PLAY_SERVICES_NOT_AVAILABLE": "Google Play Services is not available or outdated."
};

type FirebaseErrorLike = { code?: string; message?: string };

export function getFirebaseAuthErrorMessage(error: unknown) {
  const typed = error as FirebaseErrorLike;
  if (typed?.code && ERROR_MAP[typed.code]) return ERROR_MAP[typed.code];
  if (typed?.message) return typed.message;
  return "Something went wrong. Please try again.";
}
