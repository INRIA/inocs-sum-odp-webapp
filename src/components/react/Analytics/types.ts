/**
 * Shared TypeScript interfaces for Platform Analytics Dashboard components.
 * All data structures are computed server-side in analytics.ts helpers
 * and passed as props to React components.
 */

/**
 * Data for a single summary metric card (User Story 1)
 */
export interface MetricCardData {
  /** Display label, e.g. "Living Labs", "Users (active / pending)" */
  label: string;
  /** Primary display value, e.g. "12", "45 / 3" */
  value: string;
  /** Optional icon identifier */
  icon?: string;
  /** Optional Tailwind color class, e.g. "text-primary" */
  color?: string;
}

/**
 * Data for the D3 line chart — one series per living lab (User Story 2)
 */
export interface LabKpiTimelineSeries {
  labId: number;
  labName: string;
  color: string;
  dataPoints: Array<{ year: number; count: number }>;
}

/**
 * One row in the living lab metrics table (User Story 2)
 */
export interface LivingLabMetricsRow {
  labId: number;
  labName: string;
  /** All KPI results (including child KPIs) */
  totalResultEntries: number;
  /** Distinct main/parent KPIs with results */
  kpisCoveredCount: number;
  kpisGlobalCoveredCount: number;
  kpisLocalCoveredCount: number;
  /** Total main/parent KPI definitions */
  totalMainKpis: number;
  pushMeasuresCount: number;
  pullMeasuresCount: number;
  /** ISO date string or null */
  lastUpdatedAt: string | null;
}

/**
 * Data for the D3 bar chart — one group per living lab (User Story 3)
 */
export interface LabMeasuresBarData {
  labName: string;
  pushCount: number;
  pullCount: number;
}

/**
 * One row in the KPI coverage table (User Story 4)
 */
export interface KpiCoverageRow {
  kpiId: number;
  /** e.g. "1", "2", "3" */
  kpiNumber: string;
  kpiName: string;
  kpiType: "GLOBAL" | "LOCAL";
  /** How many labs have submitted results */
  labsWithResultsCount: number;
  /** Total number of labs as a reference */
  totalLabs: number;
}

/**
 * Data for a single analytics alert card (Phase 7)
 */
export interface AlertCardData {
  /** e.g. "Labs with no KPI results" */
  label: string;
  /** Count */
  value: number;
  severity: "warning" | "danger" | "info";
  /** Optional list of affected entity names */
  items?: string[];
}
