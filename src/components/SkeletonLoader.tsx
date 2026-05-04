import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: "#ffdbc9", opacity },
        style
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox width="100%" height={160} borderRadius={0} />
      <View style={styles.cardBody}>
        <SkeletonBox width="70%" height={18} borderRadius={6} />
        <SkeletonBox width="40%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
        <SkeletonBox width="30%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: "hidden", backgroundColor: "#ffffff" },
  cardBody: { padding: 14, gap: 6 }
});
