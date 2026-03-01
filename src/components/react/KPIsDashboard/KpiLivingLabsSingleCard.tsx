import React from "react";
import type { KpiLivingLabsCardProps } from "./types";
import { Badge, Tooltip } from "../ui";
import { D3TimelineChart } from "./D3TimelineChart";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv";

export const KpiLivingLabsSingleCard: React.FC<KpiLivingLabsCardProps> = ({
  kpi,
  labTimelines,
}) => {
  // Count total data points and unique labs
  const totalDataPoints = labTimelines.reduce(
    (sum, lab) => sum + lab.dataPoints.length,
    0,
  );
  const labCount = labTimelines.length;

  return (
    <div className="p-2">
      <div className="p-4 relative rounded-2xl border-primary-light border bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* KPI Badge - Same style as KpiCard */}
        <div className="absolute top-0 right-0">
          <Badge
            size="sm"
            color="light"
            className="rounded-tl-none rounded-bl-xl rounded-br-none rounded-tr-xl"
          >
            <Tooltip
              content={kpi.description}
              placement="left"
              iconClassName="h-3 w-3 text-primary"
            >
              KPI {kpi.kpi_number} {kpi.description && "ⓘ"}
            </Tooltip>
          </Badge>
        </div>

        {/* KPI Title */}
        <div className="flex flex-col text-center my-2 mb-4">
          <h6 className="text-center text-black font-semibold">
            {kpi?.name ?? "KPI"}
          </h6>
          {kpi?.metric_description && (
            <div className="text-sm text-muted mt-1 max-w-xl mx-auto">
              {kpi?.metric_description}
            </div>
          )}
        </div>

        {/* D3 Timeline Chart */}
        <div className="mt-4">
          <D3TimelineChart
            data={labTimelines}
            metricType={kpi.metric}
            height={280}
            showLegend={false}
          />
        </div>

        {/* Summary footer */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex w-full items-center justify-between">
          <span className="text-sm text-gray-500 text-left">
            {labCount} living lab{labCount !== 1 ? "s" : ""} • {totalDataPoints}{" "}
            data point{totalDataPoints !== 1 ? "s" : ""}
          </span>
          <div className="flex justify-end">
            <TriggerDownloadCsv
              type="kpi-results-definition"
              size="sm"
              kpidefinition_id={kpi.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
