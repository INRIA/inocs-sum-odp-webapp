import React, { useMemo } from "react";
import type { KpiLivingLabsCardsProps } from "./types";
import { KpiLivingLabsCard } from "./KpiLivingLabsCard";
import { KpiLivingLabsMultipleCard } from "./KpiLivingLabsMultipleCard";
import { buildKpiDataMap, groupKpisByParentChild } from "./utils";
import { COLOR_GRAY } from "../../../types/Constants";

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

  // Filter KPIs by selected categories (filter by parent KPI only)
  const filteredKpis = useMemo(() => {
    return kpis.filter((kpi) => {
      // For parent KPIs or single KPIs (no parent_kpi_id), check if they're in selected categories
      if (!kpi.parent_kpi_id) {
        return kpiIdsInSelectedCategories.has(kpi.id);
      }
      // For child KPIs, check if their parent is in selected categories
      return kpiIdsInSelectedCategories.has(kpi.parent_kpi_id);
    });
  }, [kpis, kpiIdsInSelectedCategories]);

  // Group KPIs by parent-child relationships
  const kpiGroups = useMemo(() => {
    return groupKpisByParentChild(filteredKpis);
  }, [filteredKpis]);

  // Build timeline data for ALL KPIs (parents and children)
  const kpiDataMap = useMemo(() => {
    return buildKpiDataMap(
      filteredKpis,
      livingLabs,
      filter,
      colorMap,
      COLOR_GRAY,
    );
  }, [filteredKpis, livingLabs, filter, colorMap]);

  // Filter groups to only those with data
  const groupsWithData = kpiGroups.filter((group) => {
    if (group.type === "single") {
      return kpiDataMap.has(group.kpi.id);
    } else {
      // For parent groups, check if parent or any child has data
      const hasParentData = kpiDataMap.has(group.parentKpi.id);
      const hasChildData = group.childKpis.some((child) =>
        kpiDataMap.has(child.id)
      );
      return hasParentData || hasChildData;
    }
  });

  if (groupsWithData.length === 0) {
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
      {groupsWithData.map((group) => {
        if (group.type === "single") {
          return (
            <KpiLivingLabsCard
              key={group.kpi.id}
              kpi={group.kpi}
              labTimelines={kpiDataMap.get(group.kpi.id) ?? []}
            />
          );
        } else {
          return (
            <KpiLivingLabsMultipleCard
              key={group.parentKpi.id}
              parentKpi={group.parentKpi}
              childKpis={group.childKpis}
              kpiTimelineMap={kpiDataMap}
            />
          );
        }
      })}
    </div>
  );
};
