import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppRouter } from "@/lib/useAppRouter";

const categories = [
  {
    icon: "rocket-launch" as const,
    title: "Getting Started",
    items: [
      {
        q: "How do I refer a friend?",
        a: "Navigate to your Profile tab and select \"Referrals\". There, you'll find your unique Smag link and invite code which you can share via text, email, or social media."
      },
      {
        q: "Is there a limit to referrals?",
        a: "Good news! There is currently no limit to how many gourmet friends you can refer. The more you share, the more rewards you harvest for your next meal."
      }
    ]
  },
  {
    icon: "redeem" as const,
    title: "Rewards",
    items: [
      {
        q: "When do I get my ₦10,000?",
        a: "Your ₦10,000 reward credits are automatically added to your Smag Wallet once your referred friend completes their first order of ₦25,000 or more."
      },
      {
        q: "Do credits expire?",
        a: "Referral credits remain active in your account for 90 days from the date of issuance."
      }
    ]
  },
  {
    icon: "handyman" as const,
    title: "Troubleshooting",
    items: [
      {
        q: "My link isn't working",
        a: "Try regenerating your link in the app settings. Ensure your friend is a first-time Smag user, as referral links only apply to new accounts."
      }
    ]
  }
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable style={styles.accordionItem} onPress={() => setOpen((v) => !v)}>
      <View style={styles.accordionHeader}>
        <Text style={styles.accordionQ}>{q}</Text>
        <MaterialIcons name={open ? "expand-less" : "expand-more"} size={22} color="#a33800" />
      </View>
      {open && <Text style={styles.accordionA}>{a}</Text>}
    </Pressable>
  );
}

export function SmagReferralFaqNative() {
  const router = useAppRouter();
  const [search, setSearch] = useState("");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#a33800" />
          </Pressable>
          <Text style={styles.topTitle}>Gourmet Support</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/smag_support_help")}>
          <MaterialIcons name="help-outline" size={22} color="#a33800" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.tagline}>REFERRAL PROGRAM FAQ</Text>
        <Text style={styles.headline}>Sharing the Smag Experience.</Text>
        <Text style={styles.sub}>Find answers to commonly asked questions about our rewards and referral mechanics.</Text>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#805032" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            placeholderTextColor="#80503280"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {categories.map((cat) => (
          <View key={cat.title} style={styles.category}>
            <View style={styles.catHeader}>
              <View style={styles.catIcon}>
                <MaterialIcons name={cat.icon} size={20} color="#a33800" />
              </View>
              <Text style={styles.catTitle}>{cat.title}</Text>
            </View>
            {cat.items
              .filter((item) => !search || item.q.toLowerCase().includes(search.toLowerCase()))
              .map((item) => (
                <AccordionItem key={item.q} q={item.q} a={item.a} />
              ))}
          </View>
        ))}

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Still need help?</Text>
          <Text style={styles.ctaSub}>Our concierge support team is available 24/7 to assist with your gourmet journey.</Text>
          <Pressable style={styles.ctaBtn} onPress={() => router.push("/smag_vip_support_chat")}>
            <MaterialIcons name="chat-bubble" size={18} color="#ffefeb" />
            <Text style={styles.ctaBtnText}>Contact Support</Text>
          </Pressable>
        </View>
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
  content: { padding: 20, paddingBottom: 40 },
  tagline: { color: "#a33800", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 6 },
  headline: { color: "#4b240a", fontSize: 32, fontWeight: "900", lineHeight: 36, marginBottom: 8 },
  sub: { color: "#805032", fontSize: 14, lineHeight: 21, marginBottom: 20 },
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#ffede5", borderRadius: 999, paddingHorizontal: 14, marginBottom: 24, height: 48
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#4b240a", fontSize: 14 },
  category: { marginBottom: 24 },
  catHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  catIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#ffdbc9",
    alignItems: "center", justifyContent: "center"
  },
  catTitle: { color: "#4b240a", fontSize: 18, fontWeight: "900" },
  accordionItem: {
    backgroundColor: "#ffffff", borderRadius: 14, padding: 16, marginBottom: 8
  },
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accordionQ: { flex: 1, color: "#4b240a", fontSize: 15, fontWeight: "800", paddingRight: 8 },
  accordionA: { color: "#805032", fontSize: 13, lineHeight: 20, marginTop: 10 },
  ctaCard: {
    backgroundColor: "#ffede5", borderRadius: 16, padding: 24, alignItems: "center", marginTop: 8
  },
  ctaTitle: { color: "#4b240a", fontSize: 22, fontWeight: "900", marginBottom: 6 },
  ctaSub: { color: "#805032", fontSize: 13, textAlign: "center", marginBottom: 16, lineHeight: 19 },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 14
  },
  ctaBtnText: { color: "#ffefeb", fontWeight: "900", fontSize: 15 }
});
