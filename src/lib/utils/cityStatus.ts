import type { IKpiResultGroup } from "../../types/KPIs";
import { SUM_PROJECT_MAX_LAB_ID } from "../labels";

export type CityType = "sum_living_lab" | "contributing_city";
export type CityDataStatus = "has_data" | "data_pending";

export interface CityStatus {
  type: CityType;
  dataStatus: CityDataStatus;
  typeLabel: string;
  statusLabel: string;
}

export function getCityType(labId: number): CityType {
  return labId <= SUM_PROJECT_MAX_LAB_ID ? "sum_living_lab" : "contributing_city";
}

export function getCityDataStatus(
  kpiResults: IKpiResultGroup[] | undefined | null,
): CityDataStatus {
  if (!kpiResults || kpiResults.length === 0) return "data_pending";
  const hasBeforeAfter = kpiResults.some(
    (group) => group.result_before != null && group.result_after != null,
  );
  return hasBeforeAfter ? "has_data" : "data_pending";
}

export function getFullCityStatus(
  labId: number,
  kpiResults: IKpiResultGroup[] | undefined | null,
): CityStatus {
  const type = getCityType(labId);
  const dataStatus = getCityDataStatus(kpiResults);
  return {
    type,
    dataStatus,
    typeLabel: type === "sum_living_lab" ? "SUM Living Lab" : "Contributing city",
    statusLabel: dataStatus === "has_data" ? "Data available" : "Data pending",
  };
}

export const MAP_LEGEND_ENTRIES = [
  {
    type: "sum_living_lab" as CityType,
    dataStatus: "has_data" as CityDataStatus,
    label: "SUM Living Lab — data available",
    symbol: "circle",
    color: "secondary",
  },
  {
    type: "sum_living_lab" as CityType,
    dataStatus: "data_pending" as CityDataStatus,
    label: "SUM Living Lab — data pending",
    symbol: "circle",
    color: "gray",
  },
  {
    type: "contributing_city" as CityType,
    dataStatus: "has_data" as CityDataStatus,
    label: "Contributing city — data available",
    symbol: "diamond",
    color: "secondary",
  },
  {
    type: "contributing_city" as CityType,
    dataStatus: "data_pending" as CityDataStatus,
    label: "Contributing city — data pending",
    symbol: "diamond",
    color: "gray",
  },
] as const;
