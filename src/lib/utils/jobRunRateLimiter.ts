import type { IRateLimiter, RateLimitResult } from "./rateLimiter";

type RateLimiterConfig = {
  maxRequestsPerMinute: number;
  blockDurationMinutes: number;
};

type RateLimiterState = {
  count: number;
  windowStart: number;
  blockedUntil?: number;
};

const WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS_PER_MINUTE = 3; // Stricter default for job runs
const DEFAULT_BLOCK_DURATION_MINUTES = 5;

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const resolveConfig = (): RateLimiterConfig => {
  const maxRequestsPerMinute = parsePositiveInteger(
    process.env.JOB_RUN_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE,
    DEFAULT_MAX_REQUESTS_PER_MINUTE,
  );

  const blockDurationMinutes = parsePositiveInteger(
    process.env.JOB_RUN_RATE_LIMIT_BLOCK_DURATION_MINUTES,
    DEFAULT_BLOCK_DURATION_MINUTES,
  );

  return {
    maxRequestsPerMinute,
    blockDurationMinutes,
  };
};

/**
 * Dedicated rate limiter for job run creation endpoint.
 * Uses stricter limits to prevent abuse of compute-intensive operations.
 * Default: 3 requests per minute per IP
 */
class JobRunRateLimiter implements IRateLimiter {
  private readonly requestsByIp = new Map<string, RateLimiterState>();

  public check(ip: string): RateLimitResult {
    const now = Date.now();
    const config = resolveConfig();
    const blockDurationMs = config.blockDurationMinutes * 60_000;

    this.cleanupExpiredEntries(now);

    const currentState = this.requestsByIp.get(ip);

    if (currentState?.blockedUntil && currentState.blockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((currentState.blockedUntil - now) / 1000),
      };
    }

    if (!currentState || now - currentState.windowStart >= WINDOW_MS) {
      this.requestsByIp.set(ip, {
        count: 1,
        windowStart: now,
      });

      return { allowed: true };
    }

    const nextCount = currentState.count + 1;
    if (nextCount > config.maxRequestsPerMinute) {
      const blockedUntil = now + blockDurationMs;
      this.requestsByIp.set(ip, {
        ...currentState,
        count: nextCount,
        blockedUntil,
      });

      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(blockDurationMs / 1000),
      };
    }

    this.requestsByIp.set(ip, {
      ...currentState,
      count: nextCount,
    });

    return { allowed: true };
  }

  private cleanupExpiredEntries(now: number): void {
    for (const [ip, state] of this.requestsByIp.entries()) {
      const blockExpired = !state.blockedUntil || state.blockedUntil <= now;
      const windowExpired = now - state.windowStart >= WINDOW_MS;

      if (blockExpired && windowExpired) {
        this.requestsByIp.delete(ip);
      }
    }
  }
}

export const jobRunRateLimiter = new JobRunRateLimiter();
