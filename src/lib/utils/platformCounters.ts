import type { IKpiResultGroup } from "../../types/KPIs";
import type { ILivingLabPopulated } from "../../types/LivingLab";
import { getCityType, getCityDataStatus } from "./cityStatus";

export interface PlatformCounters {
  sumLivingLabs: number;
  contributingCities: number;
  citiesWithData: number;
  totalCities: number;
  lastDataUpdate: Date | null;
}

export function computePlatformCounters(
  livingLabs: ILivingLabPopulated[],
): PlatformCounters {
  let sumLivingLabs = 0;
  let contributingCities = 0;
  let citiesWithData = 0;
  let lastDataUpdate: Date | null = null;

  livingLabs.forEach((lab) => {
    const type = getCityType(Number(lab.id));
    if (type === "sum_living_lab") {
      sumLivingLabs++;
    } else {
      contributingCities++;
    }

    const kpiResults = lab.kpi_results as IKpiResultGroup[] | undefined;
    const dataStatus = getCityDataStatus(kpiResults);
    if (dataStatus === "has_data") {
      citiesWithData++;
    }

    kpiResults?.forEach((group) => {
      group.results?.forEach((result) => {
        if (result.updated_at) {
          const d = new Date(result.updated_at as unknown as string);
          if (!lastDataUpdate || d > lastDataUpdate) {
            lastDataUpdate = d;
          }
        }
      });
    });
  });

  return {
    sumLivingLabs,
    contributingCities,
    citiesWithData,
    totalCities: sumLivingLabs + contributingCities,
    lastDataUpdate,
  };
}
