import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { waitForAuthReady } from "@/lib/firebase/auth";

const ONBOARDING_PENDING_KEY = "smag_onboarding_pending";

function readWebFlag(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeWebFlag(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(key, "1");
  } else {
    window.localStorage.removeItem(key);
  }
}

async function readFlag(key: string): Promise<boolean> {
  if (Platform.OS === "web") return readWebFlag(key) === "1";
  try {
    return (await AsyncStorage.getItem(key)) === "1";
  } catch {
    return false;
  }
}

async function writeFlag(key: string, value: boolean): Promise<void> {
  if (Platform.OS === "web") {
    writeWebFlag(key, value);
    return;
  }
  try {
    if (value) {
      await AsyncStorage.setItem(key, "1");
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch {
    // storage unavailable — fail silently
  }
}

export async function getLaunchRoute(): Promise<string> {
  const [user, onboardingPending] = await Promise.all([
    waitForAuthReady(),
    readFlag(ONBOARDING_PENDING_KEY)
  ]);

  if (onboardingPending) return "/smag_welcome";
  if (user) return "/smag_home";
  return "/smag_login";
}

// Legacy compatibility no-ops kept to avoid touching older screens unnecessarily.
export async function markRegularCustomer() {}
export async function clearRegularCustomer() {}

export async function markOnboardingPending() {
  await writeFlag(ONBOARDING_PENDING_KEY, true);
}

export async function clearOnboardingPending() {
  await writeFlag(ONBOARDING_PENDING_KEY, false);
}
