import type { APIRoute } from "astro";
import ApiResponse from "../../../../types/ApiResponse";
import { KpiResultsService } from "../../../../bff/services/kpiresults.service";
import type { IKpiResultInput } from "../../../../types";

const service = new KpiResultsService();

// PUT /api/v1/kpiresults
// Body: { id? , kpidefinition_id, living_lab_id, value, date, transport_mode_id? }
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as IKpiResultInput;
    const {
      id,
      kpidefinition_id,
      living_lab_id,
      value,
      date,
      transport_mode_id,
    } = body || {};

    const result = await service.upsertKpiResult({
      id,
      kpidefinition_id,
      living_lab_id,
      value,
      date,
      transport_mode_id,
    });
    return new ApiResponse({ data: result });
  } catch (err) {
    console.error("Error in PUT /api/v1/kpiresults:", err);
    return new ApiResponse({ error: "Internal Server Error", status: 500 });
  }
};
