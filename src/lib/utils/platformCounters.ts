export interface PlatformCounters {
  sumLivingLabs: number;
  contributingCities: number;
  citiesWithData: number;
  totalCities: number;
  lastDataUpdate: string | null;
}

export function computePlatformCounters(
  livingLabs: Array<{
    id: string | number;
    kpi_results?: Array<{
      result_before?: unknown;
      result_after?: unknown;
    }>;
  }>,
): PlatformCounters {
  const sumLivingLabs = livingLabs.length;
  const citiesWithData = livingLabs.filter((lab) =>
    lab.kpi_results?.some((r) => r.result_before || r.result_after),
  ).length;

  return {
    sumLivingLabs,
    contributingCities: sumLivingLabs,
    citiesWithData,
    totalCities: sumLivingLabs,
    lastDataUpdate: null,
  };
}
