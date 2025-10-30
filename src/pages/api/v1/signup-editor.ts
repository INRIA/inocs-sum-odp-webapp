import type { APIRoute } from "astro";
import { UserService } from "../../../bff/services/user.service";
import ApiResponse from "../../../types/ApiResponse";
import type { SignupLabEditorInput } from "../../../types";

const userService = new UserService();

export const POST: APIRoute = async ({ request }) => {
  try {
    const userData = await request.json() as SignupLabEditorInput;

    const newUser = await userService.createUserLabEditor(userData);
    return new ApiResponse({
      data: newUser,
      status: 201,
    });
  } catch (error) {
    console.error("Error in POST /api/v1/signup-editor:", error);

    return new ApiResponse({
      error: error instanceof Error ? error.message : "Internal server error",
      status: 500,
    });
  }
};
