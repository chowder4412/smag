import { getApp, getApps, initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe
} from "firebase/firestore";

import { firebaseConfig } from "./config";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ─── Types ────────────────────────────────────────────────────────────────────

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  restaurantId: string;
};

export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  basePrice?: number;
  price: number;
  imageUrl: string;
  quantity: number;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  customizations?: { label: string; value: string; extraCost: number }[];
};

export type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  MenuItemCustomization,
  OrderItem,
  Order,
  BusinessRole,
  BusinessPermission,
  AdminRank
} from "@/types/shared";

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "order_update" | "promo" | "system";
  read: boolean;
  orderId?: string;
  createdAt: Date | null;
};

export type FirestoreUserProfile = {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  avatarUri: string;
  updatedAt: Date | null;
};

export type StoredPaymentMethod = {
  id: string;
  type: "card";
  label: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
  createdAtIso: string;
};

export type PaymentPreferences = {
  wallet: "apple" | "google";
  methods: StoredPaymentMethod[];
};

function normalizePaymentPreferences(data: unknown): PaymentPreferences {
  const raw = data as Partial<PaymentPreferences> | undefined;
  const methods = Array.isArray(raw?.methods)
    ? raw.methods.filter((m): m is StoredPaymentMethod =>
        Boolean(
          m &&
          m.type === "card" &&
          typeof m.id === "string" &&
          typeof m.last4 === "string" &&
          typeof m.expiry === "string"
        )
      )
    : [];
  return {
    wallet: raw?.wallet === "apple" ? "apple" : "google",
    methods
  };
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export function subscribeMenuItems(
  restaurantId: string,
  onData: (items: MenuItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "menu_items"),
    where("restaurantId", "==", restaurantId),
    where("available", "==", true)
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem))),
    (err) => onError?.(err)
  );
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export function subscribeCart(
  userId: string,
  onData: (items: CartItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, "carts"), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CartItem))),
    (err) => onError?.(err)
  );
}

export async function addToCart(
  userId: string,
  item: Omit<CartItem, "id" | "userId">
): Promise<void> {
  await addDoc(collection(db, "carts"), { ...item, userId, createdAt: serverTimestamp() });
}

export async function updateCartItemQty(cartItemId: string, quantity: number): Promise<void> {
  if (quantity <= 0) { await deleteDoc(doc(db, "carts", cartItemId)); return; }
  await setDoc(doc(db, "carts", cartItemId), { quantity }, { merge: true });
}

export async function clearCart(userId: string): Promise<void> {
  const snap = await getDocs(query(collection(db, "carts"), where("userId", "==", userId)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const snap = await getDocs(query(collection(db, "carts"), where("userId", "==", userId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CartItem));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "orders"), {
    ...order,
    assignedDriverUid: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

export function subscribeOrders(
  userId: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void,
  limitCount = 20
): Unsubscribe {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? null,
      updatedAt: d.data().updatedAt?.toDate?.() ?? null
    } as Order))),
    (err) => onError?.(err)
  );
}

export function subscribeOrder(
  orderId: string,
  onData: (order: Order | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "orders", orderId),
    (snap) => {
      if (!snap.exists()) { onData(null); return; }
      onData({
        id: snap.id,
        ...snap.data(),
        createdAt: snap.data().createdAt?.toDate?.() ?? null,
        updatedAt: snap.data().updatedAt?.toDate?.() ?? null
      } as Order);
    },
    (err) => onError?.(err)
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function subscribeNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (err: Error) => void,
  limitCount = 50
): Unsubscribe {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? null
    } as AppNotification))),
    (err) => onError?.(err)
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
}

export async function createNotification(
  notification: Omit<AppNotification, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    ...notification,
    createdAt: serverTimestamp()
  });
}

// ─── User Profile (Firestore) ─────────────────────────────────────────────────

export async function saveUserProfileToFirestore(profile: Omit<FirestoreUserProfile, "updatedAt">): Promise<void> {
  await setDoc(doc(db, "users", profile.uid), {
    ...profile,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function getUserProfileFromFirestore(uid: string): Promise<FirestoreUserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return {
    ...snap.data(),
    updatedAt: snap.data().updatedAt?.toDate?.() ?? null
  } as FirestoreUserProfile;
}

export function subscribeUserProfileFirestore(
  uid: string,
  onData: (profile: FirestoreUserProfile | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "users", uid),
    (snap) => {
      if (!snap.exists()) { onData(null); return; }
      onData({
        ...snap.data(),
        updatedAt: snap.data().updatedAt?.toDate?.() ?? null
      } as FirestoreUserProfile);
    },
    (err) => onError?.(err)
  );
}

// ─── Saved Addresses ─────────────────────────────────────────────────────────

// Payment preferences live on the existing user document. Store masked card
// metadata only; Paystack owns card charging and sensitive card data.
export function subscribePaymentPreferences(
  userId: string,
  onData: (preferences: PaymentPreferences) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "users", userId),
    (snap) => onData(normalizePaymentPreferences(snap.data()?.paymentPreferences)),
    (err) => onError?.(err)
  );
}

