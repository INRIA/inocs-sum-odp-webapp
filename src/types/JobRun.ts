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
  [key: string]: any;
}

export interface IKpiGroup {
  id: number | string;
  name: string;
  kpis?: IKpiDefinition[];
  [key: string]: any;
}

export interface IKpiDefinition {
  id: number | string;
  name: string;
  description?: string;
  [key: string]: any;
}

export enum JobStatus {
  PENDING = "PENDING",
  STARTED = "STARTED",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}
