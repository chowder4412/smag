import { useLocalSearchParams } from "expo-router";
import { Suspense } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { SmagLoadingScreen } from "@/components/SmagSpinner";
import { getScreenById } from "@/generated/screens";
import { getNativeScreenComponent } from "@/screens/native";
import { colors } from "@/theme/colors";

const TAB_SCREENS = new Set([
  "smag_home",
  "smag_explore",
  "smag_favorites",
  "smag_order_history",
  "smag_profile",
  "smag_menu",
  "smag_my_cart",
  "smag_notifications"
]);

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const screen = getScreenById(id);
  const NativeScreen = getNativeScreenComponent(id);
  const showTabs = Boolean(id && TAB_SCREENS.has(id));

  if (!screen && !NativeScreen) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Screen not found.</Text>
      </View>
    );
  }

  if (!NativeScreen) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>
          {screen?.title ?? id} - native screen coming soon.
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary fallbackLabel="This screen failed to load. Tap to retry.">
      <Suspense fallback={<SmagLoadingScreen />}>
        {showTabs ? (
          <View style={styles.withTabs}>
            <View style={styles.screenWrap}>
              <NativeScreen />
            </View>
            <BottomTabBar />
          </View>
        ) : (
          <NativeScreen />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background
  },
  withTabs: {
    flex: 1,
    backgroundColor: colors.background
  },
  screenWrap: {
    flex: 1,
    paddingBottom: 94
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24
  },
  notFoundText: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    textAlign: "center"
  }
});
