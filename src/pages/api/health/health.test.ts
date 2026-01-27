import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from ".";

describe("Health API Route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should return status ok", async () => {
    const mockDate = new Date("2025-01-27T10:00:00.000Z");
    vi.setSystemTime(mockDate);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.service).toBe("inocs-sum-odp-webapp");
    expect(data.timestamp).toBe(mockDate.toISOString());

    vi.useRealTimers();
  });

  it("should return correct content type", async () => {
    const response = await GET({} as any);

    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should include timestamp in response", async () => {
    const response = await GET({} as any);
    const data = await response.json();

    expect(data).toHaveProperty("timestamp");
    expect(typeof data.timestamp).toBe("string");
    // Verify it's a valid ISO string
    expect(() => new Date(data.timestamp)).not.toThrow();
  });

  it("should return all required fields", async () => {
    const response = await GET({} as any);
    const data = await response.json();

    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("service");
  });
});
