import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const BIOMETRIC_EMAIL_KEY = "smag_biometric_email";
const BIOMETRIC_ENABLED_KEY = "smag_biometric_enabled";

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricTypeLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === "ios" ? "Face ID" : "Facial Recognition";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
    }
    return "Face ID / Fingerprint";
  } catch {
    return "Face ID / Fingerprint";
  }
}

export async function saveBiometricCredential(email: string): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "1");
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === "1";
}

export async function getBiometricEmail(): Promise<string | null> {
  return AsyncStorage.getItem(BIOMETRIC_EMAIL_KEY);
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Sign in to Smag",
    fallbackLabel: "Use password",
    cancelLabel: "Cancel",
    disableDeviceFallback: false
  });
  return result.success;
}

export async function clearBiometricCredential(): Promise<void> {
  await AsyncStorage.removeItem(BIOMETRIC_EMAIL_KEY);
  await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
}
