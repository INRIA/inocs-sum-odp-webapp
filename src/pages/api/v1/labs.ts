import type { APIRoute } from "astro";
import { LabService } from "../../../bff/services/labs.service";
import ApiResponse from "../../../types/ApiResponse";

const labService = new LabService();

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id");
    const fields = searchParams.get("fields");

    const include = fields?.length
      ? { projects: fields.includes("projects") }
      : undefined;

    let data = null;
    if (id) {
      const labId = parseInt(id, 10);

      if (isNaN(labId)) {
        return new ApiResponse({
          error: "Invalid lab ID format",
          status: 400,
        });
      }

      data = await labService.getLabById(id, include);
    } else {
      data = await labService.getAllLabs(include);
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return new ApiResponse({
        error: "No labs found",
        status: 404,
      });
    }
    return new ApiResponse({
      data,
    });
  } catch (error) {
    console.error("Error in GET /api/v1/labs:", error);

    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
