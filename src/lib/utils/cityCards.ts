import type { IKpi, IKpiResultGroup, ILivingLabPopulated } from "../../types";
import { EnumKpiMetricType } from "../../types/KPIs";
import type { ITransportMode } from "../../types/TransportMode";
import { EnumTransportModeType } from "../../types/TransportMode";
import { ProjectType } from "../../types/Project";
import { getChange } from "../helpers/kpi-format";
import { getUrl } from "../helpers/links";
import { CONTRIBUTING_CITY_LABEL, SUM_LIVING_LAB_LABEL } from "../labels";
import {
  getCityDataStatus,
  getCityType,
  type CityDataStatus,
  type CityType,
} from "./cityStatus";
import { isResultValidated } from "./kpiSufficiency";

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

/** A modal-split entry shown in the dedicated section of a city card. */
export interface CityModalSplitEntry {
  id: number;
  name: string;
  /** Formatted current share, e.g. "12.3%" */
  value: string;
  /** Variation display, e.g. "+2.00%" */
  change: string;
  isImproved: boolean;
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
  modalSplit: CityModalSplitEntry[];
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
  metric: (kpiDefinitionId: number) => EnumKpiMetricType;
  isModalSplit: (kpiDefinitionId: number) => boolean;
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
    metric: (id) => byId.get(id)?.metric ?? EnumKpiMetricType.ABSOLUTE,
    isModalSplit: (id) => {
      const kpi = byId.get(id);
      if (!kpi) return false;
      if (kpi.kpi_number?.startsWith("15")) return true;
      if (kpi.parent_kpi_id != null) {
        const parent = byId.get(Number(kpi.parent_kpi_id));
        return parent?.kpi_number?.startsWith("15") ?? false;
      }
      return false;
    },
  };
}

interface KpiMovements {
  modalSplit: CityModalSplitEntry[];
  improved: CityKpiMovement[];
  regressed: CityKpiMovement[];
  indicatorsImproved: number;
  indicatorsTotal: number;
}

/**
 * Turns a city's raw KPI result groups into ranked movements.
 *
 * Regular KPI readings are averaged into their top-level KPI.
 * Modal-split KPIs (KPI 15.*) are shown per NSM transport mode instead of
 * being collapsed into a single "Modal split" entry.
 *
 * The variation is computed using the same absolute-difference formula as the
 * KPI cards on the living-lab detail page (`getChange` from `kpi-format.ts`).
 */
