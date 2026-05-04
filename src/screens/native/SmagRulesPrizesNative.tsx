import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const prize1 = "https://lh3.googleusercontent.com/aida-public/AB6AXuCNxNueTo6LHx41dDQo0tWII8BfpTQaJ0XCFv2NthmGFqLaPzcfg-Do6-f2q2ruGuFHXnohcr1tIth3Jb5vkweBfa8sUrKAg9bbHWvqxvxWun6YfqqkhBNLPxUQswld7Ws6L9nKsco821iQdDRQ0nF-mVluBmJc2XxT_p_WxVhIN8BRcYDhnXuyJCy_R5iuayL91EmM8Q-tO1GlLdmQJUW2iadZ3-j1KUgBeUdJM9uMLYLA_QdZdPhZ3X3meRwPJ8iZt7JbBEQgWiyw";
const prize2 = "https://lh3.googleusercontent.com/aida-public/AB6AXuAqoi_NpJFKGA6xTJ1YDu1a-ju-Xu_MiP9HiPdc5wi3iGLXU1ia59EDuIHQHXy6ZPTeKH0HsHZsA6NOOKz1LEmvanSwOx5QdxeRgnHzSPGbZdG1WdfS_zUGyE7uUieunuVUHhkPiyV3s19tKZfgkWU1Qw1gDcEkVcVzTkHIyqTLhcjkhR9JsfGtGzG1YII2qsg0fTxe6e4fQk0gxUKdX0CNeC7p8MWEWvnWtG8iYu8vXwc2zNJimL5QQSXy-eS2cY4lv1f_lPXAz3CR";
const prize3 = "https://lh3.googleusercontent.com/aida-public/AB6AXuDDMBE8aKSU5BPr3MomvT-zivx8dK-VZxQFbcIOv8vJbIVj5jOg-EQRn7131hJWSSzq5r3Gw9jgTCKkD6TNTxSjdfvsHXVFm97Eh8c8-QzG8oRRlLPv2lIUEkkPU7gf0DgRzYChQKYYt66Dii98kojOPt_urxg164VsJsAZEslIqUVSgAcCI9oSzEnSBIZ_CPV0zjVpTDfVxUIUqQiu9FZUmclRobIH9EFq873JEXWJ7JZwk0dRTbkkFU39sFZRWSeHOhT845z3Gj_s";

const prizes = [
  { rank: "Rank 1-3", title: "Free Meals for a Month", desc: "Full gourmet experience delivered daily. Value ₦1,200,000.", img: prize1 },
  { rank: "Rank 4-10", title: "Smag Exclusive Merch", desc: "Limited edition Saffron Zest collection hoodies & caps.", img: prize2 },
  { rank: "Rank 11-50", title: "Exclusive Discounts", desc: "Permanent 25% off all orders for the next month.", img: prize3 }
];

const tiers = [
  { icon: "star" as const, title: "Elite Tier", sub: "Top 5% of Referrers", perk: "VIP SUPPORT", perkSub: "Permanent Perk", highlight: true },
  { icon: "bolt" as const, title: "Pro Tier", sub: "Refer 10+ Friends", perk: "EARLY ACCESS", perkSub: "New Menus", highlight: false },
  { icon: "trending-up" as const, title: "Rising Star", sub: "Everyone starts here", perk: "5% BONUS", perkSub: "Point Boost", highlight: false }
];

