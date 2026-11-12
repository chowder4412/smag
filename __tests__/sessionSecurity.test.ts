import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getSessionTimeoutMinutes,
  getUserAuthProviderInfo,
  isSessionLocked,
  lockSession,
  setPasswordAndUnlockSession,
  setSessionTimeoutMinutes,
  signOutAndExitSession,
  subscribeSessionLock,
  unlockSessionWithBiometrics,
  unlockSessionWithGoogle,
  unlockSessionWithPassword
} from "@/lib/sessionSecurity";

const mockReauthenticateWithCredential = jest.fn();
const mockFirebaseSignOut = jest.fn();
const mockFirebaseSetAccountPassword = jest.fn();
const mockAuthenticateWithBiometrics = jest.fn();
const mockIsBiometricAvailable = jest.fn();
const mockIsBiometricEnabled = jest.fn();

let mockCurrentUser: {
  uid: string;
  email: string;
  displayName: string;
  providerData: Array<{ providerId: string }>;
} = {
  uid: "test-user-123",
  email: "chef@smag.com",
  displayName: "Chef Pierre",
  providerData: [{ providerId: "password" }]
};

jest.mock("firebase/auth", () => ({
  EmailAuthProvider: {
    credential: jest.fn((email, password) => ({ email, password }))
  },
  GoogleAuthProvider: {
    credential: jest.fn((token) => ({ token }))
  },
  reauthenticateWithCredential: (...args: unknown[]) => mockReauthenticateWithCredential(...args)
}));

jest.mock("@/lib/firebase/auth", () => ({
  get auth() {
    return { currentUser: mockCurrentUser };
  },
  getUserAuthProviderInfo: () => {
    const providers = (mockCurrentUser?.providerData || []).map((p) => p.providerId);
    const hasGoogle = providers.includes("google.com");
    const hasApple = providers.includes("apple.com");
    const hasPassword = providers.length > 0 ? providers.includes("password") : !hasGoogle;
    let primaryProvider: "password" | "google" | "apple" | "other" = "password";
    if (!hasPassword && hasGoogle) primaryProvider = "google";
    else if (!hasPassword && hasApple) primaryProvider = "apple";
    return { hasPassword, hasGoogle, hasApple, primaryProvider };
  },
  firebaseSetAccountPassword: (...args: unknown[]) => mockFirebaseSetAccountPassword(...args),
  firebaseSignOut: () => mockFirebaseSignOut()
}));

jest.mock("@/lib/biometrics", () => ({
  isBiometricAvailable: () => mockIsBiometricAvailable(),
  isBiometricEnabled: () => mockIsBiometricEnabled(),
  authenticateWithBiometrics: () => mockAuthenticateWithBiometrics()
}));

describe("sessionSecurity", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockReauthenticateWithCredential.mockReset();
    mockFirebaseSignOut.mockReset();
    mockAuthenticateWithBiometrics.mockReset();
    mockIsBiometricAvailable.mockReset();
    mockIsBiometricEnabled.mockReset();
    mockFirebaseSetAccountPassword.mockReset();
    mockCurrentUser = {
      uid: "test-user-123",
      email: "chef@smag.com",
      displayName: "Chef Pierre",
      providerData: [{ providerId: "password" }]
    };
  });

  it("manages session timeout preferences", async () => {
    expect(await getSessionTimeoutMinutes()).toBe(5);
    await setSessionTimeoutMinutes(15);
    expect(await getSessionTimeoutMinutes()).toBe(15);
  });

  it("locks session and notifies subscribers", async () => {
    let notifiedState = false;
    const unsub = subscribeSessionLock((locked) => {
      notifiedState = locked;
    });

    await lockSession();
    expect(isSessionLocked()).toBe(true);
    expect(notifiedState).toBe(true);
    unsub();
  });

  it("unlocks session with correct password", async () => {
    await lockSession();
    mockReauthenticateWithCredential.mockResolvedValue({});

    const result = await unlockSessionWithPassword("correctPassword123");
    expect(result.success).toBe(true);
    expect(isSessionLocked()).toBe(false);
  });

  it("fails to unlock with incorrect password and keeps locked", async () => {
    await lockSession();
    mockReauthenticateWithCredential.mockRejectedValue(new Error("auth/wrong-password"));

    const result = await unlockSessionWithPassword("wrongPassword");
    expect(result.success).toBe(false);
    expect(isSessionLocked()).toBe(true);
    expect(result.message).toContain("Incorrect password");
  });

  it("unlocks session with biometrics when enabled", async () => {
    await lockSession();
    mockIsBiometricAvailable.mockResolvedValue(true);
    mockIsBiometricEnabled.mockResolvedValue(true);
    mockAuthenticateWithBiometrics.mockResolvedValue(true);

    const result = await unlockSessionWithBiometrics();
    expect(result.success).toBe(true);
    expect(isSessionLocked()).toBe(false);
  });

  it("identifies Google OAuth account without password and guides user", async () => {
    mockCurrentUser = {
      uid: "google-user-456",
      email: "google@smag.com",
      displayName: "Google Gourmet",
      providerData: [{ providerId: "google.com" }]
    };

    const authInfo = getUserAuthProviderInfo();
    expect(authInfo.hasGoogle).toBe(true);
    expect(authInfo.hasPassword).toBe(false);
    expect(authInfo.primaryProvider).toBe("google");

    await lockSession();
    const result = await unlockSessionWithPassword("anyPassword");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Google");
  });

  it("unlocks session with setPasswordAndUnlockSession for Google users", async () => {
    mockCurrentUser = {
      uid: "google-user-456",
      email: "google@smag.com",
      displayName: "Google Gourmet",
      providerData: [{ providerId: "google.com" }]
    };

    await lockSession();
    expect(isSessionLocked()).toBe(true);

    mockFirebaseSetAccountPassword.mockResolvedValue(undefined);
    const result = await setPasswordAndUnlockSession("newSecurePass123!");
    expect(result.success).toBe(true);
    expect(mockFirebaseSetAccountPassword).toHaveBeenCalledWith("newSecurePass123!");
    expect(isSessionLocked()).toBe(false);
  });

  it("signs out and clears session lock on switch account", async () => {
    await lockSession();
    const onExit = jest.fn();
    await signOutAndExitSession(onExit);

    expect(isSessionLocked()).toBe(false);
    expect(mockFirebaseSignOut).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });
});
