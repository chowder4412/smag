import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { getCurrentUser } from "@/lib/firebase/auth";
import { clearBiometricCredential } from "@/lib/biometrics";
import {
  getUserProfileFromFirestore,
  saveUserProfileToFirestore,
  subscribeUserProfileFirestore
} from "@/lib/firebase/firestore";

export type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  avatarUri: string;
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
  birthday: "",
  address: "",
  avatarUri: ""
};

const CACHE_KEY = "smag_user_profile_cache_v2";

let memoryProfile: UserProfile = DEFAULT_USER_PROFILE;
let hasLoaded = false;

const listeners = new Set<(profile: UserProfile) => void>();
let sharedFirestoreUnsub: (() => void) | null = null;

function broadcast() {
  listeners.forEach((l) => l(memoryProfile));
}

/** Start a single shared Firestore listener for the signed-in user.
 *  Called once when the first subscriber attaches (or on sign-in).
 *  All subsequent subscribers share the same listener. */
function ensureFirestoreListener(uid: string) {
  if (sharedFirestoreUnsub) return; // already running
  sharedFirestoreUnsub = subscribeUserProfileFirestore(uid, (fp) => {
    if (!fp) return;
    memoryProfile = {
      fullName: fp.fullName,
      email: fp.email,
      phone: fp.phone,
      birthday: fp.birthday,
      address: fp.address,
      avatarUri: fp.avatarUri
    };
    void writeCache(memoryProfile);
    broadcast();
  });
}

/** Tear down the shared Firestore listener (called on sign-out). */
export function teardownProfileListener() {
  sharedFirestoreUnsub?.();
  sharedFirestoreUnsub = null;
}

async function writeCache(profile: UserProfile) {
  try {
    const value = JSON.stringify(profile);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(CACHE_KEY, value);
    } else {
      await AsyncStorage.setItem(CACHE_KEY, value);
    }
  } catch { /* non-fatal */ }
}

async function readCache(): Promise<UserProfile | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      raw = window.localStorage.getItem(CACHE_KEY);
    } else {
      raw = await AsyncStorage.getItem(CACHE_KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return { ...DEFAULT_USER_PROFILE, ...parsed };
  } catch {
    return null;
  }
}

async function clearCache() {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.removeItem(CACHE_KEY);
    } else {
      await AsyncStorage.removeItem(CACHE_KEY);
    }
  } catch { /* non-fatal */ }
}

// Firestore is the source of truth. Cache is used for instant reads on startup.
export async function getUserProfile(): Promise<UserProfile> {
  if (hasLoaded) return memoryProfile;
  hasLoaded = true;

  // Serve cache immediately while Firestore loads
  const cached = await readCache();
  if (cached) { memoryProfile = cached; broadcast(); }

  const user = getCurrentUser();
  if (user) {
    ensureFirestoreListener(user.uid);
    const firestoreProfile = await getUserProfileFromFirestore(user.uid);
    if (firestoreProfile) {
      memoryProfile = {
        fullName: firestoreProfile.fullName,
        email: firestoreProfile.email,
        phone: firestoreProfile.phone,
        birthday: firestoreProfile.birthday,
        address: firestoreProfile.address,
        avatarUri: firestoreProfile.avatarUri
      };
      void writeCache(memoryProfile);
      broadcast();
    }
  }

  return memoryProfile;
}

export async function updateUserProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  memoryProfile = { ...memoryProfile, ...patch };
  void writeCache(memoryProfile);
  broadcast();

  const user = getCurrentUser();
  if (user) {
    await saveUserProfileToFirestore({
      uid: user.uid,
      ...memoryProfile
    });
  }

  return memoryProfile;
}

export async function resetUserProfile(): Promise<void> {
  memoryProfile = DEFAULT_USER_PROFILE;
  hasLoaded = false;
  teardownProfileListener();
  await Promise.all([
    clearCache(),
    clearBiometricCredential()
  ]);
  broadcast();
}

export function subscribeUserProfile(listener: (profile: UserProfile) => void) {
  listeners.add(listener);
  listener(memoryProfile);

  // Ensure the single shared Firestore listener is running
  const user = getCurrentUser();
  if (user) ensureFirestoreListener(user.uid);

  return () => {
    listeners.delete(listener);
    // Don't tear down the shared Firestore listener here —
    // it stays alive until sign-out via teardownProfileListener()
  };
}

export async function pickProfileImageFromDevice() {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    return result.assets[0].uri ?? null;
  }

  const globalRef = globalThis as {
    document?: {
      createElement: (tag: string) => {
        type: string;
        accept: string;
        onchange: ((event: unknown) => void) | null;
        click: () => void;
        files?: unknown;
      };
    };
    FileReader?: {
      new (): {
        result: string | ArrayBuffer | null;
        onload: (() => void) | null;
        readAsDataURL: (file: unknown) => void;
      };
    };
  };

  if (!globalRef.document || !globalRef.FileReader) return null;

  return new Promise<string | null>((resolve) => {
    const input = globalRef.document!.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const fileList = input.files as { length?: number; 0?: unknown } | undefined;
      const file = fileList?.[0];
      if (!file) { resolve(null); return; }
      const reader = new globalRef.FileReader!();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
