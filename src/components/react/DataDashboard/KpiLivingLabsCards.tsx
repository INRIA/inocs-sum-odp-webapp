import React, { useMemo } from "react";
import type {
  KpiLivingLabsCardsProps,
  ILabKpiTimeline,
  ITimelineDataPoint,
} from "./types";
import { KpiLivingLabsCard } from "./KpiLivingLabsCard";

export const KpiLivingLabsCards: React.FC<KpiLivingLabsCardsProps> = ({
  livingLabs,
  kpis,
  filter,
  labColors,
  categories,
}) => {
  // Create a color lookup map for quick access
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    labColors.forEach((lc) => map.set(lc.labId, lc.color));
    return map;
  }, [labColors]);

  // Create a set of KPI IDs that belong to selected categories
  const kpiIdsInSelectedCategories = useMemo(() => {
    const kpiIds = new Set<string>();
    categories.forEach((category) => {
      if (filter.selectedCategoryIds.includes(category.id)) {
        // Add all KPIs in this category
        category.kpis?.forEach((kpi) => {
          kpiIds.add(kpi.id);
        });
      }
    });
    return kpiIds;
  }, [categories, filter.selectedCategoryIds]);

  // Filter KPIs by selected categories
  const filteredKpis = useMemo(() => {
    return kpis.filter((kpi) => kpiIdsInSelectedCategories.has(kpi.id));
  }, [kpis, kpiIdsInSelectedCategories]);

  // Process KPI data for each KPI across filtered living labs
  const kpiDataMap = useMemo(() => {
    const map = new Map<string, ILabKpiTimeline[]>();

    filteredKpis.forEach((kpi) => {
      const labTimelines: ILabKpiTimeline[] = [];

      livingLabs.forEach((lab) => {
        // Skip if lab is not selected
        if (!filter.selectedLabIds.includes(lab.id)) return;

        // Find KPI result for this lab and KPI
        const kpiResult = lab.kpiResults.find(
          (r) => r.kpidefinition_id === kpi.id,
        );

        if (!kpiResult) return;

        const dataPoints: ITimelineDataPoint[] = [];

        // Process before result
        if (
          kpiResult.result_before?.date &&
          kpiResult.result_before?.value !== undefined
        ) {
          const beforeYear = new Date(
            kpiResult.result_before.date,
          ).getFullYear();
          if (filter.selectedYears.includes(beforeYear)) {
            dataPoints.push({
              year: beforeYear,
              value: kpiResult.result_before.value,
              date: kpiResult.result_before.date,
            });
          }
        }

        // Process after result
        if (
          kpiResult.result_after?.date &&
          kpiResult.result_after?.value !== undefined
        ) {
          const afterYear = new Date(kpiResult.result_after.date).getFullYear();
          if (filter.selectedYears.includes(afterYear)) {
            dataPoints.push({
              year: afterYear,
              value: kpiResult.result_after.value,
              date: kpiResult.result_after.date,
            });
          }
        }

        // Only add if there are data points
        if (dataPoints.length > 0) {
          labTimelines.push({
            labId: lab.id,
            labName: lab.name,
            color: colorMap.get(lab.id) || "#6b7280", // fallback gray
            dataPoints,
          });
        }
      });

      if (labTimelines.length > 0) {
        map.set(kpi.id, labTimelines);
      }
    });

    return map;
  }, [livingLabs, filteredKpis, filter, colorMap]);

  // Filter KPIs to only those with data
  const kpisWithData = filteredKpis.filter((kpi) => kpiDataMap.has(kpi.id));

  if (kpisWithData.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-600">
          No KPI data available for the selected filters.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Try selecting more living labs or years.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {kpisWithData.map((kpi) => (
        <KpiLivingLabsCard
          key={kpi.id}
          kpi={kpi}
          labTimelines={kpiDataMap.get(kpi.id) ?? []}
        />
      ))}
    </div>
  );
};
