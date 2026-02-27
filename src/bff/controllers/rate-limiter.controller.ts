import type { IRateLimiter } from "../../lib/utils/rateLimiter";
import { rateLimiter } from "../../lib/utils/rateLimiter";
import { jobRunRateLimiter } from "../../lib/utils/jobRunRateLimiter";

type RedirectFn = (path: string) => Response;

export type RateLimiterRequestContext = {
  request: Request;
  pathname: string;
  search: string;
  redirect: RedirectFn;
};

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
  constructor(
    private readonly limiter: IRateLimiter = rateLimiter,
    private readonly jobRunLimiter: IRateLimiter = jobRunRateLimiter,
  ) {}

  enforceRateLimit(context: RateLimiterRequestContext): Response | null {
    const { pathname, request } = context;

    if (this.isExcludedPath(pathname)) {
      return null;
    }

    // Exclude internal SSR requests from rate limiting to prevent pages from blocking themselves
    if (this.isInternalRequest(request)) {
      return null;
    }

    const clientIp = this.getClientIp(context.request);
    
    // Use stricter rate limit for job run creation
    const limiter = this.isJobRunCreation(pathname, request.method)
      ? this.jobRunLimiter
      : this.limiter;

    const limitResult = limiter.check(clientIp);
    if (limitResult.allowed) {
      return null;
    }

    // retryAfterSeconds should always be set when blocked, but provide fallback from env
    const retryAfter = String(
      limitResult.retryAfterSeconds ?? this.getDefaultRetryAfter(),
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

  private isInternalRequest(request: Request): boolean {
    return request.headers.get("X-Internal-Request") === "true";
  }

  private isJobRunCreation(pathname: string, method: string): boolean {
    return pathname === "/api/v1/job-runs" && method === "POST";
  }

  private getDefaultRetryAfter(): number {
    // Use the same block duration from env that the rate limiter uses
    const blockDurationMinutes = process.env.RATE_LIMIT_BLOCK_DURATION_MINUTES
      ? parseInt(process.env.RATE_LIMIT_BLOCK_DURATION_MINUTES, 10)
      : 5;
    return blockDurationMinutes * 60; // convert to seconds
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
    return new Response(
      JSON.stringify({ error: "Service currently unavailable" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter,
        },
      },
    );
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
