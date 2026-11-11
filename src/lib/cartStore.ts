import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  subscribeCart,
  updateCartItemQty,
  clearCart as firestoreClearCart,
  type CartItem
} from "@/lib/firebase/firestore";
import { enqueueCartMutation } from "@/lib/offlineQueue";

export type CartStoreState = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
};

let currentItems: CartItem[] = [];
let isLoading = true;
let activeUid: string | null = null;
let firestoreUnsub: (() => void) | null = null;

const storeListeners = new Set<(state: CartStoreState) => void>();

function calculateSummary(items: CartItem[]) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { itemCount, subtotal };
}

function getSnapshot(): CartStoreState {
  const { itemCount, subtotal } = calculateSummary(currentItems);
  return {
    items: [...currentItems],
    itemCount,
    subtotal,
    loading: isLoading
  };
}

function notifySubscribers() {
  const snapshot = getSnapshot();
  storeListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // Ignore subscriber errors
    }
  });
}

/**
 * Initializes single Firestore listener for the signed-in user.
 * Reuses the single real-time channel across all components.
 */
export function ensureCartSubscription(uid: string): () => void {
  if (activeUid === uid && firestoreUnsub) {
    return () => {};
  }

  // Teardown previous if user changed
  if (firestoreUnsub) {
    firestoreUnsub();
    firestoreUnsub = null;
  }

  activeUid = uid;
  isLoading = true;
  notifySubscribers();

  firestoreUnsub = subscribeCart(
    uid,
    (items) => {
      currentItems = items;
      isLoading = false;
      notifySubscribers();
    },
    () => {
      isLoading = false;
      notifySubscribers();
    }
  );

  return () => {};
}

/**
 * Tear down the shared cart listener (e.g., on sign-out).
 */
export function teardownCartSubscription(): void {
  if (firestoreUnsub) {
    firestoreUnsub();
    firestoreUnsub = null;
  }
  activeUid = null;
  currentItems = [];
  isLoading = false;
  notifySubscribers();
}

/**
 * Subscribe to cart changes. Returns unsubscribe function.
 */
export function subscribeCartStore(listener: (state: CartStoreState) => void): () => void {
  storeListeners.add(listener);
  listener(getSnapshot());

  const user = getCurrentUser();
  if (user?.uid) {
    ensureCartSubscription(user.uid);
  }

  return () => {
    storeListeners.delete(listener);
  };
}

/**
 * React hook returning full reactive cart state.
 */
export function useCartStore(): CartStoreState {
  const [state, setState] = useState<CartStoreState>(getSnapshot);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.uid) {
      ensureCartSubscription(user.uid);
    }
    return subscribeCartStore(setState);
  }, []);

  return state;
}

/**
 * React hook returning current total item count in cart.
 * Shares the unified cart subscription with zero duplicate network reads.
 */
export function useCartCount(): number {
  const [count, setCount] = useState<number>(() => calculateSummary(currentItems).itemCount);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.uid) {
      ensureCartSubscription(user.uid);
    }
    return subscribeCartStore((s) => setCount(s.itemCount));
  }, []);

  return count;
}

/**
 * Optimistically adjusts item quantity in memory and reconciles with Firestore/offline queue.
 */
export async function changeCartItemQuantity(
  item: CartItem,
  delta: number,
  isOnline = true
): Promise<void> {
  const newQty = Math.max(0, Math.min(9, item.quantity + delta));

  // Optimistic memory update
  if (newQty === 0) {
    currentItems = currentItems.filter((i) => i.id !== item.id);
  } else {
    currentItems = currentItems.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i));
  }
  notifySubscribers();

  if (!isOnline) {
    await enqueueCartMutation({ type: "update", cartItemId: item.id, quantity: newQty });
    return;
  }

  try {
    await updateCartItemQty(item.id, newQty);
  } catch (err) {
    // Revert on failure
    notifySubscribers();
    throw err;
  }
}

/**
 * Optimistically clears the cart in memory and syncs with Firestore.
 */
export async function clearUserCart(userId: string): Promise<void> {
  currentItems = [];
  notifySubscribers();
  await firestoreClearCart(userId);
}
