import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { firebaseSignInWithApple, firebaseSignInWithGoogleNative, firebaseSignUp, getFirebaseAuthErrorMessage } from "@/lib/firebase/auth";
import { useAppRouter } from "@/lib/useAppRouter";
import { saveUserProfileToFirestore } from "@/lib/firebase/firestore";
import { markOnboardingPending } from "@/lib/startupState";
import { updateUserProfile } from "@/lib/userProfile";
import { validateEmail, validateFullName, validatePassword, validatePhone } from "@/lib/validation";
import { AppImage } from "@/components/AppImage";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC9ivU_vw5adNGC69Mys4iXg7IIIj8m7wfAqQZgRHLHS3bdoZR_NU-_4737v4uz3HzTfkRMNtIJo0vLkVfqdPCuhI0HyKSpEyeM-wx6McClZN7pTc1cYbPNM1TOeTVywfKGENFz81Exgm-I8daJ_dhWN4U28TyT6-C6I56NZiRazYXBPVNBBB1tzi2wdYFMKlV1wixy4Ix5C0ikOAZA3NxpsOSr82pU8d1ugTpPoN2gu_zDYpnbYzfdk-RiUneCUeEGvRxeCHav2-PM";
const googleLogo =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDDWTRnAQFbVX8xOqTIejydbbyyNDYvDiu6mKj-aRefLz4c9ccVYs_oGU9aN9bmkQ4XAlZ2k7H4-WqKck4ejUojjdEJJsCfO28n1VpfXNuGW2-s1iBLZJb-ueb9c-QxvN7Jg1wy5DWLrmggem6KwD6u-r7Cg_2uDLC72a4NFxiahlRQ1lY_iEGAJHF5CGzgClunsEt3anFJCa0b8e7q8vYd8vw61xHzg3RtueCJUpK-nWNAv2ZVq3MnBPrRtUro1K9JpJ_eIX42mW5E";

