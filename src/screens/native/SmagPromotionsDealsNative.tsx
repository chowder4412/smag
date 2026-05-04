import { MaterialIcons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const hero =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAl7pBPV5LCpMtrU_cQRFbxT9DYhPWhUh6R6FNVWKBBA2nlXfZmDIOEJgHsJZQHZkuWWTcbO8DFsAdmIpSPxp599rUEWTJjvAw7hB0tlZR9vfPB9pEmAw5hQlr82vbhfp-R8P1xlByvsUgB2d8griy8E8Cd_N_suT0nlStGanuF2kAMtGTuchWYX12p-Y7l4KDh9AoAk7c65uglUxTWmO3LVyl4EpPWfby8a5CWOwjcJST1qorcAHnrHUEikOxYg5RPahzz-tMuPRg3";
const pizza =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBWEHNboeL1p7bGtfxDDiptWyU3VsQQ1IqRPEnXbG3oy2GDHNg--Z8oMlY46rGsb6PY2e94AwkVlYpSHtiihYSJNIvibzOH6FblM88glvdS8fqCSHfoX_CSgCcIP6iVXPxtXAMu2gqIzjCWgacjWvGhK7HeWPZnCGMgHgzHdKgs3dBKlF8b-T1FAnQ206xwZIGPNtEMy-gWkhbSyd0MhySLWdQcT_cFWGg61uivgeC7zpNZPL8lqXkrz1IVABh0D2YKK2UW0A7995Ov";
const sushi =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCYl0S0Owct2pGAj4zrV8gVD3lbVZhG88itXroP-7blN0ayApS1WJ0wciKGdUjzc2puBLzxmOIE_0id-TsBSOHcihjsxlCDKGSdoiFXfYxZea-oIwL_W926cMAX3weuB9DrTLz3PS0-bxKgRQlaBR1oauEookV4kW9dPHPrZLbf0z_k4wbsKNq8EJ1Oj0Av3FtUoNjQPH_7G-SSPMmWNwq6pV_ABwvkbjujVh9_uh4wpArJIGvUbD5Hzt4AJdjzxACSd0n1Iim1vOjt";
const burger =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDeLknwpzwLgq8otwI9sSD7NvDP3_pXY8rqbA3uHMvqgxNA4mVA7mkB4kD0B9N8iSKdJvO63ICvJ5Cz4bgdwv8zuwXMDf-VI97sxcJtrcZqEDwUdLxZWRTP3NzN6fWr6xpZjNWFJaizyHWYXrSMkavfBoSkZoUnPyLKlLR5nXofVS8YHaL_dIe2f3ov66LinalJwTBfqldC7F2OWr0Vnyk4u-bSG-mKenjDZttarGTD317fgoOV1ZTyRoFfX6Ns2WzT0pz8P8CfjYFV";
const avatar =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCFxhoNOQFB2BFxLds9NymN4vGAWzloNZ_AbeNqK-smyf1u0n9Aom-H0ksZAK8LLckFx-LOgMXgkDOSTQBsAuw3dMDrEqT_bKsraWuWkQZ57y5AHO3wG57_wpzFgu220TSvIh2t2lu7PLmQVWpicXZxZVozZZ__Bb1apanWxkk1JXvEKGBmnzOrHwzXjY1lHjbvg2-fwygUx4RkKWs2oluVnHoiLAWdfbCk0uGVHSOsflW5tdmrsHLgXz1ahYhgetloBH_0MjkwTBWs";

export function SmagPromotionsDealsNative() {
  const router = useAppRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <AppImage source={{ uri: avatar }} style={styles.avatar} />
            <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          </View>
          <Pressable onPress={() => router.push("/smag_notifications")}>
            <MaterialIcons name="notifications" size={22} color="#a33800" />
          </Pressable>
        </View>

        <Text style={styles.title}>Promotions</Text>
        <Text style={styles.subtitle}>Delicious deals curated for you.</Text>

        <View style={styles.heroCard}>
          <Pressable onPress={() => router.push("/smag_promo_details")} style={{ flex: 1 }}>
          <AppImage source={{ uri: hero }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>LIMITED TIME</Text>
            <Text style={styles.heroTitle}>Gourmet Weekend</Text>
            <Text style={styles.heroSub}>Savor premium tastes</Text>
            <Text style={styles.heroValue}>50% OFF</Text>
          </View>
          </Pressable>
        </View>

        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyTop}>
            <View>
              <Text style={styles.loyaltyTitle}>Loyalty Journey</Text>
              <Text style={styles.loyaltySub}>3 more orders to a free meal</Text>
            </View>
            <View style={styles.redeemIcon}>
              <MaterialIcons name="redeem" size={22} color="#a33800" />
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>7 Orders</Text>
            <Text style={styles.progressLabel}>Goal: 10</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Active Offers</Text>
        <OfferCard
          image={pizza}
          title="Welcome Feast"
          desc="On your first order above ₦30,000"
          badge="₦15,000 OFF"
          code="HELLO-SMAG"
          button="Copy Code"
          onPress={() => router.push("/smag_my_cart")}
        />
        <OfferCard
          image={sushi}
          title="Sushi Tuesdays"
          desc="Buy 1 Get 1 Free on all Signature Rolls"
          badge="ACTIVE"
          code="Auto-applied at checkout"
          button="Applied"
          passive
          onPress={() => router.push("/smag_checkout")}
        />
        <OfferCard
          image={burger}
          title="Burger Dash"
          desc="Zero delivery fee for all Burger partners"
          badge="FREE RIDE"
          code="FREE-RIDE"
          button="Copy Code"
          onPress={() => router.push("/smag_my_cart")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function OfferCard(props: {
  image: string;
  title: string;
  desc: string;
  badge: string;
  code: string;
  button: string;
  passive?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.offerCard}>
      <AppImage source={{ uri: props.image }} style={styles.offerImage} />
      <View style={styles.offerBody}>
        <View style={styles.offerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerTitle}>{props.title}</Text>
            <Text style={styles.offerDesc}>{props.desc}</Text>
          </View>
          <Text style={[styles.offerBadge, props.passive && styles.offerBadgePassive]}>
            {props.badge}
          </Text>
        </View>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{props.code}</Text>
          <Pressable
            style={[styles.copyBtn, props.passive && styles.copyBtnPassive]}
            onPress={props.onPress}
          >
            <Text style={[styles.copyBtnText, props.passive && styles.copyBtnTextPassive]}>
              {props.button}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 40 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  brand: { width: 80, height: 36 },
  title: { color: "#4b240a", fontSize: 38, fontWeight: "900" },
  subtitle: { marginTop: 4, color: "#805032", fontSize: 16, marginBottom: 12 },
  heroCard: { borderRadius: 24, overflow: "hidden", height: 280, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  heroContent: { position: "absolute", left: 14, right: 14, bottom: 14 },
  heroTag: {
    alignSelf: "flex-start",
    backgroundColor: "#a33800",
    color: "#ffefeb",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: "800",
    fontSize: 10
  },
  heroTitle: { marginTop: 8, color: "#fff", fontSize: 38, fontWeight: "900", lineHeight: 40 },
  heroSub: { color: "#ffffffdd", fontSize: 17 },
  heroValue: { marginTop: 2, color: "#ff7941", fontSize: 54, fontWeight: "900", lineHeight: 56 },
  loyaltyCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: "#ffede5",
    padding: 12
  },
  loyaltyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  loyaltyTitle: { color: "#4b240a", fontSize: 24, fontWeight: "900" },
  loyaltySub: { color: "#805032", marginTop: 2 },
  redeemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#ffd4bd",
    overflow: "hidden"
  },
  progressFill: { width: "70%", height: "100%", backgroundColor: "#a33800", borderRadius: 999 },
  progressLabels: { marginTop: 6, flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: "#805032", fontSize: 11, fontWeight: "700" },
  sectionTitle: { marginTop: 12, marginBottom: 8, color: "#4b240a", fontSize: 30, fontWeight: "900" },
  offerCard: { borderRadius: 20, backgroundColor: "#ffffff", overflow: "hidden", marginBottom: 10 },
  offerImage: { width: "100%", height: 160 },
  offerBody: { padding: 12 },
  offerTop: { flexDirection: "row", gap: 8 },
  offerTitle: { color: "#4b240a", fontSize: 24, fontWeight: "900" },
  offerDesc: { marginTop: 4, color: "#805032", fontSize: 13, lineHeight: 18 },
  offerBadge: { color: "#a33800", fontSize: 16, fontWeight: "900" },
  offerBadgePassive: {
    backgroundColor: "#f8a91f",
    color: "#301c00",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10
  },
  codeRow: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#ffede5",
    padding: 4,
    flexDirection: "row",
    alignItems: "center"
  },
  codeText: {
    flex: 1,
    textAlign: "center",
    color: "#8f3000",
    fontWeight: "800"
  },
  copyBtn: {
    borderRadius: 10,
    backgroundColor: "#a33800",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  copyBtnPassive: { backgroundColor: "#ffd4bd" },
  copyBtnText: { color: "#ffefeb", fontWeight: "800", fontSize: 12 },
  copyBtnTextPassive: { color: "#8f3000" }
});
