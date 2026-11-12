import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkRateLimit, recordRateLimitAttempt, resetRateLimit } from "@/lib/rateLimiter";

describe("rateLimiter", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("initially allows attempts with full quota", async () => {
    const status = await checkRateLimit("login", "user@smag.com");
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(5);
    expect(status.isLocked).toBe(false);
  });

  it("decrements remaining attempts on failure", async () => {
    const res1 = await recordRateLimitAttempt("login", "user@smag.com", false);
    expect(res1.allowed).toBe(true);
    expect(res1.remainingAttempts).toBe(4);

    const check = await checkRateLimit("login", "user@smag.com");
    expect(check.remainingAttempts).toBe(4);
  });

  it("locks out when maxAttempts is exceeded", async () => {
    for (let i = 0; i < 4; i++) {
      await recordRateLimitAttempt("login", "user@smag.com", false);
    }
    const finalAttempt = await recordRateLimitAttempt("login", "user@smag.com", false);
    expect(finalAttempt.allowed).toBe(false);
    expect(finalAttempt.isLocked).toBe(true);
    expect(finalAttempt.retryAfterSeconds).toBeGreaterThan(0);
    expect(finalAttempt.message).toContain("Too many failed attempts");

    // Subsequent check should also be blocked
    const status = await checkRateLimit("login", "user@smag.com");
    expect(status.allowed).toBe(false);
    expect(status.isLocked).toBe(true);
  });

  it("resets quota on success", async () => {
    await recordRateLimitAttempt("login", "user@smag.com", false);
    await recordRateLimitAttempt("login", "user@smag.com", false);

    const res = await recordRateLimitAttempt("login", "user@smag.com", true);
    expect(res.allowed).toBe(true);
    expect(res.remainingAttempts).toBe(5);

    const check = await checkRateLimit("login", "user@smag.com");
    expect(check.remainingAttempts).toBe(5);
  });

  it("resets quota when explicitly calling resetRateLimit", async () => {
    await recordRateLimitAttempt("password_reset", "test@smag.com", false);
    await resetRateLimit("password_reset", "test@smag.com");

    const check = await checkRateLimit("password_reset", "test@smag.com");
    expect(check.remainingAttempts).toBe(3);
  });
});
