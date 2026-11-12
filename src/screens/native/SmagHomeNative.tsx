import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getUserProfile, subscribeUserProfile, type UserProfile } from "@/lib/userProfile";
import { CartBadgeIcon } from "@/components/CartBadgeIcon";
import { subscribePromotions, subscribeMenuItems, type Promotion, type MenuItem } from "@/lib/firebase/firestore";
import { AppImage } from "@/components/AppImage";
import { SkeletonBox } from "@/components/SkeletonLoader";
import { useAppRouter } from "@/lib/useAppRouter";
import { SMAG_KITCHEN_CATEGORIES, menuItemIdForDish } from "@/lib/smagKitchenMenu";

const hero1 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCXyDQAavvyvj9Zd2hhhENCbz1TGo7v13oPVjuCE8jV6mM2DlinIVZQu73-crFbUBZuvoD7faPZCaqo_V8-A6boLL1ZTyEA6OeObcXPK77kFmVEoMz9jyAQ5GURugEzsOPzIjlPG8HEYc9nCHFB3mqCitYLgj5zpj9vXd_7uhsVa3VKfzyXvVSGnf2z_6MDCWB4DLSmwwMVzI61QuJ9UGhe5cSubPuqSzGkw41Ai45zEqlI9m8JIDXJHHfklvKn_ao1Ts3OJwV0_Lc8";
const hero2 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBRCLHQBsr7c3Oe9qkJ4fLuhNF4fk2KjlJQp9u9KPVIBmOcTCyZlzk66FHYMptIQ4NuKkebYJZgig9fz6qTXYKqj1VmUJ3ntIbhmZrB8CBNxWoyzGVQVNKANJSn7SLPpJEB7kryHWtMqLYMCXxiW4aX8dcHfwhhshOpvtozQ1lVkhYu5svdkm5PsBM1q5b6C7iZm7rlJgzCYWLGGp_iiPiGIrbYqFRcBXTKQZ_RGGCMq0_Sws5Rwx80tZLtQoOEJyeB9Cgr9E7ycBFS";

const quickLinks = [
  { label: "Explore", icon: "travel-explore", route: "/smag_explore" },
  { label: "Menu", icon: "restaurant-menu", route: "/smag_menu" },
  { label: "Rewards", icon: "military-tech", route: "/smag_membership_rewards" },
  { label: "Orders", icon: "receipt-long", route: "/smag_order_history" },
  { label: "Profile", icon: "person", route: "/smag_profile" },
  { label: "Alerts", icon: "notifications", route: "/smag_notifications" }
] as const;

