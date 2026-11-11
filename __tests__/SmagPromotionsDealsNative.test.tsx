import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SmagPromotionsDealsNative } from "../src/screens/native/SmagPromotionsDealsNative";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => Promise.resolve({ avatarUri: "https://example.com/avatar.png" }),
  subscribeUserProfile: () => () => {}
}));

describe("SmagPromotionsDealsNative", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
  });

  it("navigates to /smag_profile when profile avatar is clicked", () => {
    const { getByLabelText } = render(<SmagPromotionsDealsNative />);
    const profileBtn = getByLabelText("View profile");
    expect(profileBtn).toBeTruthy();

    fireEvent.press(profileBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_profile");
  });

  it("navigates to /smag_notifications when notification bell is clicked", () => {
    const { getByLabelText } = render(<SmagPromotionsDealsNative />);
    const notifBtn = getByLabelText("View notifications");
    expect(notifBtn).toBeTruthy();

    fireEvent.press(notifBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_notifications");
  });
});

