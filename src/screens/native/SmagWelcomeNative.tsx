import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { clearOnboardingPending } from "@/lib/startupState";
import { useAppRouter } from "@/lib/useAppRouter";

const welcomeLogo = require("../../../assets/smag_logo_cropped_clean.png");

const onboardingSlides = [
  {
    title: "Welcome to Smag!",
    subtitle: "Your account has been created successfully. Let's find your first delicious meal!",
    cardTitle: "Starter Gift",
    cardBody: "Enjoy free delivery on your first three orders.",
    cardIcon: "redeem" as const
  },
  {
    title: "Order With Confidence",
    subtitle: "Track your delivery in real-time and chat with support whenever you need help.",
    cardTitle: "Live Tracking",
    cardBody: "Follow every step from kitchen prep to doorstep delivery.",
    cardIcon: "local-shipping" as const
  },
  {
    title: "Unlock Rewards Faster",
    subtitle: "Earn points on every order and move up member levels to unlock elite perks.",
    cardTitle: "Member Benefits",
    cardBody: "Points, birthday gifts, exclusive deals, and VIP support access.",
    cardIcon: "military-tech" as const
  }
];

export function SmagWelcomeNative() {
  const router = useAppRouter();
  const [step, setStep] = useState(0);

  const slide = onboardingSlides[step];
  const isLastStep = step === onboardingSlides.length - 1;

  const progress = useMemo(
    () => onboardingSlides.map((_, index) => ({ active: index <= step, filled: index === step })),
    [step]
  );

  async function finishOnboarding() {
    await clearOnboardingPending();
    router.replace("/smag_home");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          <View style={styles.topActions}>
            <Pressable style={styles.helpBtn} onPress={() => router.push("/smag_support_help")}>
              <MaterialIcons name="help-outline" size={20} color="#a33800" />
            </Pressable>
            {!isLastStep ? (
              <Pressable style={styles.skipBtn} onPress={finishOnboarding}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.heroContainer}>
            <View style={styles.glowA} />
            <View style={styles.glowB} />
            <View style={styles.heroCard}>
              <Image source={welcomeLogo} style={styles.heroImage} resizeMode="contain" />
              <View style={styles.badge}>
                <View style={styles.badgeIcon}>
                  <MaterialIcons name="check-circle" size={20} color="#ffefeb" />
                </View>
                <View>
                  <Text style={styles.badgeLabel}>SUCCESS</Text>
                  <Text style={styles.badgeText}>Identity Verified</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>

          <View style={styles.giftCard}>
            <View style={styles.giftIconWrap}>
              <MaterialIcons name={slide.cardIcon} size={28} color="#ffefeb" />
            </View>
            <View style={styles.giftTextWrap}>
              <Text style={styles.giftTitle}>{slide.cardTitle}</Text>
              <Text style={styles.giftText}>{slide.cardBody}</Text>
            </View>
          </View>

          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              if (isLastStep) {
                void finishOnboarding();
                return;
              }
              setStep((value) => Math.min(value + 1, onboardingSlides.length - 1));
            }}
          >
            <Text style={styles.primaryBtnText}>{isLastStep ? "Start Exploring" : "Next"}</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#ffefeb" />
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => {
              if (step === 0) {
                router.push("/smag_edit_profile");
                return;
              }
              setStep((value) => Math.max(value - 1, 0));
            }}
          >
            <Text style={styles.secondaryBtnText}>{step === 0 ? "Complete Profile" : "Go Back"}</Text>
          </Pressable>

          <View style={styles.pagerWrap}>
            {progress.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.dotIdle,
                  item.active && styles.dotActive,
                  item.filled && styles.dotLine
                ]}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  shell: { flex: 1, alignItems: "center", width: "100%" },
  scroll: { flex: 1, width: "100%" },
  topBar: {
    width: "100%",
    maxWidth: 620,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { width: 80, height: 36 },
  helpBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffede5",
    justifyContent: "center",
    alignItems: "center"
  },
  skipBtn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#ffede5" },
  skipText: { color: "#a33800", fontWeight: "800", fontSize: 12 },
  content: {
    width: "100%",
    maxWidth: 620,
    paddingHorizontal: 24,
    paddingBottom: 34,
    flexGrow: 1
  },
  heroContainer: { position: "relative", marginTop: 10, marginBottom: 22, aspectRatio: 1, width: "100%" },
  glowA: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,121,65,0.22)",
    top: -16,
    left: -10
  },
  glowB: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(248,169,31,0.15)",
    right: -16,
    bottom: -20
  },
  heroCard: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fffaf8",
    borderWidth: 1,
    borderColor: "rgba(221,159,124,0.25)"
  },
  heroImage: { width: "100%", height: "100%", transform: [{ scale: 1.03 }] },
  badge: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#a33800",
    justifyContent: "center",
    alignItems: "center"
  },
  badgeLabel: { color: "#805032", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  badgeText: { color: "#4b240a", fontWeight: "800", fontSize: 14 },
  title: {
    textAlign: "center",
    color: "#4b240a",
    fontSize: 35,
    fontWeight: "900",
    marginBottom: 8
  },
  subtitle: {
    textAlign: "center",
    color: "#805032",
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 6
  },
  giftCard: {
    marginTop: 18,
    backgroundColor: "#ffede5",
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  giftIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#a33800",
    justifyContent: "center",
    alignItems: "center"
  },
  giftTextWrap: { flex: 1 },
  giftTitle: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  giftText: { marginTop: 3, color: "#805032", fontSize: 13, lineHeight: 20 },
  primaryBtn: {
    marginTop: 22,
    backgroundColor: "#a33800",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primaryBtnText: { color: "#ffefeb", fontSize: 17, fontWeight: "800" },
  secondaryBtn: { marginTop: 10, borderRadius: 999, paddingVertical: 14, alignItems: "center" },
  secondaryBtnText: { color: "#a33800", fontWeight: "800" },
  pagerWrap: {
    marginTop: 20,
    marginBottom: 4,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  dotActive: { backgroundColor: "#d4a184" },
  dotLine: { width: 40, borderRadius: 999 },
  dotIdle: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#ead9d0" }
});
