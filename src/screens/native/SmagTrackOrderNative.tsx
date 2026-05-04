import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

import { subscribeOrder, type Order, type OrderStatus } from "@/lib/firebase/firestore";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const FALLBACK_DRIVER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDnne33sttPy4g1lJNT8Kj0JlBF3T4SytVURlwACjsWUbM0dY3jnrrCDUPxYQYwQc1ZIqL_eP2WPU0oXwf5Fk6sgSJ-kVRSiklHjTDuxGYQQ7UTioqaS8121Q_B8oA7nF-LBnC5tJ1eyNSYGIo6Ogr00_Ux4hzAL90hb0KtqGr1ipEmdahPT13r7u3hK_m8cBstIuIU_tWp_-1vGzGhB3mlQcQorF3LSfvGe9Cx7A-FJzP6ecTqMvhjKyTrcclSl2B-6I1gdClBR3oK";

const STAGES: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "confirmed", label: "Order Confirmed", icon: "check-circle" },
  { key: "preparing", label: "Preparing your meal", icon: "restaurant" },
  { key: "on_delivery", label: "Out for delivery", icon: "delivery-dining" },
  { key: "delivered", label: "Delivered", icon: "home" }
];

const STATUS_ORDER: OrderStatus[] = ["confirmed", "preparing", "on_delivery", "delivered"];

function stageIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status);
}

function etaText(status: OrderStatus): string {
  switch (status) {
    case "confirmed": return "Estimated 30-40 mins";
    case "preparing": return "Estimated 20-30 mins";
    case "on_delivery": return "Arriving in 12-15 mins";
    case "delivered": return "Delivered!";
    default: return "";
  }
}

// Default Lagos coordinates — used when order has no coords yet
const DEFAULT_RESTAURANT = { latitude: 6.4281, longitude: 3.4219 };
const DEFAULT_DELIVERY = { latitude: 6.4350, longitude: 3.4300 };
const DEFAULT_DRIVER = { latitude: 6.4310, longitude: 3.4250 };

