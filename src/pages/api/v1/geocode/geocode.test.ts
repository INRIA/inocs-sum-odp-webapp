import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from ".";
import type { IGiscoRawResponse } from "../../../../types/Gisco";

const fixture: IGiscoRawResponse = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [3.0573, 50.6292] },
      properties: {
        name: "Lille",
        postalcode: "59000",
        country: "France",
        country_code: "FRA",
        label: "Lille, Hauts-de-France, France",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
      properties: {
        name: "Paris",
        postalcode: "75001",
        country: "France",
        country_code: "FRA",
        label: "Paris, Île-de-France, France",
      },
    },
  ],
};

const makeRequest = (search: string) =>
  new Request(`http://localhost:4321/api/v1/geocode${search}`);

describe("GET /api/v1/geocode", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns 400 when q param is missing", async () => {
    const res = await GET({ request: makeRequest("") } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing query parameter/i);
  });

  it("returns 400 when q param is empty string", async () => {
    const res = await GET({ request: makeRequest("?q=") } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing query parameter/i);
  });

  it("does not call upstream when q is missing", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    await GET({ request: makeRequest("") } as any);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 200 with mapped IGiscoSearchResult array on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(fixture), { status: 200 }),
      ),
    );

    const res = await GET({
      request: makeRequest("?q=Lille%2C+France"),
    } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");

    const data = await res.json();
    expect(data).toHaveLength(2);

    expect(data[0].cityName).toBe("Lille");
    expect(data[0].postalCode).toBe("59000");
    expect(data[0].country).toBe("France");
    expect(data[0].countryCode).toBe("FRA");
    expect(data[0].label).toBe("Lille, Hauts-de-France, France");
    expect(data[0].lat).toBe(50.6292);
    expect(data[0].lng).toBe(3.0573);
  });

  it("calls the upstream GISCO URL with double-quoted phrase query", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ type: "FeatureCollection", features: [] }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", mockFetch);

    await GET({ request: makeRequest("?q=Lille%2C+France") } as any);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(String(calledUrl)).toContain("gisco-services.ec.europa.eu");
    // Query should be wrapped in double quotes for phrase matching (literal " or URL-encoded %22)
    const urlStr = String(calledUrl);
    const hasDoubleQuote = urlStr.includes('"') || urlStr.includes("%22");
    expect(hasDoubleQuote).toBe(true);
    // Should request English (UK) results
    expect(calledInit?.headers?.["Accept-Language"]).toBe("en-GB");
  });

  it("returns 200 with empty array when GISCO returns no features", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ type: "FeatureCollection", features: [] }),
          { status: 200 },
        ),
      ),
    );

    const res = await GET({ request: makeRequest("?q=xyzunknown") } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("handles missing postalcode gracefully (maps to empty string)", async () => {
    const noPostal: IGiscoRawResponse = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [5.0, 45.0] },
          properties: {
            name: "SomeCity",
            country: "France",
            country_code: "FRA",
            label: "SomeCity, France",
          },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(noPostal), { status: 200 }),
      ),
    );

    const res = await GET({ request: makeRequest("?q=SomeCity") } as any);
    const data = await res.json();
    expect(data[0].postalCode).toBe("");
  });

  it("returns 502 when upstream fetch throws a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("Network error")),
    );

    const res = await GET({ request: makeRequest("?q=Lille") } as any);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/upstream geocoding service unavailable/i);
  });
});
