import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppRouter } from "@/lib/useAppRouter";

export function SmagPaymentMethodsNative() {
  const router = useAppRouter();
  const [wallet, setWallet] = useState<"apple" | "google">("google");
  const [secondaryLast4, setSecondaryLast4] = useState("8812");
  const [defaultCard, setDefaultCard] = useState("4242");

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

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Saved Cards</Text>
          <Pressable onPress={() => router.push("/smag_support_help")}>
            <Text style={styles.sectionLink}>Edit All</Text>
          </Pressable>
        </View>

        <Pressable style={styles.cardPrimary} onPress={() => setDefaultCard("4242")}>
          {defaultCard === "4242" ? (
            <View style={styles.defaultTag}>
              <Text style={styles.defaultText}>DEFAULT</Text>
            </View>
          ) : null}
          <Text style={styles.cardNumber}>•••• •••• •••• 4242</Text>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardLabel}>Expiry Date</Text>
              <Text style={styles.cardValue}>12/26</Text>
            </View>
            <MaterialIcons name="credit-card" size={24} color="#ffefebaa" />
          </View>
        </Pressable>

        <Pressable style={styles.cardSecondary} onPress={() => setDefaultCard(secondaryLast4)}>
          <Text style={styles.setDefault}>{defaultCard === secondaryLast4 ? "DEFAULT" : "Set as Default"}</Text>
          <Text style={styles.cardNumberSecondary}>•••• •••• •••• {secondaryLast4}</Text>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardLabelSecondary}>Expiry Date</Text>
              <Text style={styles.cardValueSecondary}>09/25</Text>
            </View>
            <MaterialIcons name="credit-card" size={24} color="#a3380035" />
          </View>
        </Pressable>

        <Pressable
          style={styles.addCardBtn}
          onPress={() => {
            const randomLast4 = Math.floor(1000 + Math.random() * 9000).toString();
            setSecondaryLast4(randomLast4);
            setDefaultCard(randomLast4);
          }}
        >
          <View style={styles.addCircle}>
            <MaterialIcons name="add" size={20} color="#a33800" />
          </View>
          <Text style={styles.addCardText}>Add New Card</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Digital Wallets</Text>
        <WalletRow
          icon="apple"
          title="Apple Pay"
          sub="Instant and Secure"
          selected={wallet === "apple"}
          onPress={() => setWallet("apple")}
        />
        <WalletRow
          icon="google"
          title="Google Pay"
          sub="Fast checkout"
          selected={wallet === "google"}
          onPress={() => setWallet("google")}
        />

        <Text style={styles.sectionTitle}>Other Options</Text>
        <NavOption
          icon="payments"
          title="Cash on Delivery"
          sub="Pay when you receive"
          onPress={() => router.push("/smag_checkout")}
        />
        <NavOption
          icon="account-balance"
          title="Net Banking"
          sub="All major banks supported"
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#4b240a", fontSize: 22, fontWeight: "900" },
  securityPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffede5",
    justifyContent: "center",
    alignItems: "center"
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  sectionTitle: { color: "#4b240a", fontSize: 28, fontWeight: "900", marginTop: 10 },
  sectionLink: { color: "#a33800", fontWeight: "700" },
  cardPrimary: {
    borderRadius: 24,
    backgroundColor: "#a33800",
    padding: 16
  },
  defaultTag: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#ffffff30"
  },
  defaultText: { color: "#ffefeb", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  cardNumber: {
    marginTop: 18,
    marginBottom: 14,
    color: "#ffefeb",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1
  },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { color: "#ffefeb99", fontSize: 11, fontWeight: "700" },
  cardValue: { color: "#ffefeb", fontWeight: "800" },
  cardSecondary: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 16
  },
  setDefault: { color: "#8f3000", fontWeight: "700", fontSize: 12 },
  cardNumberSecondary: {
    marginTop: 18,
    marginBottom: 14,
    color: "#4b240a",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1
  },
  cardLabelSecondary: { color: "#805032", fontSize: 11, fontWeight: "700" },
  cardValueSecondary: { color: "#4b240a", fontWeight: "800" },
  addCardBtn: {
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#dd9f7c88",
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  addCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffdbc9",
    justifyContent: "center",
    alignItems: "center"
  },
  addCardText: { color: "#805032", fontSize: 16, fontWeight: "800" },
  walletRow: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  walletLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  walletIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#fff4f0",
    justifyContent: "center",
    alignItems: "center"
  },
  walletApple: { backgroundColor: "#000" },
  walletTitle: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  walletSub: { color: "#805032", fontSize: 12 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#dd9f7c",
    alignItems: "center",
    justifyContent: "center"
  },
  radioOuterSelected: { borderColor: "#a33800" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#a33800" },
  navOption: {
    borderRadius: 16,
    backgroundColor: "#ffede5",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  navLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center"
  },
  navTitle: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  navSub: { color: "#805032", fontSize: 12 }
});
