import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SmagProfileNative } from "@/screens/native/SmagProfileNative";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/firebase/auth", () => ({
  getCurrentUser: () => ({ uid: "test-user-123" }),
  firebaseSignOut: jest.fn()
}));

jest.mock("@/lib/firebase/firestore", () => ({
  subscribePoints: (_uid: string, cb: (pts: number) => void) => {
    cb(1500);
    return () => {};
  },
  subscribeOrders: (_uid: string, cb: (orders: unknown[]) => void) => {
    cb([{ id: "order-1" }, { id: "order-2" }]);
    return () => {};
  }
}));

jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => Promise.resolve({
    fullName: "Elena Rostova",
    email: "elena@smag.com",
    phone: "+1234567890",
    birthday: "01/15/1995",
    address: "742 Evergreen Terrace",
    avatarUri: "https://example.com/avatar.jpg"
  }),
  subscribeUserProfile: (cb: (p: unknown) => void) => {
    cb({
      fullName: "Elena Rostova",
      email: "elena@smag.com",
      phone: "+1234567890",
      birthday: "01/15/1995",
      address: "742 Evergreen Terrace",
      avatarUri: "https://example.com/avatar.jpg"
    });
    return () => {};
  },
  resetUserProfile: jest.fn()
}));

jest.mock("@/lib/startupState", () => ({
  clearOnboardingPending: jest.fn()
}));

describe("SmagProfileNative Screen", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
  });

  it("renders profile name and stats accurately", async () => {
    const { findByText } = render(<SmagProfileNative />);
    expect(await findByText("Elena Rostova")).toBeTruthy();
    expect(await findByText("1.5k")).toBeTruthy(); // 1500 points
    expect(await findByText("2")).toBeTruthy(); // 2 orders
  });

  it("navigates to Settings when settings button is pressed", async () => {
    const { getByTestId } = render(<SmagProfileNative />);
    fireEvent.press(getByTestId("profile-settings-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_settings");
  });

  it("navigates to Edit Profile when profile avatar is pressed", async () => {
    const { getByTestId } = render(<SmagProfileNative />);
    fireEvent.press(getByTestId("profile-edit-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_edit_profile");
  });

  it("navigates to Profile Settings when list item is pressed", async () => {
    const { findByText } = render(<SmagProfileNative />);
    const profileSettingsItem = await findByText("Profile Settings");
    fireEvent.press(profileSettingsItem);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_edit_profile");
  });

  it("navigates to Account & Settings when list item is pressed", async () => {
    const { findByText } = render(<SmagProfileNative />);
    const accountSettingsItem = await findByText("Account & Settings");
    fireEvent.press(accountSettingsItem);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_settings");
  });

  it("handles logout and redirects to login", async () => {
    const { findByText } = render(<SmagProfileNative />);
    const logoutBtn = await findByText(/Logout Elena Rostova/i);
    fireEvent.press(logoutBtn);

    const { firebaseSignOut } = require("@/lib/firebase/auth");
    await waitFor(() => {
      expect(firebaseSignOut).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_login");
    });
  });
});

