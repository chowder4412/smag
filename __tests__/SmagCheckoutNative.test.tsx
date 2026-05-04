import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { SmagCheckoutNative } from "../src/screens/native/SmagCheckoutNative";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" }
}));
jest.mock("@/lib/firebase/auth", () => ({ getCurrentUser: () => ({ uid: "u1", email: "chef@smag.com" }) }));
jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => Promise.resolve({ email: "chef@smag.com", avatarUri: "" })
}));
jest.mock("@/components/AppImage", () => ({ AppImage: () => null }));

const mockGetCartItems = jest.fn();
const mockCreateOrder = jest.fn();
const mockClearCart = jest.fn();

jest.mock("@/lib/firebase/firestore", () => ({
  getCartItems: (...args: unknown[]) => mockGetCartItems(...args),
  createOrder: (...args: unknown[]) => mockCreateOrder(...args),
  clearCart: (...args: unknown[]) => mockClearCart(...args),
  subscribeAddresses: (_uid: string, cb: (a: { isDefault: boolean; title: string; text: string }[]) => void) => {
    cb([{ isDefault: true, title: "Home", text: "123 Main St" }]);
    return () => {};
  }
}));

describe("SmagCheckoutNative", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockGetCartItems.mockReset();
    mockCreateOrder.mockReset();
    mockClearCart.mockReset();
  });

  it("shows empty cart message when cart is empty", async () => {
    mockGetCartItems.mockResolvedValue([]);
    const { getByText } = render(<SmagCheckoutNative />);
    await waitFor(() => expect(getByText("Your cart is empty.")).toBeTruthy());
  });

  it("renders cart items and total when cart has items", async () => {
    mockGetCartItems.mockResolvedValue([
      { id: "1", name: "Truffle Pasta", price: 18000, quantity: 2, imageUrl: "", menuItemId: "m1", restaurantId: "r1", restaurantName: "L'Artiste" }
    ]);
    const { getByText } = render(<SmagCheckoutNative />);
    await waitFor(() => expect(getByText("2x Truffle Pasta")).toBeTruthy());
  });

  it("places cash order and navigates to track order", async () => {
    mockGetCartItems.mockResolvedValue([
      { id: "1", name: "Pasta", price: 10000, quantity: 1, imageUrl: "", menuItemId: "m1", restaurantId: "r1", restaurantName: "Bistro" }
    ]);
    mockCreateOrder.mockResolvedValue("order-123");
    mockClearCart.mockResolvedValue(undefined);

    const { getByTestId, getByText } = render(<SmagCheckoutNative />);
    await waitFor(() => expect(getByText(/Pasta/)).toBeTruthy());
    fireEvent.press(getByText("Cash"));
    await waitFor(() => expect(getByText("Place Order (Cash)")).toBeTruthy());
    fireEvent.press(getByTestId("checkout-place-order-button"));

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/smag_track_order?orderId=order-123");
    });
  });

  it("navigates to payment screen for paystack", async () => {
    mockGetCartItems.mockResolvedValue([
      { id: "1", name: "Pasta", price: 10000, quantity: 1, imageUrl: "", menuItemId: "m1", restaurantId: "r1", restaurantName: "Bistro" }
    ]);
    mockCreateOrder.mockResolvedValue("order-456");

    const { getByTestId, getByText } = render(<SmagCheckoutNative />);
    await waitFor(() => expect(getByText(/Pasta/)).toBeTruthy());
    fireEvent.press(getByTestId("checkout-place-order-button"));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining("/smag_payment?orderId=order-456")
      );
    });
  });
});
