import React, { useMemo } from "react";
import type { KpiLivingLabsCardsProps, IKpiGroup } from "./types";
import { KpiLivingLabsSingleCard } from "./KpiLivingLabsSingleCard";
import { KpiLivingLabsMultipleCard } from "./KpiLivingLabsMultipleCard";
import { buildKpiDataMap, groupKpisByParentChild } from "./utils";
import { ExpansionPanel, Badge, TopStickyLegend } from "../ui";
import type { IKpiTimelineMap } from "./types";
import { COLOR_GRAY } from "../../../styles/constants";

export const KpiLivingLabsCards: React.FC<KpiLivingLabsCardsProps> = ({
  livingLabs,
  kpis,
  filter,
  labColors,
  categories,
}) => {
  // Create a color lookup map for quick access
  const colorMap = useMemo(() => {
    const map = new Map<number, string>();
    labColors.forEach((lc) => map.set(lc.labId, lc.color));
    return map;
  }, [labColors]);

  // Create a set of KPI IDs that belong to selected categories
  const kpiIdsInSelectedCategories = useMemo(() => {
    const kpiIds = new Set<number>();
    categories.forEach((category) => {
      if (filter.selectedCategoryIds?.includes(category.id)) {
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
        kpiDataMap.has(child.id),
      );
      return hasParentData || hasChildData;
    }
  });

  // Group KPIs by category for display
  const groupsByCategory = useMemo(() => {
    const categoryMap = new Map<
      number,
      { category: (typeof categories)[0]; groups: IKpiGroup[] }
    >();

    // Initialize with selected categories
    categories
      .filter((cat) => filter.selectedCategoryIds?.includes(cat.id))
      .forEach((category) => {
        categoryMap.set(category.id, { category, groups: [] });
      });

    // Assign each group to its category
    groupsWithData.forEach((group) => {
      const kpiId = group.type === "single" ? group.kpi.id : group.parentKpi.id;

      // Find which category this KPI belongs to
      for (const category of categories) {
        if (category.kpis?.some((kpi) => kpi.id === kpiId)) {
          const entry = categoryMap.get(category.id);
          if (entry) {
            entry.groups.push(group);
          }
          break;
        }
      }
    });

    // Filter out categories with no groups
    return Array.from(categoryMap.values()).filter(
      (entry) => entry.groups.length > 0,
    );
  }, [categories, filter.selectedCategoryIds, groupsWithData]);

  // Get selected labs with their colors for the legend
  // IMPORTANT: This must be before any early returns to maintain consistent hook order
  const legendItems = useMemo(() => {
    return livingLabs
      .filter((lab) => filter.selectedLabIds?.includes(lab.id))
      .map((lab) => ({
        id: lab.id,
        label: lab.name,
        color: colorMap.get(lab.id) || COLOR_GRAY,
      }));
  }, [livingLabs, filter.selectedLabIds, colorMap]);

  // Helper function to render a group of KPIs
  const renderKpiGroup = (group: IKpiGroup, kpiDataMap: IKpiTimelineMap) => {
    if (group.type === "single") {
      return (
        <div key={group.kpi.id} className="break-inside-avoid col-span-1">
          <KpiLivingLabsSingleCard
            kpi={group.kpi}
            labTimelines={kpiDataMap.get(group.kpi.id) ?? []}
          />
        </div>
      );
    } else {
      return (
        <div
          key={group.parentKpi.id}
          className="break-inside-avoid md:col-span-2"
        >
          <KpiLivingLabsMultipleCard
            parentKpi={group.parentKpi}
            childKpis={group.childKpis}
            kpiTimelineMap={kpiDataMap}
          />
        </div>
      );
    }
  };

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
    <div
      className="flex flex-col gap-4 mx-auto w-full"
      id="kpi-living-labs-cards"
    >
      {/* Labs Legend - Sticky when scrolled to top */}
      <TopStickyLegend
        id="data-dashboard-legend"
        title="Displayed Living Labs"
        items={legendItems}
        boundaryElementId="kpi-living-labs-cards"
      />
      {groupsByCategory.map(({ category, groups }) => (
        <ExpansionPanel
          key={category.id}
          header={
            <div className="flex flex-row justify-center items-center gap-2 rounded-2xl border-info bg-info px-1 py-1">
              <h5 className="text-center">{category.name}</h5>
              <Badge
                color="light"
                size="sm"
                tooltip="Number of KPIs in this category"
                displayTooltipIcon={false}
              >
                {groups.length}
              </Badge>
            </div>
          }
          arrow
          open={true}
          content={
            <div className="grid grid-flow-row-dense grid-cols-1 md:grid-cols-3 gap-0">
              {groups
                .sort((a, b) => {
                  // Sort by number of children (parent groups first, then by size)
                  const aSize =
                    a.type === "parent" ? a.childKpis.length + 1 : 1;
                  const bSize =
                    b.type === "parent" ? b.childKpis.length + 1 : 1;
                  return bSize - aSize;
                })
                .map((group) => renderKpiGroup(group, kpiDataMap))}
            </div>
          }
        />
      ))}
    </div>
  );
};
