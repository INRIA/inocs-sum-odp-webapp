import readingsData from "./kpiReadings.json";

export type KpiDirection = "up_is_good" | "down_is_good" | "not_applicable";

export interface IKpiReading {
  reading: string;
  direction: KpiDirection;
  unit: string;
}

const readings = readingsData as Record<string, IKpiReading>;

export function getKpiReading(kpiDefinitionId: number): IKpiReading | null {
  return readings[String(kpiDefinitionId)] ?? null;
}

export function formatDirection(direction: KpiDirection): string {
  switch (direction) {
    case "up_is_good":
      return "Higher is better";
    case "down_is_good":
      return "Lower is better";
    case "not_applicable":
      return "No inherent direction";
  }
}
