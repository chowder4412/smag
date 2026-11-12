import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppImage } from "@/components/AppImage";
import { auth } from "@/lib/firebase/auth";
import { getUserProfile, type UserProfile } from "@/lib/userProfile";
import { isBiometricAvailable, isBiometricEnabled } from "@/lib/biometrics";
import {
  isSessionLocked,
  signOutAndExitSession,
  subscribeSessionLock,
  unlockSessionWithBiometrics,
  unlockSessionWithPassword
} from "@/lib/sessionSecurity";
import { checkRateLimit } from "@/lib/rateLimiter";
import { useAppRouter } from "@/lib/useAppRouter";

export function SessionLockOverlay() {
  const router = useAppRouter();
  const [locked, setLocked] = useState(isSessionLocked());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBiometricReady, setIsBiometricReady] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return subscribeSessionLock((isLocked) => {
      setLocked(isLocked);
      if (isLocked) {
        setPassword("");
        setErrorMessage(null);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== "web"
        }).start();

        // Load profile and check biometrics
        void getUserProfile().then((p) => setProfile(p));
        void Promise.all([isBiometricAvailable(), isBiometricEnabled()]).then(
          ([avail, enabled]) => {
            const canBio = avail && enabled;
            setIsBiometricReady(canBio);
            if (canBio) {
              // Automatically trigger biometrics once on session lock display
              void handleBiometricUnlock();
            }
          }
        );

        // Check if under lockout
        const user = auth.currentUser;
        if (user) {
          void checkRateLimit("session_unlock", user.uid).then((status) => {
            if (!status.allowed && status.retryAfterSeconds > 0) {
              setCooldownSeconds(status.retryAfterSeconds);
              setErrorMessage(status.message || "Account temporarily locked.");
            }
          });
        }
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== "web"
        }).start();
      }
    });
  }, [fadeAnim]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  async function handlePasswordUnlock() {
    if (!password.trim()) {
      setErrorMessage("Enter your password to unlock.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await unlockSessionWithPassword(password.trim());
      if (!res.success) {
        setErrorMessage(res.message || "Incorrect password. Please try again.");
        if (res.isLockedOut) {
          const user = auth.currentUser;
          if (user) {
            const status = await checkRateLimit("session_unlock", user.uid);
            if (status.retryAfterSeconds > 0) {
              setCooldownSeconds(status.retryAfterSeconds);
            }
          }
        }
      } else {
        setPassword("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricUnlock() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await unlockSessionWithBiometrics();
      if (!res.success && res.message && !res.message.includes("cancelled")) {
        setErrorMessage(res.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOutAndExitSession(() => {
      router.replace("/smag_login");
    });
  }

  if (!locked) return null;

  const currentUser = auth.currentUser;
  const displayName = profile?.fullName || currentUser?.displayName || "Gourmet Guest";
  const userEmail = profile?.email || currentUser?.email || "";
  const avatarUri = profile?.avatarUri || currentUser?.photoURL || "";

  return (
    <Modal
      visible={locked}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header Lock Shield Badge */}
              <View style={styles.badgeWrap}>
                <View style={styles.lockBadgeCircle}>
                  <MaterialIcons name="lock" size={28} color="#ffffff" />
                </View>
                <Image
                  source={require("../../../assets/SMAG_logo_transparent.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>

              {/* Title & Security Notice */}
              <Text style={styles.title}>Session Locked</Text>
              <Text style={styles.subtitle}>
                You were away for a moment. For your security, please verify your credentials to continue.
              </Text>

              {/* User Profile Summary Card */}
              <View style={styles.userCard}>
                {avatarUri ? (
                  <AppImage source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {displayName.charAt(0).toUpperCase() || "S"}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {userEmail ? (
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {userEmail}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Error / Cooldown Banner */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={18} color="#b31b25" />
                  <Text style={styles.errorText}>
                    {cooldownSeconds > 0
                      ? `Locked out. Retry in ${cooldownSeconds}s.`
                      : errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* Password Input */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={[styles.inputRow, errorMessage ? styles.inputRowError : null]}>
                  <MaterialIcons name="lock-outline" size={20} color="#a06a4a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#a06a4a99"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setErrorMessage(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading && cooldownSeconds === 0}
                    onSubmitEditing={handlePasswordUnlock}
                    testID="session-lock-password-input"
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color="#805032"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Unlock Action Button */}
              <Pressable
                style={[
                  styles.primaryBtn,
                  (loading || cooldownSeconds > 0) && styles.primaryBtnDisabled
                ]}
                onPress={handlePasswordUnlock}
                disabled={loading || cooldownSeconds > 0}
                accessibilityRole="button"
                accessibilityLabel="Unlock Session"
                testID="session-lock-unlock-btn"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons name="lock-open" size={18} color="#ffffff" />
                    <Text style={styles.primaryBtnText}>
                      {cooldownSeconds > 0 ? `Wait (${cooldownSeconds}s)` : "Unlock Session"}
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Biometric Unlock Option */}
              {isBiometricReady && cooldownSeconds === 0 ? (
                <Pressable
                  style={styles.biometricBtn}
                  onPress={handleBiometricUnlock}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Unlock with Biometrics"
                  testID="session-lock-biometric-btn"
                >
                  <MaterialIcons name="fingerprint" size={22} color="#a33800" />
                  <Text style={styles.biometricBtnText}>Unlock with Biometrics</Text>
                </Pressable>
              ) : null}

              {/* Switch Account / Sign Out Link */}
              <Pressable
                style={styles.switchAccountBtn}
                onPress={handleSignOut}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign Out or Switch Account"
                testID="session-lock-signout-btn"
              >
                <Text style={styles.switchAccountText}>
                  Not you? <Text style={styles.switchAccountLink}>Sign Out / Switch Account</Text>
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(35, 17, 8, 0.95)",
    zIndex: 99999
  },
  safe: {
    flex: 1
  },
  keyboardAvoid: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  badgeWrap: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative"
  },
  brandLogo: {
    width: 90,
    height: 90
  },
  lockBadgeCircle: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e25110",
    borderWidth: 3,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4
  },
  title: {
    color: "#fff4f0",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5
  },
  subtitle: {
    color: "#e2c0b0",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 24
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(255, 243, 235, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 219, 201, 0.25)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    gap: 12
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#e25110"
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e25110",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800"
  },
  userInfo: {
    flex: 1
  },
  userName: {
    color: "#fff4f0",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2
  },
  userEmail: {
    color: "#e2c0b0",
    fontSize: 13
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffe8e8",
    borderWidth: 1,
    borderColor: "#f5a5a5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16
  },
  errorText: {
    color: "#b31b25",
    fontSize: 13,
    fontWeight: "600",
    flex: 1
  },
  fieldWrap: {
    width: "100%",
    maxWidth: 360,
    marginBottom: 18
  },
  fieldLabel: {
    color: "#e2c0b0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
    marginLeft: 4
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#ffdbc9",
    paddingHorizontal: 14,
    height: 52
  },
  inputRowError: {
    borderColor: "#b31b25"
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    color: "#2b1b15",
    fontSize: 15,
    fontWeight: "600"
  },
  eyeBtn: {
    padding: 6
  },
  primaryBtn: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#e25110",
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#e25110",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  primaryBtnDisabled: {
    backgroundColor: "#8a5843",
    shadowOpacity: 0,
    elevation: 0
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  biometricBtn: {
    marginTop: 12,
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  biometricBtnText: {
    color: "#a33800",
    fontSize: 15,
    fontWeight: "800"
  },
  switchAccountBtn: {
    marginTop: 22,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  switchAccountText: {
    color: "#e2c0b0",
    fontSize: 13,
    textAlign: "center"
  },
  switchAccountLink: {
    color: "#ff8447",
    fontWeight: "800",
    textDecorationLine: "underline"
  }
});
