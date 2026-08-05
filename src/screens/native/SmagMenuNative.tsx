import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollView as ScrollViewType
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppImage } from "@/components/AppImage";
import { CartBadgeIcon } from "@/components/CartBadgeIcon";
import { getCurrentUser } from "@/lib/firebase/auth";
import { addToCart, subscribeCart } from "@/lib/firebase/firestore";
import { haptics } from "@/lib/haptics";
import { enqueueCartMutation } from "@/lib/offlineQueue";
import {
  CHEFS_PICKS,
  SMAG_KITCHEN_CATEGORIES,
  customGroupsForDish,
  formatNaira,
  menuItemIdForDish,
  type CustomGroup,
  type MealCategory,
  type MealDish
} from "@/lib/smagKitchenMenu";
import { useAppRouter } from "@/lib/useAppRouter";
import { useCartCount } from "@/lib/useCartCount";
import { useNetworkStatus } from "@/lib/useNetworkStatus";

const hero =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDcW_x1H-GXJ9drKFDNk4pBnXZHZjk0pbwOpn4q6dcmzBEcZveJPCwt7zhYXRHKJrhxjNPiq6j4vqrlobQsWbOvj_JoS3hPeq7lSFSuKQv90b57ptRoFEx_bG3PK5C3Pz9s3Bbdakkno2MheIYiSy1GQ9J_RIYMmPlYh3XaDNqz4BcxsIkYSYriCCn6FUvsn0E_yvZpWA8-LhrfFVcALua8iDxB7YIYzmtPAFAD_lO6GffKELv2qZTPLNzVJyMUCB6FXDLDapz8QCjU";

type MenuSection = {
  label: string;
  icon: MealCategory["icon"] | "restaurant-menu";
  dishes: MealDish[];
};

type SelectedDish = {
  dish: MealDish;
  categoryLabel: string;
};

const ALL_SECTIONS: MenuSection[] = [
  { label: "Chef's Picks", icon: "restaurant-menu", dishes: CHEFS_PICKS.map((dish) => ({ ...dish, badge: dish.badge ?? "Chef's Pick" })) },
  ...SMAG_KITCHEN_CATEGORIES
];