export function SmagHomeNative() {
  const router = useAppRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const smagMenuItems = useMemo<MenuItem[]>(() => {
    return SMAG_KITCHEN_CATEGORIES.flatMap((cat) =>
      cat.dishes.map((dish) => ({
        id: `smag_${menuItemIdForDish(dish.name)}`,
        name: dish.name,
        description: dish.description,
        price: dish.priceValue,
        category: cat.label,
        imageUrl: dish.image,
        available: true,
        restaurantId: "smag_kitchen"
      }))
    );
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const combined = [...smagMenuItems, ...allMenuItems];
    return combined.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, smagMenuItems, allMenuItems]);

  const showResults = searchFocused && searchQuery.trim().length > 0;

  useEffect(() => {
    let mounted = true;
    void getUserProfile().then((value) => { if (mounted) setProfile(value); });
    const unsubProfile = subscribeUserProfile((value) => { if (mounted) setProfile(value); });
    const unsubPromos = subscribePromotions((promos) => {
      if (mounted) { setPromotions(promos); setPromosLoading(false); }
    });
    const menuIds = ["lartiste", "luigi", "ocean_garden"];
    const unsubMenus = menuIds.map((id) =>
      subscribeMenuItems(id, (items) => {
        if (!mounted) return;
        setAllMenuItems((prev) => [...prev.filter((i) => i.restaurantId !== id), ...items]);
      })
    );
    return () => { mounted = false; unsubProfile(); unsubPromos(); unsubMenus.forEach((u) => u()); };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.outerWrap}>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <Pressable
              onPress={() => router.push("/smag_profile")}
              accessibilityRole="button"
              accessibilityLabel="View profile"
              testID="home-profile-btn"
            >
              <AppImage source={{ uri: profile?.avatarUri ?? "" }} style={styles.avatar} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/smag_saved_addresses")}
              accessibilityRole="button"
              accessibilityLabel="Delivery address"
              testID="home-delivery-address-btn"
            >
              <Text style={styles.deliverLabel}>DELIVER TO</Text>
              <Text style={styles.deliverText}>{profile?.address || "Set Delivery Address"}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push("/smag_my_cart")}
            accessibilityRole="button"
            accessibilityLabel="View cart"
            testID="home-cart-btn"
          >
            <CartBadgeIcon size={24} color="#FF5C00" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={22} color="#805032" />
            <TextInput
              style={styles.searchInput}
              placeholder="Craving something specific?"
              placeholderTextColor="#80503299"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              returnKeyType="search"
              accessibilityLabel="Search for dishes"
              accessibilityHint="Type to search Smag menu items"
              testID="home-search-input"
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => { setSearchQuery(""); setSearchFocused(false); }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                testID="home-search-clear"
              >
                <MaterialIcons name="close" size={18} color="#805032" />
              </Pressable>
            ) : (
              <Pressable
                style={styles.tuneButton}
                onPress={() => router.push("/smag_explore")}
                accessibilityRole="button"
                accessibilityLabel="Open explore filters"
                testID="home-search-filter"
              >
                <MaterialIcons name="tune" size={18} color="#ffefeb" />
              </Pressable>
            )}
          </View>

          {showResults && (
            <View style={styles.searchDropdown} testID="home-search-dropdown">
              {/* Smag Kitchen results header */}
              <View style={styles.dropdownSection}>
                <MaterialIcons name="restaurant" size={13} color="#a33800" />
                <Text style={styles.dropdownSectionLabel}>SMAG KITCHEN</Text>
              </View>

              {searchResults.length === 0 ? (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyText}>{"No Smag dishes match \""}{searchQuery}{"\""}</Text>
                </View>
              ) : (
                searchResults.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.searchResultRow}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name}, ${item.category}, ₦${item.price.toLocaleString()}`}
                    onPress={() => {
                      setSearchQuery("");
                      setSearchFocused(false);
                      if (item.restaurantId === "smag_kitchen") {
                        router.push("/smag_menu");
                      } else {
                        router.push("/smag_restaurant_details");
                      }
                    }}
                    testID={`home-search-result-${item.id}`}
                  >
                    <AppImage source={{ uri: item.imageUrl }} style={styles.searchResultImage} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      <Text style={styles.searchResultMeta}>{item.category} · ₦{item.price.toLocaleString()}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color="#a33800" />
                  </Pressable>
                ))
              )}

              {/* Other Kitchens handoff prompt */}
              <Pressable
                style={styles.searchOtherKitchens}
                accessibilityRole="button"
                accessibilityLabel={`Search Other Kitchens for ${searchQuery}`}
                testID="home-search-other-kitchens"
                onPress={() => {
                  const q = searchQuery;
                  setSearchQuery("");
                  setSearchFocused(false);
                  router.push(`/other_kitchens?query=${encodeURIComponent(q)}`);
                }}
              >
                <View style={styles.searchOtherKitchensLeft}>
                  <View style={styles.searchOtherKitchensIcon}>
                    <MaterialIcons name="storefront" size={18} color="#a33800" />
                  </View>
                  <View>
                    <Text style={styles.searchOtherKitchensTitle}>Search in Other Kitchens</Text>
                    <Text style={styles.searchOtherKitchensSub}>{"Find \""}{searchQuery}{"\" across nearby restaurants"}</Text>
                  </View>
                </View>
                <MaterialIcons name="arrow-forward" size={18} color="#a33800" />
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Today&apos;s Curations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.heroRow}>
            {promosLoading ? (
              <>
                <SkeletonBox width={290} height={220} borderRadius={24} />
                <SkeletonBox width={290} height={220} borderRadius={24} />
              </>
            ) : promotions.length > 0 ? promotions.map((promo, idx) => (
              <HeroCard
                key={promo.id}
                image={promo.imageUrl}
                tag={promo.tag}
                title={promo.title}
                subtitle={promo.subtitle}
                onPress={() => router.push("/smag_promotions_deals")}
                testID={`hero-card-${promo.id || idx}`}
              />
            )) : (
              <>
                <HeroCard
                  image={hero1}
                  tag="Editor's Choice"
                  title="20% Off Fine Dining"
                  subtitle="Experience the city's finest kitchens."
                  onPress={() => router.push("/smag_promotions_deals")}
                  testID="hero-card-default-0"
                />
                <HeroCard
                  image={hero2}
                  tag="New Arrival"
                  title="Free Delivery Burger Day"
                  subtitle="Only at The Bun & Barrel."
                  onPress={() => router.push("/smag_menu")}
                  testID="hero-card-default-1"
                />
              </>
            )}
          </View>
        </ScrollView>

        <Text style={styles.quickTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {quickLinks.map((link) => (
            <Pressable
              key={link.label}
              style={styles.quickCard}
              onPress={() => router.push(link.route)}
              accessibilityRole="button"
              accessibilityLabel={link.label}
              testID={`quick-link-${link.label.toLowerCase()}`}
            >
              <View style={styles.quickIcon}>
                <MaterialIcons name={link.icon} size={20} color="#a33800" />
              </View>
              <Text style={styles.quickText}>{link.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.otherKitchensHeader}>
          <Text style={styles.otherKitchensTitle}>Other Kitchens</Text>
          <Pressable onPress={() => router.push("/other_kitchens")} testID="home-other-kitchens-see-all">
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.otherKitchensBanner}
          onPress={() => router.push("/other_kitchens")}
          accessibilityRole="button"
          accessibilityLabel="Explore nearby restaurants in Other Kitchens"
          testID="home-other-kitchens-banner"
        >
          <View style={styles.otherKitchensIconWrap}>
            <MaterialIcons name="storefront" size={32} color="#a33800" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.otherKitchensBannerTitle}>Explore Nearby Restaurants</Text>
            <Text style={styles.otherKitchensBannerSub}>Hundreds of kitchens filtered by your location</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#a33800" />
        </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function HeroCard(props: {
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable style={styles.heroCard} onPress={props.onPress} testID={props.testID}>
      <AppImage source={{ uri: props.image }} style={styles.heroImage} />
      <View style={styles.heroOverlay} />
      <View style={styles.heroTextWrap}>
        <Text style={styles.tag}>{props.tag}</Text>
        <Text style={styles.heroTitle}>{props.title}</Text>
        <Text style={styles.heroSubtitle}>{props.subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  outerWrap: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  header: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  leftHeader: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  deliverLabel: {
    fontSize: 10,
    color: "#805032",
    fontWeight: "700",
    letterSpacing: 1
  },
  deliverText: { fontSize: 12, color: "#4b240a", fontWeight: "800" },
  searchWrap: {
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: "#ffede5",
    paddingHorizontal: 14,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  searchContainer: { marginTop: 18, zIndex: 10, elevation: 10 },
  searchInput: { flex: 1, color: "#4b240a" },
  searchDropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginTop: 4,
    shadowColor: "#4b240a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden"
  },
  searchEmpty: { padding: 16, alignItems: "center" },
  searchEmptyText: { color: "#805032", fontSize: 13 },
  searchResultRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#fff4f0"
  },
  searchResultImage: { width: 44, height: 44, borderRadius: 10 },
  searchResultName: { color: "#4b240a", fontWeight: "700", fontSize: 14 },
  searchResultMeta: { color: "#805032", fontSize: 12, marginTop: 1 },
  dropdownSection: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4
  },
  dropdownSectionLabel: { color: "#a33800", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  searchOtherKitchens: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: "#fff4f0",
    borderTopWidth: 1, borderTopColor: "#ffede5",
    marginTop: 4
  },
  searchOtherKitchensLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  searchOtherKitchensIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center"
  },
  searchOtherKitchensTitle: { color: "#4b240a", fontWeight: "800", fontSize: 13 },
  searchOtherKitchensSub: { color: "#805032", fontSize: 11, marginTop: 1 },
  tuneButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ff5e07"
  },
  sectionTitle: {
    marginTop: 24,
    color: "#4b240a",
    fontSize: 27,
    fontWeight: "900"
  },
  heroRow: { flexDirection: "row", gap: 14, paddingTop: 12 },
  heroCard: {
    width: 290,
    height: 220,
    borderRadius: 24,
    overflow: "hidden"
  },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)"
  },
  heroTextWrap: { position: "absolute", left: 16, right: 16, bottom: 16 },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "#f8a91f",
    color: "#301c00",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "800"
  },
  heroTitle: {
    marginTop: 8,
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 28
  },
  heroSubtitle: { marginTop: 3, color: "rgba(255,255,255,0.85)" },
  quickTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: "#4b240a",
    fontSize: 18,
    fontWeight: "900"
  },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    width: "31%",
    minWidth: 90,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    alignItems: "center",
    gap: 8
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffede5",
    alignItems: "center",
    justifyContent: "center"
  },
  quickText: { color: "#4b240a", fontWeight: "700", fontSize: 12 },
  otherKitchensHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 10 },
  otherKitchensTitle: { color: "#4b240a", fontSize: 18, fontWeight: "900" },
  seeAll: { color: "#a33800", fontWeight: "700", fontSize: 13 },
  otherKitchensBanner: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#ffdbc9"
  },
  otherKitchensIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center"
  },
  otherKitchensBannerTitle: { color: "#4b240a", fontSize: 15, fontWeight: "800" },
  otherKitchensBannerSub: { color: "#805032", fontSize: 12, marginTop: 2 }
});
