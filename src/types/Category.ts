import type { IKpi } from "./KPIs";

export interface ICategory {
  id: number;
  name: string;
  description?: string;
  type: "KPI_SIEF" | "ITEM" | "KPI_IMPACT" | "RESOURCES";
  kpis?: IKpi[]; // Many-to-many relation with KPIs
}

export interface IKpiCategory {
  kpi_id: number;
  category_id: number;
}
