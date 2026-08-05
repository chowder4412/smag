import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { getLaunchRoute } from "@/lib/startupState";

const logo = require("../assets/smag_logo.png");

const MIN_ANIMATION_MS = 1350;

// Try to safely load Reanimated if native C++ JSI module is bound
let Reanimated: typeof import("react-native-reanimated") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReanimatedModule = require("react-native-reanimated");
  if (ReanimatedModule && ReanimatedModule.useSharedValue) {
    Reanimated = ReanimatedModule;
  }
} catch {
  Reanimated = null;
}

export default function IndexRoute() {
  const router = useRouter() as { replace: (href: string) => void };
  const [launchRoute, setLaunchRoute] = useState<string | null>(null);

  // Fallback / Built-in Native Driver Animated Value (0 -> 1)
  const animProgress = useRef(new Animated.Value(0)).current;

  // Reanimated Shared Values (if native JSI available)
  const logoScale = Reanimated?.useSharedValue ? Reanimated.useSharedValue(0.72) : null;
  const logoOpacity = Reanimated?.useSharedValue ? Reanimated.useSharedValue(0) : null;
  const glowScale = Reanimated?.useSharedValue ? Reanimated.useSharedValue(0.75) : null;
  const glowOpacity = Reanimated?.useSharedValue ? Reanimated.useSharedValue(0) : null;
  const textOpacity = Reanimated?.useSharedValue ? Reanimated.useSharedValue(0) : null;
  const textTranslateY = Reanimated?.useSharedValue ? Reanimated.useSharedValue(14) : null;

  useEffect(() => {
    if (Reanimated && logoScale && logoOpacity && glowScale && glowOpacity && textOpacity && textTranslateY) {
      try {
        const { withTiming, withDelay, Easing: ReEasing, ReduceMotion } = Reanimated;

        // 1. Primary timing animation for logo scale and opacity using requested configuration
        logoScale.value = withTiming(1, {
          duration: 1000,
          easing: ReEasing.inOut(ReEasing.quad),
          reduceMotion: ReduceMotion?.System
        });

        logoOpacity.value = withTiming(1, {
          duration: 1000,
          easing: ReEasing.inOut(ReEasing.quad),
          reduceMotion: ReduceMotion?.System
        });

        // 2. Ambient food-app background glow animation
        glowScale.value = withTiming(1.1, {
          duration: 1000,
          easing: ReEasing.inOut(ReEasing.quad),
          reduceMotion: ReduceMotion?.System
        });

        glowOpacity.value = withTiming(0.65, {
          duration: 1000,
          easing: ReEasing.inOut(ReEasing.quad),
          reduceMotion: ReduceMotion?.System
        });

        // 3. Staggered entrance for brand text and tagline
        textOpacity.value = withDelay(
          280,
          withTiming(1, {
            duration: 720,
            easing: ReEasing.inOut(ReEasing.quad),
            reduceMotion: ReduceMotion?.System
          })
        );

        textTranslateY.value = withDelay(
          280,
          withTiming(0, {
            duration: 720,
            easing: ReEasing.inOut(ReEasing.quad),
            reduceMotion: ReduceMotion?.System
          })
        );
      } catch {
        // Fallback to Native Driver Animated
        Animated.timing(animProgress, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }).start();
      }
    } else {
      // Native Driver Animated Timing (1000ms duration, Easing.inOut(quad))
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      }).start();
    }

    // Resolve destination route simultaneously
    let active = true;
    void (async () => {
      const [route] = await Promise.all([
        getLaunchRoute(),
        new Promise((resolve) => setTimeout(resolve, MIN_ANIMATION_MS))
      ]);

      if (active) {
        setLaunchRoute(route);
      }
    })();

    return () => {
      active = false;
    };
  }, [animProgress, glowOpacity, glowScale, logoOpacity, logoScale, textOpacity, textTranslateY]);

  // Navigate when launch route and animation are ready
  useEffect(() => {
    if (launchRoute) {
      router.replace(launchRoute);
    }
  }, [launchRoute, router]);

  // Interpolated Styles for fallback
  const fallbackLogoScale = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1]
  });

  const fallbackLogoOpacity = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const fallbackGlowScale = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1.1]
  });

  const fallbackGlowOpacity = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65]
  });

  const fallbackTextOpacity = animProgress.interpolate({
    inputRange: [0, 0.28, 1],
    outputRange: [0, 0, 1]
  });

  const fallbackTextTranslateY = animProgress.interpolate({
    inputRange: [0, 0.28, 1],
    outputRange: [14, 14, 0]
  });

  const isReanimatedAvailable = Boolean(Reanimated && logoScale && logoOpacity);

  // If Reanimated hook is active
  if (isReanimatedAvailable && Reanimated && logoScale && logoOpacity && glowScale && glowOpacity && textOpacity && textTranslateY) {
    const ReanimatedView = Reanimated.default?.View ?? View;
    const ReanimatedImage = Reanimated.default?.Image ?? Animated.Image;

    return (
      <View style={styles.screen}>
        <View style={styles.logoWrapper}>
          {/* Ambient food-app background glow */}
          <ReanimatedView
            style={[
              styles.glowRing,
              {
                opacity: glowOpacity.value,
                transform: [{ scale: glowScale.value }]
              }
            ]}
          />

          {/* Animated Smag Logo */}
          <ReanimatedImage
            source={logo}
            style={[
              styles.logo,
              {
                opacity: logoOpacity.value,
                transform: [{ scale: logoScale.value }]
              }
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Brand & Tagline */}
        <ReanimatedView
          style={[
            styles.brandContainer,
            {
              opacity: textOpacity.value,
              transform: [{ translateY: textTranslateY.value }]
            }
          ]}
        >
          <Text style={styles.brandTitle}>Smag</Text>
          <Text style={styles.brandTagline}>Delicious Food, Delivered Fast</Text>
        </ReanimatedView>
      </View>
    );
  }

  // Fallback rendering
  return (
    <View style={styles.screen}>
      <View style={styles.logoWrapper}>
        {/* Ambient food-app background glow */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: fallbackGlowOpacity,
              transform: [{ scale: fallbackGlowScale }]
            }
          ]}
        />

        {/* Animated Smag Logo */}
        <Animated.Image
          source={logo}
          style={[
            styles.logo,
            {
              opacity: fallbackLogoOpacity,
              transform: [{ scale: fallbackLogoScale }]
            }
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Brand & Tagline */}
      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: fallbackTextOpacity,
            transform: [{ translateY: fallbackTextTranslateY }]
          }
        ]}
      >
        <Text style={styles.brandTitle}>Smag</Text>
        <Text style={styles.brandTagline}>Delicious Food, Delivered Fast</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff4f0",
    justifyContent: "center",
    alignItems: "center"
  },
  logoWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: 260,
    height: 260
  },
  glowRing: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255, 121, 65, 0.22)"
  },
  logo: {
    width: 220,
    height: 220
  },
  brandContainer: {
    marginTop: 24,
    alignItems: "center"
  },
  brandTitle: {
    color: "#4b240a",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  brandTagline: {
    marginTop: 6,
    color: "#805032",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3
  }
});
