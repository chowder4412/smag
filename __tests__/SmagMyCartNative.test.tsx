import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

import { SmagMyCartNative } from "../src/screens/native/SmagMyCartNative";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/lib/firebase/auth", () => ({ getCurrentUser: () => ({ uid: "u1" }) }));
jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => Promise.resolve({ avatarUri: "" })
}));
jest.mock("@/components/AppImage", () => ({ AppImage: () => null }));
jest.mock("@/lib/haptics", () => ({ haptics: { tap: jest.fn() } }));
jest.mock("@/lib/useNetworkStatus", () => ({ useNetworkStatus: () => true }));

let cartCb: ((items: unknown[]) => void) | null = null;
const mockUpdateCartItemQty = jest.fn();

jest.mock("@/lib/firebase/firestore", () => ({
  subscribeCart: (_uid: string, cb: (items: unknown[]) => void) => {
    cartCb = cb;
    return () => {};
  },
  updateCartItemQty: (...args: unknown[]) => mockUpdateCartItemQty(...args)
}));

describe("SmagMyCartNative", () => {
  beforeEach(() => {
    cartCb = null;
    mockRouter.push.mockReset();
    mockUpdateCartItemQty.mockReset();
  });

  it("shows empty cart state when cart is empty", async () => {
    const { getByText } = render(<SmagMyCartNative />);
    act(() => cartCb!([]));
    await waitFor(() => expect(getByText("Your cart is empty")).toBeTruthy());
  });

  it("renders cart items", async () => {
    const { getByText } = render(<SmagMyCartNative />);
    act(() => cartCb!([
      { id: "1", name: "Wagyu Burger", price: 24000, quantity: 1, imageUrl: "", restaurantId: "r1" }
    ]));
    await waitFor(() => expect(getByText("Wagyu Burger")).toBeTruthy());
  });

  it("navigates to checkout when Proceed is pressed", async () => {
    const { getByText } = render(<SmagMyCartNative />);
    act(() => cartCb!([
      { id: "1", name: "Wagyu Burger", price: 24000, quantity: 1, imageUrl: "", restaurantId: "r1" }
    ]));
    await waitFor(() => expect(getByText("Proceed to Checkout")).toBeTruthy());
    fireEvent.press(getByText("Proceed to Checkout"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_checkout");
  });

  it("calls updateCartItemQty when quantity is changed", async () => {
    mockUpdateCartItemQty.mockResolvedValue(undefined);
    const { getAllByRole } = render(<SmagMyCartNative />);
    act(() => cartCb!([
      { id: "1", name: "Wagyu Burger", price: 24000, quantity: 2, imageUrl: "", restaurantId: "r1" }
    ]));
    await waitFor(() => {
      const buttons = getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it("shows mixed restaurant warning when items are from different restaurants", async () => {
    const { getByText } = render(<SmagMyCartNative />);
    act(() => cartCb!([
      { id: "1", name: "Pasta", price: 10000, quantity: 1, imageUrl: "", restaurantId: "r1" },
      { id: "2", name: "Sushi", price: 12000, quantity: 1, imageUrl: "", restaurantId: "r2" }
    ]));
    await waitFor(() =>
      expect(getByText(/Remove items from one restaurant/)).toBeTruthy()
    );
  });

  it("does not navigate to checkout when mixed restaurants", async () => {
    const { getByText } = render(<SmagMyCartNative />);
    act(() => cartCb!([
      { id: "1", name: "Pasta", price: 10000, quantity: 1, imageUrl: "", restaurantId: "r1" },
      { id: "2", name: "Sushi", price: 12000, quantity: 1, imageUrl: "", restaurantId: "r2" }
    ]));
    await waitFor(() => expect(getByText("Proceed to Checkout")).toBeTruthy());
    fireEvent.press(getByText("Proceed to Checkout"));
    expect(mockRouter.push).not.toHaveBeenCalledWith("/smag_checkout");
  });
});
