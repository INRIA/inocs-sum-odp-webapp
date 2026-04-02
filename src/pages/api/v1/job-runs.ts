import type { APIRoute } from "astro";
import {
  JobRunsService,
  ConfigurationError,
  UpstreamError,
} from "../../../bff/services/job-runs.service";
import ApiResponse from "../../../types/ApiResponse";
import type { CustomMCDAAlternative, MCDAGoal } from "../../../types";

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

export const POST: APIRoute = async ({ request }) => {
  // 1. Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new ApiResponse(
      { error: "Invalid JSON in request body", status: 400 },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return new ApiResponse(
      { error: "Invalid JSON in request body", status: 400 },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;

  // 2. Validate name
  const name = payload.name;
  if (typeof name !== "string" || name.trim() === "") {
    return new ApiResponse(
      { error: "Analysis name is required", status: 400 },
      { status: 400 },
    );
  }

  // 3. Validate goals_weights
  const goals = payload.goals;
  const alternatives = payload.alternatives;

  const hasFullCustomPayload = Array.isArray(goals) && Array.isArray(alternatives);

  if (hasFullCustomPayload) {
    const validGoals = goals as MCDAGoal[];
    const validAlternatives = alternatives as CustomMCDAAlternative[];

    if (validGoals.length === 0) {
      return new ApiResponse(
        { error: "At least one goal is required", status: 400 },
        { status: 400 },
      );
    }

    const hasPositiveWeight = validGoals.some(
      (goal) => typeof goal?.weight === "number" && goal.weight > 0,
    );

    if (!hasPositiveWeight) {
      return new ApiResponse(
        {
          error: "At least one goal must have a non-zero weight",
          status: 400,
        },
        { status: 400 },
      );
    }

    if (validAlternatives.length === 0) {
      return new ApiResponse(
        { error: "At least one alternative is required", status: 400 },
        { status: 400 },
      );
    }

    const goalNames = new Set(validGoals.map((goal) => goal.name));
    const isMatrixValid = validAlternatives.every((alternative) => {
      if (!alternative || typeof alternative.name !== "string" || !alternative.name.trim()) {
        return false;
      }
      if (
        typeof alternative.values !== "object" ||
        alternative.values === null ||
        Array.isArray(alternative.values)
      ) {
        return false;
      }

      return Array.from(goalNames).every((goalName) => {
        const value = alternative.values[goalName];
        return typeof value === "number" && Number.isFinite(value);
      });
    });

    if (!isMatrixValid) {
      return new ApiResponse(
        {
          error:
            "Each alternative must define a numeric score for every selected goal",
          status: 400,
        },
        { status: 400 },
      );
    }

    try {
      const result = await jobRunsService.triggerFullCustomAnalysis(
        name.trim(),
        validGoals,
        validAlternatives,
      );
      return new ApiResponse({ data: result });
    } catch (err) {
      if (err instanceof ConfigurationError) {
        return new ApiResponse(
          { error: "Internal Server Error", status: 500 },
          { status: 500 },
        );
      }
      if (err instanceof UpstreamError) {
        return new ApiResponse(
          {
            error: "Analysis service is unavailable. Please try again later.",
            status: 502,
          },
          { status: 502 },
        );
      }
      console.error("Unexpected error in POST /api/v1/job-runs:", err);
      return new ApiResponse(
        { error: "Internal Server Error", status: 500 },
        { status: 500 },
      );
    }
  }

  const goalsWeights = payload.goals_weights;
  if (
    typeof goalsWeights !== "object" ||
    goalsWeights === null ||
    Array.isArray(goalsWeights)
  ) {
    return new ApiResponse(
      {
        error:
          "goals_weights must be provided with at least one non-zero weight",
        status: 400,
      },
      { status: 400 },
    );
  }

  const weightsMap = goalsWeights as Record<string, unknown>;
  const weightValues = Object.values(weightsMap);

  // Check for negative values or all-zero
  const hasNegative = weightValues.some((v) => typeof v === "number" && v < 0);
  const hasPositive = weightValues.some((v) => typeof v === "number" && v > 0);

  if (hasNegative || !hasPositive) {
    return new ApiResponse(
      {
        error:
          "goals_weights must be provided with at least one non-zero weight",
        status: 400,
      },
      { status: 400 },
    );
  }

  // 4. Call service for legacy goals_weights payload
  try {
    const result = await jobRunsService.triggerCustomAnalysis(
      name.trim(),
      weightsMap as Record<string, number>,
    );
    // 5. Return 200 with { id, status, ... }
    return new ApiResponse({ data: result });
  } catch (err) {
    if (err instanceof ConfigurationError) {
      // 6. Config error → 500 (no internal details in response body)
      return new ApiResponse(
        { error: "Internal Server Error", status: 500 },
        { status: 500 },
      );
    }
    if (err instanceof UpstreamError) {
      // 7. Upstream error → 502
      return new ApiResponse(
        {
          error: "Analysis service is unavailable. Please try again later.",
          status: 502,
        },
        { status: 502 },
      );
    }
    console.error("Unexpected error in POST /api/v1/job-runs:", err);
    return new ApiResponse(
      { error: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
};