async function getPaymentPreferences(userId: string): Promise<PaymentPreferences> {
  const snap = await getDoc(doc(db, "users", userId));
  return normalizePaymentPreferences(snap.data()?.paymentPreferences);
}

async function savePaymentPreferences(userId: string, preferences: PaymentPreferences): Promise<void> {
  await setDoc(doc(db, "users", userId), { paymentPreferences: preferences }, { merge: true });
}

export async function saveWalletPreference(userId: string, wallet: "apple" | "google"): Promise<void> {
  const preferences = await getPaymentPreferences(userId);
  await savePaymentPreferences(userId, { ...preferences, wallet });
}

export async function addStoredPaymentMethod(
  userId: string,
  input: Omit<StoredPaymentMethod, "id" | "type" | "isDefault" | "createdAtIso">
): Promise<void> {
  const preferences = await getPaymentPreferences(userId);
  const methods = [...preferences.methods];
  methods.push({
    id: `card_${Date.now()}`,
    type: "card",
    ...input,
    isDefault: methods.length === 0,
    createdAtIso: new Date().toISOString()
  });
  await savePaymentPreferences(userId, { ...preferences, methods });
}

export async function setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
  const preferences = await getPaymentPreferences(userId);
  await savePaymentPreferences(userId, {
    ...preferences,
    methods: preferences.methods.map((method) => ({
      ...method,
      isDefault: method.id === methodId
    }))
  });
}

export async function deleteStoredPaymentMethod(userId: string, methodId: string): Promise<void> {
  const preferences = await getPaymentPreferences(userId);
  const remaining = preferences.methods.filter((method) => method.id !== methodId);
  const hasDefault = remaining.some((method) => method.isDefault);
  await savePaymentPreferences(userId, {
    ...preferences,
    methods: remaining.map((method, index) => ({
      ...method,
      isDefault: hasDefault ? method.isDefault : index === 0
    }))
  });
}

export type SavedAddress = {
  id: string;
  userId: string;
  title: string;
  text: string;
  icon: string;
  isDefault: boolean;
};

export function subscribeAddresses(
  userId: string,
  onData: (addresses: SavedAddress[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, "addresses"), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedAddress))),
    (err) => onError?.(err)
  );
}

export async function addAddress(address: Omit<SavedAddress, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "addresses"), address);
  return ref.id;
}

export async function deleteAddress(addressId: string): Promise<void> {
  await deleteDoc(doc(db, "addresses", addressId));
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  const snap = await getDocs(query(collection(db, "addresses"), where("userId", "==", userId)));
  await Promise.all(snap.docs.map((d) =>
    updateDoc(d.ref, { isDefault: d.id === addressId })
  ));
}

// ─── Points ───────────────────────────────────────────────────────────────────

export type PointsEntry = {
  id: string;
  userId: string;
  title: string;
  meta: string;
  points: number;
  createdAt: Date | null;
};

export async function getUserPoints(userId: string): Promise<number> {
  const snap = await getDoc(doc(db, "users", userId));
  return (snap.data()?.points as number) ?? 0;
}


export function subscribePoints(
  userId: string,
  onData: (points: number, history: PointsEntry[]) => void
): Unsubscribe {
  let latestPoints = 0;
  let latestHistory: PointsEntry[] = [];

  const unsubUser = onSnapshot(doc(db, "users", userId), (snap) => {
    latestPoints = (snap.data()?.points as number) ?? 0;
    onData(latestPoints, latestHistory);
  });

  const historyQ = query(
    collection(db, "points_history"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const unsubHistory = onSnapshot(historyQ, (snap) => {
    latestHistory = snap.docs.map((d) => ({
      id: d.id, ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? null
    } as PointsEntry));
    onData(latestPoints, latestHistory);
  });

  return () => { unsubUser(); unsubHistory(); };
}

// ─── External Restaurants ────────────────────────────────────────────────────

export type ExternalRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  deliveryMinutes: string;
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  latitude: number;
  longitude: number;
  address: string;
  tags: string[];
};

export type ExternalMenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  customisations?: { label: string; options: { name: string; extraCost: number }[] }[];
};

export function subscribeExternalRestaurants(
  onData: (restaurants: ExternalRestaurant[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  // Fetch ALL approved restaurants (open and closed) so customers can see closed ones
  const q = query(
    collection(db, "external_restaurants"),
    where("status", "==", "approved")
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExternalRestaurant))),
    (err) => onError?.(err)
  );
}

export function subscribeExternalMenuItems(
  restaurantId: string,
  onData: (items: ExternalMenuItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "external_menu_items"),
    where("restaurantId", "==", restaurantId),
    where("available", "==", true)
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExternalMenuItem))),
    (err) => onError?.(err)
  );
}

// ─── Promo Codes ─────────────────────────────────────────────────────────────

export type PromoCode = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrder: number;
  maxDiscount: number;
  active: boolean;
  usageLimit: number;
  usageCount: number;
  expiresAt: Date | null;
};

