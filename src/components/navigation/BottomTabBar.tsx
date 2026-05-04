import { MaterialIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import { subscribeCart, subscribeNotifications } from "@/lib/firebase/firestore";
import { colors } from "@/theme/colors";

type Tab = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
};

const TABS: Tab[] = [
  { label: "HOME", icon: "home", route: "/smag_home" },
  { label: "EXPLORE", icon: "search", route: "/smag_explore" },
  { label: "ORDERS", icon: "receipt-long", route: "/smag_order_history" },
  { label: "PROFILE", icon: "person", route: "/smag_profile" }
];

export function BottomTabBar() {
  const router = useRouter() as { replace: (href: string) => void };
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    const unsubCart = subscribeCart(user.uid, (items) => {
      setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
    });

    const unsubNotifs = subscribeNotifications(user.uid, (notifs) => {
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    return () => { unsubCart(); unsubNotifs(); };
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => {
        const isActive = pathname === tab.route || (tab.route === "/smag_home" && pathname === "/");
        const badge = tab.route === "/smag_order_history" ? cartCount
          : tab.route === "/smag_profile" ? unreadCount
          : 0;

        return (
          <Pressable
            key={tab.label}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => { if (!isActive) router.replace(tab.route); }}
            accessibilityRole="tab"
            accessibilityLabel={tab.label.charAt(0) + tab.label.slice(1).toLowerCase()}
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.iconWrap}>
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isActive ? colors.onPrimary : colors.onSurfaceVariant}
              />
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 6,
    shadowColor: "#4b240a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 10
  },
  tab: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 8, borderRadius: 999, gap: 3
  },
  tabActive: { backgroundColor: colors.primary, paddingHorizontal: 10 },
  iconWrap: { position: "relative" },
  badge: {
    position: "absolute",
    top: -4, right: -8,
    minWidth: 16, height: 16,
    borderRadius: 8,
    backgroundColor: "#ff5e07",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  label: { fontSize: 9, fontWeight: "700", letterSpacing: 0.6, color: colors.onSurfaceVariant },
  labelActive: { color: colors.onPrimary }
});
