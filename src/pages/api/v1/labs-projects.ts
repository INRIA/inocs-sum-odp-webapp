import type { APIRoute } from "astro";
import { LabService } from "../../../bff/services/labs.service";
import ApiResponse from "../../../types/ApiResponse";

const labService = new LabService();

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const labId = searchParams.get("labId");
    const data = await labService.getLabById(labId ? parseInt(labId, 10) : 0);

    if (!data) {
      return new ApiResponse({
        error: "No lab found",
        status: 404,
      });
    }
    return new ApiResponse({
      data,
    });
  } catch (error) {
    console.error("Error in GET /api/v1/labs-projects:", error);

    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const data = await request.json();
    const labId = data.labId;
    const projectId = data.projectId;

    if (!labId) {
      return new ApiResponse({
        error: "labId query parameter is required",
        status: 400,
      });
    }

    if (!projectId) {
      return new ApiResponse({
        error: "projectId query parameter is required",
        status: 400,
      });
    }

    const updatedLab = await labService.upsertLabProjectImplementation(
      labId,
      projectId,
      data
    );
    return new ApiResponse({
      data: updatedLab,
    });
  } catch (error) {
    console.error("Error in PUT /api/v1/labs-projects:", error);

    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    const data = await request.json();
    const labId = data.labId;
    const projectId = data.projectId;

    if (!labId) {
      return new ApiResponse({
        error: "labId query parameter is required",
        status: 400,
      });
    }

    if (!projectId) {
      return new ApiResponse({
        error: "projectId query parameter is required",
        status: 400,
      });
    }

    await labService.deleteLabProjectImplementation(labId, projectId);
    return ApiResponse.noContent();
  } catch (error) {
    console.error("Error in DELETE /api/v1/labs-projects:", error);

    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
