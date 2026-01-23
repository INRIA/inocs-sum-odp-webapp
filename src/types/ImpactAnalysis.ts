import type { IKpi } from "./KPIs";

export interface IGroupAnalysisResult {
  id: string;
  name: string;
  kpi_ids: string[];
  kpis: IKpiDefinition[];
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

export interface IKpiResultData extends IKpiDefinition {
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

export interface IKpiDefinition extends IKpi {
  value_type: string; // Type of the values: percentage, ratio, custom_unit, score
  value_min?: number | null;
  value_max?: number | null;
  parent_kpi_id?: string | null;
  parent_kpi_name?: string | null;
  parent_kpi_number?: string | null;
  [key: string]: any;
}

// KPI Variations Data Structures
export interface IKpiVariationData {
  groupId: string;
  groupName: string;
  totalVariation: number | null; // Average ratio_variation across all labs and KPIs
  totalVariationPercentage: string; // Formatted percentage string
  livingLabVariations: ILivingLabVariation[];
  allKpiVariations: IKpiVariation[]; // Aggregated across all labs
}

export interface ILivingLabVariation {
  labId: string;
  labName: string;
  totalVariation: number | null; // Average ratio_variation for this lab
  totalVariationPercentage: string;
  kpis: IKpiVariation[];
}

export interface IKpiVariation {
  kpiId: string;
  kpiName: string;
  kpiParentId?: string | null;
  kpiParentName?: string | null;
  ratioVariation: number | null;
  ratioVariationPercentage: string;
  absVariation: number | null;
  valueBefore: number | null;
  valueAfter: number | null;
  transportModeName?: string | null;
}
