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
): MetricCardData[] {
  const mainKpis = getMainKpis(kpis);
  
  // Count users by status
  const activeUsers = users.filter((u) => u.status === "active").length;
  const pendingUsers = users.filter((u) => u.status === "signup").length;
  
  // Count total KPI results across all labs
  const totalKpiResults = labs.reduce((sum, lab) => {
    const resultCount = lab.kpi_results?.reduce(
      (groupSum, group) => groupSum + (group.results?.length ?? 0),
      0
    ) ?? 0;
    return sum + resultCount;
  }, 0);
  
  // Count total measures adopted (living_lab_projects_implementation)
  const totalMeasures = labs.reduce((sum, lab) => {
    return sum + (lab.living_lab_projects_implementation?.length ?? 0);
  }, 0);
  
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
      color: "text-secondary",
    },
    {
      label: "KPI Definitions",
      value: String(mainKpis.length),
      icon: "chart",
      color: "text-info",
    },
    {
      label: "KPI Results Submitted",
      value: String(totalKpiResults),
      icon: "clipboard",
      color: "text-success",
    },
    {
      label: "Measures Adopted",
      value: String(totalMeasures),
      icon: "check",
      color: "text-warning",
    },
  ];
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
  
  return labs.map((lab) => {
    // Count all KPI results for this lab
    const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
    const totalResultEntries = allResults.length;
    
    // Find distinct parent KPIs covered
    const coveredParentIds = new Set<number>();
    for (const result of allResults) {
      const parentId = parentMap.get(result.kpidefinition_id);
      if (parentId !== undefined) {
        coveredParentIds.add(parentId);
      }
    }
    const kpisCoveredCount = coveredParentIds.size;
    
    // Count measures by type
    const implementations = lab.living_lab_projects_implementation ?? [];
    const pushMeasuresCount = implementations.filter(
      (impl) => impl.project?.type === "PUSH"
    ).length;
    const pullMeasuresCount = implementations.filter(
      (impl) => impl.project?.type === "PULL"
    ).length;
    
    // Find last updated date (max of all KPI result dates and measure dates)
    const dates: Date[] = [];
    
    for (const result of allResults) {
      if (result.date) {
        dates.push(new Date(result.date));
      }
    }
    
    for (const impl of implementations) {
      if (impl.start_at) dates.push(new Date(impl.start_at));
      if (impl.updated_at) dates.push(new Date(impl.updated_at));
    }
    
    const lastUpdatedAt = dates.length > 0
      ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString()
      : null;
    
    return {
      labId: lab.id,
      labName: lab.name,
      totalResultEntries,
      kpisCoveredCount,
      totalMainKpis,
      pushMeasuresCount,
      pullMeasuresCount,
      lastUpdatedAt,
    };
  });
}

/**
 * Compute the D3 line chart data for KPI results over time per lab (User Story 2).
 */
export function computeLabKpiTimeline(
  labs: ILivingLabPopulated[],
): LabKpiTimelineSeries[] {
  // Color palette for labs (will cycle if more labs than colors)
  const colors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#06B6D4", // cyan
    "#F97316", // orange
    "#EC4899", // pink
  ];
  
  return labs.map((lab, index) => {
    // Group results by year
    const yearCounts = new Map<number, number>();
    
    const allResults = lab.kpi_results?.flatMap((g) => g.results ?? []) ?? [];
    for (const result of allResults) {
      if (result.date) {
        const year = new Date(result.date).getFullYear();
        yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
      }
    }
    
    // Convert to sorted array of data points
    const dataPoints = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
    
    return {
      labId: lab.id,
      labName: lab.name,
      color: colors[index % colors.length],
      dataPoints,
    };
  });
}

/**
 * Compute the D3 bar chart data for measures per lab (User Story 3).
 */
export function computeLabMeasuresBar(
  labs: ILivingLabPopulated[],
): LabMeasuresBarData[] {
  return labs.map((lab) => {
    const implementations = lab.living_lab_projects_implementation ?? [];
    const pushCount = implementations.filter(
      (impl) => impl.project?.type === "PUSH"
    ).length;
    const pullCount = implementations.filter(
      (impl) => impl.project?.type === "PULL"
    ).length;
    
    return {
      labName: lab.name,
      pushCount,
      pullCount,
    };
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
  
  return mainKpis.map((kpi) => ({
    kpiId: kpi.id,
    kpiNumber: kpi.kpi_number,
    kpiName: kpi.name,
    kpiType: kpi.type as "GLOBAL" | "LOCAL",
    labsWithResultsCount: kpiLabsMap.get(kpi.id)?.size ?? 0,
    totalLabs,
  }));
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
