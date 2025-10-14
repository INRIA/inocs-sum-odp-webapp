import type { ICategory } from "./Category";
import type { ITransportMode } from "./TransportMode";

//Kpi interface is a compilation of tables KPIRESULT, and KPIDEFINITIONS
export interface IKpi {
  //KPIDEFINITIONS
  id: string;
  kpi_number: string;
  parent_kpi_id?: string | null;
  name: string;
  description?: string;
  disclaimer?: string;
  type: EnumKpiType;
  progression_target: number;
  metric: EnumKpiMetricType;
  metric_description?: string;
  min_value?: number;
  max_value?: number;
  categories?: ICategory[]; // Many-to-many relation with categories
}

export interface IKpiResult {
  id: string;
  kpidefinition_id: string;
  living_lab_id: string;
  value: number;
  date: string;
  transport_mode_id?: string;
  transport_mode?: ITransportMode;
}

export interface IKpiResultInput
  extends Pick<
    IKpiResult,
    | "value"
    | "date"
    | "transport_mode_id"
    | "kpidefinition_id"
    | "living_lab_id"
  > {
  id?: string;
}

export enum EnumKpiMetricType {
  PERCENTAGE = "percentage",
  RATIO = "ratio",
  ABSOLUTE = "absolute",
  CUSTOM_UNIT = "custom_unit",
  SCORE = "score",
  NONE = "none",
}

export enum EnumKpiType {
  GLOBAL = "GLOBAL",
  LOCAL = "LOCAL",
}

export interface IIKpiResultBeforeAfter {
  living_lab_id: string;
  kpidefinition_id: string;
  transport_mode_id?: string;
  result_before?: IKpiResult | null;
  result_after?: IKpiResult | null;
}
