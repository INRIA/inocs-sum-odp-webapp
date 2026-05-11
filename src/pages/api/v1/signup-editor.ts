import type { APIRoute } from "astro";
import { UserService } from "../../../bff/services/user.service";
import { LabService } from "../../../bff/services/labs.service";
import ApiResponse from "../../../types/ApiResponse";
import type { SignupLabEditorInput } from "../../../types";
import {
  notifySignupNewLab,
  notifySignupExistingLab,
} from "../../../bff/email/admin-notifier.service";

const userService = new UserService();
const labService = new LabService();

export const POST: APIRoute = async ({ request }) => {
  try {
    const userData = await request.json() as SignupLabEditorInput;

    const newUser = await userService.createUserLabEditor(userData);

    // Fire-and-forget admin notifications based on signup mode.
    if (userData.living_lab_id) {
      // User is requesting to edit an existing lab — look up lab name for the email.
      labService
        .getLabById(userData.living_lab_id)
        .then((lab) => {
          notifySignupExistingLab({
            userName: newUser.name,
            userEmail: newUser.email,
            labId: userData.living_lab_id!,
            labName: lab?.name ?? `Lab #${userData.living_lab_id}`,
          });
        })
        .catch((err) => {
          // Even if lookup fails, still fire a degraded notification.
          console.error("[signup-editor] Failed to look up lab for email:", err);
          notifySignupExistingLab({
            userName: newUser.name,
            userEmail: newUser.email,
            labId: userData.living_lab_id!,
            labName: `Lab #${userData.living_lab_id}`,
          });
        });
    } else {
      notifySignupNewLab({
        userName: newUser.name,
        userEmail: newUser.email,
      });
    }

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
