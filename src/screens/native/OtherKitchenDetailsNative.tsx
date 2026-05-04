import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  subscribeExternalRestaurants,
  subscribeExternalMenuItems,
  addToCart,
  type ExternalRestaurant,
  type ExternalMenuItem
} from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/auth";
import { CartBadgeIcon } from "@/components/CartBadgeIcon";
import { ListSkeleton } from "@/components/SkeletonLoader";
import { AppImage } from "@/components/AppImage";
import { haptics } from "@/lib/haptics";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { useAppRouter } from "@/lib/useAppRouter";

export function OtherKitchenDetailsNative() {
  const router = useAppRouter();
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const isOnline = useNetworkStatus();

  const [restaurant, setRestaurant] = useState<ExternalRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<ExternalMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customiseItem, setCustomiseItem] = useState<ExternalMenuItem | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = subscribeExternalRestaurants((list) => {
      const found = list.find((r) => r.id === restaurantId) ?? null;
      setRestaurant(found);
    });
    return unsub;
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = subscribeExternalMenuItems(
      restaurantId,
      (items) => {
        setMenuItems(items);
        setMenuLoading(false);
        if (items.length > 0 && !selectedCategory) {
          setSelectedCategory(items[0].category);
        }
      },
      () => setMenuLoading(false)
    );
    return unsub;
  }, [restaurantId]);

  const categories = useMemo(() => [...new Set(menuItems.map((i) => i.category))], [menuItems]);
  const filtered = useMemo(
    () => menuItems.filter((i) => i.category === selectedCategory),
    [menuItems, selectedCategory]
  );

  function openCustomise(item: ExternalMenuItem) {
    if (!item.customisations?.length) {
      void handleAddToCart(item, {});
      return;
    }
    const defaults: Record<string, string> = {};
    item.customisations.forEach((c) => {
      if (c.options.length > 0) defaults[c.label] = c.options[0].name;
    });
    setSelections(defaults);
    setCustomiseItem(item);
  }

  async function handleAddToCart(item: ExternalMenuItem, customisationSelections: Record<string, string>) {
    if (!isOnline) {
      Alert.alert("No Connection", "Adding to cart requires an internet connection.");
      return;
    }
    const user = getCurrentUser();
    if (!user || !restaurant) return;
    setAddingId(item.id);
    try {
      const extraCost = Object.entries(customisationSelections).reduce((sum, [label, optName]) => {
        const group = item.customisations?.find((c) => c.label === label);
        const opt = group?.options.find((o) => o.name === optName);
        return sum + (opt?.extraCost ?? 0);
      }, 0);

      await haptics.tap();
      await addToCart(user.uid, {
        menuItemId: item.id,
        name: item.name,
        price: item.price + extraCost,
        imageUrl: item.imageUrl,
        quantity: 1,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      });
      setCustomiseItem(null);
      router.push("/smag_my_cart");
    } finally {
      setAddingId(null);
    }
  }

  if (!restaurant && !menuLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Restaurant not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#ff5c00" />
          </Pressable>
          <Pressable onPress={() => router.push("/smag_my_cart")}>
            <CartBadgeIcon size={22} color="#ff5c00" />
          </Pressable>
        </View>

        {/* Hero */}
        {restaurant ? (
          <>
            <View style={styles.heroWrap}>
              <AppImage source={{ uri: restaurant.imageUrl }} style={styles.heroImage} />
              <View style={styles.heroOverlay} />
              {!restaurant.isOpen && (
                <View style={styles.closedBanner}>
                  <Text style={styles.closedBannerText}>Currently Closed</Text>
                </View>
              )}
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={14} color="#a33800" />
                  <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <MetaChip icon="schedule" label={`${restaurant.deliveryMinutes} min`} />
                <MetaChip
                  icon="delivery-dining"
                  label={restaurant.deliveryFee === 0 ? "Free delivery" : `₦${restaurant.deliveryFee.toLocaleString()} delivery`}
                />
                {restaurant.minimumOrder > 0 && (
                  <MetaChip icon="shopping-bag" label={`Min ₦${restaurant.minimumOrder.toLocaleString()}`} />
                )}
              </View>
              <Text style={styles.address}>{restaurant.address}</Text>
            </View>
          </>
        ) : (
          <View style={styles.heroWrap}>
            <View style={[styles.heroImage, { backgroundColor: "#ffdbc9" }]} />
          </View>
        )}

        {/* Category chips */}
        {!menuLoading && categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Menu */}
        <Text style={styles.sectionTitle}>{selectedCategory || "Menu"}</Text>
        {menuLoading ? (
          <ListSkeleton count={3} />
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No items in this category.</Text>
        ) : (
          filtered.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <AppImage source={{ uri: item.imageUrl }} style={styles.itemImage} />
              <View style={styles.itemBody}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
                  <Pressable
                    style={[styles.addBtn, (!restaurant?.isOpen || addingId === item.id) && { opacity: 0.5 }]}
                    onPress={() => openCustomise(item)}
                    disabled={!restaurant?.isOpen || addingId !== null}
                  >
                    {addingId === item.id
                      ? <ActivityIndicator size="small" color="#ffefeb" />
                      : <MaterialIcons name="add" size={20} color="#ffefeb" />}
                  </Pressable>
                </View>
                {item.customisations && item.customisations.length > 0 && (
                  <Text style={styles.customiseHint}>Customisable</Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Customisation Modal */}
      <Modal visible={customiseItem !== null} transparent animationType="slide" onRequestClose={() => setCustomiseItem(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{customiseItem?.name}</Text>
            <ScrollView style={styles.modalScroll}>
              {customiseItem?.customisations?.map((group) => (
                <View key={group.label} style={styles.customGroup}>
                  <Text style={styles.customGroupLabel}>{group.label}</Text>
                  {group.options.map((opt) => (
                    <Pressable
                      key={opt.name}
                      style={styles.customOption}
                      onPress={() => setSelections((prev) => ({ ...prev, [group.label]: opt.name }))}
                    >
                      <View style={[styles.radio, selections[group.label] === opt.name && styles.radioActive]}>
                        {selections[group.label] === opt.name && <View style={styles.radioDot} />}
                      </View>
                      <Text style={styles.optionName}>{opt.name}</Text>
                      {opt.extraCost > 0 && (
                        <Text style={styles.optionExtra}>+₦{opt.extraCost.toLocaleString()}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={[styles.confirmBtn, addingId !== null && { opacity: 0.6 }]}
              onPress={() => customiseItem && handleAddToCart(customiseItem, selections)}
              disabled={addingId !== null}
            >
              {addingId !== null
                ? <ActivityIndicator color="#ffefeb" />
                : <Text style={styles.confirmBtnText}>Add to Cart</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetaChip({ icon, label }: { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  return (
    <View style={styles.metaChip}>
      <MaterialIcons name={icon} size={13} color="#805032" />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  heroWrap: { height: 280, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  closedBanner: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", paddingVertical: 10, alignItems: "center" },
  closedBannerText: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 1 },
  infoCard: { marginHorizontal: 16, marginTop: -20, backgroundColor: "#ffffff", borderRadius: 20, padding: 14 },
  infoTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  restaurantName: { color: "#4b240a", fontSize: 24, fontWeight: "900" },
  cuisine: { color: "#805032", fontSize: 13, marginTop: 2 },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#ffede5", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  ratingText: { color: "#a33800", fontWeight: "800", fontSize: 13 },
  reviewCount: { color: "#805032", fontSize: 11 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff4f0", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  metaChipText: { color: "#805032", fontSize: 12 },
  address: { marginTop: 8, color: "#805032", fontSize: 12, lineHeight: 17 },
  chipsScroll: { marginTop: 14 },
  chipsContent: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#ffdbc9" },
  chipActive: { backgroundColor: "#a33800" },
  chipText: { color: "#4b240a", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#ffefeb" },
  sectionTitle: { marginHorizontal: 16, marginTop: 16, marginBottom: 10, color: "#4b240a", fontSize: 22, fontWeight: "900" },
  emptyText: { marginHorizontal: 16, color: "#805032", fontSize: 14 },
  itemCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#ffffff", borderRadius: 18, flexDirection: "row", overflow: "hidden" },
  itemImage: { width: 100, height: 100 },
  itemBody: { flex: 1, padding: 10 },
  itemName: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  itemDesc: { color: "#805032", fontSize: 12, marginTop: 3, lineHeight: 17 },
  itemFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  itemPrice: { color: "#a33800", fontSize: 18, fontWeight: "900" },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#a33800", alignItems: "center", justifyContent: "center" },
  customiseHint: { color: "#a33800", fontSize: 10, fontWeight: "700", marginTop: 4 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { color: "#805032", fontSize: 16 },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff4f0", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "80%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#dd9f7c", alignSelf: "center", marginBottom: 16 },
  modalTitle: { color: "#4b240a", fontSize: 22, fontWeight: "900", marginBottom: 12 },
  modalScroll: { maxHeight: 320 },
  customGroup: { marginBottom: 18 },
  customGroupLabel: { color: "#805032", fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" },
  customOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#dd9f7c", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: "#a33800" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#a33800" },
  optionName: { flex: 1, color: "#4b240a", fontSize: 15, fontWeight: "600" },
  optionExtra: { color: "#a33800", fontWeight: "700", fontSize: 13 },
  confirmBtn: { marginTop: 16, backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 16, alignItems: "center" },
  confirmBtnText: { color: "#ffefeb", fontWeight: "900", fontSize: 16 }
});
