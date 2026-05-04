import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { SmagSignUpNative } from "../src/screens/native/SmagSignUpNative";

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn()
};

const mockFirebaseSignUp = jest.fn();
const mockMarkOnboardingPending = jest.fn();
const mockUpdateUserProfile = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/firebase/auth", () => ({
  firebaseSignUp: (...args: unknown[]) => mockFirebaseSignUp(...args),
  getFirebaseAuthErrorMessage: () => "Sign-up failed"
}));

jest.mock("@/lib/firebase/firestore", () => ({
  saveUserProfileToFirestore: () => Promise.resolve()
}));

jest.mock("@/lib/startupState", () => ({
  markOnboardingPending: () => mockMarkOnboardingPending()
}));

jest.mock("@/lib/userProfile", () => ({
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args)
}));

describe("SmagSignUpNative", () => {
  beforeEach(() => {
    mockRouter.replace.mockReset();
    mockRouter.push.mockReset();
    mockFirebaseSignUp.mockReset();
    mockMarkOnboardingPending.mockReset();
    mockUpdateUserProfile.mockReset();
  });

  it("shows validation errors on empty form submit", async () => {
    const { getByText, queryByText } = render(<SmagSignUpNative />);

    fireEvent.press(getByText("Create Account"));

    await waitFor(() => {
      expect(queryByText("Full name is required.")).toBeTruthy();
      expect(queryByText("Email is required.")).toBeTruthy();
      expect(queryByText("Phone number is required.")).toBeTruthy();
      expect(queryByText("Password is required.")).toBeTruthy();
    });
  });

  it("shows terms error when terms not accepted", async () => {
    const { getByText, getByTestId, queryByText } = render(<SmagSignUpNative />);

    fireEvent.changeText(getByTestId("signup-full-name"), "Alex Thompson");
    fireEvent.changeText(getByTestId("signup-email-address"), "alex@smag.com");
    fireEvent.changeText(getByTestId("signup-phone-number"), "+12345678901");
    fireEvent.changeText(getByTestId("signup-password"), "password123");
    // Do NOT press terms checkbox
    fireEvent.press(getByText("Create Account"));

    await waitFor(() => {
      expect(queryByText("Accept the terms and conditions to continue.")).toBeTruthy();
    });
    expect(mockFirebaseSignUp).not.toHaveBeenCalled();
  });

  it("shows Firebase error message on sign-up failure", async () => {
    mockFirebaseSignUp.mockRejectedValue(new Error("Sign-up failed"));

    const { getByText, getByTestId, queryByText } = render(<SmagSignUpNative />);
    fireEvent.changeText(getByTestId("signup-full-name"), "Alex Thompson");
    fireEvent.changeText(getByTestId("signup-email-address"), "alex@smag.com");
    fireEvent.changeText(getByTestId("signup-phone-number"), "+12345678901");
    fireEvent.changeText(getByTestId("signup-password"), "password123");
    fireEvent.press(getByText("I agree to the", { exact: false }));
    fireEvent.press(getByText("Create Account"));

    await waitFor(() => {
      expect(queryByText("Sign-up failed")).toBeTruthy();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("creates account, marks onboarding, and routes to welcome", async () => {
    mockFirebaseSignUp.mockResolvedValue({ uid: "user-1" });
    mockUpdateUserProfile.mockResolvedValue(undefined);
    mockMarkOnboardingPending.mockResolvedValue(undefined);

    const { getByText, getByTestId } = render(<SmagSignUpNative />);

    fireEvent.changeText(getByTestId("signup-full-name"), "Alex Thompson");
    fireEvent.changeText(getByTestId("signup-email-address"), "alex@smag.com");
    fireEvent.changeText(getByTestId("signup-phone-number"), "+12345678901");
    fireEvent.changeText(getByTestId("signup-password"), "password123");
    // acceptedTerms defaults to false — must check the box before submitting
    fireEvent.press(getByText("I agree to the", { exact: false }));
    fireEvent.press(getByText("Create Account"));

    await waitFor(() => {
      expect(mockFirebaseSignUp).toHaveBeenCalledWith("alex@smag.com", "password123", "Alex Thompson");
      expect(mockUpdateUserProfile).toHaveBeenCalled();
      expect(mockMarkOnboardingPending).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_welcome");
    });
  });
});
