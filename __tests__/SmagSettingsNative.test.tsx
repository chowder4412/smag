import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SmagSettingsNative } from "@/screens/native/SmagSettingsNative";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

const mockAuthenticateWithBiometrics = jest.fn();
const mockSaveBiometricCredential = jest.fn();
const mockClearBiometricCredential = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/ThemeContext", () => ({
  useTheme: () => ({ isDark: false, toggleTheme: jest.fn(), colors: {} })
}));

jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => Promise.resolve({ fullName: "Alex Foodie", email: "alex@smag.com", avatarUri: "" }),
  subscribeUserProfile: () => () => {},
  resetUserProfile: jest.fn()
}));

jest.mock("@/lib/firebase/auth", () => ({
  auth: { currentUser: { email: "alex@smag.com" } },
  firebaseSignOut: jest.fn()
}));

jest.mock("@/lib/startupState", () => ({
  clearOnboardingPending: jest.fn()
}));

jest.mock("@/lib/sessionSecurity", () => ({
  getSessionTimeoutMinutes: () => Promise.resolve(5),
  setSessionTimeoutMinutes: jest.fn()
}));

jest.mock("@/lib/biometrics", () => ({
  isBiometricAvailable: () => Promise.resolve(true),
  isBiometricEnabled: () => Promise.resolve(false),
  getBiometricTypeLabel: () => Promise.resolve("Face ID"),
  authenticateWithBiometrics: () => mockAuthenticateWithBiometrics(),
  saveBiometricCredential: (...args: unknown[]) => mockSaveBiometricCredential(...args),
  clearBiometricCredential: () => mockClearBiometricCredential()
}));

describe("SmagSettingsNative Biometrics Toggle", () => {
  beforeEach(() => {
    mockAuthenticateWithBiometrics.mockReset();
    mockSaveBiometricCredential.mockReset();
    mockClearBiometricCredential.mockReset();
  });

  it("renders Face ID toggle when biometrics are available on device", async () => {
    const { getByText } = render(<SmagSettingsNative />);
    await waitFor(() => {
      expect(getByText("Face ID Login")).toBeTruthy();
    });
  });

  it("enables biometrics when user authenticates via Face ID", async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue(true);
    const { getByTestId, getByText } = render(<SmagSettingsNative />);

    await waitFor(() => {
      expect(getByText("Face ID Login")).toBeTruthy();
    });

    const bioSwitch = getByTestId("settings-biometrics-switch");
    fireEvent(bioSwitch, "valueChange", true);

    await waitFor(() => {
      expect(mockAuthenticateWithBiometrics).toHaveBeenCalled();
      expect(mockSaveBiometricCredential).toHaveBeenCalledWith("alex@smag.com");
    });
  });

  it("clears biometrics when user toggles off", async () => {
    const { getByTestId, getByText } = render(<SmagSettingsNative />);

    await waitFor(() => {
      expect(getByText("Face ID Login")).toBeTruthy();
    });

    const bioSwitch = getByTestId("settings-biometrics-switch");
    fireEvent(bioSwitch, "valueChange", false);

    await waitFor(() => {
      expect(mockClearBiometricCredential).toHaveBeenCalled();
    });
  });

  it("navigates to Edit Profile from top profile card", async () => {
    const { getByTestId } = render(<SmagSettingsNative />);
    fireEvent.press(getByTestId("settings-edit-profile-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_edit_profile");
  });

  it("navigates to Edit Profile from Account section row", async () => {
    const { getByTestId } = render(<SmagSettingsNative />);
    fireEvent.press(getByTestId("settings-profile-details-row"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_edit_profile");
  });

  it("navigates to Change Password from Account section row", async () => {
    const { getByTestId } = render(<SmagSettingsNative />);
    fireEvent.press(getByTestId("settings-change-password-row"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_change_password");
  });

  it("cycles session timeout on row press", async () => {
    const { setSessionTimeoutMinutes } = require("@/lib/sessionSecurity");
    const { getByTestId, findByText } = render(<SmagSettingsNative />);
    const timeoutRow = getByTestId("settings-session-timeout-row");

    fireEvent.press(timeoutRow);
    await waitFor(() => {
      expect(setSessionTimeoutMinutes).toHaveBeenCalledWith(10);
    });
  });

  it("navigates back when back button is pressed", () => {
    const { getByTestId } = render(<SmagSettingsNative />);
    fireEvent.press(getByTestId("settings-back-btn"));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
