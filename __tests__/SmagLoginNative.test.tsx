import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { SmagLoginNative } from "../src/screens/native/SmagLoginNative";

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn()
};

const mockFirebaseSignIn = jest.fn();
const mockFirebaseSignInWithGoogleNative = jest.fn();
const mockClearOnboardingPending = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/firebase/auth", () => ({
  firebaseSignIn: (...args: unknown[]) => mockFirebaseSignIn(...args),
  firebaseSignInWithGoogleNative: (...args: unknown[]) => mockFirebaseSignInWithGoogleNative(...args),
  getFirebaseAuthErrorMessage: (err?: { message?: string }) => err?.message || "Auth failed",
  getCurrentUser: jest.fn()
}));

jest.mock("@/lib/startupState", () => ({
  clearOnboardingPending: () => mockClearOnboardingPending()
}));

jest.mock("@/lib/biometrics", () => ({
  isBiometricAvailable: () => Promise.resolve(false),
  isBiometricEnabled: () => Promise.resolve(false),
  saveBiometricCredential: () => Promise.resolve(),
  getBiometricEmail: () => Promise.resolve(null),
  authenticateWithBiometrics: () => Promise.resolve(false)
}));

const mockBiometrics = {
  isBiometricAvailable: jest.fn(),
  isBiometricEnabled: jest.fn(),
  saveBiometricCredential: jest.fn(),
  getBiometricEmail: jest.fn(),
  authenticateWithBiometrics: jest.fn()
};

jest.mock("@/lib/biometrics", () => ({
  isBiometricAvailable: (...a: unknown[]) => mockBiometrics.isBiometricAvailable(...a),
  isBiometricEnabled: (...a: unknown[]) => mockBiometrics.isBiometricEnabled(...a),
  saveBiometricCredential: (...a: unknown[]) => mockBiometrics.saveBiometricCredential(...a),
  getBiometricEmail: (...a: unknown[]) => mockBiometrics.getBiometricEmail(...a),
  authenticateWithBiometrics: (...a: unknown[]) => mockBiometrics.authenticateWithBiometrics(...a)
}));

jest.mock("@/lib/haptics", () => ({
  haptics: { success: jest.fn(), error: jest.fn(), tap: jest.fn(), select: jest.fn() }
}));

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: () => Promise.resolve(false),
  isEnrolledAsync: () => Promise.resolve(false)
}));

describe("SmagLoginNative", () => {
  beforeEach(() => {
    mockRouter.replace.mockReset();
    mockRouter.push.mockReset();
    mockFirebaseSignIn.mockReset();
    mockClearOnboardingPending.mockReset();
    mockBiometrics.isBiometricAvailable.mockResolvedValue(false);
    mockBiometrics.isBiometricEnabled.mockResolvedValue(false);
    mockBiometrics.getBiometricEmail.mockResolvedValue(null);
    mockBiometrics.authenticateWithBiometrics.mockResolvedValue(false);
    mockBiometrics.saveBiometricCredential.mockResolvedValue(undefined);
  });

  it("shows validation errors for invalid email/password", async () => {
    const { getByText, getByTestId } = render(<SmagLoginNative />);

    fireEvent.changeText(getByTestId("login-email-input"), "bad-email");
    fireEvent.changeText(getByTestId("login-password-input"), "123");
    fireEvent.press(getByText("Continue with Email"));

    await waitFor(() => {
      expect(getByText("Enter a valid email address.")).toBeTruthy();
      expect(getByText("Password must be at least 8 characters.")).toBeTruthy();
    });
    expect(mockFirebaseSignIn).not.toHaveBeenCalled();
  });

  it("signs in and routes to home on valid credentials", async () => {
    mockFirebaseSignIn.mockResolvedValue({ uid: "user-1" });
    mockClearOnboardingPending.mockResolvedValue(undefined);

    const { getByText, getByTestId } = render(<SmagLoginNative />);

    fireEvent.changeText(getByTestId("login-email-input"), "chef@smag.com");
    fireEvent.changeText(getByTestId("login-password-input"), "password123");
    fireEvent.press(getByText("Continue with Email"));

    await waitFor(() => {
      expect(mockFirebaseSignIn).toHaveBeenCalledWith("chef@smag.com", "password123");
      expect(mockClearOnboardingPending).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_home");
    });
  });

  it("auto-signs in via biometrics on mount when session is active", async () => {
    const { getCurrentUser } = require("@/lib/firebase/auth");
    getCurrentUser.mockReturnValue({ uid: "user-bio" });
    mockBiometrics.isBiometricAvailable.mockResolvedValue(true);
    mockBiometrics.isBiometricEnabled.mockResolvedValue(true);
    mockBiometrics.getBiometricEmail.mockResolvedValue("chef@smag.com");
    mockBiometrics.authenticateWithBiometrics.mockResolvedValue(true);
    mockClearOnboardingPending.mockResolvedValue(undefined);

    render(<SmagLoginNative />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_home");
    });
  });

  it("shows session expired error when biometric succeeds but no Firebase session", async () => {
    const { getCurrentUser } = require("@/lib/firebase/auth");
    getCurrentUser.mockReturnValue(null);
    mockBiometrics.isBiometricAvailable.mockResolvedValue(true);
    mockBiometrics.isBiometricEnabled.mockResolvedValue(true);
    mockBiometrics.getBiometricEmail.mockResolvedValue("chef@smag.com");
    mockBiometrics.authenticateWithBiometrics.mockResolvedValue(true);

    const { getByText } = render(<SmagLoginNative />);

    await waitFor(() => {
      expect(getByText("Session expired. Please enter your password.")).toBeTruthy();
    });
  });

  it("signs in with Google and navigates to home", async () => {
    mockFirebaseSignInWithGoogleNative.mockResolvedValue({ uid: "google-uid-123" });
    mockClearOnboardingPending.mockResolvedValue(undefined);

    const { getByText } = render(<SmagLoginNative />);
    fireEvent.press(getByText("Continue with Google"));

    await waitFor(() => {
      expect(mockFirebaseSignInWithGoogleNative).toHaveBeenCalled();
      expect(mockClearOnboardingPending).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_home");
    });
  });

  it("navigates to sign up screen when Create an Account button or link is pressed", () => {
    const { getByTestId } = render(<SmagLoginNative />);

    fireEvent.press(getByTestId("create-account-button"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_sign_up");

    mockRouter.push.mockReset();
    fireEvent.press(getByTestId("signup-link"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_sign_up");
  });
});
