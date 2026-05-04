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

import { subscribeMenuItems, type MenuItem } from "@/lib/firebase/firestore";
import { AppImage } from "@/components/AppImage";
import { getUserProfile } from "@/lib/userProfile";
import { useAppRouter } from "@/lib/useAppRouter";

type ExploreTab = "smag" | "other";

const poke =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB8DPRc_MITuKljSZXM4NsBOjJgRK0t9s7bWD7BYy-kItNdml6iABjHm4L_N4VZ1sk4yA2BT2O3cYVZpM2-YeR5MTKYDbR7KuqgzRwbKrF2RoWQhto3n0t1OSBmJZUVZuPGDt6fSQr24mCA3WgM2-RcdtGHkMMhUlfCZkRVlVx_SD-7Oz0asHPHuIXTTlisuJb9RardMiK7-x26HzDs1sSKWEw6Yru3gvyBGUaYcvdNGH0pq3buvHLpw7_zuLH0aBEoXZGREHB_rAqa";
const trufflePizza =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD-eZPhLRdAk0vlqJr5zl3Up5Ny0G7dorcMD1jUmRonjsETxTFrFpF6kkO2Gu-7uPBg7ACu6eYC48q-Rx5ZiufQPsEDGmByu-sckNl8s2S7a0w_idaicYa_3nhcJFD2TqJJ_wq_vx9z3k5FPEpzVjmQYtV853Z9RAjtmgPox1E1VZsQmW4amU-B7I9BApoch39aize1d5dV8ktlf_JJnT6IOD58j_i6iaPu9T2PK-PzkjBeH6ordNnIzIe3qEMfDaDYumcmCJqbcC6N";
const sweet =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDY7XzOYIZpjqiFYAsEz-w_uEW4FQGKpWAB8l9-weTdYbBSzD-ZlqmmI22gZCMwpydaaETM6en1jnIax4eZAyBIflGumaRrdN3yUxS57RXv3muNfKQLkO-Udo9ne_FvLtW1cEPsJvKF5dTpauq1Od9Moebs75iZmhiwHRSVzABbw3EXXifgwSM9zLitwhcgVt8yVBdK7rdr_EN_QfgzoDeREdBmoz0IBoCbijaFXiyHF2iJhTmxldmhWIVjLfWLt7PwAOqd7kjD2cuP";
const vegan =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB3UUjgYAACTjszSsyoirQV6iGT3BmfNg_fyJ408Crr3u9GSxxNbNqDA0X82NhdmggEVaxm8zfBaZz050_AOhrgppkuAp48YCKCooyaOxs2VjJ2-Xq2L8n8R5Q2cQuCd9eDcHFRBnyjY12DNNF9xM2tBaNQ9ZNaTWUPpW7248-66Su7v4UPX5IdT5uSb34_JSYgxalyuIOi0qaWWE-WxB6lUX8UGeHb1PleKzqJw9T-byIhzMUw67wmyHyBjZ65y8q67dnIhbTcgygs";

const categories = [
  { label: "Pizza", icon: "local-pizza" as const },
  { label: "Burgers", icon: "lunch-dining" as const },
  { label: "Sushi", icon: "set-meal" as const },
  { label: "Healthy", icon: "eco" as const }
];

const trendingItems = [
  {
    image: poke,
    title: "Wild Salmon Poke Bowl",
    sub: "Ocean Garden • 15-20 min",
    price: "₦18,500",
    rating: "4.9",
    ratingCount: "120+",
    tags: ["PROTEIN", "FRESH"]
  },
  {
    image: trufflePizza,
    title: "Truffle Marguerita",
    sub: "Luigi's Artisan • 20-30 min",
    price: "₦22,000",
    rating: "4.8",
    ratingCount: "250+",
    tags: ["WOOD-FIRED", "CLASSIC"]
  }
];

