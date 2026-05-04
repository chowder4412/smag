import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import { addAddress, deleteAddress, setDefaultAddress, subscribeAddresses, type SavedAddress } from "@/lib/firebase/firestore";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const hero =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB7aUZ_6WOyGBOrKa_LLfBuPyg5KwWsgQu-TQSAA06QXk4NtuoTHd0Glmq8hH-LW7r4ps-IwG5bUTtTvamfQcg_C-qoT75b8Oi-WvKMI0afbdgAkTwH7CexcbWqVOZexQmMzwYvAyYL9gIqu8886_u2uvj-AtV94OtoNlP4kVvFTzztKbPq9hRtxGTVR98HZFh_HIrNqWPcotJKZzbC271LGizpQLUTkph2OKen4CW03tODiKy1kDTPQN3yJWAeHK5NGQpTDnnw30ra";

const ICON_OPTIONS = ["house", "work", "fitness-center", "local-cafe", "place"] as const;

export function SmagSavedAddressesNative() {
  const router = useAppRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newIcon, setNewIcon] = useState<string>("house");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    const unsub = subscribeAddresses(
      user.uid,
      (data) => { setAddresses(data); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  async function handleAdd() {
    const user = getCurrentUser();
    if (!user || !newTitle.trim() || !newText.trim()) return;
    setAdding(true);
    try {
      await addAddress({
        userId: user.uid,
        title: newTitle.trim(),
        text: newText.trim(),
        icon: newIcon,
        isDefault: addresses.length === 0
      });
      setNewTitle(""); setNewText(""); setNewIcon("house"); setShowForm(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert("Delete Address", "Remove this address?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAddress(id) }
    ]);
  }

  async function handleSetDefault(id: string) {
    const user = getCurrentUser();
    if (!user) return;
    await setDefaultAddress(user.uid, id);
  }

  const defaultAddr = addresses.find((a) => a.isDefault);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#ff5c00" />
          </Pressable>
          <Text style={styles.title}>Saved Addresses</Text>
          <Pressable onPress={() => setShowForm((v) => !v)}>
            <MaterialIcons name={showForm ? "close" : "add"} size={22} color="#ff5c00" />
          </Pressable>
        </View>

        <View style={styles.heroWrap}>
          <AppImage source={{ uri: hero }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          {defaultAddr && (
            <View style={styles.heroCard}>
              <Text style={styles.heroCardLabel}>ACTIVE NOW</Text>
              <Text style={styles.heroCardText}>
                Delivering to:{"\n"}
                <Text style={styles.heroCardStrong}>{defaultAddr.title}</Text>
              </Text>
            </View>
          )}
        </View>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Address</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Label (e.g. Home, Work)"
              placeholderTextColor="#80503299"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.formInput, { minHeight: 70 }]}
              placeholder="Full address"
              placeholderTextColor="#80503299"
              value={newText}
              onChangeText={setNewText}
              multiline
            />
            <View style={styles.iconRow}>
              {ICON_OPTIONS.map((icon) => (
                <Pressable
                  key={icon}
                  style={[styles.iconOption, newIcon === icon && styles.iconOptionActive]}
                  onPress={() => setNewIcon(icon)}
                >
                  <MaterialIcons name={icon as never} size={20} color={newIcon === icon ? "#ffefeb" : "#a33800"} />
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.saveBtn, adding && { opacity: 0.6 }]} onPress={handleAdd} disabled={adding}>
              {adding ? <ActivityIndicator color="#ffefeb" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
            </Pressable>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#a33800" style={{ marginTop: 40 }} />
        ) : addresses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="add-location-alt" size={48} color="#ffdbc9" />
            <Text style={styles.emptyText}>No saved addresses yet</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {addresses.map((item) => (
              <View key={item.id} style={[styles.addressCard, item.isDefault && styles.addressCardDefault]}>
                <View style={styles.iconWrap}>
                  <MaterialIcons name={item.icon as never} size={22} color="#a33800" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.addressTitleRow}>
                    <Text style={styles.addressTitle}>{item.title}</Text>
                    {item.isDefault && <Text style={styles.defaultPill}>DEFAULT</Text>}
                  </View>
                  <Text style={styles.addressText}>{item.text}</Text>
                  {!item.isDefault && (
                    <Pressable onPress={() => handleSetDefault(item.id)}>
                      <Text style={styles.setDefaultText}>Set as default</Text>
                    </Pressable>
                  )}
                </View>
                <Pressable onPress={() => handleDelete(item.id)}>
                  <MaterialIcons name="delete" size={18} color="#9f0519" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable style={styles.addNewBtn} onPress={() => setShowForm(true)}>
          <MaterialIcons name="add-location-alt" size={18} color="#ffefeb" />
          <Text style={styles.addNewText}>Add New Address</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  heroWrap: { height: 210, borderRadius: 24, overflow: "hidden", position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(163,56,0,0.22)" },
  heroCard: { position: "absolute", right: 10, bottom: 10, backgroundColor: "#ffffffee", borderRadius: 16, padding: 10 },
  heroCardLabel: { color: "#a33800", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  heroCardText: { color: "#4b240a", fontSize: 12, marginTop: 4, lineHeight: 16 },
  heroCardStrong: { color: "#8f3000", fontWeight: "800" },
  formCard: { marginTop: 14, backgroundColor: "#ffede5", borderRadius: 20, padding: 14, gap: 10 },
  formTitle: { color: "#4b240a", fontSize: 18, fontWeight: "900" },
  formInput: { backgroundColor: "#ffffff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: "#4b240a", fontSize: 15 },
  iconRow: { flexDirection: "row", gap: 10 },
  iconOption: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffdbc9", alignItems: "center", justifyContent: "center" },
  iconOptionActive: { backgroundColor: "#a33800" },
  saveBtn: { backgroundColor: "#a33800", borderRadius: 999, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { color: "#ffefeb", fontWeight: "800", fontSize: 15 },
  emptyWrap: { alignItems: "center", marginTop: 40, gap: 10 },
  emptyText: { color: "#805032", fontSize: 16, fontWeight: "700" },
  list: { marginTop: 14, gap: 10 },
  addressCard: { borderRadius: 16, backgroundColor: "#ffffff", padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  addressCardDefault: { borderWidth: 1.5, borderColor: "#ff7941" },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  addressTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressTitle: { color: "#4b240a", fontSize: 18, fontWeight: "800" },
  defaultPill: { backgroundColor: "#ff7941", color: "#ffefeb", fontSize: 9, fontWeight: "900", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, letterSpacing: 0.5 },
  addressText: { color: "#805032", fontSize: 12, marginTop: 3, lineHeight: 16 },
  setDefaultText: { color: "#a33800", fontSize: 12, fontWeight: "700", marginTop: 4 },
  addNewBtn: { marginTop: 16, borderRadius: 999, minHeight: 50, backgroundColor: "#a33800", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addNewText: { color: "#ffefeb", fontSize: 16, fontWeight: "800" }
});
