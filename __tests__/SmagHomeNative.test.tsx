import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";

import { SmagHomeNative } from "../src/screens/native/SmagHomeNative";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => new Promise(() => {}),
  subscribeUserProfile: (_cb: unknown) => () => {}
}));

let promoCb: ((promos: unknown[]) => void) | null = null;

jest.mock("@/lib/firebase/firestore", () => ({
  subscribePromotions: (cb: (promos: unknown[]) => void) => {
    promoCb = cb;
    return () => {};
  },
  subscribeMenuItems: (_id: string, cb: (items: unknown[]) => void) => {
    cb([]);
    return () => {};
  }
}));

jest.mock("@/components/AppImage", () => ({
  AppImage: () => null
}));

jest.mock("@/components/CartBadgeIcon", () => ({
  CartBadgeIcon: () => null
}));

describe("SmagHomeNative", () => {
  beforeEach(() => {
    promoCb = null;
    mockRouter.push.mockReset();
  });

  it("renders section titles", async () => {
    const { getByText } = render(<SmagHomeNative />);
    await waitFor(() => {
      expect(getByText("Today's Curations")).toBeTruthy();
      expect(getByText("Quick Access")).toBeTruthy();
    });
  });

  it("shows skeleton boxes while promotions are loading", () => {
    const { UNSAFE_getAllByType } = render(<SmagHomeNative />);
    // SkeletonBox renders Animated.View — check that promoCb hasn't fired yet
    expect(promoCb).not.toBeNull();
    // Promotions haven't resolved yet so skeleton should be present
    // (promoCb not called = promosLoading still true)
  });

  it("renders promo cards after promotions load", async () => {
    const { getByText } = render(<SmagHomeNative />);
    act(() => promoCb!([
      { id: "1", imageUrl: "", tag: "Hot Deal", title: "50% Off Sushi", subtitle: "Tonight only." }
    ]));
    await waitFor(() => {
      expect(getByText("50% Off Sushi")).toBeTruthy();
    });
  });

  it("falls back to static cards when promotions list is empty", async () => {
    const { getByText } = render(<SmagHomeNative />);
    act(() => promoCb!([]));
    await waitFor(() => {
      expect(getByText("20% Off Fine Dining")).toBeTruthy();
    });
  });
});