export function buildCityKpiMovements(
  kpiResults: IKpiResultGroup[],
  kpis: IKpi[],
  transportModes?: ITransportMode[],
  labValidatedAt?: Date | null,
): KpiMovements {
  const lookup = buildKpiLookup(kpis);

  // Transport mode lookup for modal split NSM filtering
  // Use Number() for consistent key types — IDs may arrive as BigInt or string from Prisma.
  const tmById = new Map<number, ITransportMode>();
  for (const tm of transportModes ?? []) tmById.set(Number(tm.id), tm);

  // Regular KPIs: group children under parent
  const perParent = new Map<
    number,
    { before: number; after: number }[]
  >();

  // Modal split: collect NSM, PUBLIC_TRANSPORT, and "Private Car"
  const isModalSplitTarget = (tm: ITransportMode) =>
    tm.type === EnumTransportModeType.NSM ||
    tm.type === EnumTransportModeType.PUBLIC_TRANSPORT ||
    tm.name === "Private Car";

  const perModalSplitMode = new Map<
    number,
    { before: number; after: number; definitionId: number }[]
  >();

  for (const group of kpiResults) {
    const definitionId = Number(group.kpidefinition_id);
    if (!Number.isFinite(definitionId)) continue;

    // Mirror the living-lab-city page: only use results whose updated_at is
    // before the lab's validation date.  When labValidatedAt is null,
    // isResultValidated returns false for every result, so no KPIs are shown
    // (same behaviour as the detail page for unvalidated labs).
    const validated = (group.results ?? [])
      .filter((r) => isResultValidated(r, labValidatedAt))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Need at least two data points to compute a before→after movement.
    if (validated.length < 2) continue;

    const before = validated[0].value;
    const after = validated[validated.length - 1].value;

    if (!Number.isFinite(before) || !Number.isFinite(after)) continue;
    if (before === 0) continue;

    if (lookup.isModalSplit(definitionId)) {
      if (group.transport_mode_id == null) continue;
      const tmId = Number(group.transport_mode_id);
      const tm = tmById.get(tmId);
      if (!tm || !isModalSplitTarget(tm)) continue;

      const bucket = perModalSplitMode.get(tmId);
      const entry = { before, after, definitionId };
      if (bucket) bucket.push(entry);
      else perModalSplitMode.set(tmId, [entry]);
    } else {
      const parent = lookup.parentId(definitionId);
      const bucket = perParent.get(parent);
      const entry = { before, after };
      if (bucket) bucket.push(entry);
      else perParent.set(parent, [entry]);
    }
  }

  function buildMovement(
    id: number,
    name: string,
    entries: { before: number; after: number; definitionId?: number }[],
    definitionIdForMeta?: number,
  ): CityKpiMovement {
    const avgBefore =
      entries.reduce((sum, e) => sum + e.before, 0) / entries.length;
    const avgAfter =
      entries.reduce((sum, e) => sum + e.after, 0) / entries.length;

    const refId = definitionIdForMeta ?? id;
    const metricType = lookup.metric(refId);
    const progressionTarget = lookup.progressionTarget(refId);
    const display = getChange(avgBefore, avgAfter, metricType, progressionTarget);
    const diff = avgAfter - avgBefore;
    const change = diff * getKpiTargetDirection(progressionTarget);

    return { kpiId: id, name, change, display: display || "—" };
  }

  const movements = Array.from(perParent.entries()).map(
    ([parent, entries]) => buildMovement(parent, lookup.name(parent), entries),
  );

  // Modal split: aggregate per transport-mode type.
  // For each transport mode, average across child KPIs, then sum across modes of the same type.
  interface ModalSplitBucket {
    before: number;
    after: number;
    refId: number | null;
  }
  const buckets: Record<string, ModalSplitBucket> = {
    NSM: { before: 0, after: 0, refId: null },
    PUBLIC_TRANSPORT: { before: 0, after: 0, refId: null },
    PRIVATE: { before: 0, after: 0, refId: null },
  };

  for (const [tmId, entries] of perModalSplitMode) {
    const tm = tmById.get(tmId)!;
    const avgBefore =
      entries.reduce((s, e) => s + e.before, 0) / entries.length;
    const avgAfter =
      entries.reduce((s, e) => s + e.after, 0) / entries.length;

    const key =
      tm.type === EnumTransportModeType.NSM
        ? "NSM"
        : tm.type === EnumTransportModeType.PUBLIC_TRANSPORT
          ? "PUBLIC_TRANSPORT"
          : "PRIVATE";
    buckets[key].before += avgBefore;
    buckets[key].after += avgAfter;
    buckets[key].refId ??= entries[0].definitionId;
  }

  const modalSplitDefs: { key: string; id: number; label: string }[] = [
    { key: "NSM", id: -1, label: "NSM" },
    { key: "PUBLIC_TRANSPORT", id: -2, label: "Public transport" },
    { key: "PRIVATE", id: -3, label: "Private Car" },
  ];

  const modalSplit: CityModalSplitEntry[] = [];
  for (const { key, id, label } of modalSplitDefs) {
    const b = buckets[key];
    if (b.refId === null) continue;

    const metricType = lookup.metric(b.refId);
    const progressionTarget = lookup.progressionTarget(b.refId);
    const change = getChange(b.before, b.after, metricType, progressionTarget);
    const diff = b.after - b.before;
    const aligned = diff * getKpiTargetDirection(progressionTarget);

    modalSplit.push({
      id,
      name: label,
      value: `${(b.after * 100).toFixed(1)}%`,
      change: change || "—",
      isImproved: aligned > 0,
    });
  }

  const improved = movements
    .filter((m) => m.change > 0)
    .sort((a, b) => b.change - a.change);
  const regressed = movements
    .filter((m) => m.change < 0)
    .sort((a, b) => a.change - b.change);

  return {
    modalSplit,
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
    ...buildCityKpiMovements(kpiResults, kpis, lab.transport_modes, lab.validated_at),
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
