import type { APIRoute } from "astro";
import { CsvExportController } from "../../../../bff/controllers/csv-export.controller";

const controller = new CsvExportController();

/**
 * Parses a query param as a positive integer.
 * Returns `undefined` if value is absent/empty.
 * Returns `null` if value is present but invalid/non-positive.
 */
function parsePositiveInt(value: string | null): number | undefined | null {
  if (value === null || value === "") return undefined;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== value) return null;
  return parsed;
}

export const GET: APIRoute = async ({ url }) => {
  const rawLivingLabId = url.searchParams.get("living_lab_id");

  const living_lab_id = parsePositiveInt(rawLivingLabId);

  if (living_lab_id === null) {
    return Response.json(
      { error: "Invalid parameter: living_lab_id must be a positive integer" },
      { status: 400 },
    );
  }

  try {
    const csv = await controller.getProjectsCsv({ living_lab_id });
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="projects.csv"',
      },
    });
  } catch (err) {
    console.error("Error in GET /api/v1/csv/projects:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
