import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

import { useAppRouter } from "@/lib/useAppRouter";

type Step = "card" | "pin" | "otp" | "processing" | "success";

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export function SmagPaymentNative() {
  const router = useAppRouter();
  const { orderId, amount, email } = useLocalSearchParams<{
    orderId: string;
    amount: string;
    email: string;
  }>();

  const functions = getFunctions(getApp(), "us-central1");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Challenge fields
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeText, setChallengeText] = useState("");

  const [step, setStep] = useState<Step>("card");
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");

  const cvvRef = useRef<TextInput>(null);
  const pinRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);

  const expiryParts = expiry.replace("/", "").padEnd(4, "0");
  const expiryMonth = expiryParts.slice(0, 2);
  const expiryYear = `20${expiryParts.slice(2, 4)}`;

  async function handleChargeCard() {
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 16 || expiry.length < 5 || cvv.length < 3) {
      Alert.alert("Invalid Card", "Please check your card details and try again.");
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      const chargeCard = httpsCallable<object, { status: string; reference: string; displayText: string | null }>(
        functions, "chargeCard"
      );

      const result = await chargeCard({
        orderId,
        email,
        amountKobo: Number(amount) * 100,
        cardNumber: rawCard,
        cvv,
        expiryMonth,
        expiryYear
      });

      setReference(result.data.reference);
      await handleChargeStatus(result.data.status, result.data.displayText);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setStep("card");
      // Cancel the stuck pending_payment order
      void httpsCallable(functions, "cancelPendingOrder")({ orderId }).catch(() => {});
      Alert.alert("Payment Failed", e.message ?? "Card charge failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChargeStatus(status: string, displayText: string | null) {
    switch (status) {
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep("success");
        setTimeout(() => router.replace(`/smag_track_order?orderId=${orderId}`), 1500);
        break;
      case "send_pin":
        setChallengeText(displayText ?? "Enter your card PIN");
        setStep("pin");
        setTimeout(() => pinRef.current?.focus(), 300);
        break;
      case "send_otp":
        setChallengeText(displayText ?? "Enter the OTP sent to your phone");
        setStep("otp");
        setTimeout(() => otpRef.current?.focus(), 300);
        break;
      default:
        setStep("card");
        Alert.alert("Payment Incomplete", displayText ?? "Payment could not be completed.");
    }
  }

  async function handleSubmitChallenge(type: "pin" | "otp") {
    const value = type === "pin" ? pin : otp;
    if (value.length < 4) {
      Alert.alert("Invalid", `Please enter a valid ${type.toUpperCase()}.`);
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      const submitChallenge = httpsCallable<object, { status: string; displayText: string | null }>(
        functions, "submitChargeChallenge"
      );

      const result = await submitChallenge({ reference, type, value });
      await handleChargeStatus(result.data.status, result.data.displayText);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setStep(type === "pin" ? "pin" : "otp");
      Alert.alert("Error", e.message ?? "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#a33800" />
            </Pressable>
            <Text style={styles.headerTitle}>Secure Payment</Text>
            <View style={styles.lockBadge}>
              <MaterialIcons name="lock" size={14} color="#a33800" />
              <Text style={styles.lockText}>SSL</Text>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount to pay</Text>
            <Text style={styles.amountValue}>₦{Number(amount).toLocaleString()}</Text>
            <Text style={styles.amountSub}>Secured by Paystack</Text>
          </View>

          {/* Card Entry */}
          {step === "card" && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Card Details</Text>

              <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#80503299"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>CARD NUMBER</Text>
              <View style={styles.cardNumberWrap}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#80503299"
                  value={cardNumber}
                  onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                  keyboardType="number-pad"
                  maxLength={19}
                  returnKeyType="next"
                  onSubmitEditing={() => cvvRef.current?.focus()}
                />
                <MaterialIcons name="credit-card" size={20} color="#a06a4a" style={{ marginLeft: 8 }} />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>EXPIRY DATE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#80503299"
                    value={expiry}
                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                    keyboardType="number-pad"
                    maxLength={5}
                    returnKeyType="next"
                    onSubmitEditing={() => cvvRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>CVV</Text>
                  <TextInput
                    ref={cvvRef}
                    style={styles.input}
                    placeholder="•••"
                    placeholderTextColor="#80503299"
                    value={cvv}
                    onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    returnKeyType="done"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.payBtn, loading && { opacity: 0.6 }]}
                onPress={handleChargeCard}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#ffefeb" />
                  : <>
                      <MaterialIcons name="lock" size={18} color="#ffefeb" />
                      <Text style={styles.payBtnText}>Pay ₦{Number(amount).toLocaleString()}</Text>
                    </>}
              </Pressable>

              <View style={styles.poweredRow}>
                <MaterialIcons name="security" size={14} color="#805032" />
                <Text style={styles.poweredText}>Powered by Paystack · PCI DSS Compliant</Text>
              </View>
            </View>
          )}

          {/* PIN Entry */}
          {step === "pin" && (
            <View style={styles.formCard}>
              <View style={styles.challengeIcon}>
                <MaterialIcons name="pin" size={32} color="#a33800" />
              </View>
              <Text style={styles.challengeTitle}>Enter Card PIN</Text>
              <Text style={styles.challengeSub}>{challengeText}</Text>
              <TextInput
                ref={pinRef}
                style={[styles.input, styles.otpInput]}
                placeholder="••••"
                placeholderTextColor="#80503299"
                value={pin}
                onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                autoFocus
              />
              <Pressable
                style={[styles.payBtn, (loading || pin.length < 4) && { opacity: 0.6 }]}
                onPress={() => handleSubmitChallenge("pin")}
                disabled={loading || pin.length < 4}
              >
                {loading ? <ActivityIndicator color="#ffefeb" /> : <Text style={styles.payBtnText}>Submit PIN</Text>}
              </Pressable>
            </View>
          )}

          {/* OTP Entry */}
          {step === "otp" && (
            <View style={styles.formCard}>
              <View style={styles.challengeIcon}>
                <MaterialIcons name="sms" size={32} color="#a33800" />
              </View>
              <Text style={styles.challengeTitle}>Enter OTP</Text>
              <Text style={styles.challengeSub}>{challengeText}</Text>
              <TextInput
                ref={otpRef}
                style={[styles.input, styles.otpInput]}
                placeholder="------"
                placeholderTextColor="#80503299"
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <Pressable
                style={[styles.payBtn, (loading || otp.length < 4) && { opacity: 0.6 }]}
                onPress={() => handleSubmitChallenge("otp")}
                disabled={loading || otp.length < 4}
              >
                {loading ? <ActivityIndicator color="#ffefeb" /> : <Text style={styles.payBtnText}>Submit OTP</Text>}
              </Pressable>
            </View>
          )}

          {/* Processing */}
          {step === "processing" && (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="large" color="#a33800" />
              <Text style={styles.processingText}>Processing payment...</Text>
              <Text style={styles.processingSub}>Please do not close the app</Text>
            </View>
          )}

          {/* Success */}
          {step === "success" && (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <MaterialIcons name="check-circle" size={64} color="#a33800" />
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSub}>₦{Number(amount).toLocaleString()} paid</Text>
              <Text style={styles.successSub}>Redirecting to order tracking...</Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#4b240a", fontSize: 18, fontWeight: "900" },
  lockBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ffede5", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  lockText: { color: "#a33800", fontSize: 11, fontWeight: "800" },
  amountCard: {
    backgroundColor: "#a33800", borderRadius: 24, padding: 20,
    alignItems: "center", marginBottom: 16
  },
  amountLabel: { color: "#ffefeb99", fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  amountValue: { color: "#ffefeb", fontSize: 42, fontWeight: "900", marginTop: 4 },
  amountSub: { color: "#ffefeb88", fontSize: 12, marginTop: 4 },
  formCard: { backgroundColor: "#ffffff", borderRadius: 24, padding: 20, gap: 12 },
  formTitle: { color: "#4b240a", fontSize: 22, fontWeight: "900", marginBottom: 4 },
  fieldLabel: { color: "#805032", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: -4 },
  input: {
    backgroundColor: "#ffede5", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: "#4b240a"
  },
  cardNumberWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffede5", borderRadius: 14, paddingRight: 12 },
  row: { flexDirection: "row" },
  payBtn: {
    marginTop: 8, backgroundColor: "#a33800", borderRadius: 999,
    paddingVertical: 18, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8
  },
  payBtnText: { color: "#ffefeb", fontSize: 18, fontWeight: "900" },
  poweredRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 },
  poweredText: { color: "#805032", fontSize: 11 },
  challengeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  challengeTitle: { color: "#4b240a", fontSize: 24, fontWeight: "900", textAlign: "center" },
  challengeSub: { color: "#805032", fontSize: 14, textAlign: "center", lineHeight: 20 },
  otpInput: { textAlign: "center", letterSpacing: 8, fontSize: 24, fontWeight: "900" },
  processingWrap: { alignItems: "center", marginTop: 80, gap: 16 },
  processingText: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  processingSub: { color: "#805032", fontSize: 14 },
  successWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ffede5", alignItems: "center", justifyContent: "center" },
  successTitle: { color: "#4b240a", fontSize: 28, fontWeight: "900" },
  successSub: { color: "#805032", fontSize: 15 }
});
