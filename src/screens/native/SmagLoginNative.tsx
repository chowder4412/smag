import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  firebaseSignIn,
  firebaseSignInWithApple,
  firebaseSignInWithGoogleNative,
  getCurrentUser,
  getFirebaseAuthErrorMessage
} from "@/lib/firebase/auth";
import { clearOnboardingPending } from "@/lib/startupState";
import { validateEmail, validatePassword } from "@/lib/validation";
import {
  authenticateWithBiometrics,
  getBiometricEmail,
  getBiometricTypeLabel,
  isBiometricAvailable,
  isBiometricEnabled,
  saveBiometricCredential
} from "@/lib/biometrics";
import { haptics } from "@/lib/haptics";
import { checkRateLimit, recordRateLimitAttempt } from "@/lib/rateLimiter";
import { AppImage } from "@/components/AppImage";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBUkCnpyWiuQ0602VgaZgKndwqJk_xyPvE5ReuWUqTtgJLkw5lDEwuVmXk6cB9cNP5p07RdK9SuYdwoAX3oTmLO7eBMonbv33szGLIzz8RN4QmND5Fi0suCQeTJw7YJ1rZjSFnvvOXu7Swtt4yPk470HBBMfSOYjMwG1CgfT3BMPg3i6IwMMcTB6aAmDuTti12fQ3RFptsaVYmXtKxN87ARIGhXQ-tcj1YQcDt4A8mzPu7-GuNy0XKBqv3MNsEUs4YwuruAI0woMdck";

const googleLogo =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBvEhYOC5W32Izk2zJE57nEEPrYon0NqyVA9WytOw5MuKGafsk3KCW9TZNpPRA2vd_mvx0LCBudj4ed2JUpIRHIJOgHOHLrvPq_kD_9_Dt4WSKoKPMHWfeIlM5hYPQ_djqRpbQ_vnGOcJuZderMGVFkQPdrNSLebfu7r3GMtm0USh4e7a48WKRjmtnkvQm-GOys7Rd-3RE2z0O-7OJ7JR4RtQHIc_RF65D6gOzVrGY74eRdVm1tRwwtkhPrw-gUHaZGX7quQJ1IzIi8";