export function SmagMenuNative() {
  const router = useAppRouter();
  const isOnline = useNetworkStatus();
  const cartCount = useCartCount();
  const scrollRef = useRef<ScrollViewType | null>(null);

  const [sectionY, setSectionY] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedDish, setSelectedDish] = useState<SelectedDish | null>(null);
  const [customSelections, setCustomSelections] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [addingDish, setAddingDish] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    return subscribeCart(user.uid, (items) => {
      setCartTotal(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    });
  }, []);

  const visibleSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ALL_SECTIONS;
    return ALL_SECTIONS.map((section) => ({
      ...section,
      dishes: section.dishes.filter((dish) =>
        dish.name.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q) ||
        section.label.toLowerCase().includes(q)
      )
    })).filter((section) => section.dishes.length > 0);
  }, [searchQuery]);

  const selectedGroups = useMemo(
    () => selectedDish ? customGroupsForDish(selectedDish.dish, selectedDish.categoryLabel) : [],
    [selectedDish]
  );
  const selectedOptions = useMemo(
    () => selectedGroups.map((group) => ({
      label: group.label,
      option: group.options.find((opt) => opt.value === customSelections[group.key]) ?? group.options[0]
    })),
    [customSelections, selectedGroups]
  );
  const selectedBasePrice = selectedDish?.dish.priceValue ?? 0;
  const selectedExtraCost = selectedOptions.reduce((sum, item) => sum + (item.option?.extraCost ?? 0), 0);
  const selectedUnitPrice = selectedBasePrice + selectedExtraCost;
  const selectedTotal = selectedUnitPrice * quantity;

  function scrollToSection(label: string) {
    const y = sectionY[label] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 10), animated: true });
  }

  function openDishDetail(dish: MealDish, categoryLabel: string) {
    const groups = customGroupsForDish(dish, categoryLabel);
    const defaults = groups.reduce<Record<string, string>>((acc, group) => {
      acc[group.key] = group.options[0]?.value ?? "";
      return acc;
    }, {});
    setSelectedDish({ dish, categoryLabel });
    setCustomSelections(defaults);
    setQuantity(1);
  }

  async function handleAddConfiguredDish() {
    if (!selectedDish) return;
    const user = getCurrentUser();
    if (!user) {
      Alert.alert("Sign in required", "Please sign in before adding items to your cart.");
      return;
    }

    const cartPayload = {
      menuItemId: menuItemIdForDish(selectedDish.dish.name),
      name: selectedDish.dish.name,
      basePrice: selectedBasePrice,
      price: selectedUnitPrice,
      imageUrl: selectedDish.dish.image,
      quantity,
      restaurantId: "smag_kitchen",
      restaurantName: "Smag Kitchen",
      customizations: selectedOptions.map((item) => ({
        label: item.label,
        value: item.option?.value ?? "",
        extraCost: item.option?.extraCost ?? 0
      }))
    };

    setAddingDish(true);
    try {
      await haptics.tap();
      if (!isOnline) {
        await enqueueCartMutation({ type: "add", userId: user.uid, item: cartPayload });
        setSelectedDish(null);
        Alert.alert("You're offline", "Item saved. It will be added to your cart when you reconnect.");
        return;
      }
      await addToCart(user.uid, cartPayload);
      setSelectedDish(null);
    } finally {
      setAddingDish(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={22} color="#a33800" />
          </Pressable>
          <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          <Pressable style={styles.iconBtn} onPress={() => router.push("/smag_my_cart")} accessibilityRole="button" accessibilityLabel="View cart">
            <CartBadgeIcon size={23} color="#a33800" />
          </Pressable>
        </View>

        <View style={styles.heroWrap}>
          <AppImage source={{ uri: hero }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroText}>
            <Text style={styles.heroTag}>Smag Kitchen</Text>
            <Text style={styles.heroTitle}>Nigerian Gourmet, Ready Fast</Text>
            <Text style={styles.heroMeta}>Chef-curated breakfast, lunch, dinner and dessert</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#a33800" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search all Smag dishes..."
            placeholderTextColor="#80503288"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel="Clear search">
              <MaterialIcons name="close" size={18} color="#805032" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {ALL_SECTIONS.map((section) => (
              <Pressable
                key={section.label}
                style={styles.chip}
                onPress={() => scrollToSection(section.label)}
                accessibilityRole="button"
                accessibilityLabel={`Jump to ${section.label}`}
              >
                <MaterialIcons name={section.icon} size={15} color="#a33800" />
                <Text style={styles.chipText}>{section.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {visibleSections.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="search-off" size={48} color="#dd9f7c" />
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.emptySub}>Try searching for jollof, soup, breakfast or dessert.</Text>
          </View>
        ) : (
          visibleSections.map((section) => (
            <View
              key={section.label}
              style={styles.section}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                setSectionY((prev) => prev[section.label] === y ? prev : { ...prev, [section.label]: y });
              }}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <MaterialIcons name={section.icon} size={18} color="#a33800" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                  <Text style={styles.sectionSub}>{section.dishes.length} dishes</Text>
                </View>
              </View>

              {section.dishes.map((dish) => (
                <DishRow
                  key={`${section.label}-${dish.name}`}
                  dish={dish}
                  onAdd={() => openDishDetail(dish, section.label === "Chef's Picks" ? "Dinner" : section.label)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {cartCount > 0 ? (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartBarTitle}>{cartCount} item{cartCount === 1 ? "" : "s"} in cart</Text>
            <Text style={styles.cartBarTotal}>{formatNaira(cartTotal)}</Text>
          </View>
          <Pressable style={styles.cartBarBtn} onPress={() => router.push("/smag_my_cart")} accessibilityRole="button" accessibilityLabel="View cart">
            <Text style={styles.cartBarBtnText}>View Cart</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#ffefeb" />
          </Pressable>
        </View>
      ) : null}

      <DishDetailModal
        selectedDish={selectedDish}
        groups={selectedGroups}
        selections={customSelections}
        quantity={quantity}
        unitPrice={selectedUnitPrice}
        total={selectedTotal}
        adding={addingDish}
        onClose={() => {
          if (!addingDish) setSelectedDish(null);
        }}
        onSelect={(groupKey, value) => setCustomSelections((prev) => ({ ...prev, [groupKey]: value }))}
        onQuantityChange={(delta) => setQuantity((prev) => Math.max(1, Math.min(9, prev + delta)))}
        onAdd={handleAddConfiguredDish}
      />
    </SafeAreaView>
  );
}

function DishRow({ dish, onAdd }: { dish: MealDish; onAdd: () => void }) {
  return (
    <View style={styles.itemCard}>
      <AppImage source={{ uri: dish.image }} style={styles.itemImage} />
      <View style={styles.itemBody}>
        <View style={styles.itemTitleRow}>
          <Text style={styles.itemName} numberOfLines={2}>{dish.name}</Text>
          {dish.badge ? <Text style={styles.itemBadge}>{dish.badge}</Text> : null}
        </View>
        <Text style={styles.itemDesc} numberOfLines={2}>{dish.description}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>{dish.price}</Text>
          <Pressable style={styles.addBtn} onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Customize ${dish.name}`}>
            <MaterialIcons name="add" size={21} color="#ffefeb" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DishDetailModal({
  selectedDish,
  groups,
  selections,
  quantity,
  unitPrice,
  total,
  adding,
  onClose,
  onSelect,
  onQuantityChange,
  onAdd
}: {
  selectedDish: SelectedDish | null;
  groups: CustomGroup[];
  selections: Record<string, string>;
  quantity: number;
  unitPrice: number;
  total: number;
  adding: boolean;
  onClose: () => void;
  onSelect: (groupKey: string, value: string) => void;
  onQuantityChange: (delta: number) => void;
  onAdd: () => void;
}) {
  const dish = selectedDish?.dish;

  return (
    <Modal visible={Boolean(selectedDish)} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.detailSafe} edges={["top"]}>
        {dish ? (
          <View style={styles.detailShell}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
              <View style={styles.detailHero}>
                <AppImage source={{ uri: dish.image }} style={styles.detailImage} />
                <Pressable style={styles.detailCloseBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close dish details">
                  <MaterialIcons name="close" size={28} color="#ffffff" />
                </Pressable>
                <View style={styles.detailSearchBtn}>
                  <MaterialIcons name="search" size={28} color="#1f1a17" />
                </View>
              </View>

              <View style={styles.detailBody}>
                <View style={styles.detailBadge}>
                  <MaterialIcons name="restaurant-menu" size={14} color="#a33800" />
                  <Text style={styles.detailBadgeText}>Smag Kitchen</Text>
                </View>
                <Text style={styles.detailTitle}>{dish.name}</Text>
                <Text style={styles.detailPrice}>{formatNaira(unitPrice)}</Text>
                <Text style={styles.detailDesc}>{dish.description}</Text>

                <View style={styles.quickHeader}>
                  <Text style={styles.quickTitle}>Customize it quickly</Text>
                  <Text style={styles.quickSub}>Choose spice, meal style and packaging before adding to cart.</Text>
                </View>

                {groups.map((group) => (
                  <View key={group.key} style={styles.detailGroup}>
                    <Text style={styles.detailGroupTitle}>{group.label}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.optionRow}>
                        {group.options.map((option) => {
                          const selected = selections[group.key] === option.value;
                          return (
                            <Pressable
                              key={option.value}
                              style={[styles.optionCard, selected && styles.optionCardActive]}
                              onPress={() => onSelect(group.key, option.value)}
                              accessibilityRole="radio"
                              accessibilityState={{ selected }}
                            >
                              <View style={styles.optionTop}>
                                <Text style={[styles.optionTitle, selected && styles.optionTitleActive]}>{option.value}</Text>
                                <View style={[styles.optionRadio, selected && styles.optionRadioActive]}>
                                  {selected ? <View style={styles.optionRadioDot} /> : null}
                                </View>
                              </View>
                              <Text style={styles.optionDetail}>{option.detail}</Text>
                              <Text style={styles.optionCost}>
                                {option.extraCost > 0 ? `+${formatNaira(option.extraCost)}` : "Included"}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.detailFooter}>
              <View style={styles.qtyPill}>
                <Pressable style={styles.qtyBtnDetail} onPress={() => onQuantityChange(-1)} accessibilityRole="button" accessibilityLabel="Decrease quantity">
                  <MaterialIcons name="remove" size={18} color="#a33800" />
                </Pressable>
                <Text style={styles.qtyTextDetail}>{quantity}</Text>
                <Pressable style={styles.qtyBtnDetail} onPress={() => onQuantityChange(1)} accessibilityRole="button" accessibilityLabel="Increase quantity">
                  <MaterialIcons name="add" size={18} color="#a33800" />
                </Pressable>
              </View>
              <Pressable
                style={[styles.detailAddBtn, adding && { opacity: 0.7 }]}
                onPress={onAdd}
                disabled={adding}
                accessibilityRole="button"
                accessibilityLabel={`Add ${quantity} ${dish.name} to cart for ${formatNaira(total)}`}
                accessibilityState={{ busy: adding }}
              >
                {adding ? (
                  <ActivityIndicator color="#ffefeb" />
                ) : (
                  <Text style={styles.detailAddText}>Add {quantity} for {formatNaira(total)}</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { paddingBottom: 122 },
  header: {
    marginHorizontal: 18, marginTop: 8, marginBottom: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between"
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center"
  },
  brand: { width: 88, height: 40 },
  heroWrap: { height: 280, position: "relative", marginBottom: 16 },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(35,15,4,0.34)" },
  heroText: { position: "absolute", left: 20, right: 20, bottom: 20 },
  heroTag: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,237,229,0.94)",
    color: "#a33800", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5,
    fontWeight: "900", fontSize: 12
  },
  heroTitle: { marginTop: 10, color: "#fff", fontSize: 34, lineHeight: 39, fontWeight: "900" },
  heroMeta: { marginTop: 6, color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 19 },
  searchWrap: {
    marginHorizontal: 18, borderRadius: 999, minHeight: 52, backgroundColor: "#ffede5",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8
  },
  searchInput: { flex: 1, color: "#4b240a", fontSize: 15 },
  chipScroll: { marginTop: 14 },
  chipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingBottom: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ffffff", borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9,
    borderWidth: 1, borderColor: "#ffdbc9"
  },
  chipText: { color: "#4b240a", fontWeight: "800", fontSize: 13 },
  section: { marginTop: 22 },
  sectionHeader: { marginHorizontal: 18, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center"
  },
  sectionTitle: { color: "#4b240a", fontSize: 25, fontWeight: "900" },
  sectionSub: { color: "#805032", fontSize: 12, marginTop: 1 },
  itemCard: {
    marginHorizontal: 18, marginBottom: 12, borderRadius: 16,
    backgroundColor: "#ffffff", padding: 10, flexDirection: "row", gap: 12,
    shadowColor: "#4b240a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  itemImage: { width: 100, height: 100, borderRadius: 12 },
  itemBody: { flex: 1, minHeight: 100 },
  itemTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  itemName: { flex: 1, color: "#4b240a", fontSize: 17, lineHeight: 21, fontWeight: "900" },
  itemBadge: {
    color: "#a33800", backgroundColor: "#ffede5", borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "900", overflow: "hidden"
  },
  itemDesc: { marginTop: 4, color: "#805032", fontSize: 12, lineHeight: 17 },
  itemFooter: { marginTop: "auto", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemPrice: { color: "#a33800", fontSize: 18, fontWeight: "900" },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#a33800", alignItems: "center", justifyContent: "center"
  },
  emptyWrap: { alignItems: "center", marginTop: 54, paddingHorizontal: 26 },
  emptyTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900", marginTop: 10 },
  emptySub: { color: "#805032", textAlign: "center", marginTop: 5, lineHeight: 19 },
  cartBar: {
    position: "absolute", left: 14, right: 14, bottom: 14,
    minHeight: 72, borderRadius: 24, backgroundColor: "#4b240a",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, gap: 12
  },
  cartBarTitle: { color: "#ffefeb", fontSize: 13, fontWeight: "800" },
  cartBarTotal: { color: "#ffffff", fontSize: 22, fontWeight: "900", marginTop: 2 },
  cartBarBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#a33800", borderRadius: 999, paddingHorizontal: 15, paddingVertical: 12
  },
  cartBarBtnText: { color: "#ffefeb", fontWeight: "900" },
  detailSafe: { flex: 1, backgroundColor: "#ffffff" },
  detailShell: { flex: 1, backgroundColor: "#ffffff" },
  detailContent: { paddingBottom: 132 },
  detailHero: { height: 390, backgroundColor: "#ffffff", position: "relative" },
  detailImage: { width: "100%", height: "100%" },
  detailCloseBtn: {
    position: "absolute", top: 16, left: 18,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.36)", alignItems: "center", justifyContent: "center"
  },
  detailSearchBtn: {
    position: "absolute", right: 18, bottom: 16,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.94)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(75,36,10,0.12)"
  },
  detailBody: { paddingHorizontal: 22, paddingTop: 22 },
  detailBadge: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#ffede5", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 10
  },
  detailBadgeText: { color: "#a33800", fontSize: 12, fontWeight: "800" },
  detailTitle: { color: "#17110d", fontSize: 32, fontWeight: "900", lineHeight: 38 },
  detailPrice: { marginTop: 8, color: "#17110d", fontSize: 28, fontWeight: "900" },
  detailDesc: { marginTop: 14, color: "#73665f", fontSize: 17, lineHeight: 25 },
  quickHeader: { marginTop: 28, marginBottom: 8 },
  quickTitle: { color: "#17110d", fontSize: 22, fontWeight: "900" },
  quickSub: { marginTop: 8, color: "#73665f", fontSize: 15, lineHeight: 21 },
  detailGroup: { marginTop: 20 },
  detailGroupTitle: { color: "#17110d", fontSize: 16, fontWeight: "900", marginBottom: 10 },
  optionRow: { flexDirection: "row", gap: 12, paddingRight: 22 },
  optionCard: {
    width: 245, minHeight: 148, borderRadius: 8, borderWidth: 1,
    borderColor: "#ded5cf", backgroundColor: "#ffffff", padding: 14
  },
  optionCardActive: { borderColor: "#0b8a66", backgroundColor: "#f2fbf8" },
  optionTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  optionTitle: { flex: 1, color: "#17110d", fontSize: 17, lineHeight: 22, fontWeight: "900" },
  optionTitleActive: { color: "#063f31" },
  optionRadio: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    borderColor: "#847a73", alignItems: "center", justifyContent: "center"
  },
  optionRadioActive: { borderColor: "#0b8a66" },
  optionRadioDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#0b8a66" },
  optionDetail: { marginTop: 8, color: "#73665f", fontSize: 14, lineHeight: 19 },
  optionCost: { marginTop: 10, color: "#17110d", fontSize: 15, fontWeight: "900" },
  detailFooter: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 22,
    backgroundColor: "rgba(255,255,255,0.98)", borderTopWidth: 1, borderTopColor: "#eee4de"
  },
  qtyPill: {
    height: 56, borderRadius: 28, backgroundColor: "#ffede5",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 4
  },
  qtyBtnDetail: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center"
  },
  qtyTextDetail: { width: 28, textAlign: "center", color: "#17110d", fontSize: 18, fontWeight: "900" },
  detailAddBtn: {
    flex: 1, minHeight: 62, borderRadius: 31,
    backgroundColor: "#0b8a66", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 14
  },
  detailAddText: { color: "#ffefeb", fontSize: 18, fontWeight: "900", textAlign: "center" }
});
