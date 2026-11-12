import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SmagOrderHistoryNative } from "@/screens/native/SmagOrderHistoryNative";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

const mockCurrentUser = { uid: "test-user-123" };
jest.mock("@/lib/firebase/auth", () => ({
  getCurrentUser: () => mockCurrentUser
}));

const mockReorderItems = jest.fn().mockResolvedValue(undefined);

const sampleOrders = [
  {
    id: "ord-active-1",
    restaurantId: "smag_kitchen",
    restaurantName: "Smag Kitchen",
    status: "preparing",
    total: 12500,
    items: [
      { menuItemId: "m1", name: "Jollof Rice Feast", price: 5500, quantity: 2, imageUrl: "https://example.com/jollof.jpg" },
      { menuItemId: "m2", name: "Fried Plantain", price: 1500, quantity: 1, imageUrl: "https://example.com/plantain.jpg" }
    ],
    createdAt: new Date("2026-11-10T14:30:00Z")
  },
  {
    id: "ord-delivered-2",
    restaurantId: "ocean_garden",
    restaurantName: "Ocean Garden Seafood",
    status: "delivered",
    total: 18500,
    items: [
      { menuItemId: "m3", name: "Wild Salmon Poke Bowl", price: 18500, quantity: 1, imageUrl: "https://example.com/poke.jpg" }
    ],
    createdAt: new Date("2026-11-08T18:00:00Z")
  },
  {
    id: "ord-cancelled-3",
    restaurantId: "luigi",
    restaurantName: "Luigi Trattoria",
    status: "cancelled",
    total: 22000,
    items: [
      { menuItemId: "m4", name: "Truffle Pizza", price: 22000, quantity: 1, imageUrl: "https://example.com/pizza.jpg" }
    ],
    createdAt: new Date("2026-11-05T12:00:00Z")
  }
];

let mockOrdersList = sampleOrders;
let mockPointsValue = 2500;

jest.mock("@/lib/firebase/firestore", () => ({
  subscribeOrders: (_uid: string, onData: (orders: unknown[]) => void) => {
    onData(mockOrdersList);
    return () => {};
  },
  subscribePoints: (_uid: string, onData: (pts: number) => void) => {
    onData(mockPointsValue);
    return () => {};
  },
  reorderItems: (...args: unknown[]) => mockReorderItems(...args)
}));

let mockIsOnline = true;
jest.mock("@/lib/useNetworkStatus", () => ({
  useNetworkStatus: () => mockIsOnline
}));

jest.mock("@/components/CartBadgeIcon", () => ({
  CartBadgeIcon: () => null
}));

describe("SmagOrderHistoryNative Screen", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
    mockRouter.back.mockReset();
    mockReorderItems.mockReset();
    mockOrdersList = sampleOrders;
    mockPointsValue = 2500;
    mockIsOnline = true;
  });

  it("renders header with back and cart buttons", () => {
    const { getByTestId, getByText } = render(<SmagOrderHistoryNative />);

    expect(getByText("Order History")).toBeTruthy();
    expect(getByTestId("orders-back-btn")).toBeTruthy();
    expect(getByTestId("orders-cart-btn")).toBeTruthy();

    fireEvent.press(getByTestId("orders-back-btn"));
    expect(mockRouter.back).toHaveBeenCalled();

    fireEvent.press(getByTestId("orders-cart-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_my_cart");
  });

  it("renders summary grid with total, in-progress, delivered, and credits", () => {
    const { getByTestId, getByText } = render(<SmagOrderHistoryNative />);

    expect(getByTestId("orders-summary-total")).toBeTruthy();
    expect(getByTestId("orders-summary-in-progress")).toBeTruthy();
    expect(getByTestId("orders-summary-delivered")).toBeTruthy();
    expect(getByTestId("orders-summary-credits")).toBeTruthy();

    expect(getByText("₦2,500")).toBeTruthy();

    // Tapping credits navigates to rewards
    fireEvent.press(getByTestId("orders-summary-credits"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_membership_rewards");
  });

  it("displays active order with tracking button", () => {
    const { getByTestId, getByText } = render(<SmagOrderHistoryNative />);

    expect(getByText("Smag Kitchen")).toBeTruthy();
    expect(getByText("Preparing")).toBeTruthy();

    const trackBtn = getByTestId("track-btn-ord-active-1");
    expect(trackBtn).toBeTruthy();

    fireEvent.press(trackBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_track_order?orderId=ord-active-1");
  });

  it("displays delivered order with Rate, Receipt, and Reorder actions", async () => {
    const { getByTestId, getByText, getAllByText } = render(<SmagOrderHistoryNative />);

    expect(getByText("Ocean Garden Seafood")).toBeTruthy();
    expect(getAllByText("Delivered").length).toBeGreaterThanOrEqual(1);

    // Receipt
    const receiptBtn = getByTestId("receipt-btn-ord-delivered-2");
    fireEvent.press(receiptBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_receipt?orderId=ord-delivered-2");

    // Rate
    const rateBtn = getByTestId("rate-btn-ord-delivered-2");
    fireEvent.press(rateBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_rate_your_experience");

    // Reorder
    const reorderBtn = getByTestId("reorder-btn-ord-delivered-2");
    fireEvent.press(reorderBtn);

    await waitFor(() => {
      expect(mockReorderItems).toHaveBeenCalledWith("test-user-123", sampleOrders[1]);
      expect(mockRouter.push).toHaveBeenCalledWith("/smag_my_cart");
    });
  });

  it("renders empty state when there are no orders and allows browsing menu", () => {
    mockOrdersList = [];
    const { getByTestId, getByText } = render(<SmagOrderHistoryNative />);

    expect(getByText("No orders yet")).toBeTruthy();
    const browseBtn = getByTestId("orders-browse-menu-btn");
    expect(browseBtn).toBeTruthy();

    fireEvent.press(browseBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_menu");
  });
});
