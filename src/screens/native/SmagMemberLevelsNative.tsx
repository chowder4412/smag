import type { ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const eliteAccentImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBYY1PcqeLw3IOf64kfc7d4xeoUBy4_4hErI6zK4b7M2SehaMiYAu8vkBAghTsne4NNsB5FrR6vJjy3WGsdsAI58_5o2nwbiIEZN5-9IjM9kyU95-3Lp6fVZhpzf6ZqnURBfZ1pE1SUF3Z61HXWG3R-bgF_CJ8_tha29SMm7fxlOufKDNKdx_gd4SOmYyf7q9hVm-wx9ujD49SQV2keaWjOTVqraWMpuegXarSI2XsaV77tcn7B-FCLwE_ONV-UB5i0a2Ea0x_UQosC";

type Perk = {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  desc: string;
};

const risingPerks: Perk[] = [
  {
    icon: "bolt",
    title: "5% Bonus Points",
    desc: "Earn more points on every signature dish you order."
  },
  {
    icon: "cake",
    title: "Birthday Treat",
    desc: "A curated dessert surprise on your special day."
  }
];

const proPerks: Perk[] = [
  {
    icon: "restaurant-menu",
    title: "Early Access",
    desc: "Be first to book tables for seasonal tasting menus."
  },
  {
    icon: "delivery-dining",
    title: "Priority Dispatch",
    desc: "Your orders bypass the queue during peak dining hours."
  },
  {
    icon: "group-add",
    title: "15% Point Boost",
    desc: "Three times the rewards of a Rising Star member."
  }
];

const elitePerks: Perk[] = [
  {
    icon: "support-agent",
    title: "VIP Support",
    desc: "A dedicated concierge available 24/7 for any request."
  },
  {
    icon: "confirmation-number",
    title: "Permanent Perk",
    desc: "Zero delivery fees on every single order, forever."
  },
  {
    icon: "card-membership",
    title: "Secret Events",
    desc: "Invitations to closed-door chef collaborations and tastings."
  }
];

export function SmagMemberLevelsNative() {
  const router = useAppRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <View style={styles.topLeft}>
              <Pressable style={styles.iconBtn} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={20} color="#a33800" />
              </Pressable>
              <Text style={styles.topTitle}>Curated Tiers</Text>
            </View>
            <Pressable style={styles.iconBtn} onPress={() => router.push("/tier_comparison")}>
              <MaterialIcons name="info" size={18} color="#a33800" />
            </Pressable>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.progressLine}>
              <View style={styles.progressLineFill} />
            </View>
            <View style={styles.heroSteps}>
              <TierStep icon="stars" label="RISING" />
              <View style={styles.heroCenterStep}>
                <View style={styles.centerBadge}>
                  <MaterialIcons name="auto-awesome" size={24} color="#ffefeb" />
                </View>
                <Text style={styles.centerLabel}>PRO STATUS</Text>
              </View>
              <TierStep icon="military-tech" label="ELITE" dimmed />
            </View>
            <Text style={styles.heroNote}>
              You&apos;re 4 referrals away from <Text style={styles.heroNoteStrong}>Pro Access</Text>
            </Text>
          </View>

          <View style={styles.sectionHead}>
            <View style={styles.sectionIconWrap}>
              <MaterialIcons name="rocket-launch" size={20} color="#a33800" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Rising Star</Text>
              <Text style={styles.sectionSub}>The Starting Point</Text>
            </View>
          </View>
          <View style={styles.risingCard}>
            {risingPerks.map((perk) => (
              <PerkRow key={perk.title} perk={perk} iconColor="#ff5e07" />
            ))}
          </View>

          <View style={styles.sectionHeadRow}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIconWrapPro}>
                <MaterialIcons name="verified" size={20} color="#a33800" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Pro</Text>
                <Text style={styles.sectionSub}>Refer 10+ Friends</Text>
              </View>
            </View>
            <Text style={styles.activePill}>ACTIVE</Text>
          </View>
          <View style={styles.proOuter}>
            <View style={styles.proCard}>
              {proPerks.map((perk) => (
                <PerkRow key={perk.title} perk={perk} iconColor="#a33800" boxedIcon />
              ))}
            </View>
          </View>

          <View style={styles.sectionHead}>
            <View style={styles.sectionIconWrapElite}>
              <MaterialIcons name="diamond" size={20} color="#7e5200" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Elite</Text>
              <Text style={styles.sectionSub}>Top 5% of Referrers</Text>
            </View>
          </View>
          <View style={styles.eliteCard}>
            <AppImage source={{ uri: eliteAccentImage }} style={styles.eliteBadgeImage} />
            <View style={styles.eliteBody}>
              {elitePerks.map((perk) => (
                <PerkRow key={perk.title} perk={perk} iconColor="#7e5200" />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem
            icon="auto-awesome"
            label="GALLERY"
            onPress={() => router.push("/smag_home")}
          />
          <View style={styles.activeNav}>
            <MaterialIcons name="military-tech" size={18} color="#ffefeb" />
            <Text style={styles.activeNavLabel}>LEVELS</Text>
          </View>
          <NavItem
            icon="card-giftcard"
            label="PERKS"
            onPress={() => router.push("/smag_membership_rewards")}
          />
          <NavItem
            icon="person"
            label="PROFILE"
            onPress={() => router.push("/smag_profile")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function TierStep(props: {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  dimmed?: boolean;
}) {
  return (
    <View style={[styles.tierStep, props.dimmed && styles.tierStepDim]}>
      <View style={styles.tierStepCircle}>
        <MaterialIcons name={props.icon} size={18} color="#ff5e07" />
      </View>
      <Text style={styles.tierStepLabel}>{props.label}</Text>
    </View>
  );
}

function PerkRow(props: { perk: Perk; iconColor: string; boxedIcon?: boolean }) {
  return (
    <View style={styles.perkRow}>
      <View style={[styles.perkIconWrap, props.boxedIcon && styles.perkIconWrapBoxed]}>
        <MaterialIcons name={props.perk.icon} size={18} color={props.iconColor} />
      </View>
      <View style={styles.perkBody}>
        <Text style={styles.perkTitle}>{props.perk.title}</Text>
        <Text style={styles.perkDesc}>{props.perk.desc}</Text>
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
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 150 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  topTitle: { color: "#a33800", fontSize: 18, fontWeight: "700" },
  heroCard: {
    borderRadius: 26,
    backgroundColor: "#ffede5",
    paddingVertical: 18,
    paddingHorizontal: 14,
    position: "relative"
  },
  progressLine: {
    position: "absolute",
    left: 46,
    right: 46,
    top: 49,
    height: 2,
    backgroundColor: "#dd9f7c66"
  },
  progressLineFill: { width: "60%", height: "100%", backgroundColor: "#ff5e07" },
  heroSteps: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  tierStep: { alignItems: "center", gap: 6 },
  tierStepDim: { opacity: 0.5 },
  tierStepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  tierStepLabel: { color: "#805032", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  heroCenterStep: { alignItems: "center", gap: 8 },
  centerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d75a20",
    borderWidth: 3,
    borderColor: "#ffede5",
    alignItems: "center",
    justifyContent: "center"
  },
  centerLabel: { color: "#a33800", fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  heroNote: {
    marginTop: 14,
    color: "#805032",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500"
  },
  heroNoteStrong: { color: "#a33800", fontWeight: "800" },
  sectionHead: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 10 },
  sectionHeadRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffd4bd",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionIconWrapPro: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffdbc9",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionIconWrapElite: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8a91f33",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionTitle: { color: "#4b240a", fontSize: 33, lineHeight: 35, fontWeight: "900" },
  sectionSub: { marginTop: 2, color: "#805032", fontSize: 13, fontWeight: "500" },
  activePill: {
    borderRadius: 999,
    backgroundColor: "#a33800",
    color: "#ffefeb",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  risingCard: {
    marginTop: 8,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 12
  },
  proOuter: {
    marginTop: 8,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#ff7941",
    padding: 1
  },
  proCard: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 12
  },
  eliteCard: {
    marginTop: 8,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    padding: 14,
    overflow: "visible"
  },
  eliteBadgeImage: {
    position: "absolute",
    right: 10,
    top: -16,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#fff4f0"
  },
  eliteBody: { gap: 12, paddingRight: 40 },
  perkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  perkIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  perkIconWrapBoxed: { backgroundColor: "#ffede5", borderRadius: 8 },
  perkBody: { flex: 1 },
  perkTitle: { color: "#4b240a", fontSize: 24, lineHeight: 26, fontWeight: "800" },
  perkDesc: { marginTop: 2, color: "#805032", fontSize: 12, lineHeight: 17 },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 10,
    backgroundColor: "#ffffffee",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },
  navItem: { alignItems: "center", gap: 2 },
  navLabel: { color: "#805032", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  activeNav: {
    borderRadius: 999,
    backgroundColor: "#ff5e07",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2
  },
  activeNavLabel: { color: "#ffefeb", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }
});
