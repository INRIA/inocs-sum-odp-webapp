// T005 — ApiClient.downloadCsvBlob tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ApiClient from "./ApiClient";

describe("ApiClient.downloadCsvBlob", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // Mock window.location for URL construction
    vi.stubGlobal("window", {
      location: { origin: "http://localhost:4321" },
      document: undefined,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls fetch with the correct absolute URL", async () => {
    const mockBlob = new Blob(["col1\nval1"], { type: "text/csv" });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(mockBlob, {
        status: 200,
        headers: { "Content-Type": "text/csv" },
      }),
    );

    const client = new ApiClient();
    await client.downloadCsvBlob("/csv/kpiresults");

    expect(fetch).toHaveBeenCalledOnce();
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/csv/kpiresults");
  });

  it("calls fetch with authorization header when token is present", async () => {
    const mockBlob = new Blob(["a,b"], { type: "text/csv" });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(mockBlob, { status: 200 }),
    );

    // Simulate a cookie that contains a sessionToken
    vi.stubGlobal("document", {
      cookie: "sessionToken=my-test-token",
    });

    const client = new ApiClient();
    await client.downloadCsvBlob("/csv/projects");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer my-test-token");
  });

  it("returns a Blob on a successful 200 response", async () => {
    const csvContent = "Lab,KPI\nGeneva,1.0";
    const mockBlob = new Blob([csvContent], { type: "text/csv" });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(mockBlob, { status: 200 }),
    );

    const client = new ApiClient();
    const result = await client.downloadCsvBlob("/csv/kpiresults");

    expect(result).toBeInstanceOf(Blob);
    const text = await result.text();
    expect(text).toBe(csvContent);
  });

  it("throws ApiDownloadError when response is not ok (4xx)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('{"error":"Not Found"}', { status: 404 }),
    );

    const client = new ApiClient();
    await expect(client.downloadCsvBlob("/csv/kpiresults?living_lab_id=999")).rejects.toThrow(
      "ApiDownloadError",
    );
  });

  it("throws ApiDownloadError when response is not ok (5xx)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const client = new ApiClient();
    await expect(client.downloadCsvBlob("/csv/kpiresults")).rejects.toThrow(
      "ApiDownloadError",
    );
  });

  it("includes query params when they are part of the path", async () => {
    const mockBlob = new Blob(["data"], { type: "text/csv" });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(mockBlob, { status: 200 }),
    );

    const client = new ApiClient();
    await client.downloadCsvBlob("/csv/kpiresults?living_lab_id=3&category_id=7");

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("living_lab_id=3");
    expect(String(url)).toContain("category_id=7");
  });
});
