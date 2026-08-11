import type { IKpi, ILivingLabPopulated } from "../../types";
import { getYearFromDate } from "../helpers/format";
import {
  getCityDataStatus,
  getCityType,
  type CityDataStatus,
  type CityType,
} from "./cityStatus";

/** Marker payload consumed by `LivingLabsMapSection`. */
export interface MapLab {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number } | null;
  radius: number;
  cityType: CityType;
  dataStatus: CityDataStatus;
  totalMeasures: number;
  kpisCollected: number;
  yearsCollected: number[];
  transportModes: number;
  sustainablePercentage: number;
}

/**
 * Serialises living labs for the shared Europe map island.
 * Shared by the homepage and /insights/cities so both show the same markers.
 */
export function buildMapLabs(
  livingLabs: ILivingLabPopulated[],
  allKpis: IKpi[],
): MapLab[] {
  return livingLabs.map((lab) => {
    const kpiSet = new Set<number>();
    const yearsSet = new Set<number>();

    lab.kpi_results
      ?.filter((kpi) => kpi.result_before || kpi.result_after)
      ?.forEach((kpiresult) => {
        const kpiDefinition = allKpis.find(
          (pk) => pk.id === kpiresult.kpidefinition_id,
        );
        kpiSet.add(kpiDefinition?.parent_kpi_id ?? kpiDefinition?.id ?? 0);
        const year = getYearFromDate(kpiresult.result_after?.date);
        if (year) yearsSet.add(year);
      });

    return {
      id: String(lab.id),
      name: lab.name,
      coordinates:
        lab.lat != null && lab.lng != null
          ? { lat: parseFloat(lab.lat), lng: parseFloat(lab.lng) }
          : null,
      radius: lab.radius ?? 50,
      cityType: getCityType(Number(lab.id)),
      dataStatus: getCityDataStatus(lab.kpi_results ?? null),
      totalMeasures: lab.projects?.length ?? 0,
      kpisCollected: kpiSet.size,
      yearsCollected: Array.from(yearsSet),
      transportModes:
        lab.transport_modes?.filter((tm) => tm.type === "NSM").length ?? 0,
      sustainablePercentage: 0.4,
    };
  });
}