export function SmagRulesPrizesNative() {
  const router = useAppRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#FF5C00" />
          </Pressable>
          <Text style={styles.topTitle}>Rules &amp; Prizes</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/smag_referral_terms")}>
          <MaterialIcons name="help-outline" size={22} color="#FF5C00" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTag}>
            <MaterialIcons name="schedule" size={14} color="#a33800" />
            <Text style={styles.heroTagText}>Monthly Reset</Text>
          </View>
          <Text style={styles.heroTitle}>September Season</Text>
          <Text style={styles.heroSub}>The leaderboard resets in <Text style={styles.heroHighlight}>12 days</Text>. Aim for the top spot!</Text>
        </View>

        <Text style={styles.sectionTitle}>How to Earn Points</Text>
        <View style={styles.earnCard}>
          <View style={styles.earnIcon}>
            <MaterialIcons name="person-add" size={22} color="#a33800" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.earnTitle}>Successful Referral</Text>
            <Text style={styles.earnDesc}>Earn <Text style={styles.earnHighlight}>500 pts</Text> for every friend who places their first order over ₦20,000.</Text>
          </View>
        </View>
        <View style={styles.earnGrid}>
          <View style={styles.earnGridItem}>
            <MaterialIcons name="shopping-bag" size={22} color="#ff5e07" />
            <Text style={styles.earnGridTitle}>High Value Orders</Text>
            <Text style={styles.earnGridDesc}>Get <Text style={{ fontWeight: "800", color: "#4b240a" }}>50 pts</Text> for every ₦10,000 your referrals spend.</Text>
          </View>
          <View style={styles.earnGridItem}>
            <MaterialIcons name="auto-awesome" size={22} color="#ff5e07" />
            <Text style={styles.earnGridTitle}>Daily Streak</Text>
            <Text style={styles.earnGridDesc}>Login daily to maintain a <Text style={{ fontWeight: "800", color: "#4b240a" }}>10 pts</Text> boost.</Text>
          </View>
        </View>

        <View style={styles.prizesHeader}>
          <Text style={styles.sectionTitle}>Seasonal Prizes</Text>
          <Text style={styles.prizesTag}>Top 100 win</Text>
        </View>
        {prizes.map((p) => (
          <View key={p.rank} style={styles.prizeCard}>
            <AppImage source={{ uri: p.img }} style={styles.prizeImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.prizeRank}>{p.rank}</Text>
              <Text style={styles.prizeTitle}>{p.title}</Text>
              <Text style={styles.prizeDesc}>{p.desc}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>League Status</Text>
        {tiers.map((t) => (
          <View key={t.title} style={[styles.tierRow, t.highlight && styles.tierHighlight]}>
            <View style={[styles.tierIcon, t.highlight && styles.tierIconHighlight]}>
              <MaterialIcons name={t.icon} size={22} color={t.highlight ? "#fff" : "#a33800"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierTitle}>{t.title}</Text>
              <Text style={styles.tierSub}>{t.sub}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.tierPerk, t.highlight && { color: "#a33800" }]}>{t.perk}</Text>
              <Text style={styles.tierPerkSub}>{t.perkSub}</Text>
            </View>
          </View>
        ))}

        <Pressable style={styles.ctaBtn} onPress={() => router.push("/smag_refer_a_friend")}>
          <Text style={styles.ctaText}>Invite Friends Now</Text>
          <MaterialIcons name="send" size={18} color="#fff" />
        </Pressable>
        <Text style={styles.disclaimer}>
          By participating, you agree to the Smag Referral Terms of Service. Rewards are non-transferable.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 8, borderRadius: 999 },
  topTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: "#ffede5", borderRadius: 20, padding: 20, marginBottom: 20 },
  heroTag: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  heroTagText: { color: "#a33800", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  heroTitle: { color: "#4b240a", fontSize: 28, fontWeight: "900" },
  heroSub: { color: "#805032", fontSize: 13, marginTop: 4 },
  heroHighlight: { color: "#a33800", fontWeight: "800" },
  sectionTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900", marginBottom: 12, marginTop: 4 },
  earnCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 10
  },
  earnIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffede5",
    alignItems: "center", justifyContent: "center", flexShrink: 0
  },
  earnTitle: { color: "#4b240a", fontSize: 16, fontWeight: "900" },
  earnDesc: { color: "#805032", fontSize: 13, marginTop: 2 },
  earnHighlight: { color: "#a33800", fontWeight: "800" },
  earnGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  earnGridItem: { flex: 1, backgroundColor: "#ffede5", borderRadius: 16, padding: 14, gap: 6 },
  earnGridTitle: { color: "#4b240a", fontWeight: "800", fontSize: 14 },
  earnGridDesc: { color: "#805032", fontSize: 12 },
  prizesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  prizesTag: { color: "#a33800", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  prizeCard: {
    flexDirection: "row", gap: 14, backgroundColor: "#ffffff",
    borderRadius: 16, overflow: "hidden", marginBottom: 10, alignItems: "center"
  },
  prizeImage: { width: 100, height: 100 },
  prizeRank: { color: "#a33800", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginRight: 8 },
  prizeTitle: { color: "#4b240a", fontSize: 15, fontWeight: "900", marginTop: 2 },
  prizeDesc: { color: "#805032", fontSize: 12, marginTop: 2, paddingRight: 12 },
  tierRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#ffede5", borderRadius: 16, padding: 14, marginBottom: 8
  },
  tierHighlight: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#a3380020" },
  tierIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffdbc9",
    alignItems: "center", justifyContent: "center"
  },
  tierIconHighlight: { backgroundColor: "#a33800" },
  tierTitle: { color: "#4b240a", fontWeight: "900", fontSize: 16 },
  tierSub: { color: "#805032", fontSize: 11, marginTop: 1 },
  tierPerk: { color: "#4b240a", fontWeight: "900", fontSize: 12 },
  tierPerkSub: { color: "#805032", fontSize: 10, fontWeight: "700" },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 18, marginTop: 16, marginBottom: 12
  },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  disclaimer: { color: "#80503280", fontSize: 11, textAlign: "center", paddingHorizontal: 16 }
});
