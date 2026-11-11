import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import { markNotificationRead, subscribeNotifications, type AppNotification } from "@/lib/firebase/firestore";
import { getUserProfile } from "@/lib/userProfile";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const PAGE_SIZE = 50;

const ICON_MAP: Record<AppNotification["type"], string> = {
  order_update: "local-shipping",
  promo: "sell",
  system: "verified"
};

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function SmagNotificationsNative() {
  const router = useAppRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    void getUserProfile().then((p) => setAvatarUri(p.avatarUri));
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    setError(null);
    const unsub = subscribeNotifications(
      user.uid,
      (data) => { setNotifications(data); setLoading(false); },
      () => { setLoading(false); setError("Could not load notifications. Please try again."); },
      limit
    );
    return unsub;
  }, [limit]);

  async function handlePress(notification: AppNotification) {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    if (notification.type === "order_update" && notification.orderId) {
      router.push(`/smag_track_order?orderId=${notification.orderId}`);
    } else if (notification.type === "promo") {
      router.push("/smag_promotions_deals");
    } else {
      router.push("/smag_settings");
    }
  }

  const today = notifications.filter((n) => {
    if (!n.createdAt) return false;
    const d = new Date(n.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const earlier = notifications.filter((n) => !today.includes(n));

  const sections = [
    ...(today.length > 0 ? [{ title: "Today", data: today }] : []),
    ...(earlier.length > 0 ? [{ title: "Earlier", data: earlier }] : [])
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.iconBtn} onPress={() => router.push("/smag_profile")} accessibilityRole="button" accessibilityLabel="Open profile menu">
                <MaterialIcons name="menu" size={22} color="#a33800" />
              </Pressable>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <Pressable onPress={() => router.push("/smag_profile")} accessibilityRole="button" accessibilityLabel="View profile">
              <AppImage source={{ uri: avatarUri }} style={styles.avatar} accessibilityLabel="Profile picture" />
            </Pressable>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.groupTitle, section.title === "Earlier" && styles.groupTitleMuted]}>{section.title}</Text>
        )}
        renderItem={({ item: n }) => (
          <NotificationCard notification={n} onPress={() => handlePress(n)} />
        )}
        ListFooterComponent={
          notifications.length >= limit ? (
            <Pressable
              style={styles.loadMoreBtn}
              onPress={() => setLimit((l) => l + PAGE_SIZE)}
              accessibilityRole="button"
              accessibilityLabel="Load more notifications"
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#a33800" style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.errorWrap}>
              <MaterialIcons name="error-outline" size={24} color="#b31b25" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="notifications-none" size={56} color="#ffdbc9" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>Order something to get started!</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function NotificationCard({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.card, !notification.read && styles.cardUnread]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.body}. ${notification.read ? "Read" : "Unread"}`}
      accessibilityState={{ selected: !notification.read }}
    >
      <View style={[styles.cardIconWrap, notification.type === "order_update" && styles.cardIconWrapPrimary]}>
        <MaterialIcons name={ICON_MAP[notification.type] as never} size={26} color="#a33800" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{notification.title}</Text>
          <Text style={styles.cardTime}>{timeAgo(notification.createdAt)}</Text>
        </View>
        <Text style={styles.cardText}>{notification.body}</Text>
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  errorWrap: { alignItems: "center", marginTop: 60, gap: 10 },
  errorText: { color: "#b31b25", fontSize: 14, fontWeight: "700", textAlign: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "#a33800", fontSize: 24, fontWeight: "900" },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  groupTitle: { marginTop: 8, color: "#4b240a", fontSize: 20, fontWeight: "900" },
  groupTitleMuted: { color: "#805032aa" },
  emptyWrap: { alignItems: "center", marginTop: 80, gap: 10 },
  emptyText: { color: "#4b240a", fontSize: 18, fontWeight: "800" },
  emptySubText: { color: "#805032", fontSize: 14 },
  card: {
    borderRadius: 22, backgroundColor: "#ffffff", padding: 12,
    flexDirection: "row", gap: 10
  },
  cardUnread: { backgroundColor: "#fff4f0", borderWidth: 1, borderColor: "#ffdbc9" },
  cardIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#ffede5", justifyContent: "center", alignItems: "center"
  },
  cardIconWrapPrimary: { backgroundColor: "#ffe3d4" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: "#4b240a", fontSize: 16, fontWeight: "900", flex: 1 },
  cardTime: { color: "#805032aa", fontSize: 11, fontWeight: "600" },
  cardText: { marginTop: 4, color: "#805032", lineHeight: 18, fontSize: 13 },
  unreadDot: {
    marginTop: 6, width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#a33800", alignSelf: "flex-start"
  },
  loadMoreBtn: {
    marginTop: 16, borderRadius: 999, borderWidth: 1,
    borderColor: "#dd9f7c", paddingVertical: 14, alignItems: "center"
  },
  loadMoreText: { color: "#a33800", fontSize: 15, fontWeight: "800" }
});
