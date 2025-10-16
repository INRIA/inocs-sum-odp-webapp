import type { APIRoute } from "astro";
import { LabService } from "../../../bff/services/labs.service";
import ApiResponse from "../../../types/ApiResponse";
import type { LivingLabProjectsImplementationInput } from "../../../types";

const labService = new LabService();

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const data = await request.json();
    const { living_lab_id, project_id, ...updateData } =
      data as LivingLabProjectsImplementationInput;

    if (!living_lab_id) {
      return new ApiResponse({
        error: "living_lab_id query parameter is required",
        status: 400,
      });
    }

    if (!project_id) {
      return new ApiResponse({
        error: "project_id query parameter is required",
        status: 400,
      });
    }

    const updatedLab = await labService.upsertLabProjectImplementation(
      living_lab_id,
      project_id,
      updateData
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
