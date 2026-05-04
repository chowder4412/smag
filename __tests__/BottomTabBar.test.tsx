import React from "react";
import { render } from "@testing-library/react-native";

import { BottomTabBar } from "../src/components/navigation/BottomTabBar";

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/smag_home"
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 })
}));

jest.mock("@/lib/firebase/firestore", () => ({
  subscribeCart: (_uid: string, cb: (items: { quantity: number }[]) => void) => {
    cb([{ quantity: 2 }, { quantity: 1 }]);
    return () => {};
  },
  subscribeNotifications: (_uid: string, cb: (notifs: { read: boolean }[]) => void) => {
    cb([{ read: false }, { read: true }]);
    return () => {};
  }
}));

jest.mock("@/lib/firebase/auth", () => ({
  getCurrentUser: () => ({ uid: "user-1" })
}));

describe("BottomTabBar", () => {
  it("renders all 4 tab labels", () => {
    const { getByText } = render(<BottomTabBar />);
    expect(getByText("HOME")).toBeTruthy();
    expect(getByText("EXPLORE")).toBeTruthy();
    expect(getByText("ORDERS")).toBeTruthy();
    expect(getByText("PROFILE")).toBeTruthy();
  });

  it("applies active style to HOME when on /smag_home", () => {
    const { getByText } = render(<BottomTabBar />);
    const label = getByText("HOME");
    expect(label.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#ffefeb" })])
    );
  });

  it("shows cart badge count on ORDERS tab", () => {
    const { getByText } = render(<BottomTabBar />);
    // 2 + 1 = 3 items in cart
    expect(getByText("3")).toBeTruthy();
  });

  it("shows unread notification badge on PROFILE tab", () => {
    const { getByText } = render(<BottomTabBar />);
    // 1 unread notification
    expect(getByText("1")).toBeTruthy();
  });
});
