import { validatePromoCode, incrementPromoUsage } from "../src/lib/firebase/firestore";

jest.mock("../src/lib/firebase/config", () => ({
  firebaseConfig: {
    apiKey: "test", authDomain: "test", projectId: "test",
    storageBucket: "test", messagingSenderId: "test", appId: "test"
  }
}));

const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn(() => "doc-ref");
const mockIncrement = jest.fn((n: number) => ({ __increment: n }));

jest.mock("firebase/app", () => ({ getApps: () => [{}], getApp: jest.fn() }));
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  initializeApp: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  getDocs: (arg: unknown) => mockGetDocs(arg),
  updateDoc: (arg1: unknown, arg2: unknown) => mockUpdateDoc(arg1, arg2),
  doc: (...args: unknown[]) => (mockDoc as (...a: unknown[]) => string)(...args),
  increment: (n: number) => mockIncrement(n),
  // unused but imported by firestore.ts
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getApps: () => [{}],
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
}));

function makePromoSnap(data: Record<string, unknown>) {
  return {
    empty: false,
    docs: [{
      id: "promo-1",
      data: () => ({ ...data, expiresAt: data.expiresAt ?? null })
    }]
  };
}

describe("validatePromoCode", () => {
  beforeEach(() => mockGetDocs.mockReset());

  it("returns invalid for unknown code", async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    const result = await validatePromoCode("BADCODE", 5000);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/invalid/i);
  });

  it("returns invalid for inactive promo", async () => {
    mockGetDocs.mockResolvedValue(makePromoSnap({ code: "SAVE10", active: false, discountType: "percent", discountValue: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, usageCount: 0 }));
    const result = await validatePromoCode("SAVE10", 5000);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/no longer active/i);
  });

  it("returns invalid for expired promo", async () => {
    const past = { toDate: () => new Date(Date.now() - 1000) };
    mockGetDocs.mockResolvedValue(makePromoSnap({ code: "OLD10", active: true, discountType: "percent", discountValue: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, usageCount: 0, expiresAt: past }));
    const result = await validatePromoCode("OLD10", 5000);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/expired/i);
  });

  it("returns invalid when usage limit reached", async () => {
    mockGetDocs.mockResolvedValue(makePromoSnap({ code: "FULL", active: true, discountType: "fixed", discountValue: 500, minOrder: 0, maxDiscount: 0, usageLimit: 10, usageCount: 10 }));
    const result = await validatePromoCode("FULL", 5000);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/usage limit/i);
  });

  it("returns invalid when subtotal below minimum order", async () => {
    mockGetDocs.mockResolvedValue(makePromoSnap({ code: "MIN5K", active: true, discountType: "fixed", discountValue: 500, minOrder: 5000, maxDiscount: 0, usageLimit: 0, usageCount: 0 }));
    const result = await validatePromoCode("MIN5K", 2000);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/minimum order/i);
  });

  it("applies percent discount correctly", async () => {
    mockGetDocs.mockResolvedValue(makePromoSnap({ code: "PCT10", active: true, discountType: "percent", discountValue: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, usageCount: 0 }));
    const result = await validatePromoCode("PCT10", 10000);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(1000);
  });

  it("caps percent discount at maxDiscount", async () => {
    mockGetDocs.mockResolvedValue(makePromoSnap({ code: "CAP", active: true, discountType: "percent", discountValue: 50, minOrder: 0, maxDiscount: 2000, usageLimit: 0, usageCount: 0 }));
    const result = await validatePromoCode("CAP", 10000);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(2000);
  });

  it("applies fixed discount correctly", async () => {
    mockGetDocs.mockResolvedValue(makePromoSnap({ code: "FLAT500", active: true, discountType: "fixed", discountValue: 500, minOrder: 0, maxDiscount: 0, usageLimit: 0, usageCount: 0 }));
    const result = await validatePromoCode("FLAT500", 5000);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(500);
  });
});

describe("incrementPromoUsage", () => {
  beforeEach(() => {
    mockUpdateDoc.mockReset();
    mockIncrement.mockClear();
  });

  it("calls updateDoc with increment(1) — no read-then-write", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await incrementPromoUsage("promo-1");
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref", { usageCount: { __increment: 1 } });
    expect(mockIncrement).toHaveBeenCalledWith(1);
  });
});
