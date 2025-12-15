import type { APIRoute } from "astro";
import { JobRunsService } from "../../../bff/services/job-runs.service";
import ApiResponse from "../../../types/ApiResponse";

const jobRunsService = new JobRunsService();

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const jobName = url.searchParams.get("job_name");
    const status = url.searchParams.get("status");
    const id = url.searchParams.get("id");

    // Get job run by ID
    if (id) {
      const data = await jobRunsService.getJobRunById(id);
      if (!data) {
        return new ApiResponse({ error: "Job run not found", status: 404 });
      }
      return new ApiResponse({ data });
    }

    // Get latest successful job run by name
    if (jobName) {
      const data = await jobRunsService.getLatestSuccessfulJobRun(jobName);
      if (!data) {
        return new ApiResponse({
          error: `No successful job run found for '${jobName}'`,
          status: 404,
        });
      }
      return new ApiResponse({ data });
    }

    // Get all job runs with optional status filter
    const data = await jobRunsService.getAllJobRuns(status || undefined);
    return new ApiResponse({ data });
  } catch (err) {
    console.error("Error in GET /api/v1/job-runs:", err);
    return new ApiResponse({ error: "Internal Server Error", status: 500 });
  }
};
