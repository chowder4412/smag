import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getReferralLeaderboard, type LeaderboardEntry } from "@/lib/firebase/firestore";

export function SmagReferralLeaderboardNative() {
  const router = useAppRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    void getReferralLeaderboard().then((data) => {
      setEntries(data);
      if (user) {
        const me = data.find((e) => e.uid === user.uid);
        setMyEntry(me ?? null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const shareLeaderboard = async () => {
    await Share.share({
      message: "I am climbing the Smag Referral Elite leaderboard. Join me and start earning rewards!",
      title: "Smag Referral Elite"
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={22} color="#a33800" />
          </Pressable>
          <Text style={styles.topTitle}>Referral Elite</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={shareLeaderboard} accessibilityRole="button" accessibilityLabel="Share leaderboard">
          <MaterialIcons name="share" size={22} color="#a33800" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* My rank card */}
        <View style={styles.rankCard}>
          <Text style={styles.rankSub}>CURRENT STANDING</Text>
          {loading ? (
            <ActivityIndicator color="#ffefeb" style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={styles.rankNum}>
                {myEntry ? `Rank #${myEntry.rank}` : "Not ranked yet"}
              </Text>
              <View style={styles.rankBadge}>
                <MaterialIcons name="stars" size={18} color="#ffefeb" />
                <Text style={styles.rankBadgeText}>
                  {myEntry ? `${myEntry.referralCount} Referrals Total` : "Refer friends to rank up"}
                </Text>
              </View>
            </>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#a33800" style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="leaderboard" size={48} color="#ffdbc9" />
            <Text style={styles.emptyText}>No rankings yet</Text>
            <Text style={styles.emptySub}>Be the first to refer friends and claim the top spot</Text>
          </View>
        ) : (
          <>
            {top3.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>The Elite Three</Text>
                <View style={styles.podium}>
                  {/* 2nd place */}
                  {top3[1] && (
                    <View style={[styles.podiumCol, { marginTop: 20 }]}>
                      <AppImage source={{ uri: top3[1].avatarUri }} style={[styles.podiumAvatar, { width: 60, height: 60 }]} />
                      <View style={[styles.podiumBase, { height: 80 }]}>
                        <Text style={styles.podiumName} numberOfLines={1}>{top3[1].displayName}</Text>
                        <Text style={styles.podiumCount}>{top3[1].referralCount}</Text>
                      </View>
                    </View>
                  )}
                  {/* 1st place */}
                  {top3[0] && (
                    <View style={styles.podiumCol}>
                      <MaterialIcons name="military-tech" size={28} color="#f8a91f" style={{ marginBottom: 4 }} />
                      <AppImage source={{ uri: top3[0].avatarUri }} style={[styles.podiumAvatar, { width: 72, height: 72 }]} />
                      <View style={[styles.podiumBase, { height: 110, backgroundColor: "#ffffff" }]}>
                        <Text style={styles.podiumName} numberOfLines={1}>{top3[0].displayName}</Text>
                        <Text style={[styles.podiumCount, { fontSize: 22 }]}>{top3[0].referralCount}</Text>
                      </View>
                    </View>
                  )}
                  {/* 3rd place */}
                  {top3[2] && (
                    <View style={[styles.podiumCol, { marginTop: 30 }]}>
                      <AppImage source={{ uri: top3[2].avatarUri }} style={[styles.podiumAvatar, { width: 60, height: 60 }]} />
                      <View style={[styles.podiumBase, { height: 68 }]}>
                        <Text style={styles.podiumName} numberOfLines={1}>{top3[2].displayName}</Text>
                        <Text style={styles.podiumCount}>{top3[2].referralCount}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            {rest.length > 0 && (
              <View style={styles.listBlock}>
                {rest.map((item) => (
                  <View key={item.uid} style={[styles.listRow, item.uid === getCurrentUser()?.uid && styles.meRow]}>
                    {item.uid === getCurrentUser()?.uid && <View style={styles.meAccent} />}
                    <Text style={[styles.listRank, item.uid === getCurrentUser()?.uid && { color: "#a33800" }]}>
                      {item.rank}
                    </Text>
                    <AppImage source={{ uri: item.avatarUri }} style={styles.listAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listName}>{item.displayName}</Text>
                      {item.uid === getCurrentUser()?.uid && (
                        <Text style={[styles.listSub, { color: "#a33800", fontWeight: "700" }]}>That's you!</Text>
                      )}
                    </View>
                    <Text style={[styles.listCount, item.uid === getCurrentUser()?.uid && { color: "#a33800" }]}>
                      {item.referralCount}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <Pressable style={styles.referBtn} onPress={() => router.push("/smag_refer_a_friend")} accessibilityRole="button" accessibilityLabel="Refer a friend now">
          <MaterialIcons name="add-reaction" size={18} color="#ffefeb" />
          <Text style={styles.referBtnText}>Refer Now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 8, borderRadius: 999 },
  topTitle: { color: "#a33800", fontSize: 20, fontWeight: "900" },
  content: { padding: 16, paddingBottom: 40 },
  rankCard: { backgroundColor: "#a33800", borderRadius: 20, padding: 24, marginBottom: 24 },
  rankSub: { color: "#ffefeb99", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 4 },
  rankNum: { color: "#ffefeb", fontSize: 48, fontWeight: "900" },
  rankBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, alignSelf: "flex-start", marginTop: 12 },
  rankBadgeText: { color: "#ffefeb", fontWeight: "800", fontSize: 14 },
  emptyWrap: { alignItems: "center", marginTop: 40, gap: 10 },
  emptyText: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  emptySub: { color: "#805032", fontSize: 13, textAlign: "center" },
  sectionTitle: { color: "#4b240a", fontSize: 22, fontWeight: "900", marginBottom: 16 },
  podium: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 20 },
  podiumCol: { flex: 1, alignItems: "center" },
  podiumAvatar: { borderRadius: 999, borderWidth: 3, borderColor: "#fff", marginBottom: 8 },
  podiumBase: { width: "100%", backgroundColor: "#ffede5", borderTopLeftRadius: 12, borderTopRightRadius: 12, alignItems: "center", justifyContent: "center", paddingTop: 12, paddingHorizontal: 4 },
  podiumName: { color: "#4b240a", fontWeight: "800", fontSize: 12, textAlign: "center" },
  podiumCount: { color: "#a33800", fontWeight: "900", fontSize: 16 },
  listBlock: { gap: 6, marginBottom: 20 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ffffff", borderRadius: 14, padding: 12 },
  meRow: { backgroundColor: "#fff4f0", borderWidth: 1, borderColor: "#a3380030", position: "relative", overflow: "hidden" },
  meAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: "#a33800" },
  listRank: { width: 24, color: "#805032", fontWeight: "900", fontSize: 15 },
  listAvatar: { width: 40, height: 40, borderRadius: 20 },
  listName: { color: "#4b240a", fontWeight: "800", fontSize: 14 },
  listSub: { color: "#805032", fontSize: 11, marginTop: 1 },
  listCount: { color: "#4b240a", fontWeight: "900", fontSize: 16 },
  referBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 16 },
  referBtnText: { color: "#ffefeb", fontWeight: "900", fontSize: 16 }
});
