import type { IKpi, IKpiResultGroup, ILivingLabPopulated } from "../../types";
import { ProjectType } from "../../types/Project";
import { getUrl } from "../helpers/links";
import { CONTRIBUTING_CITY_LABEL, SUM_LIVING_LAB_LABEL } from "../labels";
import {
  getCityDataStatus,
  getCityType,
  type CityDataStatus,
  type CityType,
} from "./cityStatus";

/** How many KPIs are listed in the "improved" and "regressed" blocks of a card. */
export const TOP_KPI_COUNT = 3;

/**
 * A single KPI movement as shown on a city card.
 * `change` is policy-aligned: positive always means "moved towards the KPI target".
 */
export interface CityKpiMovement {
  kpiId: number;
  name: string;
  change: number;
  display: string;
}

export interface CityMeasureCounts {
  total: number;
  push: number;
  pull: number;
  other: number;
  pushNames: string[];
  pullNames: string[];
  otherNames: string[];
}

export interface CityCardData {
  id: string;
  name: string;
  country: string | null;
  type: CityType;
  typeLabel: string;
  dataStatus: CityDataStatus;
  population: number | null;
  area: number | null;
  /** Year of the earliest reported KPI result, or of registration when nothing is reported. */
  reportingSince: number | null;
  /** True when `reportingSince` comes from the registration date, not from reported data. */
  reportingSinceIsRegistration: boolean;
  measures: CityMeasureCounts;
  improved: CityKpiMovement[];
  regressed: CityKpiMovement[];
  indicatorsImproved: number;
  indicatorsTotal: number;
  href: string;
}

export type CityFilterId =
  | "all"
  | "sum_living_labs"
  | "contributing_cities"
  | "data_reported";

export const CITY_FILTERS: ReadonlyArray<{
  id: CityFilterId;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "sum_living_labs", label: SUM_LIVING_LAB_LABEL + "s" },
  { id: "contributing_cities", label: CONTRIBUTING_CITY_LABEL.replace("city", "cities") },
  { id: "data_reported", label: "Data reported" },
];

/**
 * `progression_target` states which way a KPI should move: 1 = increase, 0 = decrease.
 * Returns the multiplier that turns a raw variation into a policy-aligned one.
 */
export function getKpiTargetDirection(
  progressionTarget?: number | null,
): 1 | -1 {
  return progressionTarget === 0 ? -1 : 1;
}

/**
 * Relative variation between two readings, signed against the KPI target.
 * Positive means the city moved towards its target, whatever the target direction is.
 */
export function computeAlignedChange(
  before?: number | null,
  after?: number | null,
  progressionTarget?: number | null,
): number | null {
  if (before == null || after == null) return null;
  if (!Number.isFinite(before) || !Number.isFinite(after)) return null;
  if (before === 0) return null;
  const relative = (after - before) / Math.abs(before);
  return relative * getKpiTargetDirection(progressionTarget);
}

export function formatChangePercent(change: number): string {
  const pct = Math.abs(change * 100).toFixed(1);
  // U+2212 minus sign, so the value stays legible next to the "+" sign.
  return `${change < 0 ? "−" : "+"}${pct}%`;
}

