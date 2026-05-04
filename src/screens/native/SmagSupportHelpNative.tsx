import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppRouter } from "@/lib/useAppRouter";

const faqs = [
  {
    q: "How do I refer a friend?",
    a: "Go to your Profile tab and select Referrals. Share your unique Smag link via text, email, or social media."
  },
  {
    q: "Is there a limit to referrals?",
    a: "No limit! The more friends you refer, the more rewards you earn."
  },
  {
    q: "When do I get my ₦10,000 reward?",
    a: "Credits are added to your Smag Wallet once your referred friend completes their first order of ₦25,000 or more."
  },
  {
    q: "Do credits expire?",
    a: "Referral credits remain active for 90 days from the date of issuance."
  },
  {
    q: "My referral link isn't working.",
    a: "Try regenerating your link in Settings. Ensure your friend is a first-time Smag user - referral links only apply to new accounts."
  }
];

export function SmagSupportHelpNative() {
  const router = useAppRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#a33800" />
        </Pressable>
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>REFERRAL PROGRAM FAQ</Text>
        <Text style={styles.title}>Sharing the{"\n"}Smag Experience.</Text>
        <Text style={styles.subtitle}>
          Find answers to commonly asked questions about our rewards and referral mechanics.
        </Text>

        <View style={styles.faqList}>
          {faqs.map((item) => (
            <View key={item.q} style={styles.faqCard}>
              <View style={styles.faqTop}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <MaterialIcons name="expand-more" size={22} color="#a33800" />
              </View>
              <Text style={styles.faqA}>{item.a}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Still need help?</Text>
          <Text style={styles.ctaSubtitle}>Our concierge support team is available 24/7.</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffede5",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: { color: "#4b240a", fontSize: 18, fontWeight: "900" },
  content: { padding: 20, paddingBottom: 40 },
  kicker: { color: "#a33800", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { marginTop: 6, color: "#4b240a", fontSize: 34, fontWeight: "900", lineHeight: 38 },
  subtitle: { marginTop: 10, marginBottom: 20, color: "#805032", fontSize: 15, lineHeight: 22 },
  faqList: { gap: 10 },
  faqCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#4b240a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  faqTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8
  },
  faqQ: { flex: 1, color: "#4b240a", fontSize: 16, fontWeight: "800" },
  faqA: { marginTop: 8, color: "#805032", fontSize: 14, lineHeight: 20 },
  ctaCard: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: "#ffede5",
    padding: 20,
    alignItems: "center"
  },
  ctaTitle: { color: "#4b240a", fontSize: 22, fontWeight: "900" },
  ctaSubtitle: { marginTop: 6, marginBottom: 16, color: "#805032", textAlign: "center" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#a33800",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  ctaBtnText: { color: "#ffefeb", fontWeight: "800", fontSize: 15 }
});
