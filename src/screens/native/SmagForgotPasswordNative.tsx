import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { firebaseSendPasswordReset, getFirebaseAuthErrorMessage } from "@/lib/firebase/auth";
import { validateEmail } from "@/lib/validation";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDmuhfKgmgYXNwUWDXOrXVmrh0BdFsdILlI0yFNIrA9xGWj9ZfDIcUdkpmKGuTblllAQmO7wW3_HZPR39AeHC_tqOKZXLxyv-NqIayTxif27cuyBIXJsjRrjGlC9KKRFKZD2jBwR9KAhSAI9VfiSC9cPHTa-hYt8sSTRiG8JIKaWvAPPzEA_mmZkpK0pzKaj828jZsPLgnLsN_Pap9rbtKsinZ4Jj2MWwTsTJNVoKN_Ckqx71XMhXbEDE9_QC7a87rWgc32liYA_Bdt";

export function SmagForgotPasswordNative() {
  const router = useAppRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendResetLink() {
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await firebaseSendPasswordReset(email.trim());
      router.push("/smag_reset_link_sent");
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.card}>
          <View style={styles.imageWrap}>
            <AppImage source={{ uri: heroImage }} style={styles.image} />
            <View style={styles.imageShade} />
            <MaterialIcons name="lock-reset" size={50} color="#a33800" style={styles.centerIcon} />
          </View>

          <Text style={styles.title}>Forgot{"\n"}Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Text>

          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
            <MaterialIcons name="mail" size={18} color="#a06a4a" />
            <TextInput
              placeholder="chef@gourmetgallery.com"
              placeholderTextColor="#a06a4a99"
              style={styles.input}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.primaryBtn} onPress={handleSendResetLink} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#ffefeb" />
          </Pressable>

          <View style={styles.divider} />
          <Pressable style={styles.backBtn} onPress={() => router.push("/smag_login")}>
            <MaterialIcons name="arrow-back" size={18} color="#a33800" />
            <Text style={styles.backBtnText}>Back to Login</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <MaterialIcons name="verified-user" size={13} color="#c79d85" />
            <Text style={styles.footerText}>SECURE ENCRYPTION</Text>
          </View>
          <Text style={styles.footerDot}>•</Text>
          <View style={styles.footerItem}>
            <MaterialIcons name="privacy-tip" size={13} color="#c79d85" />
            <Text style={styles.footerText}>PRIVACY FIRST</Text>
          </View>
        </View>
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
    paddingTop: 28,
    paddingBottom: 22
  },
  imageWrap: {
    alignSelf: "center",
    width: 130,
    height: 130,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative"
  },
  image: { width: "100%", height: "100%" },
  imageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "#ffffff44" },
  centerIcon: { position: "absolute", alignSelf: "center", top: 40 },
  title: {
    marginTop: 20,
    textAlign: "center",
    color: "#4b240a",
    fontSize: 50,
    lineHeight: 54,
    fontWeight: "900"
  },
  subtitle: {
    marginTop: 14,
    textAlign: "center",
    color: "#805032",
    fontSize: 19,
    lineHeight: 29
  },
  label: {
    marginTop: 24,
    marginLeft: 4,
    color: "#805032",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  inputWrap: {
    marginTop: 10,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  inputWrapError: {
    borderWidth: 1.5,
    borderColor: "#b31b25"
  },
  input: { flex: 1, color: "#4b240a", fontSize: 16 },
  errorText: { marginTop: 4, color: "#b31b25", fontSize: 12, marginLeft: 6 },
  primaryBtn: {
    marginTop: 20,
    borderRadius: 999,
    backgroundColor: "#e25e20",
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primaryBtnText: { color: "#ffefeb", fontSize: 18, fontWeight: "800" },
  divider: {
    marginTop: 22,
    marginBottom: 14,
    height: 1,
    backgroundColor: "#f1d5c6"
  },
  backBtn: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  backBtnText: { color: "#a33800", fontSize: 18, fontWeight: "800" },
  footer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { color: "#c79d85", fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  footerDot: { color: "#c79d85", fontSize: 12 }
});
