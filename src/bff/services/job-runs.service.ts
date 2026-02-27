import { JobRunsRepository } from "../repositories/job-runs.repository";
import type { IJobRun } from "../../types";

/** Error thrown when JOB_RUN_IMPACT_ASSESS_ROUTE env var is not configured */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/** Error thrown when the upstream analysis API returns a non-2xx response or is unreachable */
export class UpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamError";
  }
}

export class JobRunsService {
  private jobRunsRepository: JobRunsRepository;

  constructor() {
    this.jobRunsRepository = new JobRunsRepository();
  }

  /**
   * Trigger a custom MCDA analysis job by proxying to the external analysis API.
   * @param name - User-provided analysis name
   * @param goalsWeights - Map of goal label to normalized weight
   * @returns Promise resolving to IJobRun
   * @throws ConfigurationError if JOB_RUN_IMPACT_ASSESS_ROUTE is not set
   * @throws UpstreamError if the external API returns a non-2xx response or is unreachable
   */
  async triggerCustomAnalysis(
    name: string,
    goalsWeights: Record<string, number>,
  ): Promise<IJobRun> {
    const route = process.env.JOB_RUN_IMPACT_ASSESS_ROUTE;
    if (!route) {
      const err = new ConfigurationError(
        "JOB_RUN_IMPACT_ASSESS_ROUTE environment variable is not set",
      );
      console.error(
        "Configuration error in triggerCustomAnalysis:",
        err.message,
      );
      throw err;
    }
    let res: Response;
    try {
      res = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-API-Key": process.env.JOB_RUN_IMPACT_API_KEY,
        },
        body: JSON.stringify({
          params: {
            perspective: "user_personalized",
            name,
            goals_weights: goalsWeights,
          },
        }),
      });
    } catch (networkError) {
      console.error("Network error in triggerCustomAnalysis:", networkError);
      throw new UpstreamError("External analysis API is unreachable");
    }

    if (!res.ok) {
      console.error(
        `Upstream error in triggerCustomAnalysis: external API responded with status ${res.status}`,
      );
      throw new UpstreamError(
        `External analysis API returned status ${res.status}`,
      );
    }

    const data = (await res.json()) as IJobRun;
    return data;
  }

  /**
   * Get the latest successful job run by job name
   */
  async getLatestSuccessfulJobRun(jobName: string): Promise<IJobRun | null> {
    try {
      if (!jobName || jobName.trim() === "") {
        throw new Error("Job name is required");
      }

      return await this.jobRunsRepository.findLatestSuccessfulByJobName(
        jobName,
      );
    } catch (error) {
      console.error("Error in getLatestSuccessfulJobRun service:", error);
      throw new Error("Failed to retrieve latest successful job run");
    }
  }

  /**
   * Get all job runs by job name
   */
  async getAllJobRunsByName(jobName: string): Promise<IJobRun[]> {
    try {
      if (!jobName || jobName.trim() === "") {
        throw new Error("Job name is required");
      }

      return await this.jobRunsRepository.findAllByJobName(jobName);
    } catch (error) {
      console.error("Error in getAllJobRunsByName service:", error);
      throw new Error("Failed to retrieve job runs");
    }
  }

  /**
   * Get job run by ID
   */
  async getJobRunById(id: string): Promise<IJobRun | null> {
    try {
      if (!id || id.trim() === "") {
        throw new Error("Job run ID is required");
      }

      return await this.jobRunsRepository.findById(id);
    } catch (error) {
      console.error("Error in getJobRunById service:", error);
      throw new Error("Failed to retrieve job run");
    }
  }

  /**
   * Get all job runs with optional status filter
   */
  async getAllJobRuns(status?: string): Promise<IJobRun[]> {
    try {
      return await this.jobRunsRepository.findAll(status);
    } catch (error) {
      console.error("Error in getAllJobRuns service:", error);
      throw new Error("Failed to retrieve job runs");
    }
  }
}
