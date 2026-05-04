import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppRouter } from "@/lib/useAppRouter";
import { getCurrentUser } from "@/lib/firebase/auth";
import { subscribeReferralHistory, type ReferralEntry } from "@/lib/firebase/firestore";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

export function SmagReferralHistoryNative() {
  const router = useAppRouter();
  const [entries, setEntries] = useState<ReferralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    setError(null);
    const unsub = subscribeReferralHistory(
      user.uid,
      (data) => { setEntries(data); setLoading(false); },
      () => { setLoading(false); setError("Could not load referral history."); }
    );
    return unsub;
  }, []);

  const totalPoints = entries
    .filter((e) => e.status === "completed")
    .reduce((sum, e) => sum + e.pointsAwarded, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={22} color="#a33800" />
          </Pressable>
          <Text style={styles.title}>Referral History</Text>
          <Pressable onPress={() => router.push("/smag_referral_terms")} accessibilityRole="button" accessibilityLabel="View referral terms">
            <MaterialIcons name="gavel" size={21} color="#a33800" />
          </Pressable>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total Earned</Text>
          <Text style={styles.summaryValue}>{totalPoints.toLocaleString()} pts</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#a33800" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="error-outline" size={40} color="#b31b25" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="group-add" size={48} color="#ffdbc9" />
            <Text style={styles.emptyText}>No referrals yet</Text>
            <Text style={styles.emptySub}>Share your code to start earning points</Text>
            <Pressable style={styles.referBtn} onPress={() => router.push("/smag_refer_a_friend")} accessibilityRole="button" accessibilityLabel="Refer a friend">
              <Text style={styles.referBtnText}>Refer a Friend</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map((item) => (
              <View key={item.id} style={styles.card}>
                <View>
                  <Text style={styles.name}>{item.refereeName}</Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.reward}>+{item.pointsAwarded} pts</Text>
                  <Text style={[styles.status, item.status === "pending" ? styles.pending : styles.done]}>
                    {item.status === "pending" ? "Pending" : "Completed"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#4b240a", fontSize: 24, fontWeight: "900" },
  summary: { marginTop: 18, borderRadius: 20, backgroundColor: "#ffede5", padding: 16 },
  summaryLabel: { color: "#805032", fontSize: 12, fontWeight: "700" },
  summaryValue: { marginTop: 2, color: "#a33800", fontSize: 34, fontWeight: "900" },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyText: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  emptySub: { color: "#805032", fontSize: 13, textAlign: "center" },
  referBtn: { marginTop: 8, backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 14 },
  referBtnText: { color: "#ffefeb", fontWeight: "800", fontSize: 15 },
  list: { marginTop: 14, gap: 10 },
  card: {
    borderRadius: 16, backgroundColor: "#ffffff", padding: 12,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center"
  },
  name: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  date: { marginTop: 2, color: "#805032", fontSize: 12 },
  right: { alignItems: "flex-end" },
  reward: { color: "#a33800", fontSize: 15, fontWeight: "800" },
  status: { marginTop: 2, fontSize: 11, fontWeight: "700" },
  pending: { color: "#e89b09" },
  done: { color: "#2f7d31" }
});
