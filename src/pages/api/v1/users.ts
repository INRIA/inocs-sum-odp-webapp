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

    let user = null;
    let data = [];

    // Get specific user by ID
    if (id) {
      const userId = parseInt(id, 10);

      if (isNaN(userId)) {
        return new ApiResponse({
          error: "Invalid user ID format",
          status: 400,
        });
      }

      user = await userService.getUserById(userId);
    } else if (email) {
      // Get users by email
      user = await userService.getUserByEmail(email);
    }

    if (user) {
      data.push(user);
    } else {
      // Get users with optional filtering
      const options: any = {};
      if (status) options.status = status;
      if (roleId) options.roleId = parseInt(roleId, 10);

      const users = await userService.getAllUsers(options);
      data.push(...users);
    }

    if (!data) {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Content-Type must be application/json",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userData = await request.json();

    // Validate required fields
    if (
      !userData.email ||
      !userData.name ||
      !userData.password ||
      !userData.role_id
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: email, name, password, role_id",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const newUser = await userService.createUser(userData);

    // Remove password from response
    const { password, password_confirmation, old_password, ...userResponse } =
      newUser;

    return new Response(
      JSON.stringify({
        success: true,
        data: userResponse,
        message: "User created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in POST /api/v1/users:", error);

    const status =
      error instanceof Error && error.message.includes("already exists")
        ? 409
        : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Content-Type must be application/json",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const requestData = await request.json();

    if (!requestData.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID is required for updates",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id, ...userData } = requestData;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid user ID format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updatedUser = await userService.updateUser(userId, userData);

    if (!updatedUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Remove password from response
    const { password, password_confirmation, old_password, ...userResponse } =
      updatedUser;

    return new Response(
      JSON.stringify({
        success: true,
        data: userResponse,
        message: "User updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in PUT /api/v1/users:", error);

    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && error.message.includes("already exists")
        ? 409
        : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
