import type {
  IIKpiResultBeforeAfter,
  IKpi,
  ITransportMode,
} from "../../../types";
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
 * Map of KPI IDs to their lab timelines
 */
export type IKpiTimelineMap = Map<string, ILabKpiTimeline[]>;

/**
 * Represents a single KPI (no parent-child relationship)
 */
export interface ISingleKpiGroup {
  type: "single";
  kpi: IKpi;
}

/**
 * Represents a parent KPI with child KPIs
 */
export interface IParentKpiGroup {
  type: "parent";
  parentKpi: IKpi;
  childKpis: IKpi[];
}

/**
 * Union type for KPI groups (single or parent-child)
 */
export type IKpiGroup = ISingleKpiGroup | IParentKpiGroup;

/**
 * Modal split data for a single living lab (used by ModalSplitLivingLabsCard)
 */
export interface IModalSplitLabData {
  labId: string;
  labName: string;
  before: {
    label: string;
    data: { label: string; value: number; color: string }[];
  };
  after: {
    label: string;
    data: { label: string; value: number; color: string }[];
  };
}
/**
 * Modal split data for a specific KPI across all living labs
 */
export interface IModalSplitKpiData {
  kpiId: string;
  kpiNumber: string;
  kpiName: string;
  labs: IModalSplitLabData[];
}

/**
 * Props for KPIsDashboard main component
 */
export interface KPIsDashboardProps {
  livingLabs: ILivingLabKpiData[];
  kpis: IKpi[];
  availableYears: number[];
  categories: ICategory[];
  /** Pre-processed modal split data (computed on SSR for performance) */
  modalSplitData?: IModalSplitKpiData[];
  /** Transport modes with labels and colors for modal split legend */
  transportModes?: ITransportMode[];
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
 * Props for KpiLivingLabsSingleCard component
 */
export interface KpiLivingLabsCardProps {
  kpi: IKpi;
  labTimelines: ILabKpiTimeline[];
}

/**
 * Props for KpiLivingLabsMultipleCard component (parent with children)
 */
export interface KpiLivingLabsMultipleCardProps {
  parentKpi: IKpi;
  childKpis: IKpi[];
  kpiTimelineMap: IKpiTimelineMap;
  className?: string;
}

/**
 * Props for D3TimelineChart component
 */
export interface D3TimelineChartProps {
  data: ILabKpiTimeline[];
  metricType: string;
  height?: number;
  showLegend?: boolean;
}

/**
 * Facet data for D3FacetedTimelineChart
 * Each facet represents a child KPI's timeline
 */
export interface IFacetData {
  kpiId: string;
  kpiName: string;
  labTimelines: ILabKpiTimeline[];
}

/**
 * Props for D3FacetedTimelineChart component
 * Displays multiple facets in a unified chart with shared axis
 */
export interface D3FacetedTimelineChartProps {
  facets: IFacetData[];
  metricType: string;
  facetHeight?: number;
  showLegend?: boolean;
}

/**
 * Props for ModalSplitLivingLabsCard component
 * Displays modal split data for a single KPI across all living labs
 */
export interface ModalSplitLivingLabsCardProps {
  kpiId: string;
  kpiNumber: string;
  kpiName: string;
  labs: {
    labId: string;
    labName: string;
    before: {
      label: string;
      data: { label: string; value: number; color: string }[];
    };
    after: {
      label: string;
      data: { label: string; value: number; color: string }[];
    };
  }[];
  filter: KpiLivingLabsCardsFilter;
}

/**
 * Props for ModalSplitLivingLabsCards component
 * Displays all modal split KPIs in a grid layout
 */
export interface ModalSplitLivingLabsCardsProps {
  modalSplitData: IModalSplitKpiData[];
  filter: KpiLivingLabsCardsFilter;
  /** Transport modes with labels and colors for legend display */
  transportModes: ITransportMode[];
}
