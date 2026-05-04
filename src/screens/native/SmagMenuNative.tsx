import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import { AppImage } from "@/components/AppImage";
import { addToCart, subscribeMenuItems, type MenuItem } from "@/lib/firebase/firestore";
import { CartBadgeIcon } from "@/components/CartBadgeIcon";
import { ListSkeleton } from "@/components/SkeletonLoader";
import { haptics } from "@/lib/haptics";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { useAppRouter } from "@/lib/useAppRouter";
import { enqueueCartMutation } from "@/lib/offlineQueue";

const avatar =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuClZPxgXMncLUYa-KmMsPWpGon_V0R_koqwSHV54t9pqa8RsA91J5pVCrCHyGcHIURxdofA20U34FzCjkIZdwyswxiiKI6gkL_CJmJVBw5DUK8e_V3wrCFYMz4PVQs5PnhVBntAOQGY9R-IjRKGuL5UVz5dP8QbSUYsVnPA3Q5ynSnyDeOvETwTyWF7PnSUJ4HCBoOil1DDZrpTatnyim3YXY9gjeVRhpFSoodmKKMRCk0Rzm7G-nMriIPw2oDTBOYNtPlH60kNl4s3";
const hero =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDcW_x1H-GXJ9drKFDNk4pBnXZHZjk0pbwOpn4q6dcmzBEcZveJPCwt7zhYXRHKJrhxjNPiq6j4vqrlobQsWbOvj_JoS3hPeq7lSFSuKQv90b57ptRoFEx_bG3PK5C3Pz9s3Bbdakkno2MheIYiSy1GQ9J_RIYMmPlYh3XaDNqz4BcxsIkYSYriCCn6FUvsn0E_yvZpWA8-LhrfFVcALua8iDxB7YIYzmtPAFAD_lO6GffKELv2qZTPLNzVJyMUCB6FXDLDapz8QCjU";

const RESTAURANT_ID = "lartiste";

