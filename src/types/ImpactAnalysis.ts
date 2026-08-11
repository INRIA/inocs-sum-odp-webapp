import type { IKpi } from "./KPIs";

export interface IGroupAnalysisResult {
  id: number;
  name: string;
  kpi_ids: number[];
  kpis: IKpiDefinition[];
  msqe: number;
  variation_under_no_measures: number;
  measure_coefficients: IMeasureCoefficient[];
  living_labs_analysis: ILivingLabAnalysis[];
}

export interface IMeasureCoefficient {
  id: number;
  name: string;
  coefficient: number;
  kpi_group_id: number;
  times_implemented: number;
}

export interface ILivingLabAnalysis {
  id: number;
  name: string;
  kpis: IKpiResultData[];
  measures: ILivingLabMeasure[];
}

export interface IKpiResultData extends IKpiDefinition {
  value_before: number | null;
  value_after: number | null;
  abs_variation: number | null;
  ratio_variation: number | null;
  living_lab_id: number;
  transport_mode_id?: number | null;
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
  parent_kpi_id?: number | null;
  parent_kpi_name?: string | null;
  parent_kpi_number?: string | null;
  [key: string]: any;
}

// KPI Variations Data Structures
export interface IKpiVariationData {
  groupId: number;
  groupName: string;
  totalVariation: number | null; // Average ratio_variation across all labs and KPIs
  totalVariationPercentage: string; // Formatted percentage string
  livingLabVariations: ILivingLabVariation[];
  allKpiVariations: IKpiVariation[]; // Aggregated across all labs
}

export interface ILivingLabVariation {
  labId: number;
  labName: string;
  totalVariation: number | null; // Average ratio_variation for this lab
  totalVariationPercentage: string;
  kpis: IKpiVariation[];
  // Geolocation fields for map display, maped by function calculateKpiVariationsData
  lat?: number | null;
  lng?: number | null;
  radius?: number | null;
}

export interface IKpiVariation {
  kpiId: number;
  kpiName: string;
  kpiParentId?: number | null;
  kpiParentName?: string | null;
  ratioVariation: number | null;
  ratioVariationPercentage: string;
  absVariation: number | null;
  valueBefore: number | null;
  valueAfter: number | null;
  transportModeName?: string | null;
}
