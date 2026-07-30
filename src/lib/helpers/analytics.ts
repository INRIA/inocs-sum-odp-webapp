/**
 * Analytics computation helpers for the Platform Analytics Dashboard.
 *
 * All functions are pure computations that transform raw API data
 * into display-ready structures for React components.
 * These run server-side in Astro frontmatter (SSR).
 */

import type {
  IKpi,
  ILivingLabPopulated,
  IProject,
  User,
  IKpiResultGroup,
  LivingLabProjectsImplementation,
} from "../../types";
import type {
  MetricCardData,
  LabKpiTimelineSeries,
  LivingLabMetricsRow,
  LabMeasuresBarData,
  KpiCoverageRow,
  AlertCardData,
} from "../../components/react/Analytics/types";
import { formatDateOToMonthYear } from "./format";
import { generateLabColorsWithSeed } from "./colorUtils";

/**
 * Safely parse a date string. Returns null if invalid.
 */
function safeParseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get the maximum date from an array of dates.
 * Returns null if array is empty.
 */
function getMaxDate(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  const maxTimestamp = Math.max(...dates.map((d) => d.getTime()));
  return new Date(maxTimestamp);
}

/**
 * Filter to get only main/parent KPI definitions (those without a parent_kpi_id).
 */
export function getMainKpis(kpis: IKpi[]): IKpi[] {
  return kpis.filter((k) => !k.parent_kpi_id);
}

/**
 * Build a mapping from child KPI IDs to their parent KPI IDs.
 * Parent KPIs map to themselves.
 */
export function buildKpiParentMap(kpis: IKpi[]): Map<number, number> {
  const parentMap = new Map<number, number>();
  for (const kpi of kpis) {
    if (kpi.parent_kpi_id) {
      parentMap.set(kpi.id, kpi.parent_kpi_id);
    } else {
      parentMap.set(kpi.id, kpi.id);
    }
  }
  return parentMap;
}

/**
 * Compute the 5 metric cards for the platform overview (User Story 1).
 *
 * Cards:
 * 1. Living Labs count
 * 2. Users (active / pending)
 * 3. KPI Definitions count
 * 4. KPI Results submitted count
 * 5. Measures adopted count
 */
