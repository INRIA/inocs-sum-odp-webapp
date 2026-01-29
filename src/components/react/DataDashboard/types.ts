import type { IIKpiResultBeforeAfter, IKpi } from "../../../types";
import type { ICategory } from "../../../types/Category";

/**
 * Living lab data with KPI results for dashboard display
 */
export interface ILivingLabKpiData {
  id: string;
  name: string;
  kpiResults: IIKpiResultBeforeAfter[];
}

/**
 * Single data point for timeline chart
 */
export interface ITimelineDataPoint {
  year: number;
  value: number;
  date: string;
}

/**
 * Living lab timeline data for a specific KPI
 */
export interface ILabKpiTimeline {
  labId: string;
  labName: string;
  color: string;
  dataPoints: ITimelineDataPoint[];
}

/**
 * Color assignment for a living lab (consistent across all charts)
 */
export interface ILabColorAssignment {
  labId: string;
  labName: string;
  color: string;
}

/**
 * Filter options for KPI cards
 */
export interface KpiLivingLabsCardsFilter {
  selectedLabIds: string[];
  selectedYears: number[];
  selectedCategoryIds: number[];
}

/**
 * Props for DataDashboard main component
 */
export interface DataDashboardProps {
  livingLabs: ILivingLabKpiData[];
  kpis: IKpi[];
  availableYears: number[];
  categories: ICategory[];
}

/**
 * Props for KpiLivingLabsCards component
 */
export interface KpiLivingLabsCardsProps {
  livingLabs: ILivingLabKpiData[];
  kpis: IKpi[];
  filter: KpiLivingLabsCardsFilter;
  labColors: ILabColorAssignment[];
  categories: ICategory[];
}

/**
 * Props for KpiLivingLabsCard component
 */
export interface KpiLivingLabsCardProps {
  kpi: IKpi;
  labTimelines: ILabKpiTimeline[];
}

/**
 * Props for D3TimelineChart component
 */
export interface D3TimelineChartProps {
  data: ILabKpiTimeline[];
  metricType: string;
  height?: number;
}
