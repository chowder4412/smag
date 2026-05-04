import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppRouter } from "@/lib/useAppRouter";

export function SmagResetLinkSentNative() {
  const router = useAppRouter();
  const [resentCount, setResentCount] = useState(0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.card}>
          <View style={styles.iconShell}>
            <View style={styles.iconInner}>
              <MaterialIcons name="mark-email-unread" size={52} color="#a33800" />
            </View>
            <View style={styles.checkBubble}>
              <MaterialIcons name="check" size={22} color="#ffefeb" />
            </View>
          </View>

          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent a password reset link to your email address. Please check your inbox
            and follow the instructions.
          </Text>

          <Pressable style={styles.primaryBtn} onPress={() => router.push("/smag_login")}>
            <Text style={styles.primaryText}>Back to Login</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#ffefeb" />
          </Pressable>

          <Text style={styles.helper}>Didn&apos;t receive the email?</Text>
          <Pressable style={styles.resendBtn} onPress={() => setResentCount((value) => value + 1)}>
            <MaterialIcons name="refresh" size={17} color="#a33800" />
            <Text style={styles.resendText}>{resentCount > 0 ? "Link Resent" : "Resend Link"}</Text>
          </Pressable>

          <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
        </View>

        <Pressable style={styles.supportWrap} onPress={() => router.push("/smag_support_help")}>
          <Text style={styles.supportText}>Contact Support</Text>
          <MaterialIcons name="help-outline" size={14} color="#805032" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  page: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  card: {
    backgroundColor: "#ffede5",
    borderRadius: 34,
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: "center"
  },
  iconShell: { width: 145, height: 145, alignItems: "center", justifyContent: "center" },
  iconInner: {
    width: 112,
    height: 112,
    borderRadius: 34,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  checkBubble: {
    position: "absolute",
    right: 12,
    bottom: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e25e20",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    marginTop: 12,
    color: "#4b240a",
    fontSize: 50,
    lineHeight: 54,
    fontWeight: "900",
    textAlign: "center"
  },
  subtitle: {
    marginTop: 12,
    color: "#805032",
    textAlign: "center",
    fontSize: 18,
    lineHeight: 30,
    paddingHorizontal: 4
  },
  primaryBtn: {
    marginTop: 24,
    width: "100%",
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: "#e25e20",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primaryText: { color: "#ffefeb", fontSize: 18, fontWeight: "800" },
  helper: { marginTop: 16, color: "#805032", fontSize: 15 },
  resendBtn: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  resendText: { color: "#a33800", fontSize: 21, fontWeight: "800" },
  brand: { marginTop: 22, width: 100, height: 44, opacity: 0.4 },
  supportWrap: {
    marginTop: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  supportText: { color: "#805032", fontSize: 17, fontWeight: "700" }
});
