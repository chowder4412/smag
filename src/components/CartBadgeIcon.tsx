import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useCartCount } from "@/lib/useCartCount";

export function CartBadgeIcon({ size = 24, color = "#FF5C00" }: { size?: number; color?: string }) {
  const count = useCartCount();
  return (
    <View style={styles.wrap}>
      <MaterialIcons name="shopping-bag" size={size} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#a33800",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  badgeText: { color: "#ffefeb", fontSize: 9, fontWeight: "900" }
});
