import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./job-runs";

// Helper to create a mock Request
function makeRequest(body: unknown, method = "POST"): Request {
  return new Request("http://localhost/api/v1/job-runs", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

const validGoalsWeights = {
  "Improve Accessibility": 0.118204003,
  "Improve Mobility Service": 0.164257155,
  "Improve Multimodality": 0.131881625,
  "Noise Hinderance": 0.063675546,
  "Improve Public Transport": 0.119422265,
  "Reduction of Congestion": 0.145589093,
  "Reduction of Emission": 0.144952956,
  "Improve Safety": 0.112017357,
};

const validPayload = {
  name: "Urban mobility priorities — Geneva pilot",
  goals_weights: validGoalsWeights,
};

describe("POST /api/v1/job-runs", () => {
  beforeEach(() => {
    // Stub global fetch before each test
    vi.stubGlobal("fetch", vi.fn());
    // Set the env var for tests that need it
    process.env.JOB_RUN_IMPACT_ASSESS_ROUTE = "https://analysis-api.example.com/run";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.JOB_RUN_IMPACT_ASSESS_ROUTE;
  });

  // ─── Happy Path (scenario 1) ──────────────────────────────────────────────

  describe("happy path", () => {
    it("returns 200 with { job_id } when given valid name and goals_weights", async () => {
      const returnedJobId = "550e8400-e29b-41d4-a716-446655440000";
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ job_id: returnedJobId }), { status: 200 }),
      );

      const req = makeRequest(validPayload);
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ job_id: returnedJobId });
    });
  });

  // ─── Forwarded payload shape (scenario 10) ───────────────────────────────

  describe("forwarded payload shape", () => {
    it("forwards perspective='user_personalized', name, and goals_weights to external API", async () => {
      const returnedJobId = "abc123-uuid";
      const fetchMock = vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ job_id: returnedJobId }), { status: 200 }),
      );

      const req = makeRequest(validPayload);
      await POST({ request: req } as any);

      expect(fetchMock).toHaveBeenCalledOnce();
      const [_url, fetchInit] = fetchMock.mock.calls[0];

      expect(_url).toBe("https://analysis-api.example.com/run");

      const forwardedBody = JSON.parse((fetchInit as RequestInit).body as string);
      expect(forwardedBody.params.perspective).toBe("user_personalized");
      expect(forwardedBody.params.name).toBe(validPayload.name);
      expect(forwardedBody.params.goals_weights).toEqual(validGoalsWeights);
    });
  });

  // ─── Input validation errors (scenarios 2–6) ─────────────────────────────

  describe("input validation", () => {
    it("returns 400 'Invalid JSON in request body' when body is not valid JSON", async () => {
      const req = new Request("http://localhost/api/v1/job-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json }",
      });
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid JSON in request body");
    });

    it("returns 400 'Analysis name is required' when name field is missing", async () => {
      const req = makeRequest({ goals_weights: validGoalsWeights });
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Analysis name is required");
    });

    it("returns 400 'Analysis name is required' when name is empty string after trim", async () => {
      const req = makeRequest({ name: "   ", goals_weights: validGoalsWeights });
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Analysis name is required");
    });

    it("returns 400 when goals_weights is missing", async () => {
      const req = makeRequest({ name: "My Analysis" });
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("goals_weights must be provided with at least one non-zero weight");
    });

    it("returns 400 when all goals_weights values are 0", async () => {
      const zeroWeights: Record<string, number> = {};
      Object.keys(validGoalsWeights).forEach((k) => { zeroWeights[k] = 0; });

      const req = makeRequest({ name: "My Analysis", goals_weights: zeroWeights });
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("goals_weights must be provided with at least one non-zero weight");
    });

    it("returns 400 when any goals_weights value is negative", async () => {
      const negativeWeights = { ...validGoalsWeights, "Improve Accessibility": -0.1 };

      const req = makeRequest({ name: "My Analysis", goals_weights: negativeWeights });
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("goals_weights must be provided with at least one non-zero weight");
    });
  });

  // ─── Upstream and configuration errors (scenarios 7–9) ───────────────────

  describe("upstream and configuration errors", () => {
    it("returns 502 when external API returns non-2xx status", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Server error" }), { status: 500 }),
      );

      const req = makeRequest(validPayload);
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toBe("Analysis service is unavailable. Please try again later.");
    });

    it("returns 502 or 503 when fetch throws a network error", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      const req = makeRequest(validPayload);
      const res = await POST({ request: req } as any);

      expect([502, 503]).toContain(res.status);
      const body = await res.json();
      expect(body.error).toBe("Analysis service is unavailable. Please try again later.");
    });

    it("returns 500 'Internal Server Error' when JOB_RUN_IMPACT_ASSESS_ROUTE is undefined", async () => {
      delete process.env.JOB_RUN_IMPACT_ASSESS_ROUTE;

      const req = makeRequest(validPayload);
      const res = await POST({ request: req } as any);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal Server Error");
      // Internal details must not be exposed
      expect(JSON.stringify(body)).not.toContain("JOB_RUN_IMPACT_ASSESS_ROUTE");
    });
  });
});
