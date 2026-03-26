// T005 — ApiClient.downloadCsvBlob tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ApiClient from "./ApiClient";
import type { IGiscoSearchResult } from "../../types/Gisco";

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

// T006 — ApiClient.searchCities tests
describe("ApiClient.searchCities", () => {
  const mockResults: IGiscoSearchResult[] = [
    {
      cityName: "Lille",
      postalCode: "59000",
      country: "France",
      countryCode: "FRA",
      lat: 50.6292,
      lng: 3.0573,
      label: "Lille, Hauts-de-France, France",
    },
  ];

  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { origin: "http://localhost:4321" },
      document: undefined,
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the proxy at /api/v1/geocode with the encoded query", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockResults), { status: 200 }),
    );

    const client = new ApiClient();
    await client.searchCities("Lille, France");

    expect(fetch).toHaveBeenCalledOnce();
    const [calledUrl] = vi.mocked(fetch).mock.calls[0];
    expect(String(calledUrl)).toContain("/api/v1/geocode");
    expect(String(calledUrl)).toContain("q=Lille%2C%20France");
    expect(String(calledUrl)).not.toContain("gisco-services.ec.europa.eu");
  });

  it("returns the IGiscoSearchResult array from the proxy response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockResults), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new ApiClient();
    const results = await client.searchCities("Lille, France");
    expect(results).toEqual(mockResults);
  });

  it("returns [] when the proxy returns an empty array", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const client = new ApiClient();
    const results = await client.searchCities("unknowncity");
    expect(results).toEqual([]);
  });

  it("returns [] on network error (fetch throws)", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const client = new ApiClient();
    const results = await client.searchCities("Lille");
    expect(results).toEqual([]);
  });

  it("returns [] when the proxy returns a non-OK status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Upstream geocoding service unavailable" }),
        { status: 502 },
      ),
    );

    const client = new ApiClient();
    const results = await client.searchCities("Lille");
    expect(results).toEqual([]);
  });
});
