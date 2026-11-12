import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";
import { firebaseUpdatePassword, getCurrentUser, getFirebaseAuthErrorMessage } from "@/lib/firebase/auth";
import { validatePassword } from "@/lib/validation";
import { checkRateLimit, recordRateLimitAttempt } from "@/lib/rateLimiter";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuClabG9xn7-NLjp83gp9Da86YPZN2m7irL4MiPLQAqUrD9rXBtTBF0QvyhuxYYXf2IO283FzmJre7eIFSEu4fXXJuDyQAIKLamLqIRiOMn_KOX9bqQKm_SeMUM-_T-OjCGIMVp6CRffvwyZAB0q2QOR5bcZWwgy-ivCKE1PkUQ0iX7mjqgHuwFBDXzmvIz2qLawm-35vuI74k0OYoLH-3D15aUc2h3eVrTOs2MRzDc3bA1zSqvdzIz-lsMqr-7guUmGnzcow7aXXkXS";

export function SmagChangePasswordNative() {
  const router = useAppRouter();
  const [current, setCurrent] = useState("");
  const [nextPass, setNextPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleUpdatePassword() {
    setError(null);
    const passwordError = validatePassword(nextPass);
    if (!current) {
      setError("Enter your current password.");
      return;
    }
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (nextPass !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (current === nextPass) {
      setError("Choose a new password that is different from your current password.");
      return;
    }

    const user = getCurrentUser();
    const rateIdentifier = user?.email || "current_user";
    const rateStatus = await checkRateLimit("change_password", rateIdentifier);
    if (!rateStatus.allowed) {
      setError(rateStatus.message || "Too many password change attempts. Please wait.");
      return;
    }

    setSaving(true);
    try {
      await firebaseUpdatePassword(current, nextPass);
      await recordRateLimitAttempt("change_password", rateIdentifier, true);
      Alert.alert("Password updated", "Your password has been changed successfully.", [
        { text: "OK", onPress: () => router.replace("/smag_settings") }
      ]);
    } catch (err) {
      const postStatus = await recordRateLimitAttempt("change_password", rateIdentifier, false);
      if (!postStatus.allowed || postStatus.isLocked) {
        setError(postStatus.message || "Too many attempts. Please wait before trying again.");
      } else {
        setError(getFirebaseAuthErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#a33800" />
            </Pressable>
            <Text style={styles.title}>Change Password</Text>
          </View>
        </View>

        <View style={styles.heroWrap}>
          <AppImage source={{ uri: heroImage }} style={styles.heroImage} />
          <View style={styles.heroFade} />
        </View>

        <Field
          label="Current Password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry={!showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
        />
        <Field
          label="New Password"
          value={nextPass}
          onChangeText={setNextPass}
          secureTextEntry={!showNext}
          onToggle={() => setShowNext((v) => !v)}
        />
        <Field
          label="Confirm New Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
        />

        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={18} color="#a33800" />
          <Text style={styles.infoText}>
            At least 8 characters, include a number and a symbol to keep your
            account safe and secure.
          </Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={[styles.updateBtn, saving && { opacity: 0.6 }]} onPress={handleUpdatePassword} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#ffefeb" />
          ) : (
            <>
              <Text style={styles.updateText}>Update Password</Text>
              <MaterialIcons name="lock-reset" size={18} color="#ffefeb" />
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          secureTextEntry={props.secureTextEntry}
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#80503288"
        />
        <Pressable onPress={props.onToggle}>
          <MaterialIcons
            name={props.secureTextEntry ? "visibility" : "visibility-off"}
            size={18}
            color="#805032aa"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 36, gap: 12 },
  header: { marginBottom: 4 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#a33800", fontSize: 24, fontWeight: "900" },
  heroWrap: { height: 160, borderRadius: 20, overflow: "hidden", marginBottom: 6 },
  heroImage: { width: "100%", height: "100%" },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,244,240,0.25)"
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { color: "#805032", fontWeight: "700", fontSize: 13 },
  inputWrap: {
    borderRadius: 14,
    backgroundColor: "#ffede5",
    minHeight: 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: { flex: 1, color: "#4b240a", fontSize: 15 },
  infoBox: {
    borderRadius: 16,
    backgroundColor: "#ffe3d4",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  infoText: { flex: 1, color: "#805032", fontSize: 12, lineHeight: 17 },
  errorText: { color: "#b31b25", fontSize: 13, fontWeight: "700", textAlign: "center" },
  updateBtn: {
    marginTop: 4,
    borderRadius: 999,
    minHeight: 54,
    backgroundColor: "#a33800",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },
  updateText: { color: "#ffefeb", fontSize: 17, fontWeight: "900" }
});
