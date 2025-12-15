import prisma from "../db/client";
import type { IJobRun, JobStatus } from "../../types";

export class JobRunsRepository {
  /**
   * Get the latest successful job run by job name
   */
  async findLatestSuccessfulByJobName(
    jobName: string
  ): Promise<IJobRun | null> {
    try {
      const jobRun = await prisma.job_runs.findFirst({
        where: {
          job_name: jobName,
          status: "SUCCESS",
        },
        orderBy: {
          completed_at: "desc",
        },
      });

      return jobRun ? this.mapPrismaJobRunToIJobRun(jobRun) : null;
    } catch (error) {
      console.error(
        `Error fetching latest successful job run for ${jobName}:`,
        error
      );
      throw new Error("Failed to fetch latest successful job run");
    }
  }

  /**
   * Get all job runs by job name
   */
  async findAllByJobName(jobName: string): Promise<IJobRun[]> {
    try {
      const jobRuns = await prisma.job_runs.findMany({
        where: {
          job_name: jobName,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return jobRuns.map(this.mapPrismaJobRunToIJobRun);
    } catch (error) {
      console.error(`Error fetching job runs for ${jobName}:`, error);
      throw new Error("Failed to fetch job runs");
    }
  }

  /**
   * Get job run by ID
   */
  async findById(id: string): Promise<IJobRun | null> {
    try {
      const jobRun = await prisma.job_runs.findUnique({
        where: { id },
      });

      return jobRun ? this.mapPrismaJobRunToIJobRun(jobRun) : null;
    } catch (error) {
      console.error(`Error fetching job run with id ${id}:`, error);
      throw new Error("Failed to fetch job run");
    }
  }

  /**
   * Get all job runs with optional status filter
   */
  async findAll(status?: string): Promise<IJobRun[]> {
    try {
      const jobRuns = await prisma.job_runs.findMany({
        where: status ? { status } : undefined,
        orderBy: {
          created_at: "desc",
        },
      });

      return jobRuns.map(this.mapPrismaJobRunToIJobRun);
    } catch (error) {
      console.error("Error fetching all job runs:", error);
      throw new Error("Failed to fetch job runs");
    }
  }

  /**
   * Map Prisma job_runs to IJobRun interface
   */
  private mapPrismaJobRunToIJobRun(prismaJobRun: any): IJobRun {
    return {
      id: prismaJobRun.id,
      job_name: prismaJobRun.job_name,
      status: prismaJobRun.status,
      message: prismaJobRun.message,
      created_at: prismaJobRun.created_at,
      started_at: prismaJobRun.started_at,
      completed_at: prismaJobRun.completed_at,
      input_data: prismaJobRun.input_data as any,
      output_data: prismaJobRun.output_data as any,
    };
  }
}
