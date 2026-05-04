import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  PhoneAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";

import { firebaseConfig } from "./config";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

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

export async function firebaseSignInWithGoogle(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function firebaseSignInWithGoogleNative(): Promise<User> {
  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set.");
  GoogleSignin.configure({ webClientId: clientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;
  if (!idToken) throw new Error("Google Sign-In failed: no ID token returned.");
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
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
  "auth/code-expired": "OTP code has expired. Please request a new one."
};

type FirebaseErrorLike = { code?: string; message?: string };

export function getFirebaseAuthErrorMessage(error: unknown) {
  const typed = error as FirebaseErrorLike;
  if (typed?.code && ERROR_MAP[typed.code]) return ERROR_MAP[typed.code];
  if (typed?.message) return typed.message;
  return "Something went wrong. Please try again.";
}