export function computeMetricCards(
  labs: ILivingLabPopulated[],
  kpis: IKpi[],
  users: User[],
  measures: IProject[],
): MetricCardData[] {
  const mainKpis = getMainKpis(kpis);
  const globalKpis = mainKpis.filter((k) => k.type === "GLOBAL");
  const localKpis = mainKpis.filter((k) => k.type === "LOCAL");
  const parentMap = buildKpiParentMap(kpis);

  // Count users by status
  const activeUsers = users.filter((u) => u.status === "active").length;
  const pendingUsers = users.filter((u) => u.status === "signup").length;

  // Count total KPI results across all labs
  const totalKpiResults = labs.reduce((sum, lab) => {
    const resultCount =
      lab.kpi_results?.reduce(
        (groupSum, group) => groupSum + (group.results?.length ?? 0),
        0,
      ) ?? 0;
    return sum + resultCount;
  }, 0);

  // Count total measures adopted (living_lab_projects_implementation)
  const uniqueMeasures: Set<number> = new Set();

  labs.forEach((lab) =>
    lab.living_lab_projects_implementation?.forEach((impl) =>
      uniqueMeasures.add(impl.project_id),
    ),
  );
  const coveredParentIds = new Set<number>();
  const coveredGlobalKpi = new Set<number>();
  const coveredLocalKpi = new Set<number>();

  labs.forEach((lab) => {
    // Count all KPI results for this lab
    const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
    // Find distinct parent KPIs covered

    for (const result of allResults) {
      const parentId = parentMap.get(result.kpidefinition_id);
      const kpi = mainKpis.find((k) => k.id === parentId);
      if (parentId !== undefined) {
        coveredParentIds.add(parentId);
        if (kpi?.type === "LOCAL") coveredLocalKpi.add(parentId);
        if (kpi?.type === "GLOBAL") coveredGlobalKpi.add(parentId);
      }
    }
  });
  const kpiCoverage = coveredParentIds.size / mainKpis.length;
  const kpiGlobalCoverage = coveredGlobalKpi.size / globalKpis.length;
  const kpiLocalCoverage = coveredLocalKpi.size / localKpis.length;
  return [
    {
      label: "Living Labs",
      value: String(labs.length),
      icon: "building",
      color: "text-primary",
    },
    {
      label: "Users (active / pending)",
      value: `${activeUsers} / ${pendingUsers}`,
      icon: "users",
      color: "text-primary",
    },
    {
      label: "Total measures identified",
      value: String(measures.length),
      icon: "check",
      color: "text-primary",
    },
    {
      label: "Total measures implemented",
      value: String(uniqueMeasures.size),
      icon: "check",
      color: "text-success",
    },
    {
      label: "Total KPIs coverage",
      value: `${toPercentage(kpiCoverage)} (${coveredParentIds.size}/${mainKpis.length})`,
      icon: "chart",
      color: kpiCoverage < 0.5 ? "text-danger" : "text-success",
    },
    {
      label: "Global KPIs coverage",
      value: `${toPercentage(kpiGlobalCoverage)} (${coveredGlobalKpi.size}/${globalKpis.length})`,
      icon: "chart",
      color: kpiGlobalCoverage < 0.5 ? "text-danger" : "text-success",
    },
    {
      label: "Local KPIs coverage",
      value: `${toPercentage(kpiLocalCoverage)} (${coveredLocalKpi.size}/${localKpis.length})`,
      icon: "chart",
      color: kpiLocalCoverage < 0.5 ? "text-danger" : "text-success",
    },
    {
      label: "Total KPI results entries recorded",
      value: String(totalKpiResults),
      icon: "clipboard",
      color: "text-success",
    },
  ];
}

function toPercentage(value: number): string {
  return String(Math.round(value * 100)) + "%";
}
/**
 * Compute the living lab metrics table rows (User Story 2).
 */
export function computeLabMetricsTable(
  labs: ILivingLabPopulated[],
  kpis: IKpi[],
): LivingLabMetricsRow[] {
  const mainKpis = getMainKpis(kpis);
  const parentMap = buildKpiParentMap(kpis);
  const totalMainKpis = mainKpis.length;

  return labs
    .map((lab) => {
      // Count all KPI results for this lab
      const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
      const totalResultEntries = allResults.length;

      // Find distinct parent KPIs covered
      const coveredParentIds = new Set<number>();
      const coveredGlobalKpi = new Set<number>();
      const coveredLocalKpi = new Set<number>();
      for (const result of allResults) {
        const parentId = parentMap.get(result.kpidefinition_id);
        const kpi = mainKpis.find((k) => k.id === parentId);
        if (parentId !== undefined) {
          coveredParentIds.add(parentId);
          if (kpi?.type === "LOCAL") coveredLocalKpi.add(parentId);
          if (kpi?.type === "GLOBAL") coveredGlobalKpi.add(parentId);
        }
      }
      const kpisCoveredCount = coveredParentIds.size;

      // Count measures by type
      const implementations = lab.living_lab_projects_implementation ?? [];
      const pushMeasuresCount = implementations.filter(
        (impl) => impl.project?.type === "PUSH",
      ).length;
      const pullMeasuresCount = implementations.filter(
        (impl) => impl.project?.type === "PULL",
      ).length;

      // Find last updated date (max of all KPI result dates and measure dates)
      const dates: Date[] = [];

      for (const result of allResults) {
        const parsedDate = safeParseDate(
          result.updated_at ?? result.created_at,
        );
        if (parsedDate) dates.push(parsedDate);
      }

      for (const impl of implementations) {
        const updateDate = safeParseDate(impl.updated_at);
        if (updateDate) dates.push(updateDate);
      }

      const maxDate = getMaxDate(dates);
      const lastUpdatedAt = maxDate ? formatDateOToMonthYear(maxDate) : null;

      return {
        labId: lab.id,
        labName: lab.name,
        totalResultEntries,
        kpisCoveredCount,
        kpisGlobalCoveredCount: coveredGlobalKpi.size,
        kpisLocalCoveredCount: coveredLocalKpi.size,
        totalMainKpis,
        pushMeasuresCount,
        pullMeasuresCount,
        lastUpdatedAt,
      };
    })
    .sort((a, b) => b.totalResultEntries - a.totalResultEntries);
}

