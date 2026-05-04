import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const heroImg =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC3OUIuRxeU-rSqUFKN4GI1INnjlHpfLosl86ChzX-wC395HAMsAdAMc4PU7wtgciWweD5Xz27pYUFM6Y1_jNkMiVnJsF6BvGQNFrYXQTOVmKre4NMdX6NN5ZSsdYn3G91HWNaCliVZigUKbaEZjIST-GYxzcGxdgy8X_cdrM4j0nPreUaV0NkD87Q8FRR_9A8_QI5eSjBPzw3bbC0yt9rllAyCKyQbiEBljC0DpJ0oT90WSg96LhmW1ZVUXjcvMrbg51Oy_03ncvKK";

const steps = [
  { n: "1", title: "Select Items", desc: "Add eligible gourmet items from selected restaurants to your cart." },
  { n: "2", title: "Apply Code", desc: "Enter the promo code during the checkout process." },
  { n: "3", title: "Enjoy Savings", desc: "The 50% discount will be automatically applied to your total order." }
];

const terms = [
  "Minimum order value of ₦30,000 is required to activate the discount.",
  "Offer valid for first-time users and select existing accounts.",
  "Maximum discount value capped at ₦25,000 per transaction.",
  "Cannot be combined with other active promotions or rewards."
];

export function SmagPromoDetailsNative() {
  const router = useAppRouter();
  const sharePromo = async () => {
    await Share.share({
      message: "Smag Gourmet Weekend: 50% OFF. Tap to open promo details in the app.",
      title: "Smag Promo"
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#a33800" />
          </Pressable>
          <Text style={styles.topTitle}>Promo Details</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={sharePromo}>
          <MaterialIcons name="share" size={22} color="#a33800" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <AppImage source={{ uri: heroImg }} style={styles.heroImage} />
          <View style={styles.badge}>
            <MaterialIcons name="timer" size={14} color="#fff" />
            <Text style={styles.badgeText}>Limited Time</Text>
          </View>
        </View>

        <Text style={styles.headline}>Gourmet Weekend:{"\n"}<Text style={styles.discount}>50% OFF</Text></Text>
        <View style={styles.dateRow}>
          <MaterialIcons name="calendar-today" size={16} color="#ff5e07" />
          <Text style={styles.dateText}>Expires on: <Text style={styles.dateBold}>October 31, 2023</Text></Text>
        </View>

        <Text style={styles.sectionTitle}>How to Redeem</Text>
        {steps.map((s) => (
          <View key={s.n} style={styles.stepCard}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.n}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Terms &amp; Conditions</Text>
        <View style={styles.termsCard}>
          {terms.map((t) => (
            <View key={t} style={styles.termRow}>
              <MaterialIcons name="check-circle" size={18} color="#ff5e07" />
              <Text style={styles.termText}>{t}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.ctaBtn} onPress={() => router.push("/smag_my_cart")}>
          <MaterialIcons name="shopping-basket" size={20} color="#fff" />
          <Text style={styles.ctaText}>Apply Promo &amp; Order</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff4f0"
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 8, borderRadius: 999 },
  topTitle: { color: "#a33800", fontSize: 18, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 40 },
  heroWrap: { borderRadius: 20, overflow: "hidden", height: 260, position: "relative", marginBottom: 24 },
  heroImage: { width: "100%", height: "100%" },
  badge: {
    position: "absolute", bottom: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6
  },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  headline: { color: "#4b240a", fontSize: 32, fontWeight: "900", lineHeight: 38 },
  discount: { color: "#a33800" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, marginBottom: 20 },
  dateText: { color: "#805032", fontSize: 13 },
  dateBold: { fontWeight: "800", color: "#4b240a" },
  sectionTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900", marginBottom: 12, marginTop: 4 },
  stepCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: "#ffede5", borderRadius: 16, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: "#a33800"
  },
  stepNum: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center"
  },
  stepNumText: { color: "#a33800", fontWeight: "900", fontSize: 15 },
  stepTitle: { color: "#4b240a", fontWeight: "800", fontSize: 15 },
  stepDesc: { color: "#805032", fontSize: 13, marginTop: 2 },
  termsCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, gap: 12, marginBottom: 24 },
  termRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  termText: { flex: 1, color: "#805032", fontSize: 13, lineHeight: 19 },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 18
  },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16 }
});
