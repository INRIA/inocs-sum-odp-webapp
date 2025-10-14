import type { APIRoute } from "astro";
import { ProjectsService } from "../../../bff/services/projects.service";
import ApiResponse from "../../../types/ApiResponse";
const projectsService = new ProjectsService();

export const GET: APIRoute = async () => {
  try {
    const data = await projectsService.getAllProjects();
    return new ApiResponse({ data });
  } catch (err) {
    console.error(err);
    return new ApiResponse({ error: "Internal Server Error", status: 500 });
  }
};