/**
 * Compute the D3 line chart data for KPI results over time per lab (User Story 2).
 */
export function computeLabKpiTimeline(
  labs: ILivingLabPopulated[],
): LabKpiTimelineSeries[] {
  const labColorAssignments = generateLabColorsWithSeed(
    labs.map((lab) => ({ id: lab.id, name: lab.name })),
  );

  return labs.flatMap((lab) => {
    // Group results by year
    const yearCounts = new Map<number, number>();

    const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
    for (const result of allResults) {
      const parsedDate = safeParseDate(result.date);
      if (parsedDate) {
        const year = parsedDate.getFullYear();
        yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
      }
    }

    if (allResults.length === 0) {
      return [];
    }

    // Convert to sorted array of data points
    const dataPoints = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    const colorAssignment = labColorAssignments.find(
      (assignment) => assignment.labId === lab.id,
    );

    return [
      {
        labId: lab.id,
        labName: lab.name,
        color: colorAssignment?.color ?? "#3B82F6",
        dataPoints,
      },
    ];
  });
}

/**
 * Compute the D3 bar chart data for measures per lab (User Story 3).
 */
export function computeLabMeasuresBar(
  labs: ILivingLabPopulated[],
): LabMeasuresBarData[] {
  return labs.flatMap((lab) => {
    const implementations = lab.living_lab_projects_implementation ?? [];
    const pushCount = implementations.filter(
      (impl) => impl.project?.type === "PUSH",
    ).length;
    const pullCount = implementations.filter(
      (impl) => impl.project?.type === "PULL",
    ).length;

    if (pushCount + pullCount === 0) {
      return [];
    }

    return [
      {
        labName: lab.name,
        pushCount,
        pullCount,
      },
    ];
  });
}

/**
 * Compute the KPI coverage table rows (User Story 4).
 */
export function computeKpiCoverageTable(
  labs: ILivingLabPopulated[],
  kpis: IKpi[],
): KpiCoverageRow[] {
  const mainKpis = getMainKpis(kpis);
  const parentMap = buildKpiParentMap(kpis);
  const totalLabs = labs.length;

  // Build a map: parentKpiId -> Set of labIds that have results
  const kpiLabsMap = new Map<number, Set<number>>();

  for (const lab of labs) {
    const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
    for (const result of allResults) {
      const parentId = parentMap.get(result.kpidefinition_id);
      if (parentId !== undefined) {
        if (!kpiLabsMap.has(parentId)) {
          kpiLabsMap.set(parentId, new Set());
        }
        kpiLabsMap.get(parentId)!.add(lab.id);
      }
    }
  }

  const isSingleLab = labs.length === 1;

  return mainKpis
    .sort((a, b) => sortKpiNumbers(a.kpi_number, b.kpi_number))
    .map((kpi) => {
      const base = {
        kpiId: kpi.id,
        kpiNumber: kpi.kpi_number,
        kpiName: kpi.name,
        kpiType: kpi.type as "GLOBAL" | "LOCAL",
        labsWithResultsCount: kpiLabsMap.get(kpi.id)?.size ?? 0,
        totalLabs,
      };

      if (!isSingleLab) return base;

      // Single-lab mode: compute entries count and years covered for this KPI
      const lab = labs[0];
      const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
      const kpiResults = allResults.filter((r) => {
        const parentId = parentMap.get(r.kpidefinition_id);
        return parentId === kpi.id;
      });
      const years = new Set<number>();
      for (const r of kpiResults) {
        const d = r.date ? new Date(r.date) : null;
        if (d && !isNaN(d.getTime())) {
          years.add(d.getFullYear());
        }
      }

      return {
        ...base,
        entriesCount: kpiResults.length,
        yearsCovered: Array.from(years).sort((a, b) => a - b),
      };
    });
}

