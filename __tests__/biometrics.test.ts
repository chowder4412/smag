import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn()
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

import {
  authenticateWithBiometrics,
  clearBiometricCredential,
  getBiometricEmail,
  isBiometricAvailable,
  isBiometricEnabled,
  saveBiometricCredential
} from "../src/lib/biometrics";

import * as LocalAuthentication from "expo-local-authentication";

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

beforeEach(() => jest.clearAllMocks());

describe("isBiometricAvailable", () => {
  it("returns false when no hardware", async () => {
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
    expect(await isBiometricAvailable()).toBe(false);
  });

  it("returns false when hardware present but not enrolled", async () => {
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
    expect(await isBiometricAvailable()).toBe(false);
  });

  it("returns true when hardware present and enrolled", async () => {
    mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    expect(await isBiometricAvailable()).toBe(true);
  });
});

describe("saveBiometricCredential", () => {
  it("stores email and enabled flag", async () => {
    mockStorage.setItem.mockResolvedValue(undefined);
    await saveBiometricCredential("chef@smag.com");
    expect(mockStorage.setItem).toHaveBeenCalledWith("smag_biometric_email", "chef@smag.com");
    expect(mockStorage.setItem).toHaveBeenCalledWith("smag_biometric_enabled", "1");
  });
});

describe("isBiometricEnabled", () => {
  it("returns true when flag is set", async () => {
    mockStorage.getItem.mockResolvedValue("1");
    expect(await isBiometricEnabled()).toBe(true);
  });

  it("returns false when flag is not set", async () => {
    mockStorage.getItem.mockResolvedValue(null);
    expect(await isBiometricEnabled()).toBe(false);
  });
});

describe("getBiometricEmail", () => {
  it("returns stored email", async () => {
    mockStorage.getItem.mockResolvedValue("chef@smag.com");
    expect(await getBiometricEmail()).toBe("chef@smag.com");
  });

  it("returns null when no email stored", async () => {
    mockStorage.getItem.mockResolvedValue(null);
    expect(await getBiometricEmail()).toBeNull();
  });
});

describe("authenticateWithBiometrics", () => {
  it("returns true on successful authentication", async () => {
    mockLocalAuth.authenticateAsync.mockResolvedValue({ success: true } as never);
    expect(await authenticateWithBiometrics()).toBe(true);
  });

  it("returns false on failed authentication", async () => {
    mockLocalAuth.authenticateAsync.mockResolvedValue({ success: false, error: "user_cancel" } as never);
    expect(await authenticateWithBiometrics()).toBe(false);
  });
});

describe("clearBiometricCredential", () => {
  it("removes both storage keys", async () => {
    mockStorage.removeItem.mockResolvedValue(undefined);
    await clearBiometricCredential();
    expect(mockStorage.removeItem).toHaveBeenCalledWith("smag_biometric_email");
    expect(mockStorage.removeItem).toHaveBeenCalledWith("smag_biometric_enabled");
  });
});
