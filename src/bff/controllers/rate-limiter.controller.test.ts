import { describe, it, expect, vi } from "vitest";
import { RateLimiterController } from "./rate-limiter.controller";
import type { IRateLimiter } from "../../lib/utils/rateLimiter";

const createRedirect = () => {
  return vi.fn((path: string) =>
    new Response(null, {
      status: 302,
      headers: { Location: path },
    }),
  );
};

describe("RateLimiterController", () => {
  it("returns null for excluded static paths", () => {
    const limiter: IRateLimiter = {
      check: vi.fn(() => ({ allowed: false, retryAfterSeconds: 60 })),
    };
    const controller = new RateLimiterController(limiter);
    const redirect = createRedirect();

    const response = controller.enforceRateLimit({
      request: new Request("http://localhost:4321/assets/app.js"),
      pathname: "/assets/app.js",
      search: "",
      redirect,
    });

    expect(response).toBeNull();
    expect(limiter.check).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns null when request is allowed", () => {
    const limiter: IRateLimiter = {
      check: vi.fn(() => ({ allowed: true })),
    };
    const controller = new RateLimiterController(limiter);
    const redirect = createRedirect();

    const response = controller.enforceRateLimit({
      request: new Request("http://localhost:4321/dashboard", {
        headers: {
          "x-forwarded-for": "203.0.113.10",
        },
      }),
      pathname: "/dashboard",
      search: "",
      redirect,
    });

    expect(response).toBeNull();
    expect(limiter.check).toHaveBeenCalledWith("203.0.113.10");
  });

  it("returns JSON 429 response for blocked API requests", async () => {
    const limiter: IRateLimiter = {
      check: vi.fn(() => ({ allowed: false, retryAfterSeconds: 120 })),
    };
    const controller = new RateLimiterController(limiter);
    const redirect = createRedirect();

    const response = controller.enforceRateLimit({
      request: new Request("http://localhost:4321/api/v1/labs", {
        headers: {
          "x-forwarded-for": "198.51.100.24",
        },
      }),
      pathname: "/api/v1/labs",
      search: "",
      redirect,
    });

    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Content-Type")).toContain("application/json");
    expect(response?.headers.get("Retry-After")).toBe("120");
    await expect(response?.json()).resolves.toEqual({
      error: "Service currently unavailable",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects blocked page requests to rate-limited page with original path", () => {
    const limiter: IRateLimiter = {
      check: vi.fn(() => ({ allowed: false, retryAfterSeconds: 300 })),
    };
    const controller = new RateLimiterController(limiter);
    const redirect = createRedirect();

    const response = controller.enforceRateLimit({
      request: new Request("http://localhost:4321/tools/resources?tab=all"),
      pathname: "/tools/resources",
      search: "?tab=all",
      redirect,
    });

    expect(response).not.toBeNull();
    expect(response?.status).toBe(302);
    expect(redirect).toHaveBeenCalledWith(
      "/rate-limited?from=%2Ftools%2Fresources%3Ftab%3Dall",
    );
    expect(response?.headers.get("Retry-After")).toBe("300");
  });

  it("uses x-real-ip when x-forwarded-for is missing", () => {
    const limiter: IRateLimiter = {
      check: vi.fn(() => ({ allowed: true })),
    };
    const controller = new RateLimiterController(limiter);

    controller.enforceRateLimit({
      request: new Request("http://localhost:4321/some-page", {
        headers: {
          "x-real-ip": "192.0.2.55",
        },
      }),
      pathname: "/some-page",
      search: "",
      redirect: createRedirect(),
    });

    expect(limiter.check).toHaveBeenCalledWith("192.0.2.55");
  });

  it("returns null for internal SSR requests (X-Internal-Request header)", () => {
    const limiter: IRateLimiter = {
      check: vi.fn(() => ({ allowed: false, retryAfterSeconds: 60 })),
    };
    const controller = new RateLimiterController(limiter);
    const redirect = createRedirect();

    const response = controller.enforceRateLimit({
      request: new Request("http://localhost:4321/api/v1/labs", {
        headers: {
          "X-Internal-Request": "true",
          "x-forwarded-for": "203.0.113.10",
        },
      }),
      pathname: "/api/v1/labs",
      search: "",
      redirect,
    });

    expect(response).toBeNull();
    expect(limiter.check).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