function sortKpiNumbers(kpiA: string, kpiB: string) {
  const a = kpiA?.includes(".") ? kpiA.split(".")[0] : kpiA;
  const b = kpiB?.includes(".") ? kpiB.split(".")[0] : kpiB;
  return Number(a) < Number(b) ? -1 : 1;
}

/**
 * Compute analytics alerts for anomalies (Phase 7).
 */
export function computeAlerts(
  labs: ILivingLabPopulated[],
  kpis: IKpi[],
  users: User[],
): AlertCardData[] {
  const alerts: AlertCardData[] = [];
  const mainKpis = getMainKpis(kpis);
  const parentMap = buildKpiParentMap(kpis);

  // Labs with no KPI results
  const labsNoKpis = labs.filter((lab) => {
    const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
    return allResults.length === 0;
  });
  if (labsNoKpis.length > 0) {
    alerts.push({
      label: "Labs with no KPI results",
      value: labsNoKpis.length,
      severity: "warning",
      items: labsNoKpis.map((l) => l.name),
    });
  }

  // Labs with no measures
  const labsNoMeasures = labs.filter((lab) => {
    return (lab.living_lab_projects_implementation?.length ?? 0) === 0;
  });
  if (labsNoMeasures.length > 0) {
    alerts.push({
      label: "Labs with no measures",
      value: labsNoMeasures.length,
      severity: "warning",
      items: labsNoMeasures.map((l) => l.name),
    });
  }

  // KPIs with no results from any lab
  const coveredParentIds = new Set<number>();
  for (const lab of labs) {
    const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
    for (const result of allResults) {
      const parentId = parentMap.get(result.kpidefinition_id);
      if (parentId !== undefined) {
        coveredParentIds.add(parentId);
      }
    }
  }
  const uncoveredKpis = mainKpis.filter((kpi) => !coveredParentIds.has(kpi.id));
  if (uncoveredKpis.length > 0) {
    alerts.push({
      label: "KPIs with no results",
      value: uncoveredKpis.length,
      severity: "info",
      items: uncoveredKpis.map((k) => `${k.kpi_number}: ${k.name}`),
    });
  }

  // Pending users
  const pendingUsers = users.filter((u) => u.status === "signup");
  if (pendingUsers.length > 0) {
    alerts.push({
      label: "Pending user signups",
      value: pendingUsers.length,
      severity: "info",
      items: pendingUsers.map((u) => u.email),
    });
  }

  return alerts;
}

/**
 * Compute metric cards scoped to a single living lab.
 *
 * Cards:
 * 1. Total KPI result entries recorded
 * 2. Overall KPI coverage (parent KPIs with ≥1 result / total parent KPIs)
 * 3. Global KPI coverage
 * 4. Local KPI coverage
 * 5. Measures implemented (PUSH count / PULL count)
 */