export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; discount: number; message: string; promoId?: string }> {
  const snap = await getDocs(
    query(collection(db, "promo_codes"), where("code", "==", code.trim().toUpperCase()), limit(1))
  );
  if (snap.empty) return { valid: false, discount: 0, message: "Invalid promo code." };

  const d = snap.docs[0];
  const promo = { id: d.id, ...d.data(), expiresAt: d.data().expiresAt?.toDate?.() ?? null } as PromoCode;

  if (!promo.active) return { valid: false, discount: 0, message: "This promo code is no longer active." };
  if (promo.expiresAt && promo.expiresAt < new Date()) return { valid: false, discount: 0, message: "This promo code has expired." };
  if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) return { valid: false, discount: 0, message: "This promo code has reached its usage limit." };
  if (subtotal < promo.minOrder) return { valid: false, discount: 0, message: `Minimum order of \u20a6${promo.minOrder.toLocaleString()} required.` };

  const raw = promo.discountType === "percent"
    ? Math.round(subtotal * promo.discountValue / 100)
    : promo.discountValue;
  const discount = promo.maxDiscount > 0 ? Math.min(raw, promo.maxDiscount) : raw;

  return { valid: true, discount, message: `\u20a6${discount.toLocaleString()} discount applied!`, promoId: promo.id };
}

export async function incrementPromoUsage(promoId: string): Promise<void> {
  await updateDoc(doc(db, "promo_codes", promoId), { usageCount: increment(1) });
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderItems(userId: string, order: Order): Promise<void> {
  await clearCart(userId);
  await Promise.all(
    order.items.map((item) =>
      addToCart(userId, {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName
      })
    )
  );
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export type FavoriteItem = {
  id: string;
  userId: string;
  menuItemId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  restaurantId: string;
  restaurantName: string;
  createdAt: Date | null;
};

export function subscribeFavorites(
  userId: string,
  onData: (items: FavoriteItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "favorites"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({
      id: d.id, ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? null
    } as FavoriteItem))),
    (err) => onError?.(err)
  );
}

export async function addFavorite(
  userId: string,
  item: Omit<FavoriteItem, "id" | "userId" | "createdAt">
): Promise<void> {
  // Use a deterministic ID so duplicate adds are idempotent
  const favId = `${userId}_${item.menuItemId}`;
  await setDoc(doc(db, "favorites", favId), {
    ...item,
    userId,
    createdAt: serverTimestamp()
  });
}

export async function removeFavorite(userId: string, menuItemId: string): Promise<void> {
  await deleteDoc(doc(db, "favorites", `${userId}_${menuItemId}`));
}

export async function isFavorite(userId: string, menuItemId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "favorites", `${userId}_${menuItemId}`));
  return snap.exists();
}

// ─── Referrals ───────────────────────────────────────────────────────────────

export type ReferralEntry = {
  id: string;
  referrerId: string;
  refereeName: string;
  status: "pending" | "completed";
  pointsAwarded: number;
  createdAt: Date | null;
};

export type LeaderboardEntry = {
  uid: string;
  displayName: string;
  avatarUri: string;
  referralCount: number;
  rank: number;
};

export function subscribeReferralHistory(
  userId: string,
  onData: (entries: ReferralEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "referrals"),
    where("referrerId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({
      id: d.id, ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? null
    } as ReferralEntry))),
    (err) => onError?.(err)
  );
}

export async function getReferralLeaderboard(): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(
    query(collection(db, "users"), orderBy("referralCount", "desc"), limit(20))
  );
  return snap.docs.map((d, i) => ({
    uid: d.id,
    displayName: String(d.data().fullName ?? d.data().displayName ?? "Anonymous"),
    avatarUri: String(d.data().avatarUri ?? ""),
    referralCount: Number(d.data().referralCount ?? 0),
    rank: i + 1
  }));
}

export async function getUserReferralCode(userId: string): Promise<string> {
  const snap = await getDoc(doc(db, "users", userId));
  if (snap.exists() && snap.data().referralCode) {
    return String(snap.data().referralCode);
  }
  // Generate and persist a code if not set
  const code = `SMAG-${userId.slice(0, 6).toUpperCase()}`;
  await setDoc(doc(db, "users", userId), { referralCode: code }, { merge: true });
  return code;
}

// ─── Vouchers ───────────────────────────────────────────────────────────────

export type Voucher = {
  id: string;
  userId: string;
  title: string;
  amount: string;
  minOrder: number;
  expiresAt: Date | null;
  used: boolean;
  usedAt: Date | null;
};

export function subscribeVouchers(
  userId: string,
  onData: (vouchers: Voucher[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "vouchers"),
    where("userId", "==", userId),
    orderBy("expiresAt", "asc"),
    limit(30)
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({
      id: d.id, ...d.data(),
      expiresAt: d.data().expiresAt?.toDate?.() ?? null,
      usedAt: d.data().usedAt?.toDate?.() ?? null
    } as Voucher))),
    (err) => onError?.(err)
  );
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export type Promotion = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  active: boolean;
};

export function subscribePromotions(
  onData: (promos: Promotion[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, "promotions"), where("active", "==", true));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion))),
    (err) => onError?.(err)
  );
}

