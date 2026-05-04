import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppRouter } from "@/lib/useAppRouter";
import { subscribeOrder, type Order } from "@/lib/firebase/firestore";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export function SmagReceiptNative() {
  const router = useAppRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    return subscribeOrder(orderId, (data) => { setOrder(data); setLoading(false); }, () => setLoading(false));
  }, [orderId]);

  async function shareReceipt() {
    if (!order) return;
    const lines = [
      `Smag Order Receipt`,
      `Order #${order.id.slice(-6).toUpperCase()}`,
      `Restaurant: ${order.restaurantName}`,
      ``,
      ...order.items.map(i => `  ${i.quantity}x ${i.name}  ₦${(i.price * i.quantity).toLocaleString()}`),
      ``,
      `Subtotal:     ₦${order.subtotal.toLocaleString()}`,
      `Delivery Fee: ₦${order.deliveryFee.toLocaleString()}`,
      `Service Fee:  ₦${order.serviceFee.toLocaleString()}`,
      `Total:        ₦${order.total.toLocaleString()}`,
      ``,
      `Payment: ${order.paymentMethod}`,
      `Status: ${order.status}`,
      `Date: ${formatDate(order.createdAt)}`
    ];
    await Share.share({ message: lines.join("\n"), title: "Smag Receipt" });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color="#a33800" size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Receipt not found.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#a33800" />
        </Pressable>
        <Text style={styles.title}>Receipt</Text>
        <Pressable style={styles.iconBtn} onPress={shareReceipt}>
          <MaterialIcons name="share" size={22} color="#a33800" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status badge */}
        <View style={[styles.statusBadge, order.status === "delivered" && styles.statusDelivered]}>
          <MaterialIcons name={order.status === "delivered" ? "check-circle" : "receipt"} size={20} color={order.status === "delivered" ? "#2f7d31" : "#a33800"} />
          <Text style={[styles.statusText, order.status === "delivered" && styles.statusTextDelivered]}>
            {order.status === "delivered" ? "Order Delivered" : order.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>

        {/* Order ID + date */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.muted}>Order ID</Text>
            <Text style={styles.mono}>#{order.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Date</Text>
            <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Restaurant</Text>
            <Text style={styles.value}>{order.restaurantName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Delivered to</Text>
            <Text style={[styles.value, { flex: 1, textAlign: "right" }]}>{order.deliveryAddress}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}><Text style={styles.muted}>Subtotal</Text><Text style={styles.value}>₦{order.subtotal.toLocaleString()}</Text></View>
          <View style={styles.row}><Text style={styles.muted}>Delivery Fee</Text><Text style={styles.value}>₦{order.deliveryFee.toLocaleString()}</Text></View>
          <View style={styles.row}><Text style={styles.muted}>Service Fee</Text><Text style={styles.value}>₦{order.serviceFee.toLocaleString()}</Text></View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{order.total.toLocaleString()}</Text>
          </View>
          <View style={styles.row}><Text style={styles.muted}>Payment</Text><Text style={styles.value}>{order.paymentMethod}</Text></View>
        </View>

        {/* Actions */}
        <Pressable style={styles.primaryBtn} onPress={() => router.push("/smag_order_history")}>
          <Text style={styles.primaryBtnText}>View All Orders</Text>
        </Pressable>
        {order.status === "delivered" && (
          <Pressable style={styles.secondaryBtn} onPress={() => router.push(`/smag_rate_your_experience?orderId=${order.id}`)}>
            <MaterialIcons name="star" size={16} color="#a33800" />
            <Text style={styles.secondaryBtnText}>Rate This Order</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  title: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ffede5", borderRadius: 16, padding: 14 },
  statusDelivered: { backgroundColor: "#e9f8ef" },
  statusText: { color: "#a33800", fontWeight: "800", fontSize: 15 },
  statusTextDelivered: { color: "#2f7d31" },
  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 14, gap: 10 },
  sectionTitle: { color: "#4b240a", fontSize: 16, fontWeight: "900", marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muted: { color: "#805032", fontSize: 13 },
  value: { color: "#4b240a", fontWeight: "700", fontSize: 13 },
  mono: { color: "#a33800", fontWeight: "900", fontFamily: "monospace", fontSize: 14 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemQty: { color: "#a33800", fontWeight: "900", width: 28, fontSize: 14 },
  itemName: { flex: 1, color: "#4b240a", fontSize: 14 },
  itemPrice: { color: "#4b240a", fontWeight: "700", fontSize: 14 },
  totalRow: { borderTopWidth: 1, borderTopColor: "#ffede5", paddingTop: 10, marginTop: 4 },
  totalLabel: { color: "#4b240a", fontSize: 18, fontWeight: "900" },
  totalValue: { color: "#a33800", fontSize: 24, fontWeight: "900" },
  primaryBtn: { backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 16, alignItems: "center" },
  primaryBtnText: { color: "#ffefeb", fontWeight: "900", fontSize: 16 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: "#a33800", paddingVertical: 14 },
  secondaryBtnText: { color: "#a33800", fontWeight: "800", fontSize: 15 },
  errorText: { color: "#805032", fontSize: 16 },
  backBtn: { backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: "#ffefeb", fontWeight: "800" }
});
