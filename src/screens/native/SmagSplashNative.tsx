import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { getLaunchRoute } from "@/lib/startupState";

const logoBadge = require("../../../assets/SMAG_logo_transparent.png");

export interface SmagSplashNativeProps {
  onFinish?: () => void;
  /**
   * If true, keeps the screen mounted without auto-dismissing (useful for testing & previews)
   */
  disableAutoDismiss?: boolean;
}

export function SmagSplashNative({ onFinish, disableAutoDismiss = false }: SmagSplashNativeProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const dismissingRef = useRef(false);

  // 1. Entrance Pop-In Animation (Scale 0.6 -> 1.0, Opacity 0 -> 1)
  const popAnim = useRef(new Animated.Value(0)).current;

  // 2. Continuous Flame Pulse Animation (Scale 1.0 -> 1.06 -> 1.0)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 3. Bottom Progress Bar (0% -> 100% over 2.2s)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 4. Screen Exit Animation (Opacity 1 -> 0, Scale 1 -> 1.02)
  const exitAnim = useRef(new Animated.Value(0)).current;

  const useNative = Platform.OS !== "web";

  const triggerDismiss = () => {
    if (dismissingRef.current) return;
    dismissingRef.current = true;

    setDismissed(true);
    if (onFinish) {
      onFinish();
    } else {
      void getLaunchRoute().then((route) => {
        (router as { replace: (r: string) => void }).replace(route);
      });
    }
  };

  useEffect(() => {
    // 1. Pop-In Entrance
    Animated.spring(popAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: useNative
    }).start();

    // 2. Looping Flame Pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative
        })
      ])
    );
    pulseLoop.start();

    // 3. Progress Bar Fill (2200ms)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false
    }).start();

    // 4. Auto-dismiss after 2500ms if not disabled
    let timer: NodeJS.Timeout | null = null;
    if (!disableAutoDismiss) {
      timer = setTimeout(() => {
        triggerDismiss();
      }, 2500);
    }

    return () => {
      pulseLoop.stop();
      if (timer) clearTimeout(timer);
    };
  }, [disableAutoDismiss, useNative]);

  const popScale = popAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1]
  });

  const exitOpacity = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });

  const exitScale = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03]
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return (
    <View
      testID="smag-splash-container"
      pointerEvents={dismissed ? "none" : "auto"}
      style={styles.container}
    >
      {/* Decorative Ambient Background Elements */}
      <View pointerEvents="none" style={styles.ambientLayer}>
        {/* Steam vapor waves rising above the badge */}
        <View style={styles.steamContainer}>
          <Text style={[styles.steamWave, styles.steamLeft]}>~</Text>
          <Text style={[styles.steamWave, styles.steamCenter]}>~</Text>
          <Text style={[styles.steamWave, styles.steamRight]}>~</Text>
        </View>

        {/* Top-Right Decorative Floating Leaf */}
        <View style={styles.leafTopRight}>
          <View style={styles.leafOuter}>
            <View style={styles.leafInnerStem} />
          </View>
        </View>

        {/* Bottom-Left Decorative Floating Leaf */}
        <View style={styles.leafBottomLeft}>
          <View style={[styles.leafOuter, styles.leafOuterFlipped]}>
            <View style={styles.leafInnerStem} />
          </View>
        </View>

        {/* Translucent Bubbles & Orbs */}
        <View style={styles.bubbleTopLeft} />
        <View style={styles.bubbleBottomRight} />
        <View style={styles.bubbleMini} />

        {/* Subtle Warm Sparkles */}
        <View style={styles.sparkleLeft}>
          <Text style={styles.sparkleChar}>✦</Text>
        </View>
        <View style={styles.sparkleRight}>
          <Text style={styles.sparkleChar}>✦</Text>
        </View>
      </View>

      {/* Centered Animated Brand Badge */}
      <Animated.View
        style={[
          styles.badgeWrapper,
          {
            opacity: popAnim,
            transform: [{ scale: popScale }]
          }
        ]}
      >
        {/* Outer Glow Halo */}
        <View style={styles.glowHalo} />

        {/* Breathing Official Brand Badge Image */}
        <Animated.Image
          source={logoBadge}
          style={[
            styles.brandBadgeImage,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
          resizeMode="contain"
          accessibilityLabel="SMAG chop better"
        />

        {/* Accessible screen-reader & test text */}
        <View style={styles.srOnly}>
          <Text>SMAG</Text>
          <Text>chop better</Text>
        </View>
      </Animated.View>

      {/* Bottom Loading Progress & Continue Button */}
      <View style={styles.bottomSection}>
        {/* Minimalist Progress Indicator */}
        <View style={styles.loaderContainer}>
          <Animated.View
            style={[
              styles.loaderBar,
              {
                width: progressWidth
              }
            ]}
          />
        </View>

        {/* "Continue" Pill Action Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue to app"
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed
          ]}
          onPress={triggerDismiss}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>

        {/* Version Label */}
        <Text style={styles.versionText}>Ver 1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF3EB", // Verified light warm cream/off-white background
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  steamContainer: {
    position: "absolute",
    top: "16%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  steamWave: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(226, 81, 16, 0.25)",
    transform: [{ rotate: "90deg" }]
  },
  steamLeft: {
    transform: [{ rotate: "90deg" }, { scaleY: 0.9 }],
    opacity: 0.7
  },
  steamCenter: {
    transform: [{ rotate: "90deg" }, { scaleY: 1.2 }],
    opacity: 0.9
  },
  steamRight: {
    transform: [{ rotate: "90deg" }, { scaleY: 0.95 }],
    opacity: 0.75
  },
  leafTopRight: {
    position: "absolute",
    top: "22%",
    right: "14%",
    transform: [{ rotate: "35deg" }]
  },
  leafBottomLeft: {
    position: "absolute",
    bottom: "28%",
    left: "12%",
    transform: [{ rotate: "-40deg" }]
  },
  leafOuter: {
    width: 38,
    height: 52,
    borderTopLeftRadius: 38,
    borderBottomRightRadius: 38,
    borderWidth: 2,
    borderColor: "rgba(226, 81, 16, 0.22)",
    backgroundColor: "rgba(226, 81, 16, 0.04)",
    alignItems: "center",
    justifyContent: "center"
  },
  leafOuterFlipped: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 38,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 10
  },
  leafInnerStem: {
    width: 1.5,
    height: "75%",
    backgroundColor: "rgba(226, 81, 16, 0.2)"
  },
  bubbleTopLeft: {
    position: "absolute",
    top: "29%",
    left: "14%",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(226, 81, 16, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.45)"
  },
  bubbleBottomRight: {
    position: "absolute",
    bottom: "29%",
    right: "13%",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(226, 81, 16, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.5)"
  },
  bubbleMini: {
    position: "absolute",
    bottom: "23%",
    left: "26%",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(226, 81, 16, 0.18)"
  },
  sparkleLeft: {
    position: "absolute",
    top: "44%",
    left: "10%"
  },
  sparkleRight: {
    position: "absolute",
    top: "37%",
    right: "9%"
  },
  sparkleChar: {
    fontSize: 20,
    color: "rgba(226, 81, 16, 0.3)"
  },
  badgeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  glowHalo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(226, 81, 16, 0.14)"
  },
  brandBadgeImage: {
    width: 204,
    height: 204,
    shadowColor: "#E25110",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 12
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden"
  },
  brandCircle: {
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: "#FF6F26", // Brand vibrant orange gradient base
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    shadowColor: "#E25110",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 12
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center"
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    lineHeight: 38,
    textShadowColor: "rgba(180, 50, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  tagline: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    opacity: 0.95,
    marginTop: -2
  },
  bottomSection: {
    position: "absolute",
    bottom: 54,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 24
  },
  loaderContainer: {
    width: 130,
    height: 4,
    backgroundColor: "rgba(226, 81, 16, 0.15)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 20
  },
  loaderBar: {
    height: "100%",
    backgroundColor: "#E25110",
    borderRadius: 2
  },
  continueButton: {
    backgroundColor: "#FF6F26",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 36,
    shadowColor: "#E25110",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6
  },
  continueButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }]
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4
  },
  versionText: {
    marginTop: 14,
    color: "rgba(128, 80, 50, 0.65)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4
  }
});