export function SmagMenuNative() {
  const router = useAppRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Appetizers");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const unsub = subscribeMenuItems(
      RESTAURANT_ID,
      (items) => { setMenuItems(items); setLoading(false); },
      () => { setLoading(false); setError("Could not load menu. Please check your connection."); }
    );
    return unsub;
  }, []);

  const categories = [...new Set(menuItems.map((i) => i.category))];
  const filtered = menuItems.filter((i) => i.category === selectedCategory);

  const isOnline = useNetworkStatus();

  async function handleAddToCart(item: MenuItem) {
    const user = getCurrentUser();
    if (!user) return;
    setAddingId(item.id);
    try {
      await haptics.tap();
      const cartPayload = {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: 1,
        restaurantId: item.restaurantId,
        restaurantName: "L'Artiste Bistro"
      };
      if (!isOnline) {
        await enqueueCartMutation({ type: "add", userId: user.uid, item: cartPayload });
        Alert.alert("You're offline", "Item saved. It will be added to your cart when you reconnect.", [{ text: "OK" }]);
        return;
      }
      await addToCart(user.uid, cartPayload);
      router.push("/smag_my_cart");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.push("/smag_profile")}>
              <AppImage source={{ uri: avatar }} style={styles.avatar} />
            </Pressable>
            <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          </View>
          <Pressable onPress={() => router.push("/smag_my_cart")}>
            <CartBadgeIcon size={24} color="#FF5C00" />
          </Pressable>
        </View>

        <Pressable style={styles.heroWrap} onPress={() => router.push("/smag_restaurant_details")}>
          <AppImage source={{ uri: hero }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroText}>
            <Text style={styles.heroTag}>Fine Dining - Modern Italian</Text>
            <Text style={styles.heroTitle}>L&apos;Artiste Bistro</Text>
            <Text style={styles.heroMeta}>4.9 (2.1k reviews) - 25-35 min</Text>
          </View>
        </Pressable>

        {loading ? (
          <ListSkeleton count={2} />
        ) : error ? (
          <View style={styles.errorWrap}>
            <MaterialIcons name="error-outline" size={48} color="#b31b25" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.chip, cat === selectedCategory && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${cat}`}
                    accessibilityState={{ selected: cat === selectedCategory }}
                  >
                    <Text style={[styles.chipText, cat === selectedCategory && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sectionTitle}>{selectedCategory}</Text>

            {filtered.map((item, index) => index === 0 ? (
              <View key={item.id} style={styles.featureCard}>
                <AppImage source={{ uri: item.imageUrl }} style={styles.featureImage} />
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>{item.name}</Text>
                  <Text style={styles.featureDesc}>{item.description}</Text>
                  <View style={styles.featureFooter}>
                    <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
                    <Pressable
                      style={[styles.ctaBtn, addingId === item.id && { opacity: 0.6 }]}
                      onPress={() => handleAddToCart(item)}
                      disabled={addingId !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to cart`}
                      accessibilityState={{ busy: addingId === item.id }}
                    >
                      {addingId === item.id
                        ? <ActivityIndicator size="small" color="#ffefeb" />
                        : <MaterialIcons name="add" size={16} color="#ffefeb" />}
                      <Text style={styles.ctaText}>Add to Cart</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View key={item.id} style={styles.smallCard}>
                <AppImage source={{ uri: item.imageUrl }} style={styles.smallImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.smallTitle}>{item.name}</Text>
                  <Text style={styles.smallDesc}>{item.description}</Text>
                  <View style={styles.smallFooter}>
                    <Text style={styles.smallPrice}>₦{item.price.toLocaleString()}</Text>
                    <Pressable
                      style={[styles.addMini, addingId === item.id && { opacity: 0.6 }]}
                      onPress={() => handleAddToCart(item)}
                      disabled={addingId !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to cart`}
                      accessibilityState={{ busy: addingId === item.id }}
                    >
                      {addingId === item.id
                        ? <ActivityIndicator size="small" color="#a33800" />
                        : <MaterialIcons name="add" size={18} color="#a33800" />}
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorWrap: { alignItems: "center", marginTop: 60, gap: 12, paddingHorizontal: 20 },
  errorText: { color: "#b31b25", fontSize: 15, fontWeight: "700", textAlign: "center" },
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { paddingBottom: 36 },
  header: {
    marginHorizontal: 20, marginTop: 8, marginBottom: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between"
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  brand: { width: 80, height: 36 },
  heroWrap: { height: 320, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)" },
  heroText: { position: "absolute", left: 20, right: 20, bottom: 18 },
  heroTag: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,237,229,0.9)",
    color: "#a33800", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontWeight: "700"
  },
  heroTitle: { marginTop: 8, color: "#fff", fontSize: 36, fontWeight: "900" },
  heroMeta: { marginTop: 4, color: "rgba(255,255,255,0.88)" },
  chipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  chip: { backgroundColor: "#ffdbc9", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  chipActive: { backgroundColor: "#a33800" },
  chipText: { color: "#4b240a", fontWeight: "700" },
  chipTextActive: { color: "#ffefeb" },
  sectionTitle: { marginHorizontal: 20, color: "#4b240a", fontSize: 30, fontWeight: "900", marginBottom: 10 },
  featureCard: { marginHorizontal: 20, borderRadius: 22, overflow: "hidden", backgroundColor: "#ffffff" },
  featureImage: { width: "100%", height: 180 },
  featureBody: { padding: 14 },
  featureTitle: { color: "#4b240a", fontSize: 22, fontWeight: "800" },
  featureDesc: { marginTop: 6, color: "#805032", lineHeight: 20 },
  featureFooter: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { color: "#a33800", fontSize: 24, fontWeight: "900" },
  ctaBtn: {
    backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", gap: 4
  },
  ctaText: { color: "#ffefeb", fontWeight: "800" },
  smallCard: {
    marginTop: 12, marginHorizontal: 20, backgroundColor: "#ffede5",
    borderRadius: 18, padding: 12, flexDirection: "row", gap: 12
  },
  smallImage: { width: 96, height: 96, borderRadius: 12 },
  smallTitle: { color: "#4b240a", fontSize: 18, fontWeight: "800" },
  smallDesc: { marginTop: 4, color: "#805032", fontSize: 12 },
  smallFooter: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallPrice: { color: "#4b240a", fontWeight: "900", fontSize: 20 },
  addMini: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#ffffff",
    alignItems: "center", justifyContent: "center"
  }
});
