import type { APIRoute } from "astro";
import { LabService, UserService } from "../../../../bff";
import { ApiResponse, type ILivingLab } from "../../../../types";

const labService = new LabService();
const userService = new UserService();

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id");
    const fields = searchParams.get("fields");

    const include = fields?.length
      ? {
          projects: fields.includes("projects"),
          transportModes: fields.includes("transport_modes"),
          kpiResults: fields.includes("kpiresults"),
        }
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
      if (!data) {
        return new ApiResponse({
          error: "No labs found",
          status: 404,
        });
      }
    } else {
      data = await labService.getAllLabs(include);
    }
    return new ApiResponse({
      data: data ?? [],
    });
  } catch (error) {
    console.error("Error in GET /api/v1/labs:", error);

    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      return new ApiResponse({
        success: false,
        error: "Unauthorized",
        status: 401,
      });
    }

    if (locals.user.status === "disabled") {
      return new ApiResponse({
        success: false,
        error: "Forbidden",
        status: 403,
      });
    }

    let labData;
    try {
      labData = await request.json();
    } catch (jsonError) {
      return new ApiResponse({
        success: false,
        error: "Invalid JSON in request body",
        status: 400,
      });
    }

    const userId = String(locals.user.id);

    const newLab = await labService.createLab(labData);
    const updatedUser = await userService.setUserLivingLab(
      userId,
      String(newLab.id),
    );

    return new ApiResponse({
      success: true,
      data: { ...newLab, user_id: updatedUser?.id },
      message: "Lab created successfully",
      status: 201,
    });
  } catch (error) {
    console.error("Error in POST /api/v1/labs:", error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("Unique constraint".toLowerCase())) {
        return new ApiResponse({
          success: false,
          error: "A lab with the provided unique fields already exists.",
          status: 409,
        });
      }
      if (
        errorMessage.includes("name") ||
        errorMessage.includes("country_code2") ||
        errorMessage.includes("population") ||
        errorMessage.includes("area") ||
        errorMessage.includes("radius")
      ) {
        return new ApiResponse({
          success: false,
          error: error.message,
          status: 400,
        });
      }
    }

    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      status: 500,
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const labData = (await request.json()) as ILivingLab;
    const { id, ...updatedData } = labData;

    if (!labData.id || isNaN(Number(labData.id)) || Number(labData.id) <= 0) {
      return new ApiResponse({
        error: "Invalid lab ID provided",
        status: 400,
      });
    }

    const updatedLab = await labService.updateLab(labData.id, updatedData);
    return new ApiResponse({
      data: updatedLab,
      message: "Lab updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/v1/labs:", error);
    return new ApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
