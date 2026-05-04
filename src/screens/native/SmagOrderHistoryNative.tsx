import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import { subscribeOrders, reorderItems, type Order } from "@/lib/firebase/firestore";
import { CartBadgeIcon } from "@/components/CartBadgeIcon";
import { ListSkeleton } from "@/components/SkeletonLoader";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-NG", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

export function SmagOrderHistoryNative() {
  const router = useAppRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);

  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReorder(order: Order) {
    const user = getCurrentUser();
    if (!user) return;
    setReorderingId(order.id);
    try {
      await reorderItems(user.uid, order);
      router.push("/smag_my_cart");
    } catch {
      Alert.alert("Reorder failed", "Could not add items to cart. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    setError(null);
    const unsub = subscribeOrders(
      user.uid,
      (data) => { setOrders(data); setLoading(false); },
      () => { setLoading(false); setError("Could not load orders. Pull down to retry."); },
      limit
    );
    return unsub;
  }, [limit]);

  const delivered = orders.filter((o) => o.status === "delivered").length;
  const inProgress = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;

  const ListHeader = (
    <View style={styles.listHeader}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={22} color="#a33800" />
        </Pressable>
        <Text style={styles.headerTitle}>Order History</Text>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/smag_my_cart")} accessibilityRole="button" accessibilityLabel="View cart">
          <CartBadgeIcon size={22} color="#a33800" />
        </Pressable>
      </View>
      <View style={styles.summaryGrid}>
        <SummaryCard value={String(orders.length)} label="Total Orders" />
        <SummaryCard value={String(inProgress)} label="In Progress" highlighted />
        <SummaryCard value={String(delivered)} label="Delivered" />
        <SummaryCard value="₦" label="Credits" />
      </View>
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {error && (
        <View style={styles.errorWrap}>
          <MaterialIcons name="error-outline" size={20} color="#b31b25" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {loading && <ListSkeleton count={3} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={loading ? [] : orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={ListHeader}
        renderItem={({ item: order }) => (
          <OrderCard
            order={order}
            reordering={reorderingId === order.id}
            onTrack={() => router.push(`/smag_track_order?orderId=${order.id}`)}
            onReorder={() => handleReorder(order)}
            onRate={() => router.push("/smag_rate_your_experience")}
            onReceipt={() => router.push(`/smag_receipt?orderId=${order.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="receipt-long" size={56} color="#ffdbc9" />
              <Text style={styles.emptyText}>No orders yet</Text>
              <Pressable style={styles.browseBtn} onPress={() => router.push("/smag_menu")} accessibilityRole="button" accessibilityLabel="Browse menu">
                <Text style={styles.browseBtnText}>Browse Menu</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListFooterComponent={
          orders.length >= limit ? (
            <Pressable style={styles.loadMoreBtn} onPress={() => setLimit((l) => l + 20)} accessibilityRole="button" accessibilityLabel="Load more orders">
              <Text style={styles.loadMoreText}>Load More</Text>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function SummaryCard(props: { value: string; label: string; highlighted?: boolean }) {
  return (
    <View style={[styles.summaryCard, props.highlighted && styles.summaryCardHighlighted]}>
      <Text style={[styles.summaryValue, props.highlighted && styles.summaryValueHighlighted]}>
        {props.value}
      </Text>
      <Text style={[styles.summaryLabel, props.highlighted && styles.summaryLabelHighlighted]}>
        {props.label}
      </Text>
    </View>
  );
}

function OrderCard({ order, reordering, onTrack, onReorder, onRate, onReceipt }: {
  order: Order;
  reordering: boolean;
  onTrack: () => void;
  onReorder: () => void;
  onRate: () => void;
  onReceipt: () => void;
}) {
  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";
  const active = !cancelled && !delivered;
  const firstItem = order.items[0];

  const STATUS_LABEL: Record<string, string> = {
    confirmed: "Confirmed",
    preparing: "Preparing",
    on_delivery: "On Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };

  return (
    <View style={[styles.orderCard, cancelled && styles.orderCardCancelled]}>
      {firstItem && (
        <View style={styles.imageWrap}>
          <AppImage source={{ uri: firstItem.imageUrl }} style={styles.orderImage} />
          <View style={[styles.statusBadge, cancelled && styles.statusBadgeCancelled]}>
            <Text style={[styles.statusBadgeText, cancelled && styles.statusBadgeTextCancelled]}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Text>
          </View>
        </View>
      )}
      <View style={styles.orderBody}>
        <View style={styles.orderTopRow}>
          <Text style={styles.restaurant}>{order.restaurantName}</Text>
          <Text style={[styles.amount, cancelled && styles.amountCancelled]}>
            ₦{order.total.toLocaleString()}
          </Text>
        </View>
        <Text style={styles.items}>
          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
        </Text>
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        <View style={styles.orderBottomRow}>
          {cancelled ? (
            <Text style={styles.cancelNote}>Refund Processed</Text>
          ) : (
            <View style={styles.deliveryMeta}>
              <MaterialIcons name="history" size={14} color="#805032" />
              <Text style={styles.deliveryMetaText}>Standard Delivery</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {active && (
              <Pressable style={styles.trackBtn} onPress={onTrack} accessibilityRole="button" accessibilityLabel={`Track order from ${order.restaurantName}`}>
                <Text style={styles.trackBtnText}>Track</Text>
              </Pressable>
            )}
            {delivered && (
              <Pressable style={styles.rateBtn} onPress={onRate} accessibilityRole="button" accessibilityLabel={`Rate order from ${order.restaurantName}`}>
                <Text style={styles.rateBtnText}>Rate</Text>
              </Pressable>
            )}
            {delivered && (
              <Pressable style={styles.receiptBtn} onPress={onReceipt} accessibilityRole="button" accessibilityLabel={`View receipt for order from ${order.restaurantName}`}>
                <Text style={styles.receiptBtnText}>Receipt</Text>
              </Pressable>
            )}
            <Pressable style={[styles.reorderBtn, cancelled && styles.reorderBtnSoft, reordering && { opacity: 0.6 }]} onPress={onReorder} disabled={reordering} accessibilityRole="button" accessibilityLabel={`Reorder from ${order.restaurantName}`} accessibilityState={{ busy: reordering }}>
              {reordering
                ? <ActivityIndicator size="small" color="#ffefeb" />
                : <Text style={[styles.reorderText, cancelled && styles.reorderTextSoft]}>Reorder</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 36 },
  listHeader: { marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#4b240a", fontSize: 28, fontWeight: "900" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryCard: { width: "48%", borderRadius: 18, backgroundColor: "#ffffff", paddingVertical: 14, alignItems: "center" },
  summaryCardHighlighted: { backgroundColor: "#ff7941" },
  summaryValue: { color: "#a33800", fontSize: 28, fontWeight: "900" },
  summaryValueHighlighted: { color: "#431200" },
  summaryLabel: { marginTop: 3, color: "#805032", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  summaryLabelHighlighted: { color: "#431200" },
  sectionTitle: { marginTop: 20, marginBottom: 10, color: "#4b240a", fontSize: 24, fontWeight: "900" },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#805032", fontSize: 18, fontWeight: "700" },
  browseBtn: { backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 14 },
  browseBtnText: { color: "#ffefeb", fontWeight: "800", fontSize: 15 },
  list: { gap: 12 },
  errorWrap: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff0f0", borderRadius: 12, padding: 12, marginBottom: 8 },
  errorText: { color: "#b31b25", fontSize: 13, flex: 1 },
  orderCard: { borderRadius: 20, backgroundColor: "#ffffff", overflow: "hidden" },
  orderCardCancelled: { opacity: 0.82 },
  imageWrap: { height: 170, position: "relative" },
  orderImage: { width: "100%", height: "100%" },
  statusBadge: { position: "absolute", top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#ffffffdd" },
  statusBadgeCancelled: { backgroundColor: "#fb5151dd" },
  statusBadgeText: { color: "#a33800", fontSize: 11, fontWeight: "800" },
  statusBadgeTextCancelled: { color: "#ffefee" },
  orderBody: { padding: 12 },
  orderTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  restaurant: { flex: 1, color: "#4b240a", fontSize: 20, fontWeight: "900" },
  amount: { color: "#a33800", fontSize: 22, fontWeight: "900" },
  amountCancelled: { color: "#805032" },
  items: { marginTop: 2, color: "#805032", fontSize: 14 },
  date: { marginTop: 2, color: "#805032aa", fontSize: 12 },
  orderBottomRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deliveryMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  deliveryMetaText: { color: "#805032", fontSize: 12, fontWeight: "600" },
  cancelNote: { color: "#b31b25", fontSize: 12, fontWeight: "700" },
  trackBtn: { borderRadius: 999, backgroundColor: "#ff7941", paddingHorizontal: 14, paddingVertical: 9 },
  trackBtnText: { color: "#ffefeb", fontSize: 13, fontWeight: "800" },
  rateBtn: { borderRadius: 999, backgroundColor: "#ffede5", paddingHorizontal: 14, paddingVertical: 9 },
  rateBtnText: { color: "#a33800", fontSize: 13, fontWeight: "800" },
  receiptBtn: { borderRadius: 999, backgroundColor: "#fff4f0", paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: "#dd9f7c" },
  receiptBtnText: { color: "#805032", fontSize: 13, fontWeight: "800" },
  reorderBtn: { borderRadius: 999, backgroundColor: "#a33800", paddingHorizontal: 16, paddingVertical: 9 },
  reorderBtnSoft: { backgroundColor: "#ffdbc9" },
  reorderText: { color: "#ffefeb", fontSize: 13, fontWeight: "800" },
  loadMoreBtn: {
    marginTop: 8, borderRadius: 999, borderWidth: 1,
    borderColor: "#dd9f7c", paddingVertical: 14, alignItems: "center"
  },
  loadMoreText: { color: "#a33800", fontSize: 15, fontWeight: "800" },
  reorderTextSoft: { color: "#a33800" }
});
