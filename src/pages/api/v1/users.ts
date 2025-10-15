import type { APIRoute } from "astro";
import { UserService } from "../../../bff/services/user.service";
import ApiResponse from "../../../types/ApiResponse";

const userService = new UserService();

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const status = searchParams.get("status") as
      | "signup"
      | "active"
      | "disabled"
      | null;
    const roleId = searchParams.get("role_id");
    const id = searchParams.get("id");
    const email = searchParams.get("email");
    if (id) {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        return new ApiResponse({
          error: "Invalid user ID format",
          status: 400,
        });
      }
    }
    let data = await userService.findUsers({
      id: id || undefined,
      email: email || undefined,
      status: status || undefined,
      roleId: roleId || undefined,
    });

    if (!data.length) {
      return new ApiResponse({
        error: "User not found",
        status: 404,
      });
    }
    return new ApiResponse({
      data,
    });
  } catch (error) {
    console.error("Error in GET /api/v1/users:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
