import type { APIRoute } from "astro";
import { LabService } from "../../../bff/services/labs.service";
import ApiResponse from "../../../types/ApiResponse";
import type {
  ITransportModeLivingLabDelete,
  ITransportModeLivingLabEdit,
} from "../../../types";

const labService = new LabService();

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const data = (await request.json()) as ITransportModeLivingLabEdit;
    const { living_lab_id, transport_mode_id } = data;

    if (!living_lab_id) {
      return new ApiResponse({
        error: "living_lab_id query parameter is required",
        status: 400,
      });
    }

    if (!transport_mode_id) {
      return new ApiResponse({
        error: "transport_mode_id query parameter is required",
        status: 400,
      });
    }
    const updatedLab = await labService.upsertLabTransportModeImplementation(
      data
    );
    return new ApiResponse({
      data: updatedLab,
    });
  } catch (error) {
    console.error("Error in PUT /api/v1/labs-transport-mode:", error);

    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    const data = (await request.json()) as ITransportModeLivingLabDelete;
    const { living_lab_id, transport_mode_id } = data;

    if (!living_lab_id) {
      return new ApiResponse({
        error: "living_lab_id query parameter is required",
        status: 400,
      });
    }

    if (!transport_mode_id) {
      return new ApiResponse({
        error: "transport_mode_id query parameter is required",
        status: 400,
      });
    }

    await labService.deleteLabTransportModeImplementation(
      living_lab_id,
      transport_mode_id
    );
    return ApiResponse.noContent();
  } catch (error) {
    console.error("Error in DELETE /api/v1/labs-transport-mode:", error);

    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