export function SmagExploreNative() {
  const router = useAppRouter();
  const [activeTab, setActiveTab] = useState<ExploreTab>("smag");
  const [searchQuery, setSearchQuery] = useState("");
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [avatarUri, setAvatarUri] = useState("");

  useEffect(() => {
    void getUserProfile().then((p) => setAvatarUri(p.avatarUri));
    const ids = ["lartiste", "luigi", "ocean_garden"];
    const unsubs = ids.map((id) =>
      subscribeMenuItems(id, (items) => {
        setAllItems((prev) => {
          const filtered = prev.filter((i) => i.restaurantId !== id);
          return [...filtered, ...items];
        });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [searchQuery, allItems]);

  const showSearch = activeTab === "smag" && searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Pressable onPress={() => router.push("/smag_settings")}>
              <MaterialIcons name="menu" size={26} color="#4b240a" />
            </Pressable>
            <Text style={styles.topTitle}>Explore</Text>
          </View>
          <Pressable onPress={() => router.push("/smag_profile")}>
            <AppImage source={{ uri: avatarUri }} style={styles.avatar} />
          </Pressable>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, activeTab === "smag" && styles.tabBtnActive]}
            onPress={() => setActiveTab("smag")}
          >
            <MaterialIcons name="restaurant" size={15} color={activeTab === "smag" ? "#ffefeb" : "#805032"} />
            <Text style={[styles.tabBtnText, activeTab === "smag" && styles.tabBtnTextActive]}>Smag Kitchen</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === "other" && styles.tabBtnActive]}
            onPress={() => setActiveTab("other")}
          >
            <MaterialIcons name="storefront" size={15} color={activeTab === "other" ? "#ffefeb" : "#805032"} />
            <Text style={[styles.tabBtnText, activeTab === "other" && styles.tabBtnTextActive]}>Other Kitchens</Text>
          </Pressable>
        </View>

        {/* Other Kitchens tab */}
        {activeTab === "other" ? (
          <Pressable style={styles.otherKitchensEntry} onPress={() => router.push("/other_kitchens")}>
            <View style={styles.otherKitchensIconWrap}>
              <MaterialIcons name="storefront" size={28} color="#a33800" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.otherKitchensTitle}>Browse Other Kitchens</Text>
              <Text style={styles.otherKitchensSub}>
                Hundreds of restaurants near you, filtered by location and cuisine
              </Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color="#a33800" />
          </Pressable>
        ) : (
          <>
            {/* Search bar — only shown on Smag tab */}
            <View style={styles.searchWrap}>
              <MaterialIcons name="search" size={20} color="#ff5e07" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Smag dishes..."
                placeholderTextColor="#80503288"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <MaterialIcons name="close" size={18} color="#805032" />
                </Pressable>
              )}
            </View>

            {showSearch ? (
              <>
                <Text style={styles.trendingTitle}>
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
                </Text>
                {searchResults.length === 0 ? (
                  <View style={{ alignItems: "center", marginTop: 40, gap: 10 }}>
                    <MaterialIcons name="search-off" size={48} color="#ffdbc9" />
                    <Text style={{ color: "#805032", fontSize: 16, fontWeight: "700" }}>No dishes found</Text>
                  </View>
                ) : searchResults.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.foodCard}
                    onPress={() => router.push("/smag_restaurant_details")}
                  >
                    <View style={styles.foodImageWrap}>
                      <AppImage source={{ uri: item.imageUrl }} style={styles.foodImage} />
                    </View>
                    <View style={styles.foodBody}>
                      <View style={styles.foodTitleRow}>
                        <Text style={styles.foodTitle}>{item.name}</Text>
                        <Text style={styles.foodPrice}>₦{item.price.toLocaleString()}</Text>
                      </View>
                      <Text style={styles.foodSub}>{item.description}</Text>
                      <View style={styles.foodBottom}>
                        <Text style={styles.tag}>{item.category}</Text>
                        <Pressable style={styles.addBtn} onPress={() => router.push("/smag_my_cart")}>
                          <MaterialIcons name="add" size={22} color="#ffefeb" />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            ) : (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Popular Categories</Text>
                  <Pressable onPress={() => router.push("/smag_menu")}>
                    <Text style={styles.viewAll}>View All</Text>
                  </Pressable>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.catRow}>
                    {categories.map((cat, idx) => (
                      <Pressable
                        key={cat.label}
                        style={styles.catItem}
                        onPress={() => router.push("/smag_menu")}
                      >
                        <View style={[styles.catCircle, idx === 0 && styles.catCircleActive]}>
                          <MaterialIcons
                            name={cat.icon}
                            size={28}
                            color={idx === 0 ? "#ffefeb" : "#8f3000"}
                          />
                        </View>
                        <Text style={styles.catLabel}>{cat.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.trendingTitle}>Trending Now</Text>
                <Text style={styles.trendingSubtitle}>Curated bites from our top kitchens</Text>

                {trendingItems.map((item) => (
                  <Pressable
                    key={item.title}
                    style={styles.foodCard}
                    onPress={() => router.push("/smag_restaurant_details")}
                  >
                    <View style={styles.foodImageWrap}>
                      <AppImage source={{ uri: item.image }} style={styles.foodImage} />
                      <View style={styles.ratingPill}>
                        <MaterialIcons name="star" size={13} color="#a33800" />
                        <Text style={styles.ratingText}>{item.rating} ({item.ratingCount})</Text>
                      </View>
                    </View>
                    <View style={styles.foodBody}>
                      <View style={styles.foodTitleRow}>
                        <Text style={styles.foodTitle}>{item.title}</Text>
                        <Text style={styles.foodPrice}>{item.price}</Text>
                      </View>
                      <Text style={styles.foodSub}>{item.sub}</Text>
                      <View style={styles.foodBottom}>
                        <View style={styles.tagsRow}>
                          {item.tags.map((tag) => (
                            <Text key={tag} style={styles.tag}>{tag}</Text>
                          ))}
                        </View>
                        <Pressable style={styles.addBtn} onPress={() => router.push("/smag_my_cart")}>
                          <MaterialIcons name="add" size={22} color="#ffefeb" />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Curated Collections</Text>
                <View style={styles.collectionRow}>
                  <Pressable style={styles.collectionCard} onPress={() => router.push("/smag_menu")}>
                    <AppImage source={{ uri: sweet }} style={styles.collectionImage} />
                    <View style={styles.collectionOverlay} />
                    <View style={styles.collectionTextWrap}>
                      <Text style={styles.collectionTitle}>Sweet Treats</Text>
                      <Text style={styles.collectionCount}>12 Restaurants</Text>
                    </View>
                  </Pressable>
                  <Pressable style={styles.collectionCard} onPress={() => router.push("/smag_menu")}>
                    <AppImage source={{ uri: vegan }} style={styles.collectionImage} />
                    <View style={styles.collectionOverlay} />
                    <View style={styles.collectionTextWrap}>
                      <Text style={styles.collectionTitle}>Vegan Feast</Text>
                      <Text style={styles.collectionCount}>8 Restaurants</Text>
                    </View>
                  </Pressable>
                </View>
              </>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { paddingHorizontal: 18, paddingBottom: 42 },
  topBar: { marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topTitle: { fontSize: 28, color: "#4b240a", fontWeight: "900" },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  tabRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 999, backgroundColor: "#ffdbc9"
  },
  tabBtnActive: { backgroundColor: "#a33800" },
  tabBtnText: { color: "#805032", fontWeight: "700", fontSize: 13 },
  tabBtnTextActive: { color: "#ffefeb" },
  otherKitchensEntry: {
    marginTop: 16, backgroundColor: "#ffffff", borderRadius: 18, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "#ffdbc9"
  },
  otherKitchensIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center"
  },
  otherKitchensTitle: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  otherKitchensSub: { color: "#805032", fontSize: 12, marginTop: 2, lineHeight: 17 },
  searchWrap: {
    marginTop: 14, borderRadius: 999, minHeight: 52, backgroundColor: "#ffede5",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8
  },
  searchInput: { flex: 1, color: "#4b240a", fontSize: 15 },
  sectionRow: { marginTop: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: "#4b240a", fontSize: 24, fontWeight: "900" },
  viewAll: { color: "#a33800", fontWeight: "800", fontSize: 14 },
  catRow: { flexDirection: "row", gap: 14, paddingTop: 14, paddingBottom: 4 },
  catItem: { alignItems: "center", gap: 7 },
  catCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#ffdbc9", justifyContent: "center", alignItems: "center" },
  catCircleActive: { backgroundColor: "#a33800" },
  catLabel: { color: "#805032", fontSize: 12, fontWeight: "700" },
  trendingTitle: { marginTop: 22, color: "#4b240a", fontSize: 28, fontWeight: "900" },
  trendingSubtitle: { marginTop: 2, marginBottom: 14, color: "#805032", fontSize: 14 },
  foodCard: {
    borderRadius: 22, overflow: "hidden", backgroundColor: "#ffffff", marginBottom: 16,
    shadowColor: "#4b240a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  foodImageWrap: { position: "relative" },
  foodImage: { width: "100%", height: 210 },
  ratingPill: {
    position: "absolute", top: 12, left: 12, backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: "row", alignItems: "center", gap: 4
  },
  ratingText: { color: "#a33800", fontWeight: "800", fontSize: 12 },
  foodBody: { padding: 14 },
  foodTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  foodTitle: { flex: 1, color: "#4b240a", fontSize: 20, fontWeight: "900", lineHeight: 24 },
  foodPrice: { color: "#a33800", fontSize: 22, fontWeight: "900" },
  foodSub: { marginTop: 3, color: "#805032", fontSize: 13 },
  foodBottom: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tagsRow: { flexDirection: "row", gap: 7 },
  tag: { color: "#805032", backgroundColor: "#ffdbc9", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "700" },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#a33800", justifyContent: "center", alignItems: "center" },
  collectionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  collectionCard: { flex: 1, height: 160, borderRadius: 18, overflow: "hidden" },
  collectionImage: { width: "100%", height: "100%" },
  collectionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.38)" },
  collectionTextWrap: { position: "absolute", left: 10, right: 10, bottom: 10 },
  collectionTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  collectionCount: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }
});
