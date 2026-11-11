import {
  firebaseSignInWithGoogle,
  firebaseSignInWithGoogleNative,
  getFirebaseAuthErrorMessage,
  syncGoogleUserProfile
} from "../src/lib/firebase/auth";
import { Platform } from "react-native";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

jest.mock("firebase/app", () => ({
  getApps: () => [{ name: "[DEFAULT]" }],
  getApp: () => ({ name: "[DEFAULT]" }),
  initializeApp: jest.fn()
}));

jest.mock("firebase/auth", () => ({
  getAuth: () => ({ currentUser: null }),
  initializeAuth: () => ({ currentUser: null }),
  getReactNativePersistence: jest.fn(),
  GoogleAuthProvider: Object.assign(
    jest.fn().mockImplementation(() => ({
      setCustomParameters: jest.fn()
    })),
    { credential: jest.fn((token: string) => ({ providerId: "google.com", signInMethod: "google.com", token })) }
  ),
  signInWithCredential: jest.fn(),
  signInWithPopup: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  EmailAuthProvider: { credential: jest.fn() },
  OAuthProvider: jest.fn(),
  PhoneAuthProvider: jest.fn(),
  reauthenticateWithCredential: jest.fn()
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: () => ({}),
  doc: jest.fn((_db, coll, id) => ({ path: `${coll}/${id}`, id })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: () => "mock-timestamp"
}));

jest.mock("@/lib/firebase/config", () => ({
  firebaseConfig: {
    apiKey: "mock-key",
    authDomain: "mock.firebaseapp.com",
    projectId: "mock-project"
  }
}));

jest.mock("../src/lib/firebase/firestore", () => ({
  db: {}
}));

describe("Google Auth & Profile Sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("firebaseSignInWithGoogle", () => {
    it("authenticates directly when given an explicit idToken", async () => {
      const mockUser = { uid: "user-explicit", displayName: "Explicit User", email: "explicit@smag.ng" };
      (signInWithCredential as jest.Mock).mockResolvedValueOnce({ user: mockUser });
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await firebaseSignInWithGoogle("valid-id-token");

      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith("valid-id-token");
      expect(signInWithCredential).toHaveBeenCalled();
      expect(result.uid).toBe("user-explicit");
    });

    it("uses signInWithPopup when running on Web platform without idToken", async () => {
      const origOS = Platform.OS;
      try {
        (Platform as unknown as { OS: string }).OS = "web";
        const mockUser = { uid: "web-google-user", displayName: "Web User", email: "web@smag.ng" };
        (signInWithPopup as jest.Mock).mockResolvedValueOnce({ user: mockUser });
        (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
        (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

        const result = await firebaseSignInWithGoogle();

        expect(signInWithPopup).toHaveBeenCalled();
        expect(result.uid).toBe("web-google-user");
      } finally {
        (Platform as unknown as { OS: string }).OS = origOS;
      }
    });

    it("aliases firebaseSignInWithGoogleNative to firebaseSignInWithGoogle", async () => {
      const origOS = Platform.OS;
      try {
        (Platform as unknown as { OS: string }).OS = "web";
        const mockUser = { uid: "native-alias-user", displayName: "Native User", email: "alias@smag.ng" };
        (signInWithPopup as jest.Mock).mockResolvedValueOnce({ user: mockUser });
        (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ fullName: "Native User" }) });

        const result = await firebaseSignInWithGoogleNative();

        expect(result.uid).toBe("native-alias-user");
      } finally {
        (Platform as unknown as { OS: string }).OS = origOS;
      }
    });
  });

  describe("syncGoogleUserProfile", () => {
    it("creates a new profile if user does not exist in Firestore", async () => {
      const mockUser = {
        uid: "new-uid",
        displayName: "Ada Lovelace",
        email: "ada@smag.ng",
        phoneNumber: "+2348011223344",
        photoURL: "https://lh3.googleusercontent.com/avatar.jpg"
      };
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

      await syncGoogleUserProfile(mockUser as never);

      expect(doc).toHaveBeenCalledWith(expect.anything(), "users", "new-uid");
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          uid: "new-uid",
          fullName: "Ada Lovelace",
          email: "ada@smag.ng",
          avatarUri: "https://lh3.googleusercontent.com/avatar.jpg",
          role: "customer"
        }),
        { merge: true }
      );
    });

    it("updates existing user profile missing fields", async () => {
      const mockUser = {
        uid: "existing-uid",
        displayName: "Updated Name",
        email: "updated@smag.ng",
        photoURL: "https://lh3.googleusercontent.com/photo.jpg"
      };
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ fullName: "", email: "", avatarUri: "" })
      });

      await syncGoogleUserProfile(mockUser as never);

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fullName: "Updated Name",
          email: "updated@smag.ng",
          avatarUri: "https://lh3.googleusercontent.com/photo.jpg"
        }),
        { merge: true }
      );
    });
  });

  describe("getFirebaseAuthErrorMessage for Google Auth codes", () => {
    it("returns helpful message for popup closed", () => {
      expect(getFirebaseAuthErrorMessage({ code: "auth/popup-closed-by-user" }))
        .toBe("Sign-in popup was closed before completing.");
    });

    it("returns helpful message for popup blocked", () => {
      expect(getFirebaseAuthErrorMessage({ code: "auth/popup-blocked" }))
        .toBe("Sign-in popup was blocked by your browser. Please allow popups.");
    });

    it("returns helpful message for cancelled sign in", () => {
      expect(getFirebaseAuthErrorMessage({ code: "SIGN_IN_CANCELLED" }))
        .toBe("Sign-in was cancelled.");
    });
  });
});

