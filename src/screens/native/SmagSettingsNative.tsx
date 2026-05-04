import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { firebaseSignOut } from "@/lib/firebase/auth";
import { clearOnboardingPending } from "@/lib/startupState";
import { getUserProfile, resetUserProfile, subscribeUserProfile, type UserProfile } from "@/lib/userProfile";
import { AppImage } from "@/components/AppImage";
import { useTheme } from "@/lib/ThemeContext";
import { useAppRouter } from "@/lib/useAppRouter";

export function SmagSettingsNative() {
  const router = useAppRouter();
  const { isDark, toggleTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    void getUserProfile().then((value) => {
      if (mounted) {
        setProfile(value);
      }
    });
    const unsubscribe = subscribeUserProfile((value) => {
      if (mounted) {
        setProfile(value);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#a33800" />
            </Pressable>
            <Text style={styles.title}>Settings</Text>
          </View>
          <Image source={require("../../../assets/smag_logo.png")} style={styles.brand} resizeMode="contain" />
        </View>

        <View style={styles.profileCard}>
          <AppImage source={{ uri: profile?.avatarUri ?? "" }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.fullName ?? ""}</Text>
            <Text style={styles.profileMeta}>Gourmet Tier - Since 2023</Text>
          </View>
          <Pressable onPress={() => router.push("/smag_edit_profile")}>
            <MaterialIcons name="edit" size={18} color="#a33800" />
          </Pressable>
        </View>

        <GroupTitle text="ACCOUNT SECTION" />
        <View style={styles.section}>
          <ToggleRow
            icon="notifications"
            label="Push Notifications"
            value={pushEnabled}
            onChange={setPushEnabled}
          />
          <NavRow icon="lock" label="Privacy Settings" onPress={() => router.push("/smag_support_help")} />
          <NavRow icon="security" label="Security" onPress={() => router.push("/smag_change_password")} />
        </View>

        <GroupTitle text="PREFERENCES SECTION" />
        <View style={styles.section}>
          <NavRow icon="language" label="Language" sub="English (US)" />
          <ToggleRow
            icon="dark-mode"
            label="Dark Mode"
            value={isDark}
            onChange={toggleTheme}
          />
        </View>

        <GroupTitle text="INFORMATION SECTION" />
        <View style={styles.section}>
          <NavRow icon="help" label="Help Center" onPress={() => router.push("/smag_support_help")} />
          <NavRow icon="gavel" label="Terms of Service" onPress={() => router.push("/smag_referral_terms")} />
          <NavRow icon="policy" label="Privacy Policy" onPress={() => router.push("/smag_referral_terms")} />
        </View>

        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            await clearOnboardingPending();
            await firebaseSignOut();
            await resetUserProfile();
            router.replace("/smag_login");
          }}
        >
          <MaterialIcons name="logout" size={18} color="#b31b25" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
        <Text style={styles.version}>APP VERSION v{Constants.expoConfig?.version ?? "1.0.0"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function GroupTitle({ text }: { text: string }) {
  return <Text style={styles.groupTitle}>{text}</Text>;
}

function NavRow(props: { icon: string; label: string; sub?: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.row} onPress={props.onPress}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={props.icon as never} size={18} color="#a33800" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{props.label}</Text>
        {props.sub ? <Text style={styles.rowSub}>{props.sub}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#a06a4a" />
    </Pressable>
  );
}

function ToggleRow(props: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={props.icon as never} size={18} color="#a33800" />
      </View>
      <Text style={styles.rowLabel}>{props.label}</Text>
      <Switch
        value={props.value}
        onValueChange={props.onChange}
        trackColor={{ false: "#dd9f7c66", true: "#ff7941" }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { color: "#a33800", fontSize: 24, fontWeight: "900" },
  brand: { width: 80, height: 36 },
  profileCard: {
    marginTop: 14,
    marginBottom: 18,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  profileName: { color: "#4b240a", fontSize: 22, fontWeight: "900" },
  profileMeta: { color: "#805032", fontWeight: "600", fontSize: 12 },
  groupTitle: {
    color: "#805032",
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "800"
  },
  section: {
    marginBottom: 14,
    backgroundColor: "#ffede5",
    borderRadius: 18,
    overflow: "hidden"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  rowLabel: { flex: 1, color: "#4b240a", fontSize: 15, fontWeight: "700" },
  rowSub: { marginTop: 1, color: "#805032", fontSize: 11 },
  logoutBtn: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fb5151",
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },
  logoutText: { color: "#b31b25", fontWeight: "800" },
  version: {
    marginTop: 14,
    textAlign: "center",
    color: "#80503299",
    fontSize: 11,
    letterSpacing: 1
  }
});
