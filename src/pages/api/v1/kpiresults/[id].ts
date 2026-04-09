import type { APIRoute } from "astro";
import ApiResponse from "../../../../types/ApiResponse";
import { KpiResultsService } from "../../../../bff/services/kpiresults.service";
import type { IKpiResultInput } from "../../../../types";

const service = new KpiResultsService();

// DELETE /api/v1/kpiresults/:id
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id;

    if (!id || id === "") {
      return new ApiResponse({
        status: 400,
        error:
          "Provide id OR kpidefinition_id + living_lab_id + date (transport_mode_id optional)",
      });
    }

    const deleted = await service.deleteKpiResult(id);
    if (!deleted) {
      return new ApiResponse({ status: 404, error: "KPI result not found" });
    }
    return ApiResponse.noContent();
  } catch (err) {
    console.error("Error in DELETE /api/v1/kpiresults:", err);
    return new ApiResponse({ error: "Internal Server Error", status: 500 });
  }
};
