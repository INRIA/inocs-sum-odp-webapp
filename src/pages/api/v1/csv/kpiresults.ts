import type { APIRoute } from "astro";
import { CsvExportController } from "../../../../bff/controllers/csv-export.controller";

const controller = new CsvExportController();

/**
 * Parse a query param value as a positive integer.
 * Returns the integer if valid, undefined if the param is absent, or null if invalid.
 */
function parsePositiveInt(value: string | null): number | undefined | null {
  if (value === null || value === "") return undefined;
  const n = parseInt(value, 10);
  if (isNaN(n) || n <= 0 || String(n) !== value) return null;
  return n;
}

// GET /api/v1/csv/kpiresults?living_lab_id=&category_id=&kpidefinition_id=
export const GET: APIRoute = async ({ url }) => {
  // Parse and validate query params
  const living_lab_id = parsePositiveInt(url.searchParams.get("living_lab_id"));
  const category_id = parsePositiveInt(url.searchParams.get("category_id"));
  const kpidefinition_id = parsePositiveInt(
    url.searchParams.get("kpidefinition_id"),
  );

  if (living_lab_id === null) {
    return new Response(
      JSON.stringify({
        error: "Invalid parameter: living_lab_id must be a positive integer",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (category_id === null) {
    return new Response(
      JSON.stringify({
        error: "Invalid parameter: category_id must be a positive integer",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (kpidefinition_id === null) {
    return new Response(
      JSON.stringify({
        error:
          "Invalid parameter: kpidefinition_id must be a positive integer",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const csv = await controller.getKpiResultsCsv({
      living_lab_id,
      category_id,
      kpidefinition_id,
    });

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kpi-results.csv"',
      },
    });
  } catch (err) {
    console.error("Error in GET /api/v1/csv/kpiresults:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