export function SmagTrackOrderNative() {
  const router = useAppRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveredHandled, setDeliveredHandled] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Animated driver coordinate
  const driverLatAnim = useRef(new Animated.Value(DEFAULT_DRIVER.latitude)).current;
  const driverLngAnim = useRef(new Animated.Value(DEFAULT_DRIVER.longitude)).current;
  const [driverCoord, setDriverCoord] = useState(DEFAULT_DRIVER);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const unsub = subscribeOrder(
      orderId,
      (data) => { setOrder(data); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, [orderId]);

  // Fire onOrderDelivered exactly once when status becomes "delivered"
  useEffect(() => {
    if (!order || order.status !== "delivered" || deliveredHandled || !orderId) return;
    setDeliveredHandled(true);
    const functions = getFunctions(getApp(), "us-central1");
    void httpsCallable(functions, "onOrderDelivered")({ orderId }).catch(() => {
      // Non-fatal — referral/voucher logic runs server-side, failure here doesn't affect UX
    });
  }, [order?.status, deliveredHandled, orderId]);

  // Animate driver marker smoothly when coords update
  useEffect(() => {
    if (!order?.driverLat || !order?.driverLng) return;
    const newLat = order.driverLat;
    const newLng = order.driverLng;

    Animated.parallel([
      Animated.timing(driverLatAnim, { toValue: newLat, duration: 1500, useNativeDriver: false }),
      Animated.timing(driverLngAnim, { toValue: newLng, duration: 1500, useNativeDriver: false })
    ]).start();

    // Update actual coord state after animation for Marker
    const id = setTimeout(() => setDriverCoord({ latitude: newLat, longitude: newLng }), 1500);
    return () => clearTimeout(id);
  }, [order?.driverLat, order?.driverLng]);

  const restaurantCoord = order?.restaurantLat && order?.restaurantLng
    ? { latitude: order.restaurantLat, longitude: order.restaurantLng }
    : DEFAULT_RESTAURANT;

  const deliveryCoord = order?.deliveryLat && order?.deliveryLng
    ? { latitude: order.deliveryLat, longitude: order.deliveryLng }
    : DEFAULT_DELIVERY;

  const currentStageIdx = order ? stageIndex(order.status) : -1;
  const showDriver = order?.status === "on_delivery" || order?.status === "delivered";

  const mapRegion = {
    latitude: (restaurantCoord.latitude + deliveryCoord.latitude) / 2,
    longitude: (restaurantCoord.longitude + deliveryCoord.longitude) / 2,
    latitudeDelta: Math.abs(restaurantCoord.latitude - deliveryCoord.latitude) * 2.5 + 0.01,
    longitudeDelta: Math.abs(restaurantCoord.longitude - deliveryCoord.longitude) * 2.5 + 0.01
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.topIcon} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#ff5c00" />
          </Pressable>
          <Text style={styles.topTitle}>Track Order</Text>
          <Pressable style={styles.topIcon} onPress={() => router.push("/smag_support_help")}>
            <MaterialIcons name="support-agent" size={22} color="#ff5c00" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#a33800" style={{ marginTop: 60 }} />
        ) : !order ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="receipt-long" size={56} color="#ffdbc9" />
            <Text style={styles.emptyText}>Order not found</Text>
          </View>
        ) : (
          <>
            {/* Live Map */}
            <View style={styles.mapWrap}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                toolbarEnabled={false}
              >
                {/* Restaurant marker */}
                <Marker coordinate={restaurantCoord} title="Restaurant">
                  <View style={styles.markerRestaurant}>
                    <MaterialIcons name="restaurant" size={16} color="#a33800" />
                  </View>
                </Marker>

                {/* Delivery address marker */}
                <Marker coordinate={deliveryCoord} title="Delivery">
                  <View style={styles.markerDelivery}>
                    <MaterialIcons name="home" size={16} color="#ffefeb" />
                  </View>
                </Marker>

                {/* Animated driver marker */}
                {showDriver && (
                  <Marker coordinate={driverCoord} title="Driver" anchor={{ x: 0.5, y: 0.5 }}>
                    <View style={styles.markerDriver}>
                      <MaterialIcons name="delivery-dining" size={18} color="#ffefeb" />
                    </View>
                  </Marker>
                )}

                {/* Route line */}
                <Polyline
                  coordinates={showDriver
                    ? [restaurantCoord, driverCoord, deliveryCoord]
                    : [restaurantCoord, deliveryCoord]}
                  strokeColor="#a33800"
                  strokeWidth={3}
                  lineDashPattern={[8, 4]}
                />
              </MapView>

              {/* ETA badge overlay */}
              <View style={styles.etaBadge}>
                <View style={styles.dot} />
                <Text style={styles.etaText}>{etaText(order.status)}</Text>
              </View>
            </View>

            {/* Driver card — uses live data from order, falls back to defaults */}
            <View style={styles.driverCard}>
              <View style={styles.driverLeft}>
                <AppImage
                  source={{ uri: order.driverAvatarUrl ?? FALLBACK_DRIVER_IMAGE }}
                  style={styles.driverAvatar}
                />
                <View>
                  <Text style={styles.driverName}>
                    {order.driverName ?? "Awaiting driver"}
                  </Text>
                  <Text style={styles.driverMeta}>
                    {order.driverVehicle ?? (order.status === "confirmed" || order.status === "preparing" ? "Driver will be assigned soon" : "On the way")}
                  </Text>
                </View>
              </View>
              <View style={styles.driverActions}>
                <Pressable style={styles.actionBtn} onPress={() => router.push("/smag_vip_support_chat")}>
                  <MaterialIcons name="chat-bubble" size={16} color="#a33800" />
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => router.push("/smag_support_help")}>
                  <MaterialIcons name="call" size={16} color="#ffefeb" />
                </Pressable>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Delivery Status</Text>
              {STAGES.map((stage, idx) => {
                const done = idx < currentStageIdx;
                const active = idx === currentStageIdx;
                return (
                  <View key={stage.key} style={styles.stageRow}>
                    <View style={[styles.stageDot, done && styles.stageDotDone, active && styles.stageDotActive]}>
                      {done && <MaterialIcons name="check" size={12} color="#fff" />}
                      {active && <MaterialIcons name={stage.icon as never} size={12} color="#ffefeb" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stageTitle, active && styles.stageTitleActive]}>{stage.label}</Text>
                      <Text style={[styles.stageTime, active && styles.stageTimeActive]}>
                        {active ? etaText(order.status) : done ? "Completed" : "Pending"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Order details */}
            <View style={styles.bentoRow}>
              <View style={styles.bentoCard}>
                <MaterialIcons name="restaurant-menu" size={20} color="#8f3000" />
                <Text style={styles.bentoLabel}>Your Order</Text>
                <Text style={styles.bentoValue}>
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </Text>
              </View>
              <View style={styles.bentoCard}>
                <MaterialIcons name="place" size={20} color="#8f3000" />
                <Text style={styles.bentoLabel}>Deliver To</Text>
                <Text style={styles.bentoValue}>{order.deliveryAddress}</Text>
              </View>
            </View>

            <View style={styles.bentoRow}>
              <View style={styles.bentoCard}>
                <MaterialIcons name="receipt" size={20} color="#8f3000" />
                <Text style={styles.bentoLabel}>Order Total</Text>
                <Text style={styles.bentoValue}>₦{order.total.toLocaleString()}</Text>
              </View>
              <View style={styles.bentoCard}>
                <MaterialIcons name="credit-card" size={20} color="#8f3000" />
                <Text style={styles.bentoLabel}>Payment</Text>
                <Text style={styles.bentoValue}>{order.paymentMethod}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { paddingBottom: 40 },
  topBar: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center"
  },
  topIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  topTitle: { color: "#4b240a", fontSize: 22, fontWeight: "900" },
  emptyWrap: { alignItems: "center", marginTop: 80, gap: 12 },
  emptyText: { color: "#805032", fontSize: 18, fontWeight: "700" },
  mapWrap: { height: 310, marginHorizontal: 16, borderRadius: 22, overflow: "hidden", position: "relative" },
  map: { width: "100%", height: "100%" },
  etaBadge: {
    position: "absolute", top: 10, alignSelf: "center",
    borderRadius: 999, backgroundColor: "#ffffffeb",
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: "row", alignItems: "center", gap: 6
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#a33800" },
  etaText: { color: "#4b240a", fontWeight: "800" },
  markerRestaurant: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#a33800"
  },
  markerDelivery: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#4b240a", alignItems: "center", justifyContent: "center"
  },
  markerDriver: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#a33800", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff"
  },
  driverCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 20,
    backgroundColor: "#ffffff", padding: 12,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center"
  },
  driverLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  driverAvatar: { width: 56, height: 56, borderRadius: 14 },
  driverName: { color: "#4b240a", fontSize: 18, fontWeight: "900" },
  driverMeta: { color: "#805032", fontSize: 12 },
  driverActions: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  actionBtnPrimary: { backgroundColor: "#a33800" },
  timelineCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, backgroundColor: "#ffede5", padding: 14, gap: 8 },
  timelineTitle: { color: "#4b240a", fontSize: 22, fontWeight: "900", marginBottom: 2 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stageDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#dd9f7c88", alignItems: "center", justifyContent: "center" },
  stageDotDone: { backgroundColor: "#e89b09" },
  stageDotActive: { backgroundColor: "#a33800" },
  stageTitle: { color: "#4b240a", fontWeight: "700" },
  stageTitleActive: { color: "#a33800", fontWeight: "900" },
  stageTime: { color: "#805032", fontSize: 12 },
  stageTimeActive: { color: "#a33800" },
  bentoRow: { marginHorizontal: 16, marginTop: 12, flexDirection: "row", gap: 8 },
  bentoCard: { flex: 1, borderRadius: 16, backgroundColor: "#ffffff", padding: 10, gap: 4 },
  bentoLabel: { color: "#805032", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  bentoValue: { color: "#4b240a", fontSize: 12, fontWeight: "700" }
});
