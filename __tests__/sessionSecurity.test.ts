import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getSessionTimeoutMinutes,
  isSessionLocked,
  lockSession,
  setSessionTimeoutMinutes,
  signOutAndExitSession,
  subscribeSessionLock,
  unlockSessionWithBiometrics,
  unlockSessionWithPassword
} from "@/lib/sessionSecurity";

const mockReauthenticateWithCredential = jest.fn();
const mockFirebaseSignOut = jest.fn();
const mockAuthenticateWithBiometrics = jest.fn();
const mockIsBiometricAvailable = jest.fn();
const mockIsBiometricEnabled = jest.fn();

jest.mock("firebase/auth", () => ({
  EmailAuthProvider: {
    credential: jest.fn((email, password) => ({ email, password }))
  },
  reauthenticateWithCredential: (...args: unknown[]) => mockReauthenticateWithCredential(...args)
}));

jest.mock("@/lib/firebase/auth", () => ({
  auth: {
    currentUser: {
      uid: "test-user-123",
      email: "chef@smag.com",
      displayName: "Chef Pierre"
    }
  },
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

  it("signs out and clears session lock on switch account", async () => {
    await lockSession();
    const onExit = jest.fn();
    await signOutAndExitSession(onExit);

    expect(isSessionLocked()).toBe(false);
    expect(mockFirebaseSignOut).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalled();
  });
});
