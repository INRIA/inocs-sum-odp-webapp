import type { APIRoute } from "astro";
import { KpiDefinitionsService } from "../../../bff/services/kpidefinitions.service";
import ApiResponse from "../../../types/ApiResponse";

const kpiDefinitionsService = new KpiDefinitionsService();

export const GET: APIRoute = async ({ request }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const kpi_number = searchParams.get("kpi_number") || undefined;
    const data = await kpiDefinitionsService.getAllKpiDefinitions({
      kpi_number,
    });
    return new ApiResponse({ data });
  } catch (err) {
    console.error(err);
    return new ApiResponse({ error: "Internal Server Error", status: 500 });
  }
};
