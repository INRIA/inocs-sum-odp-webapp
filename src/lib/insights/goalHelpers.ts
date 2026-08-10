import type { IJobRunImpactAnalysisSuccess, ILivingLab } from "../../types";
import type { Goal } from "./goals";

function matchesGoal(groupName: string, goal: Goal): boolean {
  const lower = groupName.toLowerCase();
  return goal.kpiGroupPatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

export function getGroupsForGoal(
  goal: Goal,
  successItems: IJobRunImpactAnalysisSuccess[],
): IJobRunImpactAnalysisSuccess[] {
  return successItems.filter((item) => matchesGoal(item.group_name, goal));
}

export function countMeasuresForGoal(
  goal: Goal,
  successItems: IJobRunImpactAnalysisSuccess[],
): number {
  const groups = getGroupsForGoal(goal, successItems);
  const seen = new Set<number>();
  for (const group of groups) {
    for (const mc of group.results.measure_coefficients) {
      if (mc.times_implemented > 0) {
        seen.add(mc.id);
      }
    }
  }
  return seen.size;
}

export function countCitiesForGoal(
  goal: Goal,
  successItems: IJobRunImpactAnalysisSuccess[],
): number {
  const groups = getGroupsForGoal(goal, successItems);
  const qualifyingMeasureIds = new Set<number>();
  for (const group of groups) {
    for (const mc of group.results.measure_coefficients) {
      if (mc.times_implemented > 0) {
        qualifyingMeasureIds.add(mc.id);
      }
    }
  }

  const cityIds = new Set<number>();
  for (const group of groups) {
    for (const la of group.results.living_labs_analysis) {
      for (const m of la.measures) {
        const mId = Number(m.measure_id);
        if (qualifyingMeasureIds.has(mId)) {
          cityIds.add(la.id);
        }
      }
    }
  }
  return cityIds.size;
}

export function hasQualifyingEvidence(
  goal: Goal,
  successItems: IJobRunImpactAnalysisSuccess[],
): boolean {
  const groups = getGroupsForGoal(goal, successItems);
  return groups.some((group) =>
    group.results.measure_coefficients.some((mc) => mc.times_implemented > 0),
  );
}

function evidenceLabel(timesImplemented: number): string {
  if (timesImplemented >= 5) return "Strong evidence";
  if (timesImplemented >= 2) return "Moderate evidence";
  return "Limited evidence";
}

export function computeTopFindings(
  successItems: IJobRunImpactAnalysisSuccess[],
  goals: Goal[],
  count: number,
): Array<{
  measureName: string;
  direction: string;
  kpiGroupName: string;
  cityCount: number;
  evidenceLabel: string;
  goalSlug: string;
}> {
  const candidates: Array<{
    measureName: string;
    direction: string;
    kpiGroupName: string;
    cityCount: number;
    evidenceLabel: string;
    goalSlug: string;
    timesImplemented: number;
  }> = [];

  for (const item of successItems) {
    const matchingGoal = goals.find((g) => matchesGoal(item.group_name, g));
    if (!matchingGoal) continue;

    for (const mc of item.results.measure_coefficients) {
      if (mc.times_implemented <= 0) continue;

      const cityIds = new Set<number>();
      for (const la of item.results.living_labs_analysis) {
        if (la.measures.some((m) => Number(m.measure_id) === mc.id)) {
          cityIds.add(la.id);
        }
      }

      candidates.push({
        measureName: mc.name,
        direction: mc.coefficient > 0 ? "improvement" : "decline",
        kpiGroupName: item.group_name,
        cityCount: cityIds.size,
        evidenceLabel: evidenceLabel(mc.times_implemented),
        goalSlug: matchingGoal.slug,
        timesImplemented: mc.times_implemented,
      });
    }
  }

  candidates.sort((a, b) => b.timesImplemented - a.timesImplemented);

  const seen = new Set<string>();
  const results: Array<{
    measureName: string;
    direction: string;
    kpiGroupName: string;
    cityCount: number;
    evidenceLabel: string;
    goalSlug: string;
  }> = [];

  for (const c of candidates) {
    const key = `${c.measureName}::${c.kpiGroupName}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        measureName: c.measureName,
        direction: c.direction,
        kpiGroupName: c.kpiGroupName,
        cityCount: c.cityCount,
        evidenceLabel: c.evidenceLabel,
        goalSlug: c.goalSlug,
      });
    }
    if (results.length >= count) break;
  }

  return results;
}

export interface RankedMeasure {
  measureId: number;
  plainName: string;
  cityCount: number;
  contributingCities: { id: number; name: string }[];
  outcomeDescription: string;
  evidenceScore: number;
  evidenceLabel: string;
}

export function getMeasuresForGoal(
  goal: Goal,
  successItems: IJobRunImpactAnalysisSuccess[],
  labs: ILivingLab[],
): RankedMeasure[] {
  const groups = getGroupsForGoal(goal, successItems);

  const measureMap = new Map<
    number,
    { name: string; coefficient: number; timesImplemented: number; cityIds: Set<number> }
  >();

  for (const group of groups) {
    for (const mc of group.results.measure_coefficients) {
      if (mc.times_implemented === 0) continue;
      const existing = measureMap.get(mc.id);
      if (!existing || mc.times_implemented > existing.timesImplemented) {
        const cityIds = new Set<number>();
        for (const la of group.results.living_labs_analysis) {
          if (la.measures.some((m) => Number(m.measure_id) === mc.id)) {
            cityIds.add(la.id);
          }
        }
        measureMap.set(mc.id, {
          name: mc.name,
          coefficient: mc.coefficient,
          timesImplemented: mc.times_implemented,
          cityIds,
        });
      }
    }
  }

  const ranked: RankedMeasure[] = [];

  for (const [id, data] of measureMap.entries()) {
    const contributingCities = Array.from(data.cityIds)
      .map((cityId) => {
        const lab = labs.find((l) => Number(l.id) === cityId);
        return lab ? { id: Number(lab.id), name: lab.name } : null;
      })
      .filter((c): c is { id: number; name: string } => c !== null);

    ranked.push({
      measureId: id,
      plainName: data.name,
      cityCount: data.cityIds.size,
      contributingCities,
      outcomeDescription:
        data.coefficient > 0
          ? "Associated with improvement in KPIs"
          : "Associated with decline in KPIs",
      evidenceScore: data.timesImplemented,
      evidenceLabel: evidenceLabel(data.timesImplemented),
    });
  }

  ranked.sort((a, b) => b.evidenceScore - a.evidenceScore);

  return ranked;
}
