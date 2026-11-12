import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SmagEditProfileNative } from "@/screens/native/SmagEditProfileNative";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

const mockUpdateUserProfile = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/firebase/auth", () => ({
  getCurrentUser: () => ({ uid: "test-user-123" })
}));

jest.mock("@/lib/firebase/storage", () => ({
  uploadProfileImageToFirebase: jest.fn().mockResolvedValue("https://storage.smag.com/avatar.jpg")
}));

jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => Promise.resolve({
    fullName: "Chef Marco",
    email: "marco@smag.com",
    phone: "+2348012345678",
    birthday: "12/25/1990",
    address: "12 Victoria Island",
    avatarUri: "https://example.com/avatar.jpg"
  }),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
  pickProfileImageFromDevice: jest.fn()
}));

describe("SmagEditProfileNative Screen", () => {
  beforeEach(() => {
    mockRouter.back.mockReset();
    mockRouter.replace.mockReset();
    mockUpdateUserProfile.mockReset();
  });

  it("loads and displays user profile fields", async () => {
    const { findByDisplayValue } = render(<SmagEditProfileNative />);
    expect(await findByDisplayValue("Chef Marco")).toBeTruthy();
    expect(await findByDisplayValue("marco@smag.com")).toBeTruthy();
    expect(await findByDisplayValue("+2348012345678")).toBeTruthy();
    expect(await findByDisplayValue("12 Victoria Island")).toBeTruthy();
  });

  it("shows validation error on empty full name", async () => {
    const { getByTestId, findByText, findByDisplayValue } = render(<SmagEditProfileNative />);
    await findByDisplayValue("Chef Marco");

    const nameInput = getByTestId("edit-profile-name");
    fireEvent.changeText(nameInput, "");

    const saveBtn = getByTestId("save-profile-btn");
    fireEvent.press(saveBtn);

    expect(await findByText("Full name is required.")).toBeTruthy();
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it("shows validation error on invalid email", async () => {
    const { getByTestId, findByText, findByDisplayValue } = render(<SmagEditProfileNative />);
    await findByDisplayValue("marco@smag.com");

    const emailInput = getByTestId("edit-profile-email");
    fireEvent.changeText(emailInput, "not-an-email");

    const saveBtn = getByTestId("save-profile-btn");
    fireEvent.press(saveBtn);

    expect(await findByText("Enter a valid email address.")).toBeTruthy();
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it("updates user profile and navigates back to profile on successful submit", async () => {
    mockUpdateUserProfile.mockResolvedValue({});
    const { getByTestId, findByDisplayValue } = render(<SmagEditProfileNative />);
    await findByDisplayValue("Chef Marco");

    fireEvent.changeText(getByTestId("edit-profile-name"), "Marco Pierre White");
    fireEvent.changeText(getByTestId("edit-profile-address"), "Gourmet Plaza 55");

    fireEvent.press(getByTestId("save-profile-btn"));

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(expect.objectContaining({
        fullName: "Marco Pierre White",
        address: "Gourmet Plaza 55"
      }));
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_profile");
    });
  });
});
