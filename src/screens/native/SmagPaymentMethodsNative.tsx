import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import {
  addStoredPaymentMethod,
  deleteStoredPaymentMethod,
  saveWalletPreference,
  setDefaultPaymentMethod,
  subscribePaymentPreferences,
  type StoredPaymentMethod
} from "@/lib/firebase/firestore";
import { useAppRouter } from "@/lib/useAppRouter";

export function SmagPaymentMethodsNative() {
  const router = useAppRouter();
  const [wallet, setWallet] = useState<"apple" | "google">("google");
  const [methods, setMethods] = useState<StoredPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cardLabel, setCardLabel] = useState("Personal Card");
  const [last4, setLast4] = useState("");
  const [expiry, setExpiry] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    return subscribePaymentPreferences(
      user.uid,
      (prefs) => {
        setWallet(prefs.wallet);
        setMethods(prefs.methods);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  async function handleWalletChange(next: "apple" | "google") {
    const user = getCurrentUser();
    if (!user) return;
    setWallet(next);
    await saveWalletPreference(user.uid, next);
  }

  async function handleAddCard() {
    const user = getCurrentUser();
    const digits = last4.replace(/\D/g, "");
    const expiryValue = expiry.trim();
    if (!user) return;
    if (digits.length !== 4 || !/^\d{2}\/\d{2}$/.test(expiryValue)) {
      Alert.alert("Card details", "Enter the last 4 digits and expiry in MM/YY format.");
      return;
    }
    setSaving(true);
    try {
      await addStoredPaymentMethod(user.uid, {
        label: cardLabel.trim() || "Saved Card",
        brand: "Card",
        last4: digits,
        expiry: expiryValue
      });
      setCardLabel("Personal Card");
      setLast4("");
      setExpiry("");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(methodId: string) {
    const user = getCurrentUser();
    if (!user) return;
    await setDefaultPaymentMethod(user.uid, methodId);
  }

  async function handleDelete(method: StoredPaymentMethod) {
    const user = getCurrentUser();
    if (!user) return;
    Alert.alert("Remove card", `Remove card ending in ${method.last4}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => void deleteStoredPaymentMethod(user.uid, method.id) }
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#ff5c00" />
            </Pressable>
            <Text style={styles.title}>Payment Methods</Text>
          </View>
          <View style={styles.securityPill}>
            <MaterialIcons name="security" size={18} color="#a33800" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Saved Cards</Text>
        {loading ? (
          <ActivityIndicator color="#a33800" style={{ marginVertical: 24 }} />
        ) : methods.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="credit-card-off" size={36} color="#dd9f7c" />
            <Text style={styles.emptyTitle}>No saved cards yet</Text>
            <Text style={styles.emptySub}>Add a card reference for faster checkout selection.</Text>
          </View>
        ) : (
          methods.map((method) => (
            <View key={method.id} style={[styles.card, method.isDefault && styles.cardDefault]}>
              <View style={styles.cardTop}>
              <Text style={[styles.cardLabel, method.isDefault && styles.cardLabelDefault]}>{method.label}</Text>
                {method.isDefault ? <Text style={styles.defaultTag}>DEFAULT</Text> : null}
              </View>
              <Text style={[styles.cardNumber, method.isDefault && styles.cardNumberDefault]}>•••• •••• •••• {method.last4}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardMeta, method.isDefault && styles.cardMetaDefault]}>Expiry {method.expiry}</Text>
                <View style={styles.cardActions}>
                  {!method.isDefault ? (
                    <Pressable onPress={() => handleSetDefault(method.id)}>
                    <Text style={[styles.actionText, method.isDefault && styles.actionTextDefault]}>Set Default</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => handleDelete(method)}>
                    <MaterialIcons name="delete" size={18} color="#b31b25" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Add Card Reference</Text>
          <TextInput
            style={styles.input}
            value={cardLabel}
            onChangeText={setCardLabel}
            placeholder="Card label"
            placeholderTextColor="#80503288"
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={last4}
              onChangeText={(v) => setLast4(v.replace(/\D/g, "").slice(0, 4))}
              placeholder="Last 4"
              placeholderTextColor="#80503288"
              keyboardType="number-pad"
              maxLength={4}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={expiry}
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, "").slice(0, 4);
                setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
              }}
              placeholder="MM/YY"
              placeholderTextColor="#80503288"
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
          <Pressable style={[styles.addBtn, saving && { opacity: 0.6 }]} onPress={handleAddCard} disabled={saving}>
            {saving ? <ActivityIndicator color="#ffefeb" /> : <Text style={styles.addBtnText}>Save Card Reference</Text>}
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Digital Wallets</Text>
        <WalletRow
          icon="apple"
          title="Apple Pay"
          sub="Instant and secure"
          selected={wallet === "apple"}
          onPress={() => handleWalletChange("apple")}
        />
        <WalletRow
          icon="google"
          title="Google Pay"
          sub="Fast checkout"
          selected={wallet === "google"}
          onPress={() => handleWalletChange("google")}
        />

        <Text style={styles.sectionTitle}>Other Options</Text>
        <NavOption
          icon="payments"
          title="Cash on Delivery"
          sub="Pay when you receive"
          onPress={() => router.push("/smag_checkout")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function WalletRow(props: {
  icon: "apple" | "google";
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.walletRow} onPress={props.onPress}>
      <View style={styles.walletLeft}>
        <View style={[styles.walletIcon, props.icon === "apple" && styles.walletApple]}>
          <MaterialIcons
            name={props.icon === "apple" ? "apple" : "g-translate"}
            size={22}
            color={props.icon === "apple" ? "#fff" : "#a33800"}
          />
        </View>
        <View>
          <Text style={styles.walletTitle}>{props.title}</Text>
          <Text style={styles.walletSub}>{props.sub}</Text>
        </View>
      </View>
      <View style={[styles.radioOuter, props.selected && styles.radioOuterSelected]}>
        {props.selected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

function NavOption(props: { icon: string; title: string; sub: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.navOption} onPress={props.onPress}>
      <View style={styles.navLeft}>
        <View style={styles.navIconWrap}>
          <MaterialIcons name={props.icon as never} size={20} color="#a33800" />
        </View>
        <View>
          <Text style={styles.navTitle}>{props.title}</Text>
          <Text style={styles.navSub}>{props.sub}</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#a06a4a" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 36, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#4b240a", fontSize: 22, fontWeight: "900" },
  securityPill: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#ffede5", justifyContent: "center", alignItems: "center" },
  sectionTitle: { color: "#4b240a", fontSize: 28, fontWeight: "900", marginTop: 10 },
  emptyCard: { borderRadius: 18, backgroundColor: "#ffffff", padding: 18, alignItems: "center", gap: 6 },
  emptyTitle: { color: "#4b240a", fontSize: 16, fontWeight: "900" },
  emptySub: { color: "#805032", fontSize: 12, textAlign: "center" },
  card: { borderRadius: 22, backgroundColor: "#ffffff", padding: 16 },
  cardDefault: { backgroundColor: "#a33800" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { color: "#4b240a", fontSize: 16, fontWeight: "900" },
  cardLabelDefault: { color: "#ffefeb" },
  defaultTag: { color: "#ffefeb", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  cardNumber: { marginTop: 18, marginBottom: 14, color: "#4b240a", fontSize: 19, fontWeight: "800", letterSpacing: 1 },
  cardNumberDefault: { color: "#ffefeb" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardMeta: { color: "#805032", fontSize: 12, fontWeight: "700" },
  cardMetaDefault: { color: "#ffefebcc" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionText: { color: "#a33800", fontSize: 12, fontWeight: "800" },
  actionTextDefault: { color: "#ffefeb" },
  addCard: { borderRadius: 18, backgroundColor: "#ffede5", padding: 14, gap: 10 },
  addTitle: { color: "#4b240a", fontSize: 17, fontWeight: "900" },
  input: { borderRadius: 14, backgroundColor: "#ffffff", paddingHorizontal: 14, paddingVertical: 12, color: "#4b240a" },
  inputRow: { flexDirection: "row", gap: 10 },
  addBtn: { borderRadius: 999, backgroundColor: "#a33800", minHeight: 50, alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#ffefeb", fontWeight: "900", fontSize: 15 },
  walletRow: { borderRadius: 16, backgroundColor: "#ffffff", padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  walletIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#fff4f0", justifyContent: "center", alignItems: "center" },
  walletApple: { backgroundColor: "#000" },
  walletTitle: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  walletSub: { color: "#805032", fontSize: 12 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#dd9f7c", alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: "#a33800" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#a33800" },
  navOption: { borderRadius: 16, backgroundColor: "#ffede5", padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  navLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  navIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  navTitle: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  navSub: { color: "#805032", fontSize: 12 }
});
