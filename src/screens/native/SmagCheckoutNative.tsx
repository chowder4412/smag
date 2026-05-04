import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentUser } from "@/lib/firebase/auth";
import { clearCart, createOrder, getCartItems, subscribeAddresses, type CartItem } from "@/lib/firebase/firestore";
import { getUserProfile } from "@/lib/userProfile";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const DELIVERY_FEE = 2990;
const SERVICE_FEE = 1500;

export function SmagCheckoutNative() {
  const router = useAppRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAddressTitle, setDeliveryAddressTitle] = useState("Home");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "cash">("paystack");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    void getCartItems(user.uid).then((items) => { setCartItems(items); setLoading(false); });
    void getUserProfile().then((p) => {
      if (p.email) setUserEmail(p.email);
      if (p.avatarUri) setAvatarUri(p.avatarUri);
    });
    const unsub = subscribeAddresses(user.uid, (addresses) => {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (def) {
        setDeliveryAddress(def.text);
        setDeliveryAddressTitle(def.title);
      }
    });
    return unsub;
  }, []);

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE + SERVICE_FEE;

  async function handlePlaceOrder() {
    const user = getCurrentUser();
    if (!user || cartItems.length === 0) return;
    setPlacing(true);

    try {
      // 1. Create order in Firestore (status: pending_payment)
      const orderId = await createOrder({
        userId: user.uid,
        restaurantId: cartItems[0]?.restaurantId ?? "lartiste",
        restaurantName: cartItems[0]?.restaurantName ?? "L'Artiste Bistro",
        items: cartItems.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          imageUrl: i.imageUrl,
          quantity: i.quantity
        })),
        subtotal,
        deliveryFee: DELIVERY_FEE,
        serviceFee: SERVICE_FEE,
        total,
        status: paymentMethod === "cash" ? "confirmed" : "pending_payment",
        deliveryAddress,
        deliveryInstructions,
        paymentMethod: paymentMethod === "cash" ? "Cash on Delivery" : "Paystack"
      });

      if (paymentMethod === "cash") {
        await clearCart(user.uid);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(`/smag_track_order?orderId=${orderId}`);
        return;
      }

      // 2. Navigate to native payment screen
      router.push(`/smag_payment?orderId=${orderId}&amount=${total}&email=${encodeURIComponent(userEmail || user.email || '')}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert("Payment Error", e.message ?? "Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#4b240a" />
            </Pressable>
            <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          </View>
          <AppImage source={{ uri: avatarUri }} style={styles.avatar} />
        </View>

        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Finalize your order and enjoy your gourmet experience.</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Pressable onPress={() => router.push("/smag_saved_addresses")}>
              <Text style={styles.change}>Change</Text>
            </Pressable>
          </View>
          {deliveryAddress ? (
            <>
              <Text style={styles.strong}>{deliveryAddressTitle}</Text>
              <Text style={styles.muted}>{deliveryAddress}</Text>
            </>
          ) : (
            <>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: "60%" }]} />
            </>
          )}
          <TextInput
            style={styles.input}
            placeholder="Delivery instructions (optional)"
            placeholderTextColor="#80503299"
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <Pressable
              style={[styles.payCard, paymentMethod === "paystack" && styles.payCardActive]}
              onPress={() => { setPaymentMethod("paystack"); void Haptics.selectionAsync(); }}
            >
              <MaterialIcons name="credit-card" size={24} color={paymentMethod === "paystack" ? "#ffefeb" : "#805032"} />
              <Text style={paymentMethod === "paystack" ? styles.payTitle : styles.payTitleMuted}>Paystack</Text>
              <Text style={paymentMethod === "paystack" ? styles.payNumber : styles.payNumberMuted}>Card / Bank / USSD</Text>
            </Pressable>
            <Pressable
              style={[styles.payCard, paymentMethod === "cash" && styles.payCardActive]}
              onPress={() => { setPaymentMethod("cash"); void Haptics.selectionAsync(); }}
            >
              <MaterialIcons name="payments" size={24} color={paymentMethod === "cash" ? "#ffefeb" : "#805032"} />
              <Text style={paymentMethod === "cash" ? styles.payTitle : styles.payTitleMuted}>Cash</Text>
              <Text style={paymentMethod === "cash" ? styles.payNumber : styles.payNumberMuted}>Pay on delivery</Text>
            </Pressable>
          </View>
          {paymentMethod === "paystack" && (
            <View style={styles.secureRow}>
              <MaterialIcons name="lock" size={12} color="#805032" />
              <Text style={styles.secureText}>Secured by Paystack — 256-bit SSL encryption</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Order</Text>
          {loading ? (
            <ActivityIndicator color="#a33800" style={{ marginVertical: 16 }} />
          ) : cartItems.length === 0 ? (
            <Text style={styles.muted}>Your cart is empty.</Text>
          ) : (
            <>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.orderRow}>
                  <AppImage source={{ uri: item.imageUrl }} style={styles.orderImage} />
                  <Text style={styles.orderName}>{item.quantity}x {item.name}</Text>
                  <Text style={styles.orderPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <TotalRow label="Subtotal" value={`₦${subtotal.toLocaleString()}`} />
              <TotalRow label="Delivery Fee" value={`₦${DELIVERY_FEE.toLocaleString()}`} />
              <TotalRow label="Service Fee" value={`₦${SERVICE_FEE.toLocaleString()}`} />
              <TotalRow label="Total" value={`₦${total.toLocaleString()}`} strong />
            </>
          )}
        </View>

        <Pressable
          testID="checkout-place-order-button"
          style={[styles.placeBtn, (placing || cartItems.length === 0) && { opacity: 0.6 }]}
          onPress={handlePlaceOrder}
          disabled={placing || cartItems.length === 0}
        >
          {placing
            ? <ActivityIndicator color="#ffefeb" />
            : <>
                <MaterialIcons name={paymentMethod === "paystack" ? "lock" : "payments"} size={18} color="#ffefeb" />
                <Text style={styles.placeText}>
                  {paymentMethod === "paystack" ? `Pay ₦${total.toLocaleString()}` : "Place Order (Cash)"}
                </Text>
              </>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function TotalRow(props: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, props.strong && styles.totalStrong]}>{props.label}</Text>
      <Text style={[styles.totalVal, props.strong && styles.totalValStrong]}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { width: 80, height: 36 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  title: { marginTop: 12, color: "#4b240a", fontSize: 36, fontWeight: "900" },
  subtitle: { marginTop: 2, marginBottom: 12, color: "#805032" },
  card: { marginTop: 10, backgroundColor: "#ffffff", borderRadius: 20, padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: "#4b240a", fontSize: 22, fontWeight: "800" },
  change: { color: "#a33800", fontWeight: "700" },
  strong: { marginTop: 10, color: "#4b240a", fontWeight: "800" },
  muted: { marginTop: 4, color: "#805032", lineHeight: 19 },
  input: {
    marginTop: 10, borderRadius: 999, backgroundColor: "#ffede5",
    paddingHorizontal: 14, paddingVertical: 12, color: "#4b240a"
  },
  paymentRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  payCard: { flex: 1, borderRadius: 16, backgroundColor: "#ffede5", padding: 12 },
  payCardActive: { backgroundColor: "#a33800" },
  payTitle: { marginTop: 8, color: "#ffefeb", fontWeight: "800" },
  payNumber: { marginTop: 2, color: "#ffefeb", fontSize: 11 },
  payTitleMuted: { marginTop: 8, color: "#4b240a", fontWeight: "800" },
  payNumberMuted: { marginTop: 2, color: "#805032", fontSize: 11 },
  secureRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 5 },
  secureText: { color: "#805032", fontSize: 11 },
  orderRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  orderImage: { width: 48, height: 48, borderRadius: 10 },
  orderName: { flex: 1, color: "#4b240a", fontWeight: "700" },
  orderPrice: { color: "#a33800", fontWeight: "800" },
  divider: { marginTop: 10, marginBottom: 8, height: 1, backgroundColor: "rgba(160,106,74,0.28)" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 7 },
  totalLabel: { color: "#805032" },
  totalVal: { color: "#4b240a", fontWeight: "700" },
  totalStrong: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  totalValStrong: { color: "#a33800", fontSize: 30, fontWeight: "900" },
  skeletonLine: {
    marginTop: 8, height: 14, borderRadius: 7,
    backgroundColor: "#ffede5", width: "80%"
  },
  placeBtn: {
    marginTop: 16, backgroundColor: "#a33800", borderRadius: 999,
    minHeight: 54, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8
  },
  placeText: { color: "#ffefeb", fontSize: 17, fontWeight: "800" }
});
