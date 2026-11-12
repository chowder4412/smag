import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutDurationMs: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  attemptsCount: number;
  remainingAttempts: number;
  isLocked: boolean;
  lockedUntil: number | null;
  retryAfterSeconds: number;
  message?: string;
}

export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 mins window
    lockoutDurationMs: 5 * 60 * 1000 // 5 mins lockout
  },
  session_unlock: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 mins window
    lockoutDurationMs: 5 * 60 * 1000 // 5 mins lockout
  },
  password_reset: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 mins window
    lockoutDurationMs: 15 * 60 * 1000 // 15 mins lockout
  },
  phone_otp: {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 mins window
    lockoutDurationMs: 10 * 60 * 1000 // 10 mins lockout
  }
};

const STORAGE_PREFIX = "@smag_rate_limit:";

interface StoredRateLimitRecord {
  attempts: number[];
  lockedUntil?: number;
}

function normalizeKey(action: string, identifier?: string): string {
  const cleanId = (identifier || "global").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return `${STORAGE_PREFIX}${action}:${cleanId}`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "a moment";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs} second${secs === 1 ? "" : "s"}`;
  }
  if (secs === 0) {
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  return `${mins}m ${secs}s`;
}

async function loadRecord(key: string): Promise<StoredRateLimitRecord> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw) as StoredRateLimitRecord;
    return {
      attempts: Array.isArray(parsed?.attempts) ? parsed.attempts : [],
      lockedUntil: typeof parsed?.lockedUntil === "number" ? parsed.lockedUntil : undefined
    };
  } catch {
    return { attempts: [] };
  }
}

async function saveRecord(key: string, record: StoredRateLimitRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Non-fatal if storage fails
  }
}

/**
 * Check if the given action is currently rate-limited.
 */
export async function checkRateLimit(
  action: string,
  identifier?: string,
  customConfig?: Partial<RateLimitConfig>
): Promise<RateLimitStatus> {
  const config: RateLimitConfig = {
    ...(RATE_LIMIT_PRESETS[action] || RATE_LIMIT_PRESETS.login),
    ...customConfig
  };

  const key = normalizeKey(action, identifier);
  const record = await loadRecord(key);
  const now = Date.now();

  // Check if currently under lockout
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      attemptsCount: record.attempts.length,
      remainingAttempts: 0,
      isLocked: true,
      lockedUntil: record.lockedUntil,
      retryAfterSeconds,
      message: `Too many attempts. For your security, please wait ${formatDuration(retryAfterSeconds)} before trying again.`
    };
  }

  // Filter attempts within the sliding window
  const windowStart = now - config.windowMs;
  const validAttempts = record.attempts.filter((ts) => ts > windowStart);
  const remainingAttempts = Math.max(0, config.maxAttempts - validAttempts.length);

  return {
    allowed: remainingAttempts > 0,
    attemptsCount: validAttempts.length,
    remainingAttempts,
    isLocked: false,
    lockedUntil: null,
    retryAfterSeconds: 0
  };
}

/**
 * Record an attempt. Call with success=true on successful action to reset the rate limit.
 * Call with success=false on failed attempt to register a failure.
 */
export async function recordRateLimitAttempt(
  action: string,
  identifier: string | undefined,
  success: boolean,
  customConfig?: Partial<RateLimitConfig>
): Promise<RateLimitStatus> {
  const key = normalizeKey(action, identifier);

  if (success) {
    await resetRateLimit(action, identifier);
    return {
      allowed: true,
      attemptsCount: 0,
      remainingAttempts: (RATE_LIMIT_PRESETS[action] || RATE_LIMIT_PRESETS.login).maxAttempts,
      isLocked: false,
      lockedUntil: null,
      retryAfterSeconds: 0
    };
  }

  const config: RateLimitConfig = {
    ...(RATE_LIMIT_PRESETS[action] || RATE_LIMIT_PRESETS.login),
    ...customConfig
  };

  const record = await loadRecord(key);
  const now = Date.now();

  const windowStart = now - config.windowMs;
  const validAttempts = record.attempts.filter((ts) => ts > windowStart);
  validAttempts.push(now);

  let lockedUntil: number | undefined = undefined;
  if (validAttempts.length >= config.maxAttempts) {
    lockedUntil = now + config.lockoutDurationMs;
  }

  const updatedRecord: StoredRateLimitRecord = {
    attempts: validAttempts,
    lockedUntil
  };

  await saveRecord(key, updatedRecord);

  if (lockedUntil) {
    const retryAfterSeconds = Math.ceil(config.lockoutDurationMs / 1000);
    return {
      allowed: false,
      attemptsCount: validAttempts.length,
      remainingAttempts: 0,
      isLocked: true,
      lockedUntil,
      retryAfterSeconds,
      message: `Too many failed attempts. For your security, please wait ${formatDuration(retryAfterSeconds)} before trying again.`
    };
  }

  const remainingAttempts = Math.max(0, config.maxAttempts - validAttempts.length);
  return {
    allowed: true,
    attemptsCount: validAttempts.length,
    remainingAttempts,
    isLocked: false,
    lockedUntil: null,
    retryAfterSeconds: 0,
    message: remainingAttempts <= 2 ? `${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.` : undefined
  };
}

/**
 * Reset rate limit tracking for an action/identifier (e.g. after successful sign in or unlock).
 */
export async function resetRateLimit(action: string, identifier?: string): Promise<void> {
  const key = normalizeKey(action, identifier);
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Non-fatal
  }
}
