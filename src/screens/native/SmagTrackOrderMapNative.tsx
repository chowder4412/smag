import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAppRouter } from "@/lib/useAppRouter";
import { colors } from "@/theme/colors";

/**
 * SmagTrackOrderMapNative — redirects to SmagTrackOrderNative which contains
 * the full live map, animated driver marker, and order timeline.
 * This screen exists as a named route for deep links and notification taps.
 */
export function SmagTrackOrderMapNative() {
  const router = useAppRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  useEffect(() => {
    const target = orderId
      ? `/smag_track_order?orderId=${orderId}`
      : "/smag_track_order";
    router.replace(target);
  }, [orderId, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
