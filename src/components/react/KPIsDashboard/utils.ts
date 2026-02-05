import type {
  ILabKpiTimeline,
  ITimelineDataPoint,
  ILivingLabKpiData,
  KpiLivingLabsCardsFilter,
  IKpiGroup,
} from "./types";
import type { IKpi } from "../../../types";
import type { IKpiResult } from "../../../types/KPIs";

/**
 * Creates a timeline data point from a KPI result if it matches the selected years
 * @returns ITimelineDataPoint if the year is selected, null otherwise
 */
function createTimelineDataPoint(
  result: IKpiResult | null | undefined,
  selectedYears: number[],
): ITimelineDataPoint | null {
  if (!result?.date || result.value === undefined) {
    return null;
  }

  const year = new Date(result.date).getFullYear();
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
  kpiResult: {
    result_before?: IKpiResult | null;
    result_after?: IKpiResult | null;
  },
  selectedYears: number[],
): ITimelineDataPoint[] {
  const dataPoints: ITimelineDataPoint[] = [];

  const beforePoint = createTimelineDataPoint(
    kpiResult.result_before,
    selectedYears,
  );
  if (beforePoint) {
    dataPoints.push(beforePoint);
  }

  const afterPoint = createTimelineDataPoint(
    kpiResult.result_after,
    selectedYears,
  );
  if (afterPoint) {
    dataPoints.push(afterPoint);
  }

  return dataPoints;
}

/**
 * Builds timeline data for all living labs for a specific KPI
 * Only includes labs that are selected in the filter and have data points
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
    // Skip if lab is not selected
    if (!filter.selectedLabIds?.includes(lab.id)) {
      return;
    }

    // Find KPI result for this lab and KPI
    const kpiResult = lab.kpiResults.find((r) => r.kpidefinition_id === kpi.id);

    if (!kpiResult) {
      return;
    }

    const dataPoints = filter.selectedYears
      ? processKpiResults(kpiResult, filter.selectedYears)
      : [];

    // Only add if there are data points
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
 * Builds a map of KPI IDs to lab timelines for all filtered KPIs
 * Only includes KPIs that have at least one lab with data
 */
export function buildKpiDataMap(
  filteredKpis: IKpi[],
  livingLabs: ILivingLabKpiData[],
  filter: KpiLivingLabsCardsFilter,
  colorMap: Map<number, string>,
  fallbackColor: string,
): Map<number, ILabKpiTimeline[]> {
  const map = new Map<number, ILabKpiTimeline[]>();

  filteredKpis.forEach((kpi) => {
    const labTimelines = buildLabTimelines(
      kpi,
      livingLabs,
      filter,
      colorMap,
      fallbackColor,
    );

    if (labTimelines.length > 0) {
      map.set(kpi.id, labTimelines);
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
  const processedKpiIds = new Set<string>();

  // First, identify all parent KPIs and group their children
  const parentKpiMap = new Map<string, IKpi[]>(); // Map parent ID to child KPIs

  kpis.forEach((kpi) => {
    if (kpi.parent_kpi_id) {
      // This is a child KPI
      if (!parentKpiMap.has(kpi.parent_kpi_id)) {
        parentKpiMap.set(kpi.parent_kpi_id, []);
      }
      parentKpiMap.get(kpi.parent_kpi_id)!.push(kpi);
      processedKpiIds.add(kpi.id);
    }
  });

  // Now process all KPIs
  kpis.forEach((kpi) => {
    // Skip if already processed as a child
    if (processedKpiIds.has(kpi.id)) {
      return;
    }

    // Check if this KPI has children
    const childKpis = parentKpiMap.get(kpi.id);

    if (childKpis && childKpis.length > 0) {
      // This is a parent KPI with children
      groups.push({
        type: "parent",
        parentKpi: kpi,
        childKpis,
      });
    } else {
      // This is a single KPI (no parent, no children)
      groups.push({
        type: "single",
        kpi,
      });
    }

    processedKpiIds.add(kpi.id);
  });

  return groups;
}
