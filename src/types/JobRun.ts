import type {
  IGroupAnalysisResult,
  IKpiDefinition,
  IKpiGroup,
} from "./ImpactAnalysis";
import type { ILivingLab } from "./LivingLab";

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
  goals?: MCDAGoal[];
  kpis: IKpiDefinition[];
  living_labs: ILivingLab[];
  params?: {
    name?: string;
    goals_weights?: Record<string, number>;
    perspective?: string;
  };
  [key: string]: any;
}

export interface IJobRunOutputData {
  success?: IJobRunImpactAnalysisSuccess[];
  errors?: IJobRunError[];
  timestamp?: string;
  mcda_results?: McdaResults;
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

export interface MCDAGoal {
  name: string;
  weight: number;
}

export interface McdaPreferenceMatrix {
  [sourceKey: string]: {
    [targetKey: string]: number;
  };
}

export interface OutrankingGraphNode {
  id: string;
  label: string;
  rank?: number;
  netFlow: number;
  positiveFlow?: number;
  negativeFlow?: number;
}

export interface OutrankingGraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface OutrankingGraphData {
  nodes: OutrankingGraphNode[];
  edges: OutrankingGraphEdge[];
}

export interface McdaKeyInsightCard {
  title: string;
  description: string;
  value: string;
  detail?: string;
  tooltip?: string;
}

export interface McdaResults {
  net_flows?: { [key: string]: number };
  alternative_labels?: { [key: string]: string };
  negative_flows?: { [key: string]: number };
  positive_flows?: { [key: string]: number };
  preference_matrix?: McdaPreferenceMatrix;
  criteria_labels?: { [key: string]: string };
  gaia_method?: string;
  gaia_quality?: number;
  gaia_criteria?: { key: string; x: number; y: number }[];
  gaia_alternatives?: { key: string; x: number; y: number }[];
  gaia_decision_stick?: [number, number];
  ranking?: string[];
  [key: string]: any;
}
export enum JobStatus {
  PENDING = "PENDING",
  STARTED = "STARTED",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}
