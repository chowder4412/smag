import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser } from "@/lib/firebase/auth";
import { uploadProfileImageToFirebase } from "@/lib/firebase/storage";
import {
  getUserProfile,
  pickProfileImageFromDevice,
  updateUserProfile
} from "@/lib/userProfile";
import { validateEmail, validateFullName, validatePhone } from "@/lib/validation";
import { AppImage } from "@/components/AppImage";
import { useAppRouter } from "@/lib/useAppRouter";

export function SmagEditProfileNative() {
  const router = useAppRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUri, setAvatarUri] = useState("");

  useEffect(() => {
    let mounted = true;
    void getUserProfile().then((p) => {
      if (!mounted) return;
      setFullName(p.fullName);
      setEmail(p.email);
      setPhone(p.phone);
      setBirthday(p.birthday);
      setAddress(p.address);
      setAvatarUri(p.avatarUri);
    });
    return () => { mounted = false; };
  }, []);

  async function uploadPhoto() {
    const image = await pickProfileImageFromDevice();
    if (!image) return; // user cancelled or permission denied — no alert needed
    setAvatarUri(image);
  }

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function saveProfile() {
    const ne = validateFullName(fullName);
    const ee = validateEmail(email);
    const pe = validatePhone(phone);
    setNameError(ne);
    setEmailError(ee);
    setPhoneError(pe);
    if (ne || ee || pe) return;
    let finalAvatarUri = avatarUri;
    const currentUser = getCurrentUser();
    const shouldUploadToFirebase =
      Boolean(currentUser?.uid) &&
      (avatarUri.startsWith("file:") || avatarUri.startsWith("content:") || avatarUri.startsWith("data:"));

    if (shouldUploadToFirebase && currentUser) {
      try {
        finalAvatarUri = await uploadProfileImageToFirebase({
          uid: currentUser.uid,
          imageUri: avatarUri
        });
      } catch {
        Alert.alert(
          "Photo upload warning",
          "We could not upload your new photo to cloud storage. Your profile will still be updated locally."
        );
      }
    }

    // updateUserProfile writes to cache + Firestore in one call
    await updateUserProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      birthday: birthday.trim(),
      address: address.trim(),
      avatarUri: finalAvatarUri
    });

    router.replace("/smag_profile");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#ff5c00" />
            </Pressable>
            <Text style={styles.headerTitle}>Profile Settings</Text>
          </View>
          <Pressable onPress={saveProfile}>
            <Text style={styles.saveTop}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.photoWrap}>
          <AppImage source={{ uri: avatarUri }} style={styles.photo} />
          <Pressable style={styles.cameraFab} onPress={uploadPhoto}>
            <MaterialIcons name="photo-camera" size={18} color="#431200" />
          </Pressable>
        </View>
        <Text style={styles.nameLabel}>{fullName || "Your Name"}</Text>
        <Pressable style={styles.uploadBtn} onPress={uploadPhoto}>
          <MaterialIcons name="upload" size={15} color="#a33800" />
          <Text style={styles.uploadText}>Upload Profile Picture</Text>
        </Pressable>

        <View style={styles.formCard}>
          <Field label="FULL NAME" value={fullName} onChangeText={(v) => { setFullName(v); setNameError(null); }} icon="person" error={nameError} testID="edit-profile-name" />
          <Field label="EMAIL ADDRESS" value={email} onChangeText={(v) => { setEmail(v); setEmailError(null); }} icon="alternate-email" error={emailError} testID="edit-profile-email" keyboardType="email-address" />
          <Field label="PHONE NUMBER" value={phone} onChangeText={(v) => { setPhone(v); setPhoneError(null); }} icon="call" error={phoneError} testID="edit-profile-phone" keyboardType="phone-pad" />
          <Field label="DELIVERY ADDRESS" value={address} onChangeText={setAddress} icon="home" testID="edit-profile-address" />
          <Field label="BIRTHDAY" value={birthday} onChangeText={setBirthday} icon="cake" placeholder="MM/DD/YYYY" testID="edit-profile-birthday" />
        </View>

        <Pressable style={styles.saveBtn} onPress={saveProfile} testID="save-profile-btn" accessibilityRole="button" accessibilityLabel="Save Changes">
          <Text style={styles.saveText}>Save Changes</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: string;
  placeholder?: string;
  error?: string | null;
  testID?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={[styles.inputWrap, props.error ? styles.inputWrapError : null]}>
        <TextInput
          style={styles.input}
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder ?? ""}
          placeholderTextColor="#80503288"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={props.keyboardType ?? "default"}
          testID={props.testID}
        />
        <MaterialIcons name={props.icon as never} size={18} color="#80503288" />
      </View>
      {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff4f0" },
  content: { padding: 20, paddingBottom: 36 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#4b240a", fontSize: 20, fontWeight: "900" },
  saveTop: { color: "#ff5c00", fontSize: 16, fontWeight: "800" },
  photoWrap: {
    alignSelf: "center",
    marginTop: 18,
    width: 150,
    height: 150,
    borderRadius: 26,
    overflow: "hidden"
  },
  photo: { width: "100%", height: "100%" },
  cameraFab: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ff7941",
    alignItems: "center",
    justifyContent: "center"
  },
  nameLabel: {
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
    color: "#805032",
    fontWeight: "600"
  },
  uploadBtn: {
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "#ffede5",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  uploadText: { color: "#a33800", fontWeight: "800", fontSize: 12 },
  formCard: {
    borderRadius: 20,
    backgroundColor: "#ffede5",
    padding: 14,
    gap: 12
  },
  fieldWrap: { gap: 5 },
  label: { color: "#805032", fontSize: 11, letterSpacing: 1.1, fontWeight: "800" },
  inputWrap: {
    borderRadius: 14,
    backgroundColor: "#ffffff",
    minHeight: 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: { flex: 1, color: "#4b240a", fontSize: 15 },
  inputWrapError: { borderWidth: 1.5, borderColor: "#b31b25" },
  errorText: { color: "#b31b25", fontSize: 12, marginTop: 3, marginLeft: 4 },
  saveBtn: {
    marginTop: 14,
    borderRadius: 999,
    minHeight: 54,
    backgroundColor: "#a33800",
    alignItems: "center",
    justifyContent: "center"
  },
  saveText: { color: "#ffefeb", fontSize: 17, fontWeight: "900" }
});
