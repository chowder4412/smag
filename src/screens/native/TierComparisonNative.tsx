import type { ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const profileImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5GDc1WeT9BmUbxTcB9zyEWZq8GIaJ1n40AEfKLnXacCaM4OvshWpSk08nxvqn66p6kbZ09BwMl9zPYO3NZ7ju6IHeviFH23g1IVamSNlWQ_v7GzUuzILlHvV9Bll9h8obpiEuL4TgVNOljIoDM7Ng8bUsvUNEFiWgxnBNwQbMijQADN5leeC0K15bH_xHmUtTrXalj_AE4M43lqPrGRhoDkokY-JXOX9u9vhsu2zWASZrlHIBOiAXF8aiWWOwgfJ8dqDdKH6fYtb6";
const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB8pS2MLuXtMBB1qu-KI1TSgNpOuLyYNqstfySEGmlxHpsTJNPpXCfkq2fvS4els5cDJYoLMln8LH2IlyHxQ4RWxEygZ3Gh_kXwKeotuTwp2WF4Riq5ZeYVsTn1X02Z34REZtWdtztpVl76Hrh6PQ9UnriNh6cJYh7o7p_5LdThd240N9n1R5neL8WU-1pUX7KFGSUIjF5GKZT2E90K--5k9pX9PzTA03QRxb_u64_m6bFR8CIr9ByT7-oQbSShMPjqLRJlOjO1AmPE";
const ctaImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB6JZ0vMCRT2ZeJnzDstW_YfWkGPUCudfpJi_tq4ruwkKnE5fbPu8AA72M8BCU7LCuxfHiLZr7AKIpAhV_3LV7kVCwl9IVbQue9Q6hKxJHiHLCAAPMJuNa85p-LhM-acja666u1sxZZ14Jjenqp1uUdTWLQdUkYTRouE5ZQYbeqTN4Uoxzi15LOSgM7PNuwo_3pYR4qZb-aZSTtf7uPaYYgftr5dzkIMLQfOW4du5tKr-vLRgpjDAIkeTJ9jXK5g7Arht5IZd1fy8gM";

type TierFeature = {
  label: string;
  locked?: boolean;
  bold?: boolean;
};

const risingFeatures: TierFeature[] = [
  { label: "1.2x Point Multiplier" },
  { label: "Birthday Treats" },
  { label: "Early Access", locked: true },
  { label: "Priority Dispatch", locked: true },
  { label: "VIP Support", locked: true }
];

const eliteFeatures: TierFeature[] = [
  { label: "3.5x Point Multiplier" },
  { label: "Premium Birthday Gift" },
  { label: "First-In-Line Access" },
  { label: "Instant VIP Dispatch" },
  { label: "24/7 VIP Concierge", bold: true },
  { label: "Permanent Perks", bold: true }
];

export function TierComparisonNative() {
  const router = useAppRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <View style={styles.topLeft}>
              <Pressable style={styles.menuBtn} onPress={() => router.push("/smag_home")}>
                <MaterialIcons name="menu" size={20} color="#a33800" />
              </Pressable>
              <Text style={styles.topTitle}>The Gourmet Gallery</Text>
            </View>
            <Pressable onPress={() => router.push("/smag_profile")}>
              <AppImage source={{ uri: profileImage }} style={styles.avatar} />
            </Pressable>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.heroTag}>ELEVATE YOUR PALATE</Text>
            <Text style={styles.heroTitle}>
              Choose Your <Text style={styles.heroTitleAccent}>Culinary Journey</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Unlock exclusive privileges, priority services, and handcrafted rewards tailored
              for true gourmands.
            </Text>
            <View style={styles.heroImageWrap}>
              <AppImage source={{ uri: heroImage }} style={styles.heroImage} />
              <View style={styles.heroImageOverlay} />
              <View style={styles.quoteCard}>
                <Text style={styles.quoteText}>
                  &quot;The art of dining starts with the right tier.&quot;
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tierStack}>
            <TierCard
              tone="light"
              icon="auto-awesome"
              title="Rising Star"
              subtitle="Entry Privilege"
              features={risingFeatures}
              buttonLabel="Current Tier"
              onPress={() => router.push("/smag_membership_rewards")}
            />

            <View style={styles.proCard}>
              <View style={styles.proGlow} />
              <MaterialIcons name="restaurant" size={28} color="#ffefeb" />
              <Text style={styles.proTitle}>Pro</Text>
              <Text style={styles.proSub}>Connoisseur Choice</Text>
              <View style={styles.proFeatureList}>
                <ProFeature label="2.0x Point Multiplier" />
                <ProFeature label="Special Birthday Treats" />
                <ProFeature label="Early Access (24h)" />
                <ProFeature label="Priority Dispatch" />
                <View style={styles.proLocked}>
                  <MaterialIcons name="lock" size={14} color="#ffefebaa" />
                  <Text style={styles.proLockedText}>VIP Support</Text>
                </View>
              </View>
              <Pressable style={styles.proBtn} onPress={() => router.push("/smag_membership_rewards")}>
                <Text style={styles.proBtnText}>Upgrade Now</Text>
              </Pressable>
              <Text style={styles.proFoot}>Most Popular Choice</Text>
            </View>

            <TierCard
              tone="elite"
              icon="military-tech"
              title="Elite"
              subtitle="Ultimate Luxury"
              features={eliteFeatures}
              buttonLabel="Apply for Elite"
              onPress={() => router.push("/smag_membership_rewards")}
            />
          </View>

          <View style={styles.canvasSection}>
            <Text style={styles.canvasTitle}>The Benefit Canvas</Text>
            <Text style={styles.canvasSub}>
              A detailed breakdown of how we elevate your culinary experience.
            </Text>

            <FeatureRow
              title="Point Multipliers"
              sub="Velocity of rewards"
              values={[
                { label: "1.2x", tone: "neutral" },
                { label: "2.0x", tone: "primary" },
                { label: "3.5x", tone: "tertiary" }
              ]}
            />

            <FeatureRow
              title="Priority Dispatch"
              sub="Speed to table"
              values={[
                { label: "-", tone: "muted" },
                { label: "Check", tone: "primary" },
                { label: "Instant", tone: "tertiary" }
              ]}
            />

            <FeatureRow
              title="Early Access"
              sub="Exclusive menu debuts"
              values={[
                { label: "-", tone: "muted" },
                { label: "24h", tone: "primary" },
                { label: "7 Days", tone: "tertiary" }
              ]}
            />

            <FeatureRow
              title="VIP Support"
              sub="Personalized care"
              values={[
                { label: "Standard", tone: "neutral" },
                { label: "Priority", tone: "neutral" },
                { label: "Concierge", tone: "primary" }
              ]}
            />
          </View>

          <View style={styles.ctaWrap}>
            <AppImage source={{ uri: ctaImage }} style={styles.ctaImage} />
            <View style={styles.ctaOverlay} />
            <View style={styles.ctaBody}>
              <Text style={styles.ctaTitle}>
                Ready to Taste the <Text style={styles.ctaTitleAccent}>Unprecedented?</Text>
              </Text>
              <Text style={styles.ctaDesc}>
                Join over 150,000 gourmet members transforming daily dining into an art form.
              </Text>
              <Pressable style={styles.ctaPrimary} onPress={() => router.push("/smag_sign_up")}>
                <Text style={styles.ctaPrimaryText}>Join Smag Pro Today</Text>
              </Pressable>
              <Pressable style={styles.ctaSecondary} onPress={() => router.push("/smag_member_levels")}>
                <Text style={styles.ctaSecondaryText}>Compare Tiers</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem icon="auto-awesome" label="Gallery" onPress={() => router.push("/smag_home")} />
          <NavItem icon="restaurant" label="Discover" onPress={() => router.push("/smag_explore")} />
          <View style={styles.activeNav}>
            <MaterialIcons name="military-tech" size={18} color="#a33800" />
            <Text style={styles.activeNavLabel}>Rewards</Text>
          </View>
          <NavItem icon="person" label="Profile" onPress={() => router.push("/smag_profile")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function TierCard(props: {
  tone: "light" | "elite";
  icon: ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  subtitle: string;
  features: TierFeature[];
  buttonLabel: string;
  onPress: () => void;
}) {
  const elite = props.tone === "elite";
  return (
    <View style={styles.tierCard}>
      <MaterialIcons
        name={props.icon}
        size={26}
        color={elite ? "#e89b09" : "#ff5e07"}
        style={styles.tierIcon}
      />
      <Text style={styles.tierTitle}>{props.title}</Text>
      <Text style={styles.tierSub}>{props.subtitle}</Text>
      <View style={styles.tierFeatures}>
        {props.features.map((item) => (
          <View key={item.label} style={[styles.tierFeatureRow, item.locked && styles.lockedRow]}>
            {item.locked ? (
              <MaterialIcons name="lock" size={14} color="#805032" />
            ) : (
              <View style={[styles.dot, elite && styles.dotElite]} />
            )}
            <Text style={[styles.tierFeatureText, item.bold && styles.tierFeatureTextBold]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      <Pressable style={[styles.tierBtn, elite && styles.tierBtnElite]} onPress={props.onPress}>
        <Text style={[styles.tierBtnText, elite && styles.tierBtnTextElite]}>{props.buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

function ProFeature({ label }: { label: string }) {
  return (
    <View style={styles.proFeatureRow}>
      <MaterialIcons name="check-circle" size={17} color="#ffefeb" />
      <Text style={styles.proFeatureText}>{label}</Text>
    </View>
  );
}

function FeatureRow(props: {
  title: string;
  sub: string;
  values: { label: string; tone: "neutral" | "primary" | "tertiary" | "muted" }[];
}) {
  return (
    <View style={styles.featureCard}>
      <View>
        <Text style={styles.featureTitle}>{props.title}</Text>
        <Text style={styles.featureSub}>{props.sub}</Text>
      </View>
      <View style={styles.featureValues}>
        {props.values.map((value) => (
          <View key={value.label} style={styles.valuePill}>
            <Text
              style={[
                styles.valueText,
                value.tone === "primary" && styles.valueTextPrimary,
                value.tone === "tertiary" && styles.valueTextTertiary,
                value.tone === "muted" && styles.valueTextMuted
              ]}
            >
              {value.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function NavItem(props: {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.navItem} onPress={props.onPress}>
      <MaterialIcons name={props.icon} size={18} color="#805032" />
      <Text style={styles.navLabel}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  page: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, paddingRight: 10 },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffede5",
    alignItems: "center",
    justifyContent: "center"
  },
  topTitle: { color: "#a33800", fontSize: 20, fontWeight: "800", flexShrink: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  heroSection: { gap: 10 },
  heroTag: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#ffede5",
    color: "#a33800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8
  },
  heroTitle: { color: "#4b240a", fontSize: 38, lineHeight: 40, fontWeight: "900" },
  heroTitleAccent: { color: "#ff7941" },
  heroSubtitle: { color: "#805032", fontSize: 14, lineHeight: 20 },
  heroImageWrap: { marginTop: 4, borderRadius: 22, overflow: "hidden", height: 220 },
  heroImage: { width: "100%", height: "100%" },
  heroImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#4b240a22" },
  quoteCard: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 18,
    backgroundColor: "#ffffffe6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 160
  },
  quoteText: { color: "#a33800", fontSize: 13, lineHeight: 16, fontWeight: "700", fontStyle: "italic" },
  tierStack: { marginTop: 16, gap: 12 },
  tierCard: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  tierIcon: { marginBottom: 6 },
  tierTitle: { color: "#4b240a", fontSize: 27, lineHeight: 30, fontWeight: "900" },
  tierSub: { marginTop: 2, color: "#805032", fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  tierFeatures: { marginTop: 12, gap: 8 },
  tierFeatureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lockedRow: { opacity: 0.35 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#ff7941" },
  dotElite: { backgroundColor: "#7e5200" },
  tierFeatureText: { color: "#4b240a", fontSize: 13, fontWeight: "500" },
  tierFeatureTextBold: { fontWeight: "800" },
  tierBtn: {
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: "#ffede5",
    paddingVertical: 11,
    alignItems: "center"
  },
  tierBtnElite: { backgroundColor: "#4b240a" },
  tierBtnText: { color: "#a33800", fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  tierBtnTextElite: { color: "#ffefeb" },
  proCard: {
    borderRadius: 24,
    backgroundColor: "#d75a20",
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: "hidden"
  },
  proGlow: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ff9f6e44"
  },
  proTitle: { marginTop: 6, color: "#ffefeb", fontSize: 30, lineHeight: 32, fontWeight: "900" },
  proSub: { color: "#ffdbc9", fontSize: 12, fontWeight: "600", letterSpacing: 0.6 },
  proFeatureList: { marginTop: 12, gap: 10 },
  proFeatureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  proFeatureText: { color: "#ffefeb", fontSize: 14, fontWeight: "600" },
  proLocked: { flexDirection: "row", alignItems: "center", gap: 8, opacity: 0.55 },
  proLockedText: { color: "#ffefeb", fontSize: 14, fontWeight: "500" },
  proBtn: {
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    alignItems: "center"
  },
  proBtnText: { color: "#a33800", fontSize: 13, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  proFoot: {
    marginTop: 8,
    textAlign: "center",
    color: "#ffdbc9",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  canvasSection: { marginTop: 20 },
  canvasTitle: { color: "#4b240a", fontSize: 30, lineHeight: 34, fontWeight: "900" },
  canvasSub: { marginTop: 4, color: "#805032", fontSize: 13, lineHeight: 18 },
  featureCard: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "#ffede5",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10
  },
  featureTitle: { color: "#a33800", fontSize: 17, fontWeight: "800" },
  featureSub: { color: "#805032", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  featureValues: { flexDirection: "row", gap: 8 },
  valuePill: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center"
  },
  valueText: { color: "#4b240a", fontSize: 12, fontWeight: "700" },
  valueTextPrimary: { color: "#a33800" },
  valueTextTertiary: { color: "#7e5200" },
  valueTextMuted: { color: "#80503266" },
  ctaWrap: { marginTop: 22, borderRadius: 24, overflow: "hidden", height: 320, position: "relative" },
  ctaImage: { width: "100%", height: "100%" },
  ctaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#1e0800cc" },
  ctaBody: { ...StyleSheet.absoluteFillObject, padding: 18, alignItems: "center", justifyContent: "center" },
  ctaTitle: { color: "#ffffff", textAlign: "center", fontSize: 32, lineHeight: 36, fontWeight: "900" },
  ctaTitleAccent: { color: "#ff7941" },
  ctaDesc: {
    marginTop: 8,
    color: "#ffefebcc",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 280
  },
  ctaPrimary: {
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: "#ff5e07",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  ctaPrimaryText: { color: "#ffefeb", fontSize: 13, fontWeight: "800" },
  ctaSecondary: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ffffff44",
    backgroundColor: "#ffffff22",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  ctaSecondaryText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffffee",
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },
  navItem: { alignItems: "center", gap: 2 },
  navLabel: { color: "#805032", fontSize: 10, fontWeight: "700" },
  activeNav: {
    borderRadius: 999,
    backgroundColor: "#ffede5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2
  },
  activeNavLabel: { color: "#a33800", fontSize: 10, fontWeight: "900" }
});
