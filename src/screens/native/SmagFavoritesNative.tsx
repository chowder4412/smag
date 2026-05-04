import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { ListSkeleton } from "@/components/SkeletonLoader";
import { useAppRouter } from "@/lib/useAppRouter";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  subscribeFavorites,
  removeFavorite,
  addToCart,
  type FavoriteItem
} from "@/lib/firebase/firestore";
import { getUserProfile } from "@/lib/userProfile";

export function SmagFavoritesNative() {
  const router = useAppRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    void getUserProfile().then((p) => setAvatarUri(p.avatarUri));
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    setError(null);
    const unsub = subscribeFavorites(
      user.uid,
      (items) => { setFavorites(items); setLoading(false); },
      () => { setLoading(false); setError("Could not load favorites. Please try again."); }
    );
    return unsub;
  }, []);

  async function handleRemove(item: FavoriteItem) {
    const user = getCurrentUser();
    if (!user) return;
    // Optimistic remove
    setFavorites((prev) => prev.filter((f) => f.id !== item.id));
    void removeFavorite(user.uid, item.menuItemId);
  }

  async function handleAddToCart(item: FavoriteItem) {
    const user = getCurrentUser();
    if (!user) return;
    setAddingId(item.id);
    try {
      await addToCart(user.uid, {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: 1,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName
      });
      router.push("/smag_my_cart");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <Pressable onPress={() => router.push("/smag_settings")} accessibilityRole="button" accessibilityLabel="Open menu">
              <MaterialIcons name="menu" size={22} color="#805032" />
            </Pressable>
            <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          </View>
          <Pressable onPress={() => router.push("/smag_profile")} accessibilityRole="button" accessibilityLabel="View profile">
            <AppImage source={{ uri: avatarUri }} style={styles.avatar} />
          </Pressable>
        </View>

        <Text style={styles.kicker}>CURATED SELECTION</Text>
        <Text style={styles.title}>My Favorites</Text>
        <Text style={styles.subtitle}>
          A handpicked gallery of your most loved flavors and gourmet cravings.
        </Text>

        {loading ? (
          <ListSkeleton count={3} />
        ) : error ? (
          <View style={styles.errorWrap}>
            <MaterialIcons name="error-outline" size={48} color="#b31b25" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="favorite-border" size={56} color="#ffdbc9" />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySub}>Browse the menu and tap ♥ to save dishes here</Text>
            <Pressable style={styles.browseBtn} onPress={() => router.push("/smag_menu")} accessibilityRole="button" accessibilityLabel="Browse menu">
              <Text style={styles.browseBtnText}>Browse Menu</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {favorites.map((item) => (
              <View key={item.id} style={styles.card}>
                <AppImage source={{ uri: item.imageUrl }} style={styles.cardImage} />
                <Pressable
                  style={styles.heartBtn}
                  onPress={() => handleRemove(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name} from favorites`}
                >
                  <MaterialIcons name="favorite" size={20} color="#a33800" />
                </Pressable>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardRestaurant}>{item.restaurantName}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>₦{item.price.toLocaleString()}</Text>
                    <Pressable
                      style={[styles.addBtn, addingId === item.id && { opacity: 0.6 }]}
                      onPress={() => handleAddToCart(item)}
                      disabled={addingId !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to cart`}
                    >
                      <MaterialIcons name="add-shopping-cart" size={16} color="#ffefeb" />
                      <Text style={styles.addBtnText}>Add to Cart</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 36 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { width: 80, height: 36 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  kicker: { color: "#a33800", fontSize: 11, letterSpacing: 1.2, fontWeight: "800" },
  title: { color: "#4b240a", fontSize: 42, fontWeight: "900", lineHeight: 44 },
  subtitle: { marginTop: 8, color: "#805032", fontSize: 15, lineHeight: 22, marginBottom: 16 },
  errorWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  errorText: { color: "#b31b25", fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyText: { color: "#4b240a", fontSize: 18, fontWeight: "800" },
  emptySub: { color: "#805032", fontSize: 13, textAlign: "center" },
  browseBtn: { marginTop: 8, backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 14 },
  browseBtnText: { color: "#ffefeb", fontWeight: "800", fontSize: 15 },
  list: { gap: 14 },
  card: { borderRadius: 20, overflow: "hidden", backgroundColor: "#ffffff" },
  cardImage: { width: "100%", height: 200 },
  heartBtn: {
    position: "absolute", right: 12, top: 12,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#ffffffdd", alignItems: "center", justifyContent: "center"
  },
  cardBody: { padding: 14 },
  cardName: { color: "#4b240a", fontSize: 22, fontWeight: "900" },
  cardRestaurant: { color: "#a33800", fontSize: 12, fontWeight: "700", marginTop: 2 },
  cardDesc: { marginTop: 4, color: "#805032", lineHeight: 19, fontSize: 13 },
  cardFooter: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardPrice: { color: "#a33800", fontSize: 24, fontWeight: "900" },
  addBtn: {
    borderRadius: 999, backgroundColor: "#a33800",
    paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", gap: 5
  },
  addBtnText: { color: "#ffefeb", fontWeight: "800" }
});
