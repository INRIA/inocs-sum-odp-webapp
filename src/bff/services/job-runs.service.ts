import { JobRunsRepository } from "../repositories/job-runs.repository";
import type { IJobRun } from "../../types";

export class JobRunsService {
  private jobRunsRepository: JobRunsRepository;

  constructor() {
    this.jobRunsRepository = new JobRunsRepository();
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
        jobName
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
