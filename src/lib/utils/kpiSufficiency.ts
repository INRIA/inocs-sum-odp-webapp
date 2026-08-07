import type { IKpiResult } from "../../types/KPIs";

/**
 * The minimum number of validated estimations required to render a KPI as a chart.
 */
export const CHART_THRESHOLD = 2;

/**
 * Returns true if a KPI result is considered "validated" for a given lab.
 *
 * Validation rule:
 *   lab_validated_at > kpi_result.updated_at
 *
 * If either timestamp is absent the result is treated as NOT validated
 * (conservative default: do not promote data whose freshness cannot be confirmed).
 */
export function isResultValidated(
  result: IKpiResult,
  labValidatedAt: Date | null | undefined,
): boolean {
  if (!labValidatedAt || !result.updated_at) return false;
  const labTs = new Date(labValidatedAt).getTime();
  const kpiTs = new Date(result.updated_at).getTime();
  return labTs > kpiTs;
}

/**
 * Counts how many results in the array are validated for the given lab.
 */
export function countValidatedResults(
  results: IKpiResult[],
  labValidatedAt: Date | null | undefined,
): number {
  return results.filter((r) => isResultValidated(r, labValidatedAt)).length;
}

/**
 * Describes the display mode for a KPI result group.
 *
 * - "chart"    → >= CHART_THRESHOLD validated results  → render as chart
 * - "baseline" → exactly 1 validated result            → render as baseline row
 * - "hidden"   → 0 validated results                   → do not render
 */
export type KpiDisplayMode = "chart" | "baseline" | "hidden";

export function getKpiDisplayMode(
  results: IKpiResult[],
  labValidatedAt: Date | null | undefined,
): KpiDisplayMode {
  const count = countValidatedResults(results, labValidatedAt);
  if (count >= CHART_THRESHOLD) return "chart";
  if (count === 1) return "baseline";
  return "hidden";
}
