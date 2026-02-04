import React, { useState, useMemo, useCallback } from "react";
import type { KPIsDashboardProps, KpiLivingLabsCardsFilter } from "./types";
import { KpiLivingLabsCards } from "./KpiLivingLabsCards";
import { ModalSplitLivingLabsCards } from "./ModalSplitLivingLabsCards";
import { DataDashboardFilter } from "../ui/DataDashboardFilter";
import { generateLabColorsWithSeed } from "../../../lib/helpers/colorUtils";
import { PageNavigation } from "../ui/PageNavigation";
import {
  FunnelIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

export const KPIsDashboard: React.FC<KPIsDashboardProps> = ({
  livingLabs,
  kpis,
  availableYears,
  categories,
  modalSplitData = [],
  transportModes = [],
}) => {
  // State for sidebar collapse - shared between filter component and navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Memoized handler for open state changes to prevent re-renders
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  }, []);

  // Memoized toggle handler for navigation
  const handleNavigationToggle = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const navigationSections = useMemo(
    () => [
      {
        id: "data-dashboard-filters",
        label: "Filters",
        icon: <FunnelIcon className="w-5 h-5 md:w-8 md:h-8" />,
        onClick: handleNavigationToggle,
      },
      {
        id: "data-dashboard-top",
        label: "Top of page",
        icon: <ArrowUpCircleIcon className="w-5 h-5 md:w-8 md:h-8" />,
      },
      {
        id: "data-dashboard-kpis-start",
        label: "Data section",
        icon: <PresentationChartLineIcon className="w-5 h-5 md:w-8 md:h-8" />,
      },
      {
        id: "data-dashboard-kpis-end",
        label: "Bottom of page",
        icon: <ArrowDownCircleIcon className="w-5 h-5 md:w-8 md:h-8" />,
      },
    ],
    [handleNavigationToggle],
  );
  // Generate consistent color assignments for all labs (defined once at parent level)
  // Uses seeded randomness based on lab IDs for deterministic but varied colors
  const labColors = useMemo(
    () =>
      generateLabColorsWithSeed(
        livingLabs?.map((lab) => ({ id: lab.id, name: lab.name })) ?? [],
      ),
    [livingLabs],
  );

  // Initialize filter with all labs and years selected
  const [filter, setFilter] = useState<KpiLivingLabsCardsFilter>({
    selectedLabIds: livingLabs?.map((lab) => lab.id) ?? [],
    selectedYears: availableYears ?? [],
    selectedCategoryIds: categories?.map((cat) => cat.id) ?? [],
  });

  // Handler for filter changes from DataDashboardFilter component
  const handleFilterChange = useCallback(
    (newFilter: KpiLivingLabsCardsFilter) => {
      setFilter(newFilter);
    },
    [],
  );

  const getKpisCount = useMemo(() => {
    const modalSplitKpisCount = modalSplitData.length;
    const otherKpisCount = kpis.filter((kpi) => !kpi.parent_kpi_id).length;
    return modalSplitKpisCount + otherKpisCount;
  }, [modalSplitData, kpis]);

  return (
    <div className="relative">
      {/* Main content area - full width */}
      <div className="flex flex-col gap-6">
        {/* Summary and Filter Toggle */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filter.selectedLabIds?.length} of {livingLabs.length}{" "}
            living labs • {getKpisCount} KPIs • {availableYears.length} years
          </span>
          {/* Filter component with internal toggle button and panel */}
          <DataDashboardFilter
            livingLabs={livingLabs}
            availableYears={availableYears}
            categories={categories}
            filter={filter}
            onFilterChange={handleFilterChange}
            isOpen={isSidebarOpen}
            onOpenChange={handleOpenChange}
          />
        </div>

        <section id="data-dashboard-kpis-start">
          {modalSplitData.length > 0 && (
            <ModalSplitLivingLabsCards
              modalSplitData={modalSplitData}
              filter={filter}
              transportModes={transportModes}
            />
          )}

          {kpis.length > 0 && (
            <KpiLivingLabsCards
              livingLabs={livingLabs}
              kpis={kpis}
              filter={filter}
              labColors={labColors}
              categories={categories}
            />
          )}
        </section>

        <section id="data-dashboard-kpis-end" />

        <PageNavigation
          sections={navigationSections}
          disclaimer="The information presented is based on data provided directly by the participating living labs. While the platform makes this data accessible and comparable, each living lab remains responsible for the accuracy, completeness, and interpretation of the data it reports."
        />
      </div>
    </div>
  );
};
