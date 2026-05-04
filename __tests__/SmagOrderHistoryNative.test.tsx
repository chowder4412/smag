import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";

import { SmagOrderHistoryNative } from "../src/screens/native/SmagOrderHistoryNative";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/lib/firebase/auth", () => ({ getCurrentUser: () => ({ uid: "u1" }) }));
jest.mock("@/components/AppImage", () => ({ AppImage: () => null }));
jest.mock("@/components/CartBadgeIcon", () => ({ CartBadgeIcon: () => null }));

let orderCb: ((orders: unknown[]) => void) | null = null;

jest.mock("@/lib/firebase/firestore", () => ({
  subscribeOrders: (_uid: string, cb: (orders: unknown[]) => void) => {
    orderCb = cb;
    return () => {};
  }
}));

const mockOrder = {
  id: "ord-1",
  restaurantName: "L'Artiste Bistro",
  total: 24000,
  status: "delivered",
  items: [{ name: "Truffle Pasta", quantity: 1, imageUrl: "" }],
  deliveryAddress: "123 Main St",
  paymentMethod: "Card",
  createdAt: new Date()
};

describe("SmagOrderHistoryNative", () => {
  beforeEach(() => {
    orderCb = null;
    mockRouter.push.mockReset();
  });

  it("shows empty state when no orders", async () => {
    const { getByText } = render(<SmagOrderHistoryNative />);
    act(() => orderCb!([]));
    await waitFor(() => expect(getByText("No orders yet")).toBeTruthy());
  });

  it("renders order cards when orders exist", async () => {
    const { getByText } = render(<SmagOrderHistoryNative />);
    act(() => orderCb!([mockOrder]));
    await waitFor(() => {
      expect(getByText("L'Artiste Bistro")).toBeTruthy();
      expect(getByText("₦24,000")).toBeTruthy();
    });
  });

  it("shows correct summary counts", async () => {
    const { getAllByText } = render(<SmagOrderHistoryNative />);
    act(() => orderCb!([mockOrder]));
    await waitFor(() => {
      expect(getAllByText("1").length).toBeGreaterThan(0); // total orders
    });
  });

  it("navigates to track order when Track is pressed", async () => {
    const inProgressOrder = { ...mockOrder, status: "on_delivery" };
    const { getByText } = render(<SmagOrderHistoryNative />);
    act(() => orderCb!([inProgressOrder]));
    await waitFor(() => expect(getByText("Track")).toBeTruthy());
    const { fireEvent } = require("@testing-library/react-native");
    fireEvent.press(getByText("Track"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_track_order?orderId=ord-1");
  });
});
