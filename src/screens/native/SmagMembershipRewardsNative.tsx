import type { ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import { subscribePoints, type PointsEntry } from "@/lib/firebase/firestore";
import { useAppRouter } from "@/lib/useAppRouter";

export function SmagMembershipRewardsNative() {
  const router = useAppRouter();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<PointsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    const unsub = subscribePoints(user.uid, (pts, hist) => {
      setPoints(pts); setHistory(hist); setLoading(false);
    });
    return unsub;
  }, []);

  const TIER_THRESHOLDS = { rising: 0, pro: 1000, elite: 3000 };
  const tier = points >= TIER_THRESHOLDS.elite ? "Elite" : points >= TIER_THRESHOLDS.pro ? "Pro" : "Rising Star";
  const nextTier = tier === "Rising Star" ? "Pro" : tier === "Pro" ? "Elite" : null;
  const nextThreshold = tier === "Rising Star" ? TIER_THRESHOLDS.pro : TIER_THRESHOLDS.elite;
  const toGo = nextTier ? Math.max(0, nextThreshold - points) : 0;
  const fillPct = nextTier ? Math.min(1, points / nextThreshold) : 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <View style={styles.titleWrap}>
              <Pressable style={styles.iconBtn} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={20} color="#a33800" />
              </Pressable>
              <Text style={styles.topTitle}>Membership Rewards</Text>
            </View>
            <Pressable style={styles.iconBtn} onPress={() => router.push("/smag_notifications")}>
              <MaterialIcons name="notifications" size={20} color="#a33800" />
            </Pressable>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceGlowTop} />
            <View style={styles.balanceGlowBottom} />
            <Text style={styles.balanceKicker}>TOTAL BALANCE</Text>
            <View style={styles.balanceRow}>
              {loading
                ? <ActivityIndicator color="#ffefeb" size="large" />
                : <Text style={styles.balanceValue}>{points.toLocaleString()}</Text>}
              <Text style={styles.balanceUnit}>pts</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(fillPct * 100)}%` }]} />
            </View>
            <View style={styles.tiersRow}>
              <Text style={styles.tierPill}>{tier}</Text>
              {nextTier ? (
                <View style={styles.nextTierWrap}>
                  <Text style={styles.nextTierLabel}>Next:</Text>
                  <Text style={styles.nextTierValue}>{nextTier}</Text>
                </View>
              ) : <Text style={styles.nextTierValue}>MAX TIER 🏆</Text>}
              {nextTier ? <Text style={styles.nextTierGap}>({toGo.toLocaleString()} pts to go)</Text> : null}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Perks</Text>
            <Pressable style={styles.viewAllWrap} onPress={() => router.push("/tier_comparison")}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="chevron-right" size={16} color="#a33800" />
            </Pressable>
          </View>

          <View style={styles.perksGrid}>
            <PerkCard
              icon="bolt"
              title="15% Point Boost"
              desc="Earn points faster on every dinner order."
            />
            <PerkCard
              icon="delivery-dining"
              title="Free Delivery"
              desc="Unlimited free delivery on orders over ₦30,000."
            />
          </View>

          <View style={styles.birthdayCard}>
            <View style={styles.birthdayIcon}>
              <MaterialIcons name="cake" size={22} color="#a33800" />
            </View>
            <View style={styles.birthdayBody}>
              <Text style={styles.birthdayTitle}>Birthday Treat</Text>
              <Text style={styles.birthdayDesc}>A special gift on your day!</Text>
            </View>
            <Text style={styles.lockedPill}>LOCKED</Text>
          </View>

          <Text style={styles.recentTitle}>Recent Earnings</Text>
          <View style={styles.earningsCard}>
            {history.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: "#805032", fontWeight: "700" }}>No earnings yet — place an order!</Text>
              </View>
            ) : history.slice(0, 10).map((entry, index) => (
              <View
                key={entry.id}
                style={[styles.earningRow, index < Math.min(history.length, 10) - 1 && styles.earningDivider]}
              >
                <View style={styles.earningLeft}>
                  <View style={styles.earningIcon}>
                    <MaterialIcons name="star" size={20} color="#ff5e07" />
                  </View>
                  <View>
                    <Text style={styles.earningTitle}>{entry.title}</Text>
                    <Text style={styles.earningMeta}>{entry.meta}</Text>
                  </View>
                </View>
                <View style={styles.earningPoints}>
                  <Text style={styles.pointsValue}>+{entry.points}</Text>
                  <Text style={styles.pointsLabel}>PTS</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable style={styles.loadBtn} onPress={() => router.push("/smag_referral_history")}>
            <Text style={styles.loadBtnText}>Load History</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem
            icon="restaurant"
            label="Gallery"
            onPress={() => router.push("/smag_home")}
          />
          <NavItem
            icon="military-tech"
            label="Levels"
            onPress={() => router.push("/smag_member_levels")}
          />
          <View style={styles.activeNav}>
            <MaterialIcons name="redeem" size={19} color="#ffefeb" />
            <Text style={styles.activeNavLabel}>PERKS</Text>
          </View>
          <NavItem icon="person" label="Profile" onPress={() => router.push("/smag_profile")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function PerkCard(props: {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.perkCard}>
      <View style={styles.perkIconWrap}>
        <MaterialIcons name={props.icon} size={22} color="#ff5e07" />
      </View>
      <Text style={styles.perkTitle}>{props.title}</Text>
      <Text style={styles.perkDesc}>{props.desc}</Text>
    </View>
  );
}

function NavItem(props: {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.navItem} onPress={props.onPress}>
      <MaterialIcons name={props.icon} size={19} color="#805032" />
      <Text style={styles.navLabel}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  page: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 },
  topBar: {
    height: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  topTitle: { color: "#4b240a", fontSize: 20, fontWeight: "700", letterSpacing: -0.2 },
  balanceCard: {
    marginTop: 8,
    borderRadius: 30,
    backgroundColor: "#d75a20",
    paddingHorizontal: 20,
    paddingVertical: 18,
    overflow: "hidden"
  },
  balanceGlowTop: {
    position: "absolute",
    right: -50,
    top: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#ff8d52",
    opacity: 0.28
  },
  balanceGlowBottom: {
    position: "absolute",
    left: -90,
    bottom: -90,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#a33800",
    opacity: 0.25
  },
  balanceKicker: {
    color: "#ffefeb",
    alignSelf: "center",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4
  },
  balanceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6
  },
  balanceValue: {
    color: "#ffefeb",
    fontSize: 54,
    lineHeight: 58,
    fontWeight: "900",
    letterSpacing: -1
  },
  balanceUnit: {
    color: "#ffefeb",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "600",
    marginBottom: 8
  },
  track: {
    marginTop: 10,
    borderRadius: 999,
    height: 9,
    backgroundColor: "#cb632fcc",
    overflow: "hidden"
  },
  fill: { width: "70%", height: "100%", borderRadius: 999, backgroundColor: "#ffdbc9" },
  tiersRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  tierPill: {
    borderRadius: 999,
    backgroundColor: "#ff9f6e33",
    color: "#ffefeb",
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  nextTierWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  nextTierLabel: { color: "#ffefeb", fontSize: 15, fontWeight: "700" },
  nextTierValue: { color: "#ffefeb", fontSize: 17, fontWeight: "900" },
  nextTierGap: { color: "#ffefeb", fontSize: 14, fontWeight: "700" },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: { color: "#4b240a", fontSize: 34, lineHeight: 38, fontWeight: "900" },
  viewAllWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { color: "#a33800", fontSize: 15, fontWeight: "800" },
  perksGrid: { flexDirection: "row", gap: 10 },
  perkCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#ffede5",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    minHeight: 146
  },
  perkIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  perkTitle: {
    marginTop: 12,
    color: "#4b240a",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900"
  },
  perkDesc: { marginTop: 6, color: "#805032", fontSize: 13, lineHeight: 18, fontWeight: "500" },
  birthdayCard: {
    marginTop: 12,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  birthdayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffede5",
    alignItems: "center",
    justifyContent: "center"
  },
  birthdayBody: { flex: 1 },
  birthdayTitle: { color: "#4b240a", fontSize: 27, lineHeight: 30, fontWeight: "900" },
  birthdayDesc: { color: "#805032", fontSize: 14, lineHeight: 19, fontWeight: "500" },
  lockedPill: {
    borderRadius: 999,
    backgroundColor: "#ffd4bd",
    color: "#a33800",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  recentTitle: {
    marginTop: 18,
    marginBottom: 10,
    color: "#4b240a",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900"
  },
  earningsCard: { borderRadius: 24, backgroundColor: "#ffede5", overflow: "hidden" },
  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  earningDivider: { borderBottomWidth: 1, borderBottomColor: "#ffd4bd" },
  earningLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  earningIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  earningTitle: { color: "#4b240a", fontSize: 22, lineHeight: 24, fontWeight: "800" },
  earningMeta: { color: "#805032", fontSize: 12, marginTop: 3, fontWeight: "500" },
  earningPoints: { alignItems: "flex-end", marginLeft: 6 },
  pointsValue: { color: "#a33800", fontSize: 25, lineHeight: 27, fontWeight: "900" },
  pointsLabel: { color: "#805032", fontSize: 13, fontWeight: "700", marginTop: 2 },
  loadBtn: {
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dd9f7c",
    paddingVertical: 14,
    alignItems: "center"
  },
  loadBtnText: { color: "#a33800", fontSize: 18, fontWeight: "800" },
  bottomNav: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    borderRadius: 999,
    backgroundColor: "#ffffffee",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8
  },
  navItem: { alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 4 },
  navLabel: { color: "#805032", fontSize: 10, fontWeight: "700" },
  activeNav: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#ff5e07",
    alignItems: "center",
    justifyContent: "center",
    gap: 1
  },
  activeNavLabel: { color: "#ffefeb", fontSize: 8, fontWeight: "900", letterSpacing: 0.2 }
});
