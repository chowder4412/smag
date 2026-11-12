import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import { AppImage } from "@/components/AppImage";
import { subscribeCart, updateCartItemQty, validatePromoCode, type CartItem } from "@/lib/firebase/firestore";
import { getUserProfile } from "@/lib/userProfile";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { haptics } from "@/lib/haptics";
import { enqueueCartMutation } from "@/lib/offlineQueue";
import { useAppRouter } from "@/lib/useAppRouter";

const DELIVERY_FEE = 2990;
const SERVICE_FEE = 1500;

export function SmagMyCartNative() {
  const router = useAppRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoId, setPromoId] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState("");

  useEffect(() => {
    void getUserProfile().then((p) => setAvatarUri(p.avatarUri));
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    const unsub = subscribeCart(
      user.uid,
      (items) => { setCartItems(items); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const summary = useMemo(() => {
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = promoApplied ? promoDiscount : 0;
    const total = Math.max(0, subtotal + DELIVERY_FEE + SERVICE_FEE - discount);
    return { subtotal, discount, total };
  }, [cartItems, promoApplied, promoDiscount]);

  const restaurantIds = [...new Set(cartItems.map((i) => i.restaurantId).filter(Boolean))];
  const mixedRestaurants = restaurantIds.length > 1;

  const isOnline = useNetworkStatus();

  async function handleQtyChange(item: CartItem, delta: number) {
    void haptics.tap();
    const newQty = Math.max(0, Math.min(9, item.quantity + delta));
    // Optimistic update — apply immediately, sync in background
    setCartItems((prev) =>
      newQty === 0
        ? prev.filter((i) => i.id !== item.id)
        : prev.map((i) => i.id === item.id ? { ...i, quantity: newQty } : i)
    );
    if (!isOnline) {
      await enqueueCartMutation({ type: "update", cartItemId: item.id, quantity: newQty });
      Alert.alert(
        "You're offline",
        "Cart change saved. It will sync automatically when you reconnect.",
        [{ text: "OK" }]
      );
      return;
    }
    // Fire-and-forget — Firestore snapshot will reconcile if it fails
    void updateCartItemQty(item.id, newQty);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#ff5c00" />
          </Pressable>
          <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          <Pressable onPress={() => router.push("/smag_profile")}>
          <AppImage source={{ uri: avatarUri }} style={styles.avatar} />
          </Pressable>
        </View>

        <Text style={styles.title}>My Cart</Text>
        <Text style={styles.subtitle}>Review your gourmet selections</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#a33800" style={{ marginTop: 40 }} />
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="shopping-bag" size={56} color="#ffdbc9" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Pressable style={styles.browseBtn} onPress={() => router.push("/smag_menu")}>
              <Text style={styles.browseBtnText}>Browse Menu</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {cartItems.map((item) => (
              <SwipeableCartItem
                key={item.id}
                item={item}
                onQtyChange={(delta) => handleQtyChange(item, delta)}
                onDelete={() => handleQtyChange(item, -item.quantity)}
              />
            ))}

            <View style={styles.promoWrap}>
              <TextInput
                style={styles.promoInput}
                placeholder="Promo code"
                placeholderTextColor="#80503299"
                value={promoCode}
                onChangeText={(v) => { setPromoCode(v); setPromoApplied(false); setPromoError(null); }}
                autoCapitalize="characters"
              />
              <Pressable
                style={[styles.applyBtn, promoLoading && { opacity: 0.6 }]}
                disabled={promoLoading || promoCode.trim().length < 3}
                onPress={async () => {
                  if (promoApplied) {
                    setPromoApplied(false);
                    setPromoDiscount(0);
                    setPromoId(null);
                    setPromoError(null);
                    return;
                  }
                  setPromoLoading(true);
                  setPromoError(null);
                  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
                  const result = await validatePromoCode(promoCode.trim(), subtotal);
                  setPromoLoading(false);
                  if (result.valid) {
                    setPromoApplied(true);
                    setPromoDiscount(result.discount);
                    setPromoId(result.promoId ?? null);
                  } else {
                    setPromoError(result.message);
                  }
                }}
              >
                <Text style={styles.applyText}>
                  {promoLoading ? "..." : promoApplied ? "Remove" : "Apply"}
                </Text>
              </Pressable>
            </View>
            {promoError ? <Text style={styles.promoErrorText}>{promoError}</Text> : null}
            {promoApplied ? <Text style={styles.promoSuccessText}>✓ {promoCode.toUpperCase()} applied</Text> : null}

            <View style={styles.totalBox}>
              <Row label="Subtotal" value={`₦${summary.subtotal.toLocaleString()}`} />
              <Row label="Delivery Fee" value={`₦${DELIVERY_FEE.toLocaleString()}`} />
              <Row label="Service Fee" value={`₦${SERVICE_FEE.toLocaleString()}`} />
              {promoApplied ? <Row label="Promo Discount" value={`-₦${summary.discount.toLocaleString()}`} /> : null}
              <View style={styles.totalDivider} />
              <Row label="Total" value={`₦${summary.total.toLocaleString()}`} bold />
            </View>

            <Pressable
              style={[styles.checkoutBtn, mixedRestaurants && styles.checkoutBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
              accessibilityState={{ disabled: mixedRestaurants }}
              onPress={() => {
                if (mixedRestaurants) {
                  Alert.alert(
                    "Mixed Restaurants",
                    "Your cart has items from multiple restaurants. Please keep items from one restaurant per order."
                  );
                  return;
                }
                router.push("/smag_checkout");
              }}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#ffefeb" />
            </Pressable>
            {mixedRestaurants && (
              <Text style={styles.mixedWarning}>
                ⚠️ Remove items from one restaurant to continue
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SwipeableCartItem({
  item,
  onQtyChange,
  onDelete
}: {
  item: CartItem;
  onQtyChange: (delta: number) => void;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, -100));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          // Snap open to reveal delete
          Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
        } else {
          // Snap back
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      }
    })
  ).current;

  function confirmDelete() {
    Animated.timing(translateX, { toValue: -400, duration: 220, useNativeDriver: true }).start(() => onDelete());
  }

  return (
    <View style={styles.swipeContainer} accessibilityLabel={`${item.name} cart item. Swipe left to delete.`}>
      {/* Delete action revealed behind */}
      <View style={styles.deleteAction}>
        <Pressable
          style={styles.deleteBtn}
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name} from cart`}
        >
          <MaterialIcons name="delete" size={22} color="#ffefeb" />
          <Text style={styles.deleteBtnText}>Remove</Text>
        </Pressable>
      </View>

      {/* Swipeable card */}
      <Animated.View
        style={[styles.itemCard, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <AppImage source={{ uri: item.imageUrl }} style={styles.itemImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.customizations?.length ? (
            <Text style={styles.itemCustoms} numberOfLines={2}>
              {item.customizations.map((c) => c.value).join(" • ")}
            </Text>
          ) : null}
          <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
          <View style={styles.qtyRow}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => onQtyChange(-1)}
              accessibilityRole="button"
              accessibilityLabel={`Decrease quantity of ${item.name}`}
            >
              <MaterialIcons name="remove" size={16} color="#a33800" />
            </Pressable>
            <Text style={styles.qtyValue} accessibilityLabel={`Quantity ${item.quantity}`}>{item.quantity}</Text>
            <Pressable
              style={[styles.qtyBtn, styles.qtyBtnActive]}
              onPress={() => onQtyChange(1)}
              accessibilityRole="button"
              accessibilityLabel={`Increase quantity of ${item.name}`}
            >
              <MaterialIcons name="add" size={16} color="#ffefeb" />
            </Pressable>
          </View>
        </View>
        {/* Swipe hint arrow */}
        <MaterialIcons name="chevron-left" size={18} color="#dd9f7c" style={{ alignSelf: "center" }} />
      </Animated.View>
    </View>
  );
}

function Row(props: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, props.bold && styles.rowBold]}>{props.label}</Text>
      <Text style={[styles.rowValue, props.bold && styles.totalValue]}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 36 },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  brand: { width: 80, height: 36 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  title: { color: "#4b240a", fontSize: 34, fontWeight: "900" },
  subtitle: { marginTop: 4, marginBottom: 14, color: "#805032" },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#805032", fontSize: 18, fontWeight: "700" },
  browseBtn: { backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 14 },
  browseBtnText: { color: "#ffefeb", fontWeight: "800", fontSize: 15 },
  itemCard: {
    backgroundColor: "#ffffff", borderRadius: 20, padding: 12,
    flexDirection: "row", gap: 12, marginBottom: 10
  },
  swipeContainer: { position: "relative", marginBottom: 10, borderRadius: 20, overflow: "hidden" },
  deleteAction: {
    position: "absolute", right: 0, top: 0, bottom: 0,
    width: 80, backgroundColor: "#b31b25",
    alignItems: "center", justifyContent: "center", borderRadius: 20
  },
  deleteBtn: { alignItems: "center", gap: 4 },
  deleteBtnText: { color: "#ffefeb", fontSize: 10, fontWeight: "800" },
  itemImage: { width: 88, height: 88, borderRadius: 12 },
  itemName: { color: "#4b240a", fontSize: 18, fontWeight: "800" },
  itemCustoms: { color: "#805032", fontSize: 11, lineHeight: 15, marginTop: 3 },
  itemPrice: { marginTop: 2, color: "#a33800", fontSize: 22, fontWeight: "900" },
  qtyRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center"
  },
  qtyBtnActive: { backgroundColor: "#a33800" },
  qtyValue: { width: 20, textAlign: "center", fontWeight: "800", color: "#4b240a" },
  promoWrap: {
    marginTop: 8, backgroundColor: "#ffede5", borderRadius: 16,
    padding: 4, flexDirection: "row", alignItems: "center"
  },
  promoInput: { flex: 1, paddingHorizontal: 12, color: "#4b240a" },
  applyBtn: { backgroundColor: "#a33800", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  applyText: { color: "#ffefeb", fontWeight: "800" },
  promoErrorText: { color: "#b31b25", fontSize: 12, marginTop: 4, marginLeft: 4 },
  promoSuccessText: { color: "#2f7d31", fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: "700" },
  totalBox: { marginTop: 18, gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { color: "#805032" },
  rowValue: { color: "#4b240a", fontWeight: "700" },
  rowBold: { color: "#4b240a", fontWeight: "800", fontSize: 18 },
  totalValue: { color: "#a33800", fontSize: 32, fontWeight: "900" },
  totalDivider: { marginTop: 4, height: 1, backgroundColor: "rgba(160,106,74,0.28)" },
  checkoutBtn: {
    marginTop: 18, backgroundColor: "#a33800", borderRadius: 999,
    minHeight: 54, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8
  },
  checkoutText: { color: "#ffefeb", fontSize: 17, fontWeight: "800" },
  checkoutBtnDisabled: { backgroundColor: "#a3380066" },
  mixedWarning: { marginTop: 8, textAlign: "center", color: "#b31b25", fontSize: 13, fontWeight: "700" }
});
