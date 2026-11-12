import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SessionLockOverlay } from "@/components/security/SessionLockOverlay";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

let mockIsLocked = true;
let mockLockSubscriber: ((locked: boolean) => void) | null = null;
const mockUnlockSessionWithPassword = jest.fn();
const mockUnlockSessionWithGoogle = jest.fn();
const mockUnlockSessionWithBiometrics = jest.fn();
const mockSetPasswordAndUnlockSession = jest.fn();
const mockSignOutAndExitSession = jest.fn();

let mockCurrentUser: {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  providerData: Array<{ providerId: string }>;
} = {
  uid: "google-uid-123",
  email: "social@gmail.com",
  displayName: "Google User",
  photoURL: "https://example.com/avatar.jpg",
  providerData: [{ providerId: "google.com" }]
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/useAppRouter", () => ({
  useAppRouter: () => mockRouter
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
  }
}));

jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () =>
    Promise.resolve({
      fullName: "Google User",
      email: "social@gmail.com",
      avatarUri: "https://example.com/avatar.jpg"
    })
}));

jest.mock("@/lib/biometrics", () => ({
  isBiometricAvailable: () => Promise.resolve(true),
  isBiometricEnabled: () => Promise.resolve(false)
}));

jest.mock("@/lib/rateLimiter", () => ({
  checkRateLimit: () => Promise.resolve({ allowed: true, retryAfterSeconds: 0 })
}));

jest.mock("@/lib/sessionSecurity", () => ({
  isSessionLocked: () => mockIsLocked,
  subscribeSessionLock: (listener: (locked: boolean) => void) => {
    mockLockSubscriber = listener;
    listener(mockIsLocked);
    return () => {
      mockLockSubscriber = null;
    };
  },
  unlockSessionWithPassword: (...args: unknown[]) => mockUnlockSessionWithPassword(...args),
  unlockSessionWithGoogle: (...args: unknown[]) => mockUnlockSessionWithGoogle(...args),
  unlockSessionWithBiometrics: (...args: unknown[]) => mockUnlockSessionWithBiometrics(...args),
  setPasswordAndUnlockSession: (...args: unknown[]) => mockSetPasswordAndUnlockSession(...args),
  signOutAndExitSession: (cb?: () => void) => {
    mockSignOutAndExitSession();
    cb?.();
    return Promise.resolve();
  }
}));

describe("SessionLockOverlay", () => {
  beforeEach(() => {
    mockIsLocked = true;
    mockUnlockSessionWithPassword.mockReset();
    mockUnlockSessionWithGoogle.mockReset();
    mockUnlockSessionWithBiometrics.mockReset();
    mockSetPasswordAndUnlockSession.mockReset();
    mockSignOutAndExitSession.mockReset();
    mockRouter.replace.mockReset();
    mockCurrentUser = {
      uid: "google-uid-123",
      email: "social@gmail.com",
      displayName: "Google User",
      photoURL: "https://example.com/avatar.jpg",
      providerData: [{ providerId: "google.com" }]
    };
  });

  it("renders Google Unlock options for users who signed in with Google OAuth", async () => {
    const { getByTestId, getByText } = render(<SessionLockOverlay />);

    await waitFor(() => {
      expect(getByText("Session Locked")).toBeTruthy();
      expect(getByText("Signed in with Google")).toBeTruthy();
      expect(getByTestId("session-lock-google-unlock-btn")).toBeTruthy();
      expect(getByTestId("session-lock-biometric-btn")).toBeTruthy();
    });
  });

  it("unlocks session with Google when Unlock with Google is pressed", async () => {
    mockUnlockSessionWithGoogle.mockResolvedValue({ success: true });
    const { getByTestId } = render(<SessionLockOverlay />);

    await waitFor(() => {
      expect(getByTestId("session-lock-google-unlock-btn")).toBeTruthy();
    });

    fireEvent.press(getByTestId("session-lock-google-unlock-btn"));

    await waitFor(() => {
      expect(mockUnlockSessionWithGoogle).toHaveBeenCalled();
    });
  });

  it("allows Google user to open Set Password form and save a new password", async () => {
    mockSetPasswordAndUnlockSession.mockResolvedValue({ success: true });
    const { getByTestId, getByText } = render(<SessionLockOverlay />);

    await waitFor(() => {
      expect(getByTestId("session-lock-open-set-password")).toBeTruthy();
    });

    fireEvent.press(getByTestId("session-lock-open-set-password"));

    await waitFor(() => {
      expect(getByText("Set Account Password")).toBeTruthy();
      expect(getByTestId("session-lock-new-password-input")).toBeTruthy();
    });

    fireEvent.changeText(getByTestId("session-lock-new-password-input"), "mySecretPass123!");
    fireEvent.changeText(getByTestId("session-lock-confirm-password-input"), "mySecretPass123!");
    fireEvent.press(getByTestId("session-lock-save-password-btn"));

    await waitFor(() => {
      expect(mockSetPasswordAndUnlockSession).toHaveBeenCalledWith("mySecretPass123!");
    });
  });

  it("renders password field for standard email/password accounts", async () => {
    mockCurrentUser = {
      uid: "email-uid-789",
      email: "email@smag.com",
      displayName: "Email User",
      photoURL: "",
      providerData: [{ providerId: "password" }]
    };

    mockUnlockSessionWithPassword.mockResolvedValue({ success: true });

    const { getByTestId, getByText } = render(<SessionLockOverlay />);

    await waitFor(() => {
      expect(getByText("Session Locked")).toBeTruthy();
      expect(getByTestId("session-lock-password-input")).toBeTruthy();
      expect(getByTestId("session-lock-unlock-btn")).toBeTruthy();
    });

    fireEvent.changeText(getByTestId("session-lock-password-input"), "validPassword123");
    fireEvent.press(getByTestId("session-lock-unlock-btn"));

    await waitFor(() => {
      expect(mockUnlockSessionWithPassword).toHaveBeenCalledWith("validPassword123");
    });
  });

  it("signs out and redirects to login when Sign Out is pressed", async () => {
    const { getByTestId } = render(<SessionLockOverlay />);

    await waitFor(() => {
      expect(getByTestId("session-lock-signout-btn")).toBeTruthy();
    });

    fireEvent.press(getByTestId("session-lock-signout-btn"));

    await waitFor(() => {
      expect(mockSignOutAndExitSession).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_login");
    });
  });
});
