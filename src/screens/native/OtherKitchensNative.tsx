import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { subscribeExternalRestaurants, type ExternalRestaurant } from "@/lib/firebase/firestore";
import { useLocation, distanceKm } from "@/lib/useLocation";
import { SkeletonBox } from "@/components/SkeletonLoader";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const MAX_DISTANCE_KM = 15;

export function OtherKitchensNative() {
  const router = useAppRouter();
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
  const location = useLocation();
  const [restaurants, setRestaurants] = useState<ExternalRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery ?? "");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const unsub = subscribeExternalRestaurants(
      (data) => { setRestaurants(data); setLoading(false); },
      () => { setLoading(false); setError("Could not load restaurants. Please check your connection."); }
    );
    return unsub;
  }, []);

  const cuisines = useMemo(() => {
    const all = new Set(restaurants.map((r) => r.cuisine));
    return ["All", ...Array.from(all).sort()];
  }, [restaurants]);

  const filtered = useMemo(() => {
    let list = restaurants;

    // Location filter — only show restaurants within MAX_DISTANCE_KM
    if (location.coords) {
      list = list.filter((r) =>
        distanceKm(location.coords!, { latitude: r.latitude, longitude: r.longitude }) <= MAX_DISTANCE_KM
      );
    }

    // Cuisine filter
    if (selectedCuisine !== "All") {
      list = list.filter((r) => r.cuisine === selectedCuisine);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort by distance if we have location, else by rating
    if (location.coords) {
      list = [...list].sort(
        (a, b) =>
          distanceKm(location.coords!, { latitude: a.latitude, longitude: a.longitude }) -
          distanceKm(location.coords!, { latitude: b.latitude, longitude: b.longitude })
      );
    } else {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [restaurants, location.coords, selectedCuisine, search]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={22} color="#a33800" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Other Kitchens</Text>
          {initialQuery ? (
            <Text style={styles.locationText}>Results for "{initialQuery}"</Text>
          ) : location.coords ? (
            <Text style={styles.locationText}>
              <MaterialIcons name="location-on" size={11} color="#a33800" /> Showing within {MAX_DISTANCE_KM}km
            </Text>
          ) : location.permissionDenied ? (
            <Text style={styles.locationText}>Enable location for nearby results</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color="#805032" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or cuisine..."
          placeholderTextColor="#80503288"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search other kitchens"
          accessibilityHint="Type a restaurant name, cuisine, or dish"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} accessibilityRole="button" accessibilityLabel="Clear search">
            <MaterialIcons name="close" size={18} color="#805032" />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
        {cuisines.map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, selectedCuisine === c && styles.chipActive]}
            onPress={() => setSelectedCuisine(c)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${c}`}
            accessibilityState={{ selected: selectedCuisine === c }}
          >
            <Text style={[styles.chipText, selectedCuisine === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={loading || location.loading ? [] : filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: restaurant }) => (
          <RestaurantCard
            restaurant={restaurant}
            distanceKm={
              location.coords
                ? distanceKm(location.coords, { latitude: restaurant.latitude, longitude: restaurant.longitude })
                : null
            }
            onPress={() => router.push(`/other_kitchen_details?restaurantId=${restaurant.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          loading || location.loading ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBox key={i} width="100%" height={200} borderRadius={20} />
              ))}
            </View>
          ) : error ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="error-outline" size={48} color="#b31b25" />
              <Text style={[styles.emptyText, { color: "#b31b25" }]}>Failed to load</Text>
              <Text style={styles.emptySub}>{error}</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="storefront" size={56} color="#ffdbc9" />
              <Text style={styles.emptyText}>No kitchens found nearby</Text>
              <Text style={styles.emptySub}>Try expanding your search or changing the filter</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function RestaurantCard({
  restaurant,
  distanceKm: dist,
  onPress
}: {
  restaurant: ExternalRestaurant;
  distanceKm: number | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, ${restaurant.cuisine}, rated ${restaurant.rating.toFixed(1)}, ${restaurant.deliveryMinutes} minutes delivery${!restaurant.isOpen ? ", currently closed" : ""}`}
    >
      <AppImage source={{ uri: restaurant.imageUrl }} style={styles.cardImage} />
      {!restaurant.isOpen && (
        <View style={styles.closedOverlay}>
          <Text style={styles.closedText}>CLOSED</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardName}>{restaurant.name}</Text>
          <View style={styles.ratingPill}>
            <MaterialIcons name="star" size={12} color="#a33800" />
            <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
          </View>
        </View>
        <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={13} color="#805032" />
            <Text style={styles.metaText}>{restaurant.deliveryMinutes} min</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="delivery-dining" size={13} color="#805032" />
            <Text style={styles.metaText}>
              {restaurant.deliveryFee === 0 ? "Free delivery" : `₦${restaurant.deliveryFee.toLocaleString()}`}
            </Text>
          </View>
          {dist !== null && (
            <View style={styles.metaItem}>
              <MaterialIcons name="location-on" size={13} color="#805032" />
              <Text style={styles.metaText}>{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}</Text>
            </View>
          )}
        </View>
        <View style={styles.tagsRow}>
          {restaurant.tags.slice(0, 3).map((tag) => (
            <Text key={tag} style={styles.tag}>{tag}</Text>
          ))}
          {restaurant.minimumOrder > 0 && (
            <Text style={styles.minOrder}>Min ₦{restaurant.minimumOrder.toLocaleString()}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  title: { color: "#4b240a", fontSize: 22, fontWeight: "900" },
  locationText: { color: "#805032", fontSize: 11, fontWeight: "600", marginTop: 1 },
  searchWrap: {
    marginHorizontal: 16, marginTop: 10, borderRadius: 999, minHeight: 48,
    backgroundColor: "#ffede5", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, gap: 8
  },
  searchInput: { flex: 1, color: "#4b240a", fontSize: 14 },
  chipsScroll: { marginTop: 10 },
  chipsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#ffdbc9" },
  chipActive: { backgroundColor: "#a33800" },
  chipText: { color: "#4b240a", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#ffefeb" },
  list: { padding: 16, paddingTop: 12 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyText: { color: "#4b240a", fontSize: 18, fontWeight: "800" },
  emptySub: { color: "#805032", fontSize: 13, textAlign: "center" },
  card: { borderRadius: 20, backgroundColor: "#ffffff", overflow: "hidden", marginBottom: 14 },
  cardImage: { width: "100%", height: 180 },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    height: 180,
    alignItems: "center",
    justifyContent: "center"
  },
  closedText: { color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: 2 },
  cardBody: { padding: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { flex: 1, color: "#4b240a", fontSize: 18, fontWeight: "900" },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#ffede5", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { color: "#a33800", fontWeight: "800", fontSize: 12 },
  reviewCount: { color: "#805032", fontSize: 11 },
  cuisine: { color: "#805032", fontSize: 13, marginTop: 2 },
  cardMeta: { flexDirection: "row", gap: 12, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { color: "#805032", fontSize: 12 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { backgroundColor: "#ffdbc9", color: "#805032", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: "700" },
  minOrder: { backgroundColor: "#ffede5", color: "#a33800", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: "700" }
});
