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

/** Converts a string to Title Case (e.g. "nigerian dishes" -> "Nigerian Dishes") */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Parses comma-separated cuisine string into clean, normalized individual cuisine names */
function parseCuisines(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => toTitleCase(c.trim()))
    .filter(Boolean);
}

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

  // Dynamically extract and normalize unique individual cuisines from all restaurants
  const cuisines = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => {
      parseCuisines(r.cuisine).forEach((c) => set.add(c));
    });
    return ["All", ...Array.from(set).sort()];
  }, [restaurants]);

  const filtered = useMemo(() => {
    let list = restaurants;

    // Location filter — only show restaurants within MAX_DISTANCE_KM
    if (location.coords) {
      list = list.filter((r) =>
        distanceKm(location.coords!, { latitude: r.latitude, longitude: r.longitude }) <= MAX_DISTANCE_KM
      );
    }

    // Cuisine filter — match if any of the restaurant's cuisines equal selectedCuisine
    if (selectedCuisine !== "All") {
      list = list.filter((r) => parseCuisines(r.cuisine).includes(selectedCuisine));
    }

    // Search filter — match name, cuisine list, or tags
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
      <View style={styles.responsiveContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={22} color="#a33800" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Other Kitchens</Text>
            {initialQuery ? (
              <Text style={styles.locationText}>{"Results for \""}{initialQuery}{"\""}</Text>
            ) : location.coords ? (
              <Text style={styles.locationText}>
                <MaterialIcons name="location-on" size={11} color="#a33800" /> Showing within {MAX_DISTANCE_KM}km
              </Text>
            ) : location.permissionDenied ? (
              <Text style={styles.locationText}>Enable location for nearby results</Text>
            ) : null}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={22} color="#805032" />
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
            <Pressable onPress={() => setSearch("")} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clearBtn}>
              <MaterialIcons name="close" size={18} color="#805032" />
            </Pressable>
          )}
        </View>

        {/* Filter Category Chips */}
        <View style={styles.chipsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
            {cuisines.map((c) => {
              const isActive = selectedCuisine === c;
              return (
                <Pressable
                  key={c}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setSelectedCuisine(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${c}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Kitchen List */}
        <FlatList
          data={loading || location.loading ? [] : filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            loading || location.loading ? (
              <View style={{ gap: 14 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBox key={i} width="100%" height={220} borderRadius={20} />
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
                <Text style={styles.emptySub}>Try expanding your search or selecting a different cuisine</Text>
              </View>
            )
          }
        />
      </View>
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
  const parsedCuisines = useMemo(() => parseCuisines(restaurant.cuisine), [restaurant.cuisine]);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, ${parsedCuisines.join(", ")}, rated ${restaurant.rating.toFixed(1)}, ${restaurant.deliveryMinutes} minutes delivery${!restaurant.isOpen ? ", currently closed" : ""}`}
    >
      <View style={styles.imageContainer}>
        <AppImage source={{ uri: restaurant.imageUrl }} style={styles.cardImage} />
        
        {!restaurant.isOpen && (
          <View style={styles.closedOverlay}>
            <View style={styles.closedBadge}>
              <MaterialIcons name="lock-clock" size={14} color="#ffffff" />
              <Text style={styles.closedBadgeText}>CLOSED</Text>
            </View>
          </View>
        )}

        {/* Rating Pill Over Image */}
        <View style={styles.floatingRating}>
          <MaterialIcons name="star" size={13} color="#D97706" />
          <Text style={styles.ratingText}>{restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}</Text>
          {restaurant.reviewCount > 0 && (
            <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardName} numberOfLines={1}>{restaurant.name}</Text>
        </View>

        {/* Formatted Cuisine Line */}
        <Text style={styles.cuisineLine} numberOfLines={1}>
          {parsedCuisines.length > 0 ? parsedCuisines.join(" • ") : restaurant.cuisine}
        </Text>

        {/* Meta Info Row */}
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={14} color="#805032" />
            <Text style={styles.metaText}>{restaurant.deliveryMinutes} min</Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaItem}>
            <MaterialIcons name="two-wheeler" size={14} color="#805032" />
            <Text style={styles.metaText}>
              {restaurant.deliveryFee === 0 ? "Free Delivery" : `₦${restaurant.deliveryFee.toLocaleString()}`}
            </Text>
          </View>

          {dist !== null && (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={14} color="#805032" />
                <Text style={styles.metaText}>{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}</Text>
              </View>
            </>
          )}
        </View>

        {/* Tags & Min Order */}
        <View style={styles.tagsRow}>
          {restaurant.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tagBadge}>
              <Text style={styles.tagText}>{toTitleCase(tag)}</Text>
            </View>
          ))}
          {restaurant.minimumOrder > 0 && (
            <View style={styles.minOrderBadge}>
              <Text style={styles.minOrderText}>Min Order ₦{restaurant.minimumOrder.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  responsiveContainer: { flex: 1, width: "100%", maxWidth: 680, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  title: { color: "#4b240a", fontSize: 24, fontWeight: "900", letterSpacing: -0.3 },
  locationText: { color: "#805032", fontSize: 12, fontWeight: "600", marginTop: 2 },
  searchWrap: {
    marginHorizontal: 16, marginTop: 8, borderRadius: 16, height: 50,
    backgroundColor: "#ffffff", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, gap: 10,
    borderWidth: 1, borderColor: "#ffdbc9",
    shadowColor: "#4b240a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2
  },
  searchInput: { flex: 1, color: "#4b240a", fontSize: 14, fontWeight: "500" },
  clearBtn: { padding: 4 },
  chipsWrap: { marginTop: 12, marginBottom: 4 },
  chipsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#ffdbc9"
  },
  chipActive: { backgroundColor: "#a33800", borderColor: "#a33800" },
  chipText: { color: "#4b240a", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#ffffff" },
  list: { padding: 16, paddingTop: 8, paddingBottom: 24 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyText: { color: "#4b240a", fontSize: 18, fontWeight: "800" },
  emptySub: { color: "#805032", fontSize: 13, textAlign: "center", paddingHorizontal: 32 },
  
  // Restaurant Card Styles
  card: {
    borderRadius: 20, backgroundColor: "#ffffff", overflow: "hidden",
    borderWidth: 1, borderColor: "#ffede5",
    shadowColor: "#4b240a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3
  },
  imageContainer: { position: "relative", width: "100%", height: 180 },
  cardImage: { width: "100%", height: "100%" },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 20, 15, 0.55)",
    alignItems: "center", justifyContent: "center"
  },
  closedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(163, 56, 0, 0.9)", paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.3)"
  },
  closedBadgeText: { color: "#ffffff", fontWeight: "900", fontSize: 13, letterSpacing: 1.5 },
  floatingRating: {
    position: "absolute", bottom: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.92)", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  ratingText: { color: "#4b240a", fontWeight: "800", fontSize: 12 },
  reviewCount: { color: "#805032", fontSize: 11 },
  
  cardBody: { padding: 16 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { flex: 1, color: "#4b240a", fontSize: 19, fontWeight: "900" },
  cuisineLine: { color: "#a33800", fontSize: 13, fontWeight: "700", marginTop: 3 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#805032", fontSize: 12, fontWeight: "600" },
  metaDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#ffdbc9" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tagBadge: { backgroundColor: "#ffdbc9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: "#4b240a", fontSize: 11, fontWeight: "700" },
  minOrderBadge: { backgroundColor: "#ffede5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  minOrderText: { color: "#a33800", fontSize: 11, fontWeight: "800" }
});
