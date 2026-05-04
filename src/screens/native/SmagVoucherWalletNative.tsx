import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppRouter } from "@/lib/useAppRouter";
import { getCurrentUser } from "@/lib/firebase/auth";
import { subscribeVouchers, type Voucher } from "@/lib/firebase/firestore";

type Tab = "Active" | "Used" | "Expired";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function expiryLabel(date: Date | null): string {
  const days = daysUntil(date);
  if (days === null) return "No expiry";
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

export function SmagVoucherWalletNative() {
  const router = useAppRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Active");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    const unsub = subscribeVouchers(
      user.uid,
      (data) => { setVouchers(data); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const now = new Date();
  const active = vouchers.filter((v) => !v.used && (!v.expiresAt || v.expiresAt > now));
  const used = vouchers.filter((v) => v.used);
  const expired = vouchers.filter((v) => !v.used && v.expiresAt && v.expiresAt <= now);

  const displayed = tab === "Active" ? active : tab === "Used" ? used : expired;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={22} color="#FF5C00" />
          </Pressable>
          <Text style={styles.topTitle}>Voucher Wallet</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/smag_support_help")} accessibilityRole="button" accessibilityLabel="Get help">
          <MaterialIcons name="help" size={22} color="#FF5C00" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headline}>Treat <Text style={styles.headlineAccent}>Yourself</Text></Text>
        <Text style={styles.sub}>Your exclusive rewards gallery</Text>

        <View style={styles.tabs}>
          {(["Active", "Used", "Expired"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityLabel={t}
              accessibilityState={{ selected: tab === t }}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#a33800" style={{ marginTop: 40 }} />
        ) : displayed.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="confirmation-number" size={44} color="#a06a4a" />
            </View>
            <Text style={styles.emptyTitle}>No Vouchers Found</Text>
            <Text style={styles.emptySub}>
              {tab === "Active"
                ? "Complete orders and referrals to earn vouchers!"
                : `No ${tab.toLowerCase()} vouchers.`}
            </Text>
          </View>
        ) : (
          displayed.map((v) => {
            const days = daysUntil(v.expiresAt);
            const urgent = days !== null && days <= 3 && days >= 0;
            return (
              <View key={v.id} style={styles.voucherCard}>
                <View style={styles.voucherIconWrap}>
                  <MaterialIcons name="confirmation-number" size={44} color="#a33800" />
                </View>
                <View style={styles.voucherBody}>
                  <Text style={styles.voucherAmount}>{v.amount}</Text>
                  <Text style={styles.voucherTitle}>{v.title}</Text>
                  {v.minOrder > 0 && (
                    <View style={styles.voucherMinRow}>
                      <MaterialIcons name="shopping-bag" size={14} color="#805032" />
                      <Text style={styles.voucherMin}>Min. order ₦{v.minOrder.toLocaleString()}</Text>
                    </View>
                  )}
                  <View style={styles.voucherFooter}>
                    <View>
                      <Text style={styles.expiryLabel}>EXPIRY</Text>
                      <Text style={[styles.expiryValue, urgent && styles.expiryUrgent]}>
                        {expiryLabel(v.expiresAt)}
                      </Text>
                    </View>
                    {!v.used && (!v.expiresAt || v.expiresAt > now) && (
                      <Pressable
                        style={styles.useBtn}
                        onPress={() => router.push("/smag_checkout")}
                        accessibilityRole="button"
                        accessibilityLabel={`Use voucher: ${v.title}`}
                      >
                        <Text style={styles.useBtnText}>Use Now</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 8, borderRadius: 999 },
  topTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  content: { padding: 16, paddingBottom: 40 },
  headline: { color: "#4b240a", fontSize: 36, fontWeight: "900", lineHeight: 40 },
  headlineAccent: { color: "#a33800", fontStyle: "italic" },
  sub: { color: "#805032", fontSize: 14, marginTop: 4, marginBottom: 20 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: "#ffdbc9" },
  tabActive: { backgroundColor: "#a33800" },
  tabText: { color: "#4b240a", fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  voucherCard: { backgroundColor: "#ffffff", borderRadius: 20, padding: 16, marginBottom: 14 },
  voucherIconWrap: { width: 80, height: 80, borderRadius: 14, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  voucherBody: { gap: 4 },
  voucherAmount: { color: "#a33800", fontSize: 28, fontWeight: "900" },
  voucherTitle: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  voucherMinRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  voucherMin: { color: "#805032", fontSize: 13 },
  voucherFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#dd9f7c30" },
  expiryLabel: { color: "#805032", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  expiryValue: { color: "#4b240a", fontWeight: "800", fontSize: 13 },
  expiryUrgent: { color: "#b31b25" },
  useBtn: { backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  useBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  emptySub: { color: "#805032", fontSize: 13, textAlign: "center", maxWidth: 240, lineHeight: 19 }
});
