import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { jobRunRateLimiter } from "./jobRunRateLimiter";

describe("JobRunRateLimiter", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it("allows requests within the limit (default 3 per minute)", () => {
    const ip = "192.168.1.100";

    const result1 = jobRunRateLimiter.check(ip);
    expect(result1.allowed).toBe(true);

    const result2 = jobRunRateLimiter.check(ip);
    expect(result2.allowed).toBe(true);

    const result3 = jobRunRateLimiter.check(ip);
    expect(result3.allowed).toBe(true);
  });

  it("blocks requests exceeding the limit", () => {
    const ip = "192.168.1.101";

    // Make 3 allowed requests
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);

    // 4th request should be blocked
    const result = jobRunRateLimiter.check(ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("blocks subsequent requests during block period", () => {
    const ip = "192.168.1.102";

    // Exceed limit
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);
    const blockedResult = jobRunRateLimiter.check(ip);

    expect(blockedResult.allowed).toBe(false);

    // Advance time by 1 minute (not enough to unblock - default block is 5 minutes)
    vi.advanceTimersByTime(60_000);

    const stillBlockedResult = jobRunRateLimiter.check(ip);
    expect(stillBlockedResult.allowed).toBe(false);
    expect(stillBlockedResult.retryAfterSeconds).toBeLessThan(
      blockedResult.retryAfterSeconds!,
    );
  });

  it("allows requests after block period expires", () => {
    const ip = "192.168.1.103";

    // Exceed limit
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);
    const blockedResult = jobRunRateLimiter.check(ip);

    expect(blockedResult.allowed).toBe(false);

    // Advance time by 5 minutes (default block duration)
    vi.advanceTimersByTime(5 * 60_000);

    const unblockedResult = jobRunRateLimiter.check(ip);
    expect(unblockedResult.allowed).toBe(true);
  });

  it("resets counter after 1 minute window", () => {
    const ip = "192.168.1.104";

    // Make 2 requests
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);

    // Advance time by 1 minute
    vi.advanceTimersByTime(60_000);

    // Counter should reset, allowing 3 more requests
    const result1 = jobRunRateLimiter.check(ip);
    expect(result1.allowed).toBe(true);

    const result2 = jobRunRateLimiter.check(ip);
    expect(result2.allowed).toBe(true);

    const result3 = jobRunRateLimiter.check(ip);
    expect(result3.allowed).toBe(true);
  });

  it("tracks different IPs independently", () => {
    const ip1 = "192.168.1.105";
    const ip2 = "192.168.1.106";

    // Exhaust limit for ip1
    jobRunRateLimiter.check(ip1);
    jobRunRateLimiter.check(ip1);
    jobRunRateLimiter.check(ip1);
    const blockedResult = jobRunRateLimiter.check(ip1);

    expect(blockedResult.allowed).toBe(false);

    // ip2 should still be allowed
    const ip2Result = jobRunRateLimiter.check(ip2);
    expect(ip2Result.allowed).toBe(true);
  });

  it("respects custom JOB_RUN_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE env var", () => {
    process.env.JOB_RUN_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE = "2";
    const ip = "192.168.1.107";

    const result1 = jobRunRateLimiter.check(ip);
    expect(result1.allowed).toBe(true);

    const result2 = jobRunRateLimiter.check(ip);
    expect(result2.allowed).toBe(true);

    // 3rd request should be blocked (limit is 2)
    const result3 = jobRunRateLimiter.check(ip);
    expect(result3.allowed).toBe(false);
  });

  it("respects custom JOB_RUN_RATE_LIMIT_BLOCK_DURATION_MINUTES env var", () => {
    process.env.JOB_RUN_RATE_LIMIT_BLOCK_DURATION_MINUTES = "2";
    const ip = "192.168.1.108";

    // Exceed limit
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);
    const blockedResult = jobRunRateLimiter.check(ip);

    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.retryAfterSeconds).toBe(120); // 2 minutes in seconds

    // Advance time by 2 minutes
    vi.advanceTimersByTime(2 * 60_000);

    const unblockedResult = jobRunRateLimiter.check(ip);
    expect(unblockedResult.allowed).toBe(true);
  });

  it("uses default values for invalid env vars", () => {
    process.env.JOB_RUN_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE = "invalid";
    process.env.JOB_RUN_RATE_LIMIT_BLOCK_DURATION_MINUTES = "-5";
    const ip = "192.168.1.109";

    // Should use default limit of 3
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);
    jobRunRateLimiter.check(ip);

    const result = jobRunRateLimiter.check(ip);
    expect(result.allowed).toBe(false);
    // Should use default block duration of 5 minutes
    expect(result.retryAfterSeconds).toBe(300);
  });
});
