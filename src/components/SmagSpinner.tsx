import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
  type ViewStyle
} from "react-native";

const logoSource = require("../../assets/SMAG_logo_transparent.png");

export interface SmagSpinnerProps {
  /**
   * Diameter in pixels of the spinning logo. Defaults to 56.
   */
  size?: number;
  /**
   * Optional custom style applied to the container.
   */
  style?: ViewStyle;
  /**
   * Accessibility label for screen readers. Defaults to "Loading...".
   */
  accessibilityLabel?: string;
  testID?: string;
}

export function SmagSpinner({
  size = 56,
  style,
  accessibilityLabel = "Loading...",
  testID = "smag-spinner"
}: SmagSpinnerProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web"
      })
    );

    spinLoop.start();

    return () => {
      spinLoop.stop();
    };
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Animated.Image
        source={logoSource}
        style={[
          styles.logo,
          {
            width: size,
            height: size,
            transform: [{ rotate: spin }]
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

export interface SmagLoadingScreenProps {
  size?: number;
  message?: string;
}

export function SmagLoadingScreen({ size = 64 }: SmagLoadingScreenProps) {
  return (
    <View style={styles.screen}>
      <SmagSpinner size={size} testID="smag-loading-screen-spinner" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center"
  },
  logo: {
    // Drop shadow for warm, elevated depth
    shadowColor: "#E25110",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFF3EB",
    justifyContent: "center",
    alignItems: "center"
  }
});
