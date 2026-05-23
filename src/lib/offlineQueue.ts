/**
 * Offline queue for cart mutations.
 *
 * When the device is offline, addToCart / updateCartItemQty calls are
 * persisted to AsyncStorage. When the connection restores, the queue is
 * replayed automatically.
 *
 * Usage:
 *   import { enqueueCartMutation, flushCartQueue } from "@/lib/offlineQueue";
 */

import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { addToCart, updateCartItemQty, type CartItem } from "@/lib/firebase/firestore";

const QUEUE_KEY = "smag_offline_cart_queue";
const isNative = Platform.OS !== "web";

type AddMutation = {
  type: "add";
  userId: string;
  item: Omit<CartItem, "id" | "userId">;
};

type UpdateMutation = {
  type: "update";
  cartItemId: string;
  quantity: number;
};

type CartMutation = AddMutation | UpdateMutation;

async function readQueue(): Promise<CartMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as CartMutation[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: CartMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // storage unavailable — fail silently
  }
}

/** Add a cart mutation to the offline queue */
export async function enqueueCartMutation(mutation: CartMutation): Promise<void> {
  const queue = await readQueue();
  queue.push(mutation);
  await writeQueue(queue);
}

/** Replay all queued mutations against Firestore, then clear the queue */
export async function flushCartQueue(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const failed: CartMutation[] = [];

  for (const mutation of queue) {
    try {
      if (mutation.type === "add") {
        await addToCart(mutation.userId, mutation.item);
      } else {
        await updateCartItemQty(mutation.cartItemId, mutation.quantity);
      }
    } catch {
      failed.push(mutation);
    }
  }

  // Keep only the ones that failed — retry next time
  await writeQueue(failed);
}

/** Subscribe to network state and flush the queue whenever connection restores */
export function startOfflineQueueListener(): () => void {
  let wasOffline = false;

  const unsub = NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected === true && state.isInternetReachable !== false;

    if (!isOnline) {
      wasOffline = true;
      return;
    }

    if (wasOffline) {
      wasOffline = false;
      void flushCartQueue();
    }
  });

  return unsub;
}