export function SmagSignUpNative() {
  const router = useAppRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  async function completeSignUp() {
    const ne = validateFullName(fullName);
    const ee = validateEmail(email);
    const phe = validatePhone(phone);
    const pe = validatePassword(password);
    setNameError(ne);
    setEmailError(ee);
    setPhoneError(phe);
    setPasswordError(pe);
    setFormError(null);

    if (ne || ee || phe || pe) return;
    if (!acceptedTerms) {
      setFormError("Accept the terms and conditions to continue.");
      return;
    }

    setLoading(true);
    try {
      const user = await firebaseSignUp(email.trim(), password, fullName.trim());
      // Seed Firestore profile immediately so getUserProfile() has data on first load
      await saveUserProfileToFirestore({
        uid: user.uid,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        birthday: "",
        address: "",
        avatarUri: ""
      });
      // Store referral code if provided — onOrderDelivered will process it on first delivery
      if (referralCode.trim()) {
        const { setDoc, doc, getFirestore } = await import("firebase/firestore");
        const { getApp } = await import("firebase/app");
        await setDoc(
          doc(getFirestore(getApp()), "users", user.uid),
          { usedReferralCode: referralCode.trim().toUpperCase() },
          { merge: true }
        );
      }
      await updateUserProfile({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim() });
      await markOnboardingPending();
      router.replace("/smag_welcome");
    } catch (error) {
      setFormError(getFirebaseAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setSocialLoading("google");
    try {
      await firebaseSignInWithGoogleNative();
      await markOnboardingPending();
      router.replace("/smag_welcome");
    } catch (err) { setFormError(getFirebaseAuthErrorMessage(err)); }
    finally { setSocialLoading(null); }
  }

  async function handleAppleSignUp() {
    if (Platform.OS !== "ios") {
      Alert.alert("Apple Sign-Up", "Apple sign-up is only available on iOS devices.");
      return;
    }
    setSocialLoading("apple");
    try {
      const rawNonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce: hashedNonce
      });
      if (credential.identityToken) {
        await firebaseSignInWithApple(credential.identityToken, rawNonce);
        await markOnboardingPending();
        router.replace("/smag_welcome");
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code !== "ERR_REQUEST_CANCELED") setFormError(getFirebaseAuthErrorMessage(err));
    } finally { setSocialLoading(null); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.topIconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color="#ff5e07" />
          </Pressable>
          <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
          <Pressable style={styles.topIconBtn} onPress={() => router.push("/smag_support_help")}>
            <MaterialIcons name="help" size={20} color="#ff5e07" />
          </Pressable>
        </View>

        <View style={styles.heroWrap}>
          <AppImage source={{ uri: heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Join Smag</Text>
            <Text style={styles.heroSub}>Your editorial journey through taste begins here.</Text>
          </View>
        </View>

        <Field
          label="FULL NAME"
          placeholder="Gourmet Enthusiast"
          icon="person"
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            setNameError(null);
            setFormError(null);
          }}
          error={nameError}
        />
        <Field
          label="EMAIL ADDRESS"
          placeholder="hello@smag-gallery.com"
          icon="mail"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setEmailError(null);
            setFormError(null);
          }}
          error={emailError}
          keyboardType="email-address"
        />
        <Field
          label="PHONE NUMBER"
          placeholder="+1 234 567 8900"
          icon="call"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            setPhoneError(null);
            setFormError(null);
          }}
          error={phoneError}
          keyboardType="phone-pad"
        />
        <Field
          label="PASSWORD"
          placeholder="••••••••••••"
          icon="visibility"
          secure
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setPasswordError(null);
            setFormError(null);
          }}
          error={passwordError}
        />

        <Field
          label="REFERRAL CODE (OPTIONAL)"
          placeholder="SMAG-XXXXXX"
          icon="card-giftcard"
          value={referralCode}
          onChangeText={(value) => setReferralCode(value)}
        />

        <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms((value) => !value)}>
          <View style={styles.checkBox}>
            {acceptedTerms ? <MaterialIcons name="check" size={12} color="#a33800" /> : null}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsBold}>Terms and Conditions</Text> and the
            privacy policy of Gourmet Gallery.
          </Text>
        </Pressable>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <Pressable style={styles.primaryBtn} onPress={completeSignUp} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? "Creating Account..." : "Create Account"}</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#ffefeb" />
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          <Pressable
            style={[styles.socialBtn, socialLoading !== null ? { opacity: 0.6 } : {}]}
            onPress={handleGoogleSignUp}
            disabled={socialLoading !== null}
          >
            {socialLoading === "google"
              ? <ActivityIndicator size="small" color="#4b240a" />
              : <AppImage source={{ uri: googleLogo }} style={styles.socialLogo} />}
            <Text style={styles.socialText}>{socialLoading === "google" ? "Signing up..." : "Google"}</Text>
          </Pressable>
          <Pressable
            style={[styles.socialBtn, socialLoading !== null ? { opacity: 0.6 } : {}, Platform.OS !== "ios" ? { opacity: 0.4 } : {}]}
            onPress={handleAppleSignUp}
            disabled={socialLoading !== null}
          >
            {socialLoading === "apple"
              ? <ActivityIndicator size="small" color="#4b240a" />
              : <MaterialIcons name="apple" size={18} color="#4b240a" />}
            <Text style={styles.socialText}>{socialLoading === "apple" ? "Signing up..." : "Apple"}</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Already have an account?
          <Text style={styles.footerLink} onPress={() => router.push("/smag_login")}>
            {" "}
            Log In
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  placeholder: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  secure?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <View style={[styles.inputWrap, props.error ? styles.inputWrapError : null]}>
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor="#d3a189"
          testID={`signup-${props.label.toLowerCase().replace(/\s+/g, "-")}`}
          style={styles.input}
          secureTextEntry={props.secure}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={props.keyboardType ?? "default"}
        />
        <MaterialIcons name={props.icon} size={18} color="#d3a189" />
      </View>
      {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  topBar: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  topIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  brand: { width: 80, height: 36 },
  heroWrap: { borderRadius: 26, overflow: "hidden", marginBottom: 16 },
  heroImage: { width: "100%", height: 168 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#4b240a20" },
  heroCard: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 10,
    borderRadius: 24,
    backgroundColor: "#ffede5",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  heroTitle: { color: "#4b240a", fontSize: 43, lineHeight: 46, fontWeight: "900" },
  heroSub: { marginTop: 2, color: "#805032", fontSize: 16, lineHeight: 22 },
  fieldWrap: { marginTop: 8 },
  fieldLabel: {
    marginBottom: 8,
    marginLeft: 4,
    color: "#a06a4a",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#ffede5",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: { flex: 1, color: "#4b240a", fontSize: 16, paddingVertical: 12 },
  inputWrapError: { borderWidth: 1.5, borderColor: "#b31b25" },
  errorText: { color: "#b31b25", fontSize: 12, marginTop: 3, marginLeft: 4 },
  termsRow: { marginTop: 14, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  checkBox: {
    marginTop: 2,
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#dd9f7c",
    alignItems: "center",
    justifyContent: "center"
  },
  termsText: { flex: 1, color: "#805032", fontSize: 14, lineHeight: 22 },
  termsBold: { color: "#a33800", fontWeight: "800" },
  primaryBtn: {
    marginTop: 18,
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: "#e25e20",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primaryText: { color: "#ffefeb", fontSize: 20, fontWeight: "800" },
  dividerRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  divider: { flex: 1, height: 1, backgroundColor: "#e7c5b5" },
  dividerText: { color: "#a06a4a", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  socialRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  socialBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  socialLogo: { width: 17, height: 17 },
  socialText: { color: "#4b240a", fontSize: 16, fontWeight: "800" },
  footerText: { marginTop: 16, textAlign: "center", color: "#805032", fontSize: 16 },
  footerLink: { color: "#a33800", fontWeight: "800" }
});
