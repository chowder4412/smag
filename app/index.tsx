import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { getLaunchRoute } from "@/lib/startupState";

const logo = require("../assets/smag_logo.png");

const MIN_SPLASH_MS = 1700;

export default function IndexRoute() {
  const router = useRouter() as { replace: (href: string) => void };
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 120,
        mass: 0.9,
        useNativeDriver: true
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 650,
        delay: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();

    let active = true;
    (async () => {
      const [route] = await Promise.all([
        getLaunchRoute(),
        new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS))
      ]);

      if (active) {
        router.replace(route);
      }
    })();

    return () => {
      active = false;
    };
  }, [logoOpacity, logoScale, router, textOpacity]);

  return (
    <View style={styles.screen}>
      <Animated.Image
        source={logo}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }]
          }
        ]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.brand, { opacity: textOpacity }]}>Smag</Animated.Text>
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
  logo: {
    width: 230,
    height: 230
  },
  brand: {
    marginTop: 20,
    color: "#4b240a",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0.2
  }
});
