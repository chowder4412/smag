import NetInfo from "@react-native-community/netinfo";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsub();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <MaterialIcons name="wifi-off" size={16} color="#ffefeb" />
      <Text style={styles.text}>No internet connection — showing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 999,
    backgroundColor: "#4b240a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  text: { color: "#ffefeb", fontSize: 13, fontWeight: "700" }
});