function yearOf(date?: string | Date | null): number | null {
  if (!date) return null;
  const parsed = new Date(date as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

function countMeasures(lab: ILivingLabPopulated): CityMeasureCounts {
  const projects = lab.projects ?? [];
  const pushNames: string[] = [];
  const pullNames: string[] = [];
  const otherNames: string[] = [];
  for (const project of projects) {
    if (project.type === ProjectType.PUSH) pushNames.push(project.name);
    else if (project.type === ProjectType.PULL) pullNames.push(project.name);
    else otherNames.push(project.name);
  }
  return {
    total: projects.length,
    push: pushNames.length,
    pull: pullNames.length,
    other: otherNames.length,
    pushNames,
    pullNames,
    otherNames,
  };
}

interface KpiLookup {
  progressionTarget: (kpiDefinitionId: number) => number | null;
  parentId: (kpiDefinitionId: number) => number;
  name: (kpiDefinitionId: number) => string;
}

function buildKpiLookup(kpis: IKpi[]): KpiLookup {
  const byId = new Map<number, IKpi>();
  for (const kpi of kpis) byId.set(Number(kpi.id), kpi);

  const parentId = (id: number) => {
    const kpi = byId.get(id);
    const parent = kpi?.parent_kpi_id;
    return parent != null ? Number(parent) : id;
  };

  return {
    progressionTarget: (id) => byId.get(id)?.progression_target ?? null,
    parentId,
    name: (id) => byId.get(parentId(id))?.name ?? `KPI ${id}`,
  };
}

interface KpiMovements {
  improved: CityKpiMovement[];
  regressed: CityKpiMovement[];
  indicatorsImproved: number;
  indicatorsTotal: number;
}

/**
 * Turns a city's raw KPI result groups into ranked movements.
 *
 * Child KPI readings (and per-transport-mode readings of the same KPI) are averaged
 * into their top-level KPI, so a card lists indicators rather than raw measurements.
 */
export function buildCityKpiMovements(
  kpiResults: IKpiResultGroup[],
  kpis: IKpi[],
): KpiMovements {
  const lookup = buildKpiLookup(kpis);
  const perParent = new Map<number, number[]>();

  for (const group of kpiResults) {
    const definitionId = Number(group.kpidefinition_id);
    if (!Number.isFinite(definitionId)) continue;
    const change = computeAlignedChange(
      group.result_before?.value,
      group.result_after?.value,
      lookup.progressionTarget(definitionId),
    );
    if (change === null) continue;
    const parent = lookup.parentId(definitionId);
    const bucket = perParent.get(parent);
    if (bucket) bucket.push(change);
    else perParent.set(parent, [change]);
  }

  const movements: CityKpiMovement[] = Array.from(perParent.entries()).map(
    ([parent, changes]) => {
      const change = changes.reduce((sum, c) => sum + c, 0) / changes.length;
      return {
        kpiId: parent,
        name: lookup.name(parent),
        change,
        display: formatChangePercent(change),
      };
    },
  );

  const improved = movements
    .filter((m) => m.change > 0)
    .sort((a, b) => b.change - a.change);
  const regressed = movements
    .filter((m) => m.change < 0)
    .sort((a, b) => a.change - b.change);

  return {
    improved: improved.slice(0, TOP_KPI_COUNT),
    regressed: regressed.slice(0, TOP_KPI_COUNT),
    indicatorsImproved: improved.length,
    indicatorsTotal: movements.length,
  };
}

export function buildCityCard(
  lab: ILivingLabPopulated,
  kpis: IKpi[],
): CityCardData {
  const labId = Number(lab.id);
  const kpiResults = (lab.kpi_results ?? []) as IKpiResultGroup[];
  const type = getCityType(labId);
  const dataStatus = getCityDataStatus(kpiResults);

  const reportedYears = kpiResults
    .flatMap((group) => group.results ?? [])
    .map((result) => yearOf(result.date))
    .filter((year): year is number => year !== null);
  const registrationYear = yearOf(lab.created_at);
  const reportingSince = reportedYears.length
    ? Math.min(...reportedYears)
    : registrationYear;

  return {
    id: String(lab.id),
    name: lab.name,
    country: lab.country ?? null,
    type,
    typeLabel:
      type === "sum_living_lab" ? SUM_LIVING_LAB_LABEL : CONTRIBUTING_CITY_LABEL,
    dataStatus,
    population: lab.population ?? null,
    area: lab.area ?? null,
    reportingSince,
    reportingSinceIsRegistration: reportedYears.length === 0,
    measures: countMeasures(lab),
    ...buildCityKpiMovements(kpiResults, kpis),
    href: getUrl(`/living-lab-city/${lab.id}`),
  };
}

/**
 * Builds every card, with reported cities first (alphabetically) and cities
 * without published results grouped at the bottom.
 */
export function buildCityCards(
  labs: ILivingLabPopulated[],
  kpis: IKpi[],
): CityCardData[] {
  return labs
    .map((lab) => buildCityCard(lab, kpis))
    .sort((a, b) => {
      const aPending = a.dataStatus === "data_pending" ? 1 : 0;
      const bPending = b.dataStatus === "data_pending" ? 1 : 0;
      if (aPending !== bPending) return aPending - bPending;
      return a.name.localeCompare(b.name);
    });
}

export function filterCityCards(
  cards: CityCardData[],
  filter: CityFilterId,
): CityCardData[] {
  switch (filter) {
    case "sum_living_labs":
      return cards.filter((c) => c.type === "sum_living_lab");
    case "contributing_cities":
      return cards.filter((c) => c.type === "contributing_city");
    case "data_reported":
      return cards.filter((c) => c.dataStatus === "has_data");
    default:
      return cards;
  }
}
