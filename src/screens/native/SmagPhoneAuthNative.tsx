import { MaterialIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { firebaseVerifyPhoneOtp, getFirebaseAuthErrorMessage } from "@/lib/firebase/auth";
import { clearOnboardingPending } from "@/lib/startupState";
import { useAppRouter } from "@/lib/useAppRouter";
import { auth } from "@/lib/firebase/auth";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";

export function SmagPhoneAuthNative() {
  const router = useAppRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [verificationId, setVerificationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<TextInput>(null);

  async function sendOtp() {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 7) {
      setError("Enter a valid phone number with country code e.g. +234 801 234 5678");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Use PhoneAuthProvider directly — no reCAPTCHA widget needed on native
      const provider = new PhoneAuthProvider(auth);
      // On native, verifyPhoneNumber triggers SMS automatically via Firebase
      const vid = await provider.verifyPhoneNumber(trimmed, { type: "recaptcha" } as never);
      setVerificationId(vid);
      setStep("otp");
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.trim().length < 4) {
      setError("Enter the OTP code sent to your phone.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await firebaseVerifyPhoneOtp(verificationId, otp.trim());
      await clearOnboardingPending();
      router.replace("/smag_home");
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={22} color="#a33800" />
        </Pressable>
        <Text style={styles.headerTitle}>Phone Sign-In</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="phone" size={40} color="#a33800" />
        </View>

        {step === "phone" ? (
          <>
            <Text style={styles.title}>Enter your phone number</Text>
            <Text style={styles.subtitle}>
              We'll send a one-time code to verify your number.
            </Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="+234 801 234 5678"
              placeholderTextColor="#80503299"
              value={phone}
              onChangeText={(t) => { setPhone(t); setError(null); }}
              keyboardType="phone-pad"
              autoFocus
              accessibilityLabel="Phone number input"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={sendOtp}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Send OTP"
            >
              {loading
                ? <ActivityIndicator color="#ffefeb" />
                : <Text style={styles.primaryBtnText}>Send OTP</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter the OTP</Text>
            <Text style={styles.subtitle}>
              Code sent to {phone}. Check your messages.
            </Text>
            <TextInput
              ref={otpRef}
              style={[styles.input, styles.otpInput, error ? styles.inputError : null]}
              placeholder="------"
              placeholderTextColor="#80503299"
              value={otp}
              onChangeText={(t) => { setOtp(t.replace(/\D/g, "").slice(0, 6)); setError(null); }}
              keyboardType="number-pad"
              maxLength={6}
              accessibilityLabel="OTP code input"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={verifyOtp}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Verify and sign in"
            >
              {loading
                ? <ActivityIndicator color="#ffefeb" />
                : <Text style={styles.primaryBtnText}>Verify & Sign In</Text>}
            </Pressable>
            <Pressable
              style={styles.resendBtn}
              onPress={() => { setStep("phone"); setOtp(""); setError(null); }}
              accessibilityRole="button"
              accessibilityLabel="Change number or resend OTP"
            >
              <Text style={styles.resendText}>Change number or resend</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center"
  },
  headerTitle: { color: "#4b240a", fontSize: 18, fontWeight: "900" },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 20 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 24
  },
  title: { color: "#4b240a", fontSize: 26, fontWeight: "900", textAlign: "center" },
  subtitle: { color: "#805032", fontSize: 15, textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 22 },
  input: {
    backgroundColor: "#ffede5", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 18, color: "#4b240a"
  },
  otpInput: { textAlign: "center", letterSpacing: 8, fontSize: 24, fontWeight: "900" },
  inputError: { borderWidth: 1.5, borderColor: "#b31b25" },
  errorText: { color: "#b31b25", fontSize: 13, marginTop: 6, textAlign: "center" },
  primaryBtn: {
    marginTop: 18, backgroundColor: "#a33800",
    borderRadius: 999, paddingVertical: 16, alignItems: "center"
  },
  primaryBtnText: { color: "#ffefeb", fontWeight: "800", fontSize: 17 },
  resendBtn: { marginTop: 14, alignItems: "center" },
  resendText: { color: "#a33800", fontWeight: "700", fontSize: 14 }
});
