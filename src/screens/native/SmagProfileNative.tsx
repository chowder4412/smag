import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { firebaseSignOut, getCurrentUser } from "@/lib/firebase/auth";
import { clearOnboardingPending } from "@/lib/startupState";
import { getUserProfile, resetUserProfile, subscribeUserProfile, type UserProfile } from "@/lib/userProfile";
import { subscribePoints, subscribeOrders } from "@/lib/firebase/firestore";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";
import { SkeletonBox } from "@/components/SkeletonLoader";

const navItems = [
  {
    label: "My Orders",
    sub: "Recent and past experiences",
    icon: "receipt-long",
    route: "/smag_order_history"
  },
  {
    label: "Saved Addresses",
    sub: "Manage delivery spots",
    icon: "place",
    route: "/smag_saved_addresses"
  },
  {
    label: "Payment Methods",
    sub: "Securely manage cards",
    icon: "credit-card",
    route: "/smag_payment_methods"
  },
  {
    label: "Favorites",
    sub: "Top-rated plates and spots",
    icon: "favorite",
    route: "/smag_favorites"
  },
  {
    label: "Promo Codes",
    sub: "Active discounts applied",
    icon: "confirmation-number",
    route: "/smag_promotions_deals"
  },
  {
    label: "Voucher Wallet",
    sub: "Your exclusive rewards",
    icon: "account-balance-wallet",
    route: "/smag_voucher_wallet"
  },
  {
    label: "Refer a Friend",
    sub: "Share & earn ₦10,000",
    icon: "group-add",
    route: "/smag_refer_a_friend"
  },
  {
    label: "Referral Leaderboard",
    sub: "See how you rank",
    icon: "leaderboard",
    route: "/smag_referral_leaderboard"
  },
  {
    label: "Profile Settings",
    sub: "Personal details, address & photo",
    icon: "badge",
    route: "/smag_edit_profile"
  },
  {
    label: "Account & Settings",
    sub: "Security, biometrics & preferences",
    icon: "settings",
    route: "/smag_settings"
  }
];

export function SmagProfileNative() {
  const router = useAppRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    void getUserProfile().then((value) => {
      if (mounted) { setProfile(value); setProfileLoading(false); }
    });
    const unsubProfile = subscribeUserProfile((value) => {
      if (mounted) { setProfile(value); setProfileLoading(false); }
    });

    const user = getCurrentUser();
    let unsubPoints: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    if (user) {
      unsubPoints = subscribePoints(user.uid, (pts) => {
        if (mounted) setPoints(pts);
      });
      unsubOrders = subscribeOrders(user.uid, (orders) => {
        if (mounted) setOrderCount(orders.length);
      }, undefined, 200);
    }

    return () => {
      mounted = false;
      unsubProfile();
      unsubPoints?.();
      unsubOrders?.();
    };
  }, []);

  const quickStats = [
    { label: "Orders", value: String(orderCount), icon: "restaurant" as const },
    { label: "Points", value: points >= 1000 ? `${(points / 1000).toFixed(1)}k` : String(points), icon: "dataset" as const },
    { label: "Member", value: "Free", icon: "account-balance-wallet" as const }
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>My Profile</Text>
          <View style={styles.topRight}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push("/smag_settings")}
              accessibilityRole="button"
              accessibilityLabel="Account Settings"
              testID="profile-settings-btn"
            >
              <MaterialIcons name="settings" size={24} color="#a33800" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/smag_edit_profile")}
              accessibilityRole="button"
              accessibilityLabel="Edit Profile"
              testID="profile-edit-btn"
            >
              <AppImage source={{ uri: profile?.avatarUri ?? "" }} style={styles.avatar} />
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          {profileLoading ? (
            <>
              <SkeletonBox width={130} height={130} borderRadius={24} />
              <SkeletonBox width={160} height={28} borderRadius={8} style={{ marginTop: 10 }} />
              <SkeletonBox width={100} height={22} borderRadius={999} style={{ marginTop: 8 }} />
            </>
          ) : (
            <>
              <View style={styles.heroImageWrap}>
                <AppImage source={{ uri: profile?.avatarUri ?? "" }} style={styles.heroImage} />
                <Pressable style={styles.editFab} onPress={() => router.push("/smag_edit_profile")}>
                  <MaterialIcons name="edit" size={16} color="#ffefeb" />
                </Pressable>
              </View>
              <Text style={styles.name}>{profile?.fullName ?? ""}</Text>
              <Text style={styles.badge}>PREMIUM MEMBER</Text>
            </>
          )}
        </View>

        <View style={styles.statsGrid}>
          {quickStats.map((item, index) => (
            <View key={item.label} style={[styles.statCard, index === 2 && styles.statHighlight]}>
              <MaterialIcons name={item.icon} size={24} color={index === 2 ? "#431200" : "#a33800"} />
              <Text style={[styles.statValue, index === 2 && styles.statValueDark]}>{item.value}</Text>
              <Text style={[styles.statLabel, index === 2 && styles.statLabelDark]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.groupTitle}>GOURMET DASHBOARD</Text>
        <View style={styles.listBlock}>
          {navItems.map((item) => (
            <Pressable key={item.label} style={styles.listItem} onPress={() => router.push(item.route as never)}>
              <View style={styles.listIconWrap}>
                <MaterialIcons name={item.icon as never} size={20} color="#a33800" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{item.label}</Text>
                <Text style={styles.listSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#a06a4a" />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            await clearOnboardingPending();
            await firebaseSignOut();
            await resetUserProfile();
            router.replace("/smag_login");
          }}
        >
          <MaterialIcons name="logout" size={18} color="#a33800" />
          <Text style={styles.logoutText}>Logout {profile?.fullName ?? ""}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  topBarTitle: { color: "#4b240a", fontSize: 24, fontWeight: "900" },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffede5",
    alignItems: "center",
    justifyContent: "center"
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ff7941"
  },
  hero: { alignItems: "center", marginTop: 16, marginBottom: 18 },
  heroImageWrap: { width: 130, height: 130, borderRadius: 24, overflow: "hidden" },
  heroImage: { width: "100%", height: "100%" },
  editFab: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#a33800",
    alignItems: "center",
    justifyContent: "center"
  },
  name: { marginTop: 10, color: "#4b240a", fontSize: 30, fontWeight: "900" },
  badge: {
    marginTop: 6,
    color: "#a33800",
    backgroundColor: "#ffe3d4",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "800"
  },
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    backgroundColor: "#ffede5"
  },
  statHighlight: { backgroundColor: "#ff7941" },
  statValue: { marginTop: 6, color: "#4b240a", fontSize: 20, fontWeight: "900" },
  statValueDark: { color: "#431200" },
  statLabel: { marginTop: 2, color: "#805032", fontSize: 11, fontWeight: "600" },
  statLabelDark: { color: "#431200" },
  groupTitle: {
    color: "#805032",
    marginBottom: 10,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "800"
  },
  listBlock: { gap: 8 },
  listItem: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  listIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffede5",
    alignItems: "center",
    justifyContent: "center"
  },
  listTitle: { color: "#4b240a", fontSize: 15, fontWeight: "800" },
  listSub: { color: "#805032", fontSize: 11 },
  logoutBtn: {
    marginTop: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a3380035",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  logoutText: { color: "#a33800", fontSize: 16, fontWeight: "800" }
});
