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
  success?: IJobRunSuccess[];
  errors?: IJobRunError[];
  timestamp?: string;
  [key: string]: any;
}

export interface IJobRunSuccess {
  group_id: string;
  group_name: string;
  results: IGroupAnalysisResult;
}

export interface IJobRunError {
  group_id: string;
  group_name: string;
  error: string;
}

export interface IGroupAnalysisResult {
  id: string;
  name: string;
  kpi_ids: string[];
  kpis: any;
  msqe: number;
  variation_under_no_measures: number;
  measure_coefficients: IMeasureCoefficient[];
  living_labs_analysis: ILivingLabAnalysis[];
}

export interface IMeasureCoefficient {
  id: string;
  name: string;
  coefficient: number;
  kpi_group_id: string;
}

export interface ILivingLabAnalysis {
  id: string;
  name: string;
  kpis: IKpiResultData[];
  measures: ILivingLabMeasure[];
}

export interface IKpiResultData {
  id: string;
  name: string;
  value_before: number | null;
  value_after: number | null;
  abs_variation: number | null;
  ratio_variation: number | null;
  living_lab_id: string;
  transport_mode_id?: string | null;
  transport_mode_name?: string | null;
  value_type: string;
  value_min: number | null;
  value_max: number | null;
  progression_target: number;
}

export interface ILivingLabMeasure {
  measure_id: string;
  measure_name: string;
  status?: string;
  implementation_date?: string | null;
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
