import type {
  ILabKpiTimeline,
  ILabPartition,
  ITimelineDataPoint,
  ILivingLabKpiData,
  KpiLivingLabsCardsFilter,
  IKpiGroup,
} from "./types";
import type { IKpi } from "../../../types";
import type { IKpiResult, IKpiResultGroup } from "../../../types/KPIs";
import { normalizeKpiResultGroup } from "../../../lib/utils/kpis";
import {
  getKpiDisplayMode,
  isResultValidated,
} from "../../../lib/utils/kpiSufficiency";

/**
 * Creates a timeline data point from a KPI result if it matches the selected years
 * @returns ITimelineDataPoint if the year is selected, null otherwise
 */
function createTimelineDataPoint(
  result: IKpiResult | null | undefined,
  selectedYears: number[],
): ITimelineDataPoint | null {
  if (!result?.date || !Number.isFinite(result.value)) {
    return null;
  }

  const parsedDate = new Date(result.date);
  const year = parsedDate.getFullYear();
  if (!Number.isFinite(year)) {
    return null;
  }

  if (!selectedYears.includes(year)) {
    return null;
  }

  return {
    year,
    value: result.value,
    date: result.date,
  };
}

/**
 * Processes KPI results (before and after) into an array of timeline data points
 * Filters by selected years
 */
export function processKpiResults(
  kpiResult: Partial<IKpiResultGroup>,
  selectedYears: number[],
): ITimelineDataPoint[] {
  if (!Array.isArray(selectedYears)) {
    return [];
  }

  const normalizedGroup = normalizeKpiResultGroup(
    kpiResult as IKpiResultGroup,
  );

  const dataPoints: ITimelineDataPoint[] = normalizedGroup.results
    .map((result) => createTimelineDataPoint(result, selectedYears))
    .filter((point): point is ITimelineDataPoint => point !== null);

  return dataPoints;
}

/**
 * Builds timeline data for all living labs for a specific KPI.
 * Kept for backwards compatibility — use buildLabPartition for new code.
 * Only includes labs that are selected in the filter and have data points.
 */
export function buildLabTimelines(
  kpi: IKpi,
  livingLabs: ILivingLabKpiData[],
  filter: KpiLivingLabsCardsFilter,
  colorMap: Map<number, string>,
  fallbackColor: string,
): ILabKpiTimeline[] {
  const labTimelines: ILabKpiTimeline[] = [];

  livingLabs.forEach((lab) => {
    if (!filter.selectedLabIds?.includes(lab.id)) {
      return;
    }

    const kpiResult = lab.kpiResults.find((r) => r.kpidefinition_id === kpi.id);

    if (!kpiResult) {
      return;
    }

    const dataPoints = filter.selectedYears
      ? processKpiResults(kpiResult, filter.selectedYears)
      : [];

    if (dataPoints.length > 0) {
      labTimelines.push({
        labId: lab.id,
        labName: lab.name,
        color: colorMap.get(lab.id) || fallbackColor,
        dataPoints,
      });
    }
  });

  return labTimelines;
}

/**
 * Builds partitioned lab data for a single KPI applying the data-sufficiency rule.
 *
 * - Labs with ≥2 validated estimations → chartLabs (rendered as D3 timeline)
 * - Labs with exactly 1 validated estimation → baselineLabs (rendered as table row)
 * - Labs with 0 validated estimations → excluded from both partitions
 *
 * "Validated" means lab.validated_at > kpiresult.updated_at.
 */
export function buildLabPartition(
  kpi: IKpi,
  livingLabs: ILivingLabKpiData[],
  filter: KpiLivingLabsCardsFilter,
  colorMap: Map<number, string>,
  fallbackColor: string,
): ILabPartition {
  const chartLabs: ILabKpiTimeline[] = [];
  const baselineLabs: ILabPartition["baselineLabs"] = [];

  livingLabs.forEach((lab) => {
    if (!filter.selectedLabIds?.includes(lab.id)) return;

    const kpiResult = lab.kpiResults.find(
      (r) => r.kpidefinition_id === kpi.id,
    );
    if (!kpiResult) return;

    const mode = getKpiDisplayMode(kpiResult.results, lab.validated_at);

    if (mode === "chart") {
      const dataPoints = filter.selectedYears
        ? processKpiResults(kpiResult, filter.selectedYears)
        : [];
      if (dataPoints.length > 0) {
        chartLabs.push({
          labId: lab.id,
          labName: lab.name,
          color: colorMap.get(lab.id) || fallbackColor,
          dataPoints,
        });
      }
    } else if (mode === "baseline") {
      const validatedResult = kpiResult.results.find((r) =>
        isResultValidated(r, lab.validated_at),
      );
      if (validatedResult) {
        baselineLabs.push({
          labId: lab.id,
          labName: lab.name,
          color: colorMap.get(lab.id) || fallbackColor,
          result: validatedResult,
        });
      }
    }
    // mode === "hidden" → skip
  });

  return { chartLabs, baselineLabs };
}

/**
 * Builds a map of KPI IDs to partitioned lab data for all filtered KPIs.
 * Applies the data-sufficiency rule: only includes KPIs that have at least
 * one lab with chart-worthy or baseline-worthy data.
 */
export function buildKpiDataMap(
  filteredKpis: IKpi[],
  livingLabs: ILivingLabKpiData[],
  filter: KpiLivingLabsCardsFilter,
  colorMap: Map<number, string>,
  fallbackColor: string,
): Map<number, ILabPartition> {
  const map = new Map<number, ILabPartition>();

  filteredKpis.forEach((kpi) => {
    const partition = buildLabPartition(
      kpi,
      livingLabs,
      filter,
      colorMap,
      fallbackColor,
    );

    if (partition.chartLabs.length > 0 || partition.baselineLabs.length > 0) {
      map.set(kpi.id, partition);
    }
  });

  return map;
}

/**
 * Groups KPIs by parent-child relationships
 * Returns an array of KPI groups (either single KPIs or parent KPIs with their children)
 * @param kpis - Array of all KPIs (including both parent and child KPIs)
 * @returns Array of IKpiGroup objects representing single KPIs or parent-child groupings
 */
export function groupKpisByParentChild(kpis: IKpi[]): IKpiGroup[] {
  const groups: IKpiGroup[] = [];
  const processedKpiIds = new Set<number>();

  const parentKpiMap = new Map<number, IKpi[]>();

  kpis.forEach((kpi) => {
    if (kpi.parent_kpi_id) {
      if (!parentKpiMap.has(kpi.parent_kpi_id)) {
        parentKpiMap.set(kpi.parent_kpi_id, []);
      }
      parentKpiMap.get(kpi.parent_kpi_id)!.push(kpi);
      processedKpiIds.add(kpi.id);
    }
  });

  kpis.forEach((kpi) => {
    if (processedKpiIds.has(kpi.id)) {
      return;
    }

    const childKpis = parentKpiMap.get(kpi.id);

    if (childKpis && childKpis.length > 0) {
      groups.push({
        type: "parent",
        parentKpi: kpi,
        childKpis,
      });
    } else {
      groups.push({
        type: "single",
        kpi,
      });
    }

    processedKpiIds.add(kpi.id);
  });

  return groups;
}
