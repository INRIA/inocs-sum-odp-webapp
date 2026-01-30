import React, { useState, useMemo } from "react";
import type { DataDashboardProps, KpiLivingLabsCardsFilter } from "./types";
import { KpiLivingLabsCards } from "./KpiLivingLabsCards";
import { ModalSplitLivingLabsCard } from "./ModalSplitLivingLabsCard";
import { DataDashboardFilter } from "./DataDashboardFilter";
import { generateLabColorsWithSeed } from "../../../lib/helpers/colorUtils";
import { PageNavigation } from "../ui/PageNavigation";
import {
  FunnelIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

export const DataDashboard: React.FC<DataDashboardProps> = ({
  livingLabs,
  kpis,
  availableYears,
  categories,
  modalSplitData = [],
}) => {
  // State for sidebar collapse (desktop only)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationSections = [
    {
      id: "data-dashboard-filters",
      label: "Filters",
      icon: <FunnelIcon className="w-5 h-5 md:w-8 md:h-8" />,
      onClick: () => setIsSidebarOpen(!isSidebarOpen),
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
  ];
  // Generate consistent color assignments for all labs (defined once at parent level)
  // Uses seeded randomness based on lab IDs for deterministic but varied colors
  const labColors = useMemo(
    () =>
      generateLabColorsWithSeed(
        livingLabs.map((lab) => ({ id: lab.id, name: lab.name })),
      ),
    [livingLabs],
  );

  // Initialize filter with all labs and years selected
  const [filter, setFilter] = useState<KpiLivingLabsCardsFilter>({
    selectedLabIds: livingLabs.map((lab) => lab.id),
    selectedYears: availableYears,
    selectedCategoryIds: categories.map((cat) => cat.id),
  });

  // Handler for filter changes from DataDashboardFilter component
  const handleFilterChange = (newFilter: KpiLivingLabsCardsFilter) => {
    setFilter(newFilter);
  };

  return (
    <div className="relative">
      {/* Main content area - full width */}
      <div className="flex flex-col gap-6">
        {/* Filters Section - fixed sidebar on right for both mobile and desktop */}
        <div
          className={`
            fixed top-20 right-4 z-40 w-[calc(100%-2rem)] sm:w-80
            transition-all duration-300
            ${isSidebarOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"}
          `}
          style={{ maxHeight: "calc(100vh - 6rem)" }}
        >
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 6rem)" }}
          >
            <DataDashboardFilter
              livingLabs={livingLabs}
              availableYears={availableYears}
              categories={categories}
              filter={filter}
              onFilterChange={handleFilterChange}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filter.selectedLabIds.length} of {livingLabs.length} living
            labs • {filter.selectedCategoryIds.length} of {categories.length}{" "}
            categories
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {/* Toggle button visible on both mobile and desktop */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={isSidebarOpen ? "Hide filters" : "Show filters"}
            >
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              <span>{"Show Filters"}</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <section id="data-dashboard-kpis-start">
          {/* Modal Split Section - One card per KPI subtype (15.a, 15.b, 15.c) */}
          {modalSplitData.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 px-2">
                Modal Split
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                {modalSplitData.map((kpiData) => (
                  <ModalSplitLivingLabsCard
                    key={kpiData.kpiId}
                    kpiId={kpiData.kpiId}
                    kpiNumber={kpiData.kpiNumber}
                    kpiName={kpiData.kpiName}
                    labs={kpiData.labs}
                    filter={filter}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other KPI Cards */}
          <KpiLivingLabsCards
            livingLabs={livingLabs}
            kpis={kpis}
            filter={filter}
            labColors={labColors}
            categories={categories}
          />
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