export function SmagLoginNative() {
  const router = useRouter() as { push: (href: string) => void; replace: (href: string) => void; back: () => void };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | "phone" | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    void (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      setBiometricAvailable(available && enabled);
      if (available && enabled) {
        const savedEmail = await getBiometricEmail();
        if (!savedEmail) return;
        const success = await authenticateWithBiometrics();
        if (!success) return;
        setSocialLoading("phone");
        try {
          const user = getCurrentUser();
          if (user) {
            await haptics.success();
            await clearOnboardingPending();
            router.replace("/smag_home");
          } else {
            setEmail(savedEmail);
            setAuthError("Session expired. Please enter your password.");
          }
        } finally {
          setSocialLoading(null);
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEmailSignIn() {
    const ee = validateEmail(email);
    const pe = validatePassword(password);
    setEmailError(ee);
    setPasswordError(pe);
    setAuthError(null);
    if (ee || pe) return;

    const normalizedEmail = email.trim();
    const rateStatus = await checkRateLimit("login", normalizedEmail);
    if (!rateStatus.allowed) {
      setAuthError(rateStatus.message || `Too many attempts. Try again in ${rateStatus.retryAfterSeconds}s.`);
      void haptics.error();
      return;
    }

    setLoading(true);
    try {
      await firebaseSignIn(normalizedEmail, password);
      await recordRateLimitAttempt("login", normalizedEmail, true);
      setFailCount(0);
      setLockedUntil(null);
      // Prompt user to enable biometrics if device supports it and not yet configured
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      if (available && !enabled && Platform.OS !== "web") {
        const label = await getBiometricTypeLabel();
        Alert.alert(
          `Enable ${label}?`,
          `Would you like to use ${label} for faster sign-in and session unlock? You can also change this anytime in Settings.`,
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Enable",
              onPress: async () => {
                const verified = await authenticateWithBiometrics();
                if (verified) {
                  await saveBiometricCredential(normalizedEmail);
                }
              }
            }
          ]
        );
      }
      await haptics.success();
      await clearOnboardingPending();
      router.replace("/smag_home");
    } catch (error) {
      const postStatus = await recordRateLimitAttempt("login", normalizedEmail, false);
      if (!postStatus.allowed || postStatus.isLocked) {
        setAuthError(postStatus.message || "Too many failed attempts. Please wait before trying again.");
      } else {
        const remainingNote = postStatus.message ? ` (${postStatus.message})` : "";
        setAuthError(`${getFirebaseAuthErrorMessage(error)}${remainingNote}`);
      }
      void haptics.error();
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricSignIn() {
    const savedEmail = await getBiometricEmail();
    if (!savedEmail) return;
    const success = await authenticateWithBiometrics();
    if (!success) return;
    setSocialLoading("phone"); // reuse loading state
    try {
      const user = getCurrentUser();
      if (user) {
        await haptics.success();
        await clearOnboardingPending();
        router.replace("/smag_home");
      } else {
        setEmail(savedEmail);
        setAuthError("Session expired. Please enter your password.");
      }
    } finally {
      setSocialLoading(null);
    }
  }

  async function handleGoogleSignIn() {
    if (Platform.OS !== "web" && Constants.appOwnership === "expo") {
      Alert.alert(
        "Development Build Required",
        "Google Sign-In on mobile requires a development build (npx expo run:android / eas build) or web mode (npx expo start --web). Native Google modules are not supported inside Expo Go."
      );
      return;
    }
    setSocialLoading("google");
    setAuthError(null);
    try {
      await firebaseSignInWithGoogleNative();
      await clearOnboardingPending();
      router.replace("/smag_home");
    } catch (error) {
      setAuthError(getFirebaseAuthErrorMessage(error));
    } finally {
      setSocialLoading(null);
    }
  }

  async function handleAppleSignIn() {
    if (Platform.OS !== "ios") {
      Alert.alert("Apple Sign-In", "Apple sign-in is only available on iOS devices.");
      return;
    }
    setSocialLoading("apple");
    setAuthError(null);
    try {
      const rawNonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ],
        nonce: hashedNonce
      });
      if (credential.identityToken) {
        await firebaseSignInWithApple(credential.identityToken, rawNonce);
        await clearOnboardingPending();
        router.replace("/smag_home");
      }
    } catch (error: unknown) {
      const e = error as { code?: string };
      if (e?.code !== "ERR_REQUEST_CANCELED") {
        setAuthError(getFirebaseAuthErrorMessage(error));
      }
    } finally {
      setSocialLoading(null);
    }
  }

  function handlePhoneSignIn() {
    router.push("/smag_phone_auth");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Hero Section */}
        <View style={styles.heroWrap}>
          <AppImage source={{ uri: heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <Image source={require("../../../assets/smag_logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Content & Form Card */}
        <View style={styles.content}>
          <Text style={styles.title}>
            Experience{"\n"}
            <Text style={styles.titleAccent}>Gourmet</Text> Delivered.
          </Text>
          <Text style={styles.subtitle}>
            Join Smag and explore a curated gallery of the city&apos;s finest culinary creations.
          </Text>

          {/* Email Field */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            placeholder="chef@smag.com"
            placeholderTextColor="#80503299"
            testID="login-email-input"
            style={[styles.input, emailError ? styles.inputError : null]}
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(null); setAuthError(null); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          {/* Password Field */}
          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#80503299"
              testID="login-password-input"
              style={[styles.input, styles.passwordInput, passwordError ? styles.inputError : null]}
              value={password}
              onChangeText={(t) => { setPassword(t); setPasswordError(null); setAuthError(null); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={22} color="#805032" />
            </Pressable>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          {/* Primary Action Button */}
          <Pressable style={styles.primaryButton} onPress={handleEmailSignIn} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? "Signing In..." : "Continue with Email"}</Text>
          </Pressable>

          {/* Create Account Secondary Action Button */}
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/smag_sign_up")}
            accessibilityRole="button"
            accessibilityLabel="Create an Account"
            testID="create-account-button"
          >
            <MaterialIcons name="person-add-alt-1" size={18} color="#a33800" />
            <Text style={styles.secondaryButtonText}>Create an Account</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Sign In */}
          <Pressable
            style={[styles.socialBtn, socialLoading !== null ? { opacity: 0.6 } : {}]}
            onPress={handleGoogleSignIn}
            disabled={socialLoading !== null}
          >
            {socialLoading === "google"
              ? <ActivityIndicator size="small" color="#4b240a" />
              : <AppImage source={{ uri: googleLogo }} style={styles.googleIcon} />}
            <Text style={styles.socialText}>
              {socialLoading === "google" ? "Signing in..." : "Continue with Google"}
            </Text>
          </Pressable>

          {/* Apple Sign In — iOS Only */}
          {Platform.OS === "ios" ? (
            <Pressable
              style={[styles.socialBtn, styles.appleBtn, socialLoading !== null ? { opacity: 0.6 } : {}]}
              onPress={handleAppleSignIn}
              disabled={socialLoading !== null}
            >
              {socialLoading === "apple"
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <MaterialIcons name="apple" size={20} color="#ffffff" />}
              <Text style={[styles.socialText, { color: "#ffffff" }]}>
                {socialLoading === "apple" ? "Signing in..." : "Continue with Apple"}
              </Text>
            </Pressable>
          ) : null}

          {/* Phone Sign In */}
          <Pressable style={styles.socialBtn} onPress={handlePhoneSignIn} disabled={socialLoading !== null}>
            <MaterialIcons name="phone" size={20} color="#a33800" />
            <Text style={styles.socialText}>Continue with Phone</Text>
          </Pressable>

          {/* Forgot Password */}
          <Pressable onPress={() => router.push("/smag_forgot_password")}>
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </Pressable>

          {/* Biometrics Option */}
          {biometricAvailable && (
            <Pressable
              style={styles.biometricBtn}
              onPress={handleBiometricSignIn}
              disabled={socialLoading !== null}
            >
              <MaterialIcons name="fingerprint" size={28} color="#a33800" />
              <Text style={styles.biometricText}>Sign in with Biometrics</Text>
            </Pressable>
          )}

          {/* Footer Link */}
          <Text style={styles.footerText}>
            Don&apos;t have an account?
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/smag_sign_up")}
              accessibilityRole="link"
              accessibilityLabel="Create an Account"
              testID="signup-link"
            >
              {" "}Create an Account
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  scroll: { flexGrow: 1 },
  heroWrap: {
    height: 270,
    position: "relative",
    marginTop: 4,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden"
  },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(163, 56, 0, 0.22)"
  },
  logo: {
    position: "absolute",
    top: 22,
    left: 20,
    width: 100,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 34 },
  title: { color: "#4b240a", fontSize: 34, lineHeight: 40, fontWeight: "900" },
  titleAccent: { color: "#ff5e07", fontStyle: "italic" },
  subtitle: { color: "#805032", marginTop: 8, marginBottom: 20, fontSize: 15, lineHeight: 22 },
  label: { color: "#4b240a", fontSize: 14, marginBottom: 8, fontWeight: "700" },
  input: {
    backgroundColor: "#ffede5",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#4b240a",
    borderWidth: 1,
    borderColor: "rgba(221, 159, 124, 0.35)"
  },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: "absolute", right: 14, top: 14, padding: 4 },
  inputError: { borderWidth: 1.5, borderColor: "#b31b25" },
  errorText: { color: "#b31b25", fontSize: 12, marginTop: 4, marginLeft: 4 },
  primaryButton: {
    marginTop: 18,
    backgroundColor: "#a33800",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#a33800",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4
  },
  primaryButtonText: { color: "#ffefeb", fontWeight: "800", fontSize: 16 },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#a33800",
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#a33800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  secondaryButtonText: { color: "#a33800", fontWeight: "800", fontSize: 15 },
  dividerRow: { marginTop: 22, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(221, 159, 124, 0.35)" },
  dividerText: { color: "#805032", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  socialBtn: {
    marginBottom: 10,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#ffdbc9"
  },
  appleBtn: { backgroundColor: "#000000", borderColor: "#000000" },
  googleIcon: { width: 18, height: 18 },
  socialText: { color: "#4b240a", fontWeight: "700", fontSize: 15 },
  forgotLink: { marginTop: 10, textAlign: "center", color: "#a33800", fontSize: 13, fontWeight: "700" },
  biometricBtn: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ffdbc9",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff"
  },
  biometricText: { color: "#a33800", fontWeight: "700", fontSize: 15 },
  footerText: { marginTop: 22, marginBottom: 12, textAlign: "center", color: "#805032", fontSize: 14 },
  footerLink: { color: "#a33800", fontWeight: "800", textDecorationLine: "underline" }
});
