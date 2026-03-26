import type { APIRoute } from "astro";
import type {
  IGiscoRawResponse,
  IGiscoSearchResult,
} from "../../../../types/Gisco";

export const GET: APIRoute = async ({ request }) => {
  const q = new URL(request.url).searchParams.get("q");

  if (!q || q.trim() === "") {
    return new Response(
      JSON.stringify({ error: "Missing query parameter 'q'" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const upstreamUrl = `https://gisco-services.ec.europa.eu/api/?q="${encodeURIComponent(q)}"`;
    const upstream = await fetch(upstreamUrl, {
      headers: { "Accept-Language": "en-GB" },
    });
    const body = (await upstream.json()) as IGiscoRawResponse;

    const results: IGiscoSearchResult[] = body.features.map((f) => ({
      cityName: f.properties.city ?? f.properties.name,
      postalCode: f.properties.postalcode ?? f.properties.postcode ?? "",
      country: f.properties.country,
      countryCode: f.properties.country_code ?? f.properties.countrycode ?? "",
      label: f.properties.label,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Upstream geocoding service unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
};
