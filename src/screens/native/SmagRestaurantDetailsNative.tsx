import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  subscribeExternalMenuItems,
  addFavorite,
  removeFavorite,
  isFavorite,
  addToCart,
  type ExternalMenuItem,
  type ExternalRestaurant
} from "@/lib/firebase/firestore";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { SkeletonBox } from "@/components/SkeletonLoader";

export function SmagRestaurantDetailsNative() {
  const router = useAppRouter();
  const { restaurantId } = useLocalSearchParams<{ restaurantId?: string }>();

  const [restaurant, setRestaurant] = useState<ExternalRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<ExternalMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  const effectiveId = restaurantId ?? "lartiste";

  useEffect(() => {
    setError(null);
    void getDoc(doc(db, "external_restaurants", effectiveId)).then((snap) => {
      if (snap.exists()) {
        setRestaurant({ id: snap.id, ...snap.data() } as ExternalRestaurant);
      } else {
        // Fallback: try menu_items restaurant (Smag Kitchen)
        setRestaurant({
          id: effectiveId,
          name: "L'Artiste Bistro",
          cuisine: "Fine Dining · Modern Italian",
          imageUrl: "",
          rating: 4.9,
          reviewCount: 2100,
          deliveryMinutes: "25-35",
          deliveryFee: 0,
          minimumOrder: 0,
          isOpen: true,
          latitude: 0,
          longitude: 0,
          address: "",
          tags: []
        });
      }
      setLoading(false);
    }).catch(() => {
      setError("Could not load restaurant details.");
      setLoading(false);
    });
  }, [effectiveId]);

  useEffect(() => {
    const unsub = subscribeExternalMenuItems(
      effectiveId,
      (items) => {
        setMenuItems(items);
        if (items.length > 0 && !selectedCategory) {
          setSelectedCategory(items[0].category);
        }
      },
      () => {}
    );
    return unsub;
  }, [effectiveId]);

  // Load favorite status for all items
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || menuItems.length === 0) return;
    void Promise.all(
      menuItems.map(async (item) => {
        const fav = await isFavorite(user.uid, item.id);
        return { id: item.id, fav };
      })
    ).then((results) => {
      const ids = new Set(results.filter((r) => r.fav).map((r) => r.id));
      setFavoriteIds(ids);
    });
  }, [menuItems]);

  async function toggleFavorite(item: ExternalMenuItem) {
    const user = getCurrentUser();
    if (!user || !restaurant) return;
    const isFav = favoriteIds.has(item.id);
    // Optimistic
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(item.id); else next.add(item.id);
      return next;
    });
    if (isFav) {
      void removeFavorite(user.uid, item.id);
    } else {
      void addFavorite(user.uid, {
        menuItemId: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      });
    }
  }

  async function handleAddToCart(item: ExternalMenuItem) {
    const user = getCurrentUser();
    if (!user || !restaurant) return;
    setAddingId(item.id);
    try {
      await addToCart(user.uid, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: 1,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      });
      router.push("/smag_my_cart");
    } finally {
      setAddingId(null);
    }
  }

  const categories = [...new Set(menuItems.map((i) => i.category))];
  const filtered = menuItems.filter((i) => i.category === selectedCategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={22} color="#FF5C00" />
          </Pressable>
        </View>
        <View style={{ padding: 20, gap: 12 }}>
          <SkeletonBox width="100%" height={300} borderRadius={0} />
          <SkeletonBox width="70%" height={28} borderRadius={8} />
          <SkeletonBox width="50%" height={18} borderRadius={6} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={22} color="#FF5C00" />
          </Pressable>
        </View>
        <View style={styles.errorWrap}>
          <MaterialIcons name="error-outline" size={48} color="#b31b25" />
          <Text style={styles.errorText}>{error ?? "Restaurant not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
              <MaterialIcons name="arrow-back" size={22} color="#FF5C00" />
            </Pressable>
            <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          </View>
          <View style={styles.topRight}>
            <MaterialIcons name="share" size={22} color="#FF5C00" />
          </View>
        </View>

        <View style={styles.heroWrap}>
          <AppImage source={{ uri: restaurant.imageUrl }} style={styles.heroImage} />
          {!restaurant.isOpen && (
            <View style={styles.closedOverlay}>
              <Text style={styles.closedText}>CLOSED</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{restaurant.name}</Text>
              <Text style={styles.subtitle}>
                {restaurant.rating > 0 ? `${restaurant.rating.toFixed(1)} · ${restaurant.reviewCount.toLocaleString()} reviews · ` : ""}
                {restaurant.deliveryMinutes} min
              </Text>
            </View>
            {restaurant.deliveryFee === 0 && (
              <Text style={styles.deliveryTag}>FREE DELIVERY</Text>
            )}
          </View>
          <Text style={styles.description}>{restaurant.cuisine}</Text>
          {restaurant.address ? <Text style={styles.address}>{restaurant.address}</Text> : null}
        </View>

        {categories.length > 0 && (
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
        )}

        {selectedCategory ? <Text style={styles.sectionTitle}>{selectedCategory}</Text> : null}

        {filtered.length === 0 && menuItems.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40, gap: 10 }}>
            <MaterialIcons name="restaurant-menu" size={48} color="#ffdbc9" />
            <Text style={{ color: "#805032", fontSize: 15 }}>Menu coming soon</Text>
          </View>
        ) : (
          filtered.map((item, index) => index === 0 ? (
            <View key={item.id} style={styles.featureCard}>
              <AppImage source={{ uri: item.imageUrl }} style={styles.featureImage} />
              <Pressable
                style={styles.heartBtn}
                onPress={() => toggleFavorite(item)}
                accessibilityRole="button"
                accessibilityLabel={favoriteIds.has(item.id) ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
              >
                <MaterialIcons
                  name={favoriteIds.has(item.id) ? "favorite" : "favorite-border"}
                  size={20}
                  color="#a33800"
                />
              </Pressable>
              <View style={styles.featureBody}>
                <View style={styles.featureTop}>
                  <Text style={styles.featureTitle}>{item.name}</Text>
                  <Text style={styles.featurePrice}>₦{item.price.toLocaleString()}</Text>
                </View>
                <Text style={styles.featureText}>{item.description}</Text>
                <Pressable
                  style={[styles.addCartBtn, addingId === item.id && { opacity: 0.6 }]}
                  onPress={() => handleAddToCart(item)}
                  disabled={addingId !== null}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name} to cart`}
                  accessibilityState={{ busy: addingId === item.id }}
                >
                  {addingId === item.id
                    ? <ActivityIndicator color="#ffefeb" size="small" />
                    : <MaterialIcons name="add-shopping-cart" size={18} color="#ffefeb" />}
                  <Text style={styles.addCartText}>Add to Cart</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View key={item.id} style={styles.horizontalItem}>
              <AppImage source={{ uri: item.imageUrl }} style={styles.horizontalImage} />
              <View style={{ flex: 1 }}>
                <View style={styles.featureTop}>
                  <Text style={styles.horizontalTitle}>{item.name}</Text>
                  <Text style={styles.horizontalPrice}>₦{item.price.toLocaleString()}</Text>
                </View>
                <Text style={styles.horizontalSub}>{item.description}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <Pressable
                    style={styles.miniAdd}
                    onPress={() => handleAddToCart(item)}
                    disabled={addingId !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.name} to cart`}
                  >
                    {addingId === item.id
                      ? <ActivityIndicator color="#a33800" size="small" />
                      : <MaterialIcons name="add" size={18} color="#a33800" />}
                  </Pressable>
                  <Pressable
                    style={styles.miniHeart}
                    onPress={() => toggleFavorite(item)}
                    accessibilityRole="button"
                    accessibilityLabel={favoriteIds.has(item.id) ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                  >
                    <MaterialIcons
                      name={favoriteIds.has(item.id) ? "favorite" : "favorite-border"}
                      size={16}
                      color="#a33800"
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { paddingBottom: 34 },
  topBar: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center"
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { width: 80, height: 36 },
  topRight: { flexDirection: "row", gap: 12 },
  heroWrap: { height: 300, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center"
  },
  closedText: { color: "#fff", fontWeight: "900", fontSize: 22, letterSpacing: 2 },
  infoCard: {
    marginTop: -20, marginHorizontal: 20,
    backgroundColor: "#ffffff", borderRadius: 24, padding: 16
  },
  infoTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  title: { color: "#4b240a", fontSize: 28, lineHeight: 32, fontWeight: "900" },
  subtitle: { marginTop: 5, color: "#805032", fontWeight: "600" },
  deliveryTag: {
    alignSelf: "flex-start", color: "#a33800", fontSize: 10, fontWeight: "900",
    backgroundColor: "#ffede5", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4
  },
  description: { marginTop: 8, color: "#805032" },
  address: { marginTop: 4, color: "#805032aa", fontSize: 12 },
  chipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 18 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: "#ffdbc9" },
  chipActive: { backgroundColor: "#a33800" },
  chipText: { color: "#4b240a", fontWeight: "700" },
  chipTextActive: { color: "#ffefeb" },
  sectionTitle: { marginTop: 18, marginHorizontal: 20, color: "#4b240a", fontSize: 26, fontWeight: "900" },
  featureCard: { marginTop: 10, marginHorizontal: 20, borderRadius: 20, overflow: "hidden", backgroundColor: "#ffffff" },
  featureImage: { width: "100%", height: 220 },
  heartBtn: {
    position: "absolute", right: 12, top: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#ffffffdd", alignItems: "center", justifyContent: "center"
  },
  featureBody: { padding: 14 },
  featureTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  featureTitle: { flex: 1, color: "#4b240a", fontSize: 20, fontWeight: "800" },
  featurePrice: { color: "#a33800", fontSize: 22, fontWeight: "900" },
  featureText: { marginTop: 7, color: "#805032", lineHeight: 20 },
  addCartBtn: {
    marginTop: 12, borderRadius: 999, minHeight: 46, backgroundColor: "#a33800",
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6
  },
  addCartText: { color: "#ffefeb", fontWeight: "800" },
  horizontalItem: {
    marginTop: 10, marginHorizontal: 20, backgroundColor: "#ffede5",
    borderRadius: 20, padding: 12, flexDirection: "row", gap: 12
  },
  horizontalImage: { width: 96, height: 96, borderRadius: 12 },
  horizontalTitle: { flex: 1, color: "#4b240a", fontSize: 17, fontWeight: "800" },
  horizontalPrice: { color: "#a33800", fontSize: 20, fontWeight: "900" },
  horizontalSub: { marginTop: 5, color: "#805032", fontSize: 12 },
  miniAdd: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#ffd4bd",
    justifyContent: "center", alignItems: "center"
  },
  miniHeart: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#ffd4bd",
    justifyContent: "center", alignItems: "center"
  },
  errorWrap: { alignItems: "center", marginTop: 80, gap: 12, padding: 24 },
  errorText: { color: "#b31b25", fontSize: 15, fontWeight: "700", textAlign: "center" }
});
