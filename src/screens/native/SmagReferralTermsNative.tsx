import { MaterialIcons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppRouter } from "@/lib/useAppRouter";

const PRIVACY_POLICY_URL = "https://smag-12fe9.web.app/privacy";
const TERMS_URL = "https://smag-12fe9.web.app/terms";

const sections = [
  {
    title: "Data We Collect",
    body: "We collect your name, email, phone number, delivery addresses and order history to provide the Smag service. Payment data is processed securely by Paystack and never stored on our servers."
  },
  {
    title: "How We Use Your Data",
    body: "Your data is used to process orders, personalise your experience, send order updates and improve our service. We do not sell your personal data to third parties."
  },
  {
    title: "Referral Terms",
    body: "Referrals are valid for verified Smag users with active accounts. Points are credited when your referred friend completes their first paid order. Self-referrals or duplicate account referrals are disqualified automatically."
  },
  {
    title: "Reward Payout",
    body: "Approved referral rewards are posted within 24 to 72 hours. Smag reserves the right to withhold rewards in cases of suspected fraud."
  },
  {
    title: "Data Retention",
    body: "We retain your data for as long as your account is active. You may request deletion of your account and associated data by contacting support@smag.ng."
  },
  {
    title: "Contact Us",
    body: "For privacy concerns or data requests, email us at privacy@smag.ng or visit our website."
  }
];

export function SmagReferralTermsNative() {
  const router = useAppRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#a33800" />
          </Pressable>
          <Text style={styles.title}>Terms & Privacy</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.linkRow}>
          <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(TERMS_URL)}>
            <MaterialIcons name="open-in-new" size={14} color="#ffefeb" />
            <Text style={styles.linkBtnText}>Full Terms of Service</Text>
          </Pressable>
          <Pressable style={[styles.linkBtn, styles.linkBtnSecondary]} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <MaterialIcons name="policy" size={14} color="#a33800" />
            <Text style={styles.linkBtnTextSecondary}>Privacy Policy</Text>
          </Pressable>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}

        <Pressable style={styles.cta} onPress={() => router.push("/smag_referral_history")}>
          <Text style={styles.ctaText}>View Referral History</Text>
        </Pressable>

        <Text style={styles.footer}>Last updated: January 2025 • Smag Mobile v{require("../../../package.json").version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 36, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { color: "#4b240a", fontSize: 24, fontWeight: "900" },
  placeholder: { width: 22, height: 22 },
  card: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 14
  },
  cardTitle: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  cardBody: { marginTop: 6, color: "#805032", fontSize: 14, lineHeight: 21 },
  cta: {
    marginTop: 10,
    borderRadius: 999,
    minHeight: 52,
    backgroundColor: "#a33800",
    alignItems: "center",
    justifyContent: "center"
  },
  ctaText: { color: "#ffefeb", fontSize: 16, fontWeight: "800" },
  linkRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  linkBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 10
  },
  linkBtnSecondary: { backgroundColor: "#ffede5" },
  linkBtnText: { color: "#ffefeb", fontSize: 12, fontWeight: "800" },
  linkBtnTextSecondary: { color: "#a33800", fontSize: 12, fontWeight: "800" },
  footer: { marginTop: 16, textAlign: "center", color: "#80503299", fontSize: 11 }
});
