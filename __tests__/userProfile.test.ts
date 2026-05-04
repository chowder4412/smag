import {
  getUserProfile,
  resetUserProfile,
  subscribeUserProfile,
  updateUserProfile
} from "../src/lib/userProfile";

// Mock Firebase deps that userProfile now imports
jest.mock("@/lib/firebase/auth", () => ({
  getCurrentUser: () => null
}));

jest.mock("@/lib/firebase/firestore", () => ({
  getUserProfileFromFirestore: () => Promise.resolve(null),
  saveUserProfileToFirestore: () => Promise.resolve(),
  subscribeUserProfileFirestore: () => () => {}
}));

jest.mock("@/lib/biometrics", () => ({
  clearBiometricCredential: () => Promise.resolve()
}));

beforeEach(async () => {
  await resetUserProfile();
});

describe("getUserProfile", () => {
  it("returns empty profile initially", async () => {
    const profile = await getUserProfile();
    expect(profile.fullName).toBe("");
    expect(profile.email).toBe("");
  });
});

describe("updateUserProfile", () => {
  it("merges partial update", async () => {
    await updateUserProfile({ fullName: "Jane Doe" });
    const profile = await getUserProfile();
    expect(profile.fullName).toBe("Jane Doe");
    expect(profile.email).toBe("");
  });

  it("persists multiple updates", async () => {
    await updateUserProfile({ fullName: "Jane Doe" });
    await updateUserProfile({ email: "jane@smag.com" });
    const profile = await getUserProfile();
    expect(profile.fullName).toBe("Jane Doe");
    expect(profile.email).toBe("jane@smag.com");
  });
});

describe("resetUserProfile", () => {
  it("restores defaults after update", async () => {
    await updateUserProfile({ fullName: "Temp Name" });
    await resetUserProfile();
    const profile = await getUserProfile();
    expect(profile.fullName).toBe("");
  });
});

describe("subscribeUserProfile", () => {
  it("calls listener immediately with current profile", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeUserProfile(listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ fullName: "" }));
    unsubscribe();
  });

  it("calls listener on update", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeUserProfile(listener);
    await updateUserProfile({ fullName: "Updated Name" });
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Updated Name" }));
    unsubscribe();
  });

  it("stops calling listener after unsubscribe", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeUserProfile(listener);
    unsubscribe();
    listener.mockClear();
    await updateUserProfile({ fullName: "Ghost Update" });
    expect(listener).not.toHaveBeenCalled();
  });
});
