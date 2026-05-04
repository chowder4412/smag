import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getUserReferralCode } from "@/lib/firebase/firestore";

const heroImg =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD7M7VjEXbn_uJbsfSTwVitXiu6RBF6qy-oOu1jO0mIk0WYb8xPqGibf65qFWnMQONQAEaeq12uQD4DcTKYOIiWpTR-vILSPwIeJVqAiLm75TuSx5k6JSrhatn9xJ_lP-CqWU1ApOIqyEXq-wGhZCRazTOEDN6nTM7b0HvvKWhdI68wP7ZMYVZ26pNYxk6N8jVu6YkIZuk7Pu3ZdwasfUr0flfqgXT1jt12NpXxm02bqh_8wViz211Rt2_o93OMq83-lpOPa8OYouDH";

const steps = [
  { icon: "share" as const, title: "1. Share your code", desc: "Send your referral link or code to your foodie friends via text or social media." },
  { icon: "person-add" as const, title: "2. Friend joins Smag", desc: "Your friend signs up and places their first order of ₦25,000 or more using your code." },
  { icon: "redeem" as const, title: "3. Both get ₦10,000", desc: "The credit is automatically applied to both of your accounts. Time for a gourmet feast!" }
];

export function SmagReferAFriendNative() {
  const router = useAppRouter();
  const [referralCode, setReferralCode] = useState("SMAG-...");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    void getUserReferralCode(user.uid).then(setReferralCode);
  }, []);

  const shareReferralCode = async () => {
    await Share.share({
      message: `Use my Smag referral code ${referralCode} and we both get ₦10,000 off.`,
      title: "Smag Referral Invite"
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#805032" />
        </Pressable>
        <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <AppImage source={{ uri: heroImg }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
        </View>

        <View style={styles.heroTextCard}>
          <Text style={styles.heroTitle}>Share the Taste, Get ₦10,000</Text>
          <Text style={styles.heroDesc}>
            Invite your friends to Smag. When they place their first order, you both get ₦10,000 off your next meal!
          </Text>
        </View>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>YOUR UNIQUE CODE</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeValue}>{referralCode}</Text>
            <Pressable style={styles.copyBtn} onPress={shareReferralCode}>
              <MaterialIcons name="content-copy" size={14} color="#fff" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>How it Works</Text>
        {steps.map((s) => (
          <View key={s.title} style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <MaterialIcons name={s.icon} size={28} color="#a33800" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <Pressable style={styles.inviteBtn} onPress={() => router.push("/smag_referral_history")}>
          <MaterialIcons name="send" size={18} color="#ffefeb" />
          <Text style={styles.inviteText}>Invite Friends</Text>
        </Pressable>

        <View style={styles.subLinks}>
          <Pressable style={styles.subLink} onPress={() => router.push("/smag_referral_faq")}>
            <MaterialIcons name="help-outline" size={16} color="#a33800" />
            <Text style={styles.subLinkText}>Referral FAQ</Text>
          </Pressable>
          <Pressable style={styles.subLink} onPress={() => router.push("/smag_rules_prizes")}>
            <MaterialIcons name="emoji-events" size={16} color="#a33800" />
            <Text style={styles.subLinkText}>Rules &amp; Prizes</Text>
          </Pressable>
          <Pressable style={styles.subLink} onPress={() => router.push("/smag_referral_leaderboard")}>
            <MaterialIcons name="leaderboard" size={16} color="#a33800" />
            <Text style={styles.subLinkText}>Leaderboard</Text>
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
  iconBtn: { padding: 8, borderRadius: 999 },
  brand: { width: 80, height: 36 },
  content: { padding: 16, paddingBottom: 40 },
  heroWrap: { borderRadius: 20, overflow: "hidden", height: 220, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,244,240,0.3)"
  },
  heroTextCard: {
    backgroundColor: "#ffffff", borderRadius: 16, padding: 20,
    marginTop: -24, marginHorizontal: 12, marginBottom: 20,
    shadowColor: "#4b240a", shadowOpacity: 0.08, shadowRadius: 20, elevation: 4
  },
  heroTitle: { color: "#a33800", fontSize: 26, fontWeight: "900", marginBottom: 8 },
  heroDesc: { color: "#805032", fontSize: 14, lineHeight: 21 },
  codeBox: {
    backgroundColor: "#ffede5", borderRadius: 16, padding: 16,
    alignItems: "center", marginBottom: 24, gap: 10
  },
  codeLabel: { color: "#805032", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  codeRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#ffffff", borderRadius: 999, paddingLeft: 20, paddingRight: 4,
    paddingVertical: 4, width: "100%"
  },
  codeValue: { color: "#4b240a", fontSize: 18, fontWeight: "900", letterSpacing: 2 },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10
  },
  copyBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  sectionTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: 20 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  stepIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#ffdbc9",
    alignItems: "center", justifyContent: "center", flexShrink: 0
  },
  stepTitle: { color: "#4b240a", fontSize: 16, fontWeight: "900" },
  stepDesc: { color: "#805032", fontSize: 13, marginTop: 2, lineHeight: 19 },
  inviteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 18, marginTop: 8
  },
  inviteText: { color: "#ffefeb", fontWeight: "900", fontSize: 16 },
  subLinks: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 16, flexWrap: "wrap" },
  subLink: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6 },
  subLinkText: { color: "#a33800", fontSize: 13, fontWeight: "700" }
});
