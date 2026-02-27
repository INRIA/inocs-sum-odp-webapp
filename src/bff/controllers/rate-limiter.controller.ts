import type { IRateLimiter } from "../../lib/utils/rateLimiter";
import { rateLimiter } from "../../lib/utils/rateLimiter";

type RedirectFn = (path: string) => Response;

export type RateLimiterRequestContext = {
  request: Request;
  pathname: string;
  search: string;
  redirect: RedirectFn;
};

const DEFAULT_RETRY_AFTER_SECONDS = 300;

const RATE_LIMIT_EXCLUDED_PREFIXES = [
  "/_astro/",
  "/assets/",
  "/files/",
  "/icons/",
  "/favicon",
  "/apple-touch-icon",
  "/site.webmanifest",
  "/rate-limited",
];

export class RateLimiterController {
  constructor(private readonly limiter: IRateLimiter = rateLimiter) {}

  enforceRateLimit(context: RateLimiterRequestContext): Response | null {
    const { pathname } = context;

    if (this.isExcludedPath(pathname)) {
      return null;
    }

    const clientIp = this.getClientIp(context.request);
    const limitResult = this.limiter.check(clientIp);
    if (limitResult.allowed) {
      return null;
    }

    const retryAfter = String(
      limitResult.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS,
    );

    if (this.isApiRoute(pathname)) {
      return this.buildApiBlockedResponse(retryAfter);
    }

    return this.buildPageBlockedResponse(context, retryAfter);
  }

  private isExcludedPath(pathname: string): boolean {
    return RATE_LIMIT_EXCLUDED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );
  }

  private isApiRoute(pathname: string): boolean {
    return pathname.startsWith("/api/");
  }

  private getClientIp(request: Request): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0]?.trim();
      if (firstIp) {
        return firstIp;
      }
    }

    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) {
      return realIp;
    }

    return "unknown";
  }

  private buildApiBlockedResponse(retryAfter: string): Response {
    return new Response(JSON.stringify({ error: "Service currently unavailable" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter,
      },
    });
  }

  private buildPageBlockedResponse(
    context: RateLimiterRequestContext,
    retryAfter: string,
  ): Response {
    const originalPath = `${context.pathname}${context.search}`;
    const blockedRedirectUrl = `/rate-limited?from=${encodeURIComponent(originalPath)}`;
    const response = context.redirect(blockedRedirectUrl);
    response.headers.set("Retry-After", retryAfter);
    return response;
  }
}

export const rateLimiterController = new RateLimiterController();
