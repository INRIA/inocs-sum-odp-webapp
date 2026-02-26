import React from "react";
import type { ModalSplitLivingLabsCardProps } from "./types";
import { Badge, Tooltip } from "../ui";
import { ModalSplitStackedBarChart } from "../KpiCards/ModalSplitStackedBarChart";
import type { ModalSplitChartDataset } from "../KpiCards/ModalSplitChart";

/**
 * ModalSplitLivingLabsCard displays modal split data for a single KPI
 * across all filtered living labs using horizontal stacked bar charts.
 */
export const ModalSplitLivingLabsCard: React.FC<
  ModalSplitLivingLabsCardProps
> = ({ kpiId, kpiNumber, kpiName, labs, filter }) => {
  const selectedLabIds = filter.selectedLabIds ?? [];
  const selectedYears = filter.selectedYears ?? [];

  // Filter labs based on selected lab IDs
  const filteredLabs = labs.filter((lab) =>
    selectedLabIds.some((selectedLabId) => String(selectedLabId) === String(lab.labId)),
  );

  // Filter by selected years
  const labsWithFilteredYears = filteredLabs
    .map((lab) => {
      const filteredEntries = lab.entries.filter((entry) =>
        selectedYears.includes(entry.year),
      );

      return {
        ...lab,
        entries: filteredEntries,
      };
    })
    .filter((lab) => lab.entries.length > 0);

  if (labsWithFilteredYears.length === 0) {
    return null;
  }

  return (
    <div className="p-2">
      <div className="p-4 relative rounded-2xl border-primary-light border bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* KPI Badge */}
        <div className="absolute top-0 right-0">
          <Badge
            size="sm"
            color="light"
            className="rounded-tl-none rounded-bl-xl rounded-br-none rounded-tr-xl"
          >
            <Tooltip
              content={`Modal Split KPI ${kpiNumber}`}
              placement="left"
              iconClassName="h-3 w-3 text-primary"
            >
              KPI {kpiNumber} ⓘ
            </Tooltip>
          </Badge>
        </div>

        {/* KPI Title */}
        <div className="flex flex-col text-center my-2 mb-4">
          <h5 className="text-center min-h-[64px]">{kpiName}</h5>
        </div>

        {/* Living Labs List - Each lab in a column */}
        <div className="flex flex-col gap-1 mt-4">
          {labsWithFilteredYears.map((lab) => {
            const chartData: ModalSplitChartDataset[] = lab.entries;

            return (
              <div
                key={lab.labId}
                className="border-b border-gray-100 last:border-b-0"
              >
                {/* Lab Name */}
                <h6 className="text-sm font-medium text-gray-700">
                  {lab.labName}
                </h6>

                {/* Horizontal Stacked Bar Chart */}
                <div className="w-full">
                  <ModalSplitStackedBarChart
                    data={chartData}
                    orientation="horizontal"
                    height={chartData.length * 60 + 60}
                    viewLegend={false}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="mt-4 pt-2 border-t border-gray-100 text-center">
          <span className="text-sm text-gray-500">
            {labsWithFilteredYears.length} living lab
            {labsWithFilteredYears.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};
