import type { ILivingLabPopulated } from "../../types/LivingLab";
import type { IKpi } from "../../types/KPIs";
import type { IKpiResultGroup } from "../../types/KPIs";

export type CellState = "before-after" | "baseline-only" | "none";

export interface MatrixCell {
  labId: number;
  kpiGroupId: string;
  state: CellState;
  label: string;
}

export interface KpiGroupEntry {
  id: string;
  name: string;
  kpiIds: number[];
}

export interface CoverageMatrixData {
  labs: { id: number; name: string }[];
  kpiGroups: KpiGroupEntry[];
  cells: MatrixCell[];
}

function groupKpisByCategory(kpiDefs: IKpi[]): KpiGroupEntry[] {
  const map = new Map<string, { name: string; kpiIds: number[] }>();
  for (const kpi of kpiDefs) {
    const cat = kpi.categories?.[0];
    const groupId = cat ? String(cat.id) : "uncategorised";
    const groupName = cat?.name ?? "Uncategorised";
    if (!map.has(groupId)) {
      map.set(groupId, { name: groupName, kpiIds: [] });
    }
    map.get(groupId)!.kpiIds.push(kpi.id);
  }
  return Array.from(map.entries()).map(([id, v]) => ({ id, name: v.name, kpiIds: v.kpiIds }));
}

function countValidated(
  groups: IKpiResultGroup[],
  kpiIds: Set<number>,
  labValidatedAt: Date | null | undefined,
): number {
  let count = 0;
  for (const g of groups) {
    if (!kpiIds.has(g.kpidefinition_id)) continue;
    if (!labValidatedAt) continue;
    const hasResult =
      g.result_before != null || g.result_after != null;
    if (hasResult) count++;
  }
  return count;
}

export function buildCoverageMatrix(
  labs: ILivingLabPopulated[],
  kpiDefs: IKpi[],
): CoverageMatrixData {
  const kpiGroups = groupKpisByCategory(kpiDefs);
  const cells: MatrixCell[] = [];

  for (const lab of labs) {
    const labId = Number(lab.id);
    const kpiResultGroups = (lab.kpi_results ?? []) as IKpiResultGroup[];
    const labValidatedAt = lab.validated_at as Date | null | undefined;

    for (const group of kpiGroups) {
      const kpiIdSet = new Set(group.kpiIds);
      const validated = countValidated(kpiResultGroups, kpiIdSet, labValidatedAt);

      let state: CellState;
      let label: string;
      if (validated >= 2) {
        state = "before-after";
        label = "Before & after";
      } else if (validated === 1) {
        state = "baseline-only";
        label = "Baseline only";
      } else {
        state = "none";
        label = "—";
      }

      cells.push({ labId, kpiGroupId: group.id, state, label });
    }
  }

  return {
    labs: labs.map((l) => ({ id: Number(l.id), name: l.name })),
    kpiGroups,
    cells,
  };
}
