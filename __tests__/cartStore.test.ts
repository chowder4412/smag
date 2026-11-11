import {
  ensureCartSubscription,
  subscribeCartStore,
  changeCartItemQuantity,
  clearUserCart,
  teardownCartSubscription
} from "@/lib/cartStore";
import { type CartItem } from "@/lib/firebase/firestore";

let mockCartSnapshot: (items: CartItem[]) => void = () => {};
const mockUpdateCartItemQty = jest.fn();
const mockClearCart = jest.fn();

jest.mock("@/lib/firebase/auth", () => ({
  getCurrentUser: () => ({ uid: "test-user-123" })
}));

jest.mock("@/lib/firebase/firestore", () => ({
  subscribeCart: (_uid: string, onData: (items: CartItem[]) => void) => {
    mockCartSnapshot = onData;
    return jest.fn();
  },
  updateCartItemQty: (...args: unknown[]) => mockUpdateCartItemQty(...args),
  clearCart: (...args: unknown[]) => mockClearCart(...args)
}));

jest.mock("@/lib/offlineQueue", () => ({
  enqueueCartMutation: jest.fn().mockResolvedValue(undefined)
}));

describe("cartStore", () => {
  beforeEach(() => {
    teardownCartSubscription();
    mockUpdateCartItemQty.mockReset();
    mockClearCart.mockReset();
  });

  it("calculates summary totals correctly when items are emitted", () => {
    let latestState: { itemCount: number; subtotal: number } | null = null;
    const unsub = subscribeCartStore((state) => {
      latestState = state;
    });

    ensureCartSubscription("test-user-123");

    const sampleItems: CartItem[] = [
      {
        id: "c1",
        menuItemId: "m1",
        name: "Truffle Pasta",
        price: 15000,
        quantity: 2,
        imageUrl: "",
        userId: "test-user-123",
        restaurantId: "r1",
        restaurantName: "Luigi"
      },
      {
        id: "c2",
        menuItemId: "m2",
        name: "Gelato",
        price: 4500,
        quantity: 1,
        imageUrl: "",
        userId: "test-user-123",
        restaurantId: "r1",
        restaurantName: "Luigi"
      }
    ];

    mockCartSnapshot(sampleItems);

    expect(latestState).not.toBeNull();
    expect(latestState?.itemCount).toBe(3);
    expect(latestState?.subtotal).toBe(34500);

    unsub();
  });

  it("handles quantity change and triggers Firestore sync when online", async () => {
    mockUpdateCartItemQty.mockResolvedValue(undefined);

    const item: CartItem = {
      id: "c1",
      menuItemId: "m1",
      name: "Truffle Pasta",
      price: 15000,
      quantity: 1,
      imageUrl: "",
      userId: "test-user-123",
      restaurantId: "r1",
      restaurantName: "Luigi"
    };

    await changeCartItemQuantity(item, 1, true);
    expect(mockUpdateCartItemQty).toHaveBeenCalledWith("c1", 2);
  });

  it("clears user cart and updates subscribers", async () => {
    mockClearCart.mockResolvedValue(undefined);

    let latestCount = -1;
    const unsub = subscribeCartStore((state) => {
      latestCount = state.itemCount;
    });

    await clearUserCart("test-user-123");
    expect(latestCount).toBe(0);
    expect(mockClearCart).toHaveBeenCalledWith("test-user-123");

    unsub();
  });
});
