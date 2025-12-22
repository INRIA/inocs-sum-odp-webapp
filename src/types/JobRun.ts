import type { IGroupAnalysisResult, IKpiGroup } from "./ImpactAnalysis";

export interface IJobRun {
  id: string;
  job_name: string;
  status: string;
  message?: string | null;
  created_at: Date;
  started_at?: Date | null;
  completed_at?: Date | null;
  input_data?: IJobRunInputData | null;
  output_data?: IJobRunOutputData | null;
}

export interface IJobRunInputData {
  kpi_groups?: IKpiGroup[];
  [key: string]: any;
}

export interface IJobRunOutputData {
  success?: IJobRunImpactAnalysisSuccess[];
  errors?: IJobRunError[];
  timestamp?: string;
  [key: string]: any;
}

export interface IJobRunImpactAnalysisSuccess {
  group_id: string;
  group_name: string;
  results: IGroupAnalysisResult;
}

export interface IJobRunError {
  group_id: string;
  group_name: string;
  error: string;
}

export enum JobStatus {
  PENDING = "PENDING",
  STARTED = "STARTED",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}