export function computePerLabMetricCards(
  lab: ILivingLabPopulated,
  kpis: IKpi[],
): MetricCardData[] {
  const mainKpis = getMainKpis(kpis);
  const globalKpis = mainKpis.filter((k) => k.type === "GLOBAL");
  const localKpis = mainKpis.filter((k) => k.type === "LOCAL");
  const parentMap = buildKpiParentMap(kpis);

  const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
  const totalResultEntries = allResults.length;

  const coveredParentIds = new Set<number>();
  const coveredGlobalKpi = new Set<number>();
  const coveredLocalKpi = new Set<number>();

  for (const result of allResults) {
    const parentId = parentMap.get(result.kpidefinition_id);
    const kpi = mainKpis.find((k) => k.id === parentId);
    if (parentId !== undefined) {
      coveredParentIds.add(parentId);
      if (kpi?.type === "LOCAL") coveredLocalKpi.add(parentId);
      if (kpi?.type === "GLOBAL") coveredGlobalKpi.add(parentId);
    }
  }

  const kpiCoverage =
    mainKpis.length > 0 ? coveredParentIds.size / mainKpis.length : 0;
  const kpiGlobalCoverage =
    globalKpis.length > 0 ? coveredGlobalKpi.size / globalKpis.length : 0;
  const kpiLocalCoverage =
    localKpis.length > 0 ? coveredLocalKpi.size / localKpis.length : 0;

  const implementations = lab.living_lab_projects_implementation ?? [];
  const pushCount = implementations.filter(
    (impl) => impl.project?.type === "PUSH",
  ).length;
  const pullCount = implementations.filter(
    (impl) => impl.project?.type === "PULL",
  ).length;

  return [
    {
      label: "KPI result entries recorded",
      value: String(totalResultEntries),
      icon: "clipboard",
      color: "text-success",
    },
    {
      label: "Overall KPI coverage",
      value: `${toPercentage(kpiCoverage)} (${coveredParentIds.size}/${mainKpis.length})`,
      icon: "chart",
      color: kpiCoverage < 0.5 ? "text-danger" : "text-success",
    },
    {
      label: "Global KPI coverage",
      value: `${toPercentage(kpiGlobalCoverage)} (${coveredGlobalKpi.size}/${globalKpis.length})`,
      icon: "chart",
      color: kpiGlobalCoverage < 0.5 ? "text-danger" : "text-success",
    },
    {
      label: "Local KPI coverage",
      value: `${toPercentage(kpiLocalCoverage)} (${coveredLocalKpi.size}/${localKpis.length})`,
      icon: "chart",
      color: kpiLocalCoverage < 0.5 ? "text-danger" : "text-success",
    },
    {
      label: "Measures implemented (PUSH / PULL)",
      value: `${pushCount} / ${pullCount}`,
      icon: "check",
      color: pushCount + pullCount === 0 ? "text-danger" : "text-success",
    },
  ];
}

/**
 * Compute analytics alerts scoped to a single living lab.
 *
 * Alerts:
 * - KPIs with no results for this lab
 * - No measures recorded
 */
export function computePerLabAlerts(
  lab: ILivingLabPopulated,
  kpis: IKpi[],
): AlertCardData[] {
  const alerts: AlertCardData[] = [];
  const mainKpis = getMainKpis(kpis);
  const parentMap = buildKpiParentMap(kpis);

  // Find covered parent KPI IDs for this lab
  const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
  const coveredParentIds = new Set<number>();
  for (const result of allResults) {
    const parentId = parentMap.get(result.kpidefinition_id);
    if (parentId !== undefined) {
      coveredParentIds.add(parentId);
    }
  }

  // KPIs with no results for this lab
  const missingKpis = mainKpis.filter((kpi) => !coveredParentIds.has(kpi.id));
  if (missingKpis.length > 0) {
    alerts.push({
      label: "KPIs with no results",
      value: missingKpis.length,
      severity: missingKpis.length > mainKpis.length / 2 ? "warning" : "info",
      items: missingKpis.map((k) => `${k.kpi_number}: ${k.name}`),
    });
  }

  // No measures recorded
  const implementationsCount =
    lab.living_lab_projects_implementation?.length ?? 0;
  if (implementationsCount === 0) {
    alerts.push({
      label: "No measures recorded",
      value: 0,
      severity: "warning",
    });
  }

  return alerts;
}
