import React from "react";
import type { KpiLivingLabsMultipleCardProps } from "./types";
import { Badge, Tooltip } from "../ui";
import { D3TimelineChart } from "./D3TimelineChart";

export const KpiLivingLabsMultipleCard: React.FC<
  KpiLivingLabsMultipleCardProps
> = ({ parentKpi, childKpis, kpiTimelineMap }) => {
  // Get parent KPI timelines if data exists
  const parentTimelines = kpiTimelineMap.get(parentKpi.id) || [];
  const hasParentData = parentTimelines.length > 0;

  // Filter child KPIs that have data
  const childKpisWithData = childKpis.filter(
    (child) =>
      kpiTimelineMap.has(child.id) && kpiTimelineMap.get(child.id)!.length > 0,
  );

  // Count total data points and unique labs across all KPIs
  const allTimelines = [
    ...(hasParentData ? [parentTimelines] : []),
    ...childKpisWithData.map((child) => kpiTimelineMap.get(child.id)!),
  ].flat();

  const totalDataPoints = allTimelines.reduce(
    (sum, lab) => sum + lab.dataPoints.length,
    0,
  );

  const uniqueLabIds = new Set(allTimelines.map((lab) => lab.labId));
  const labCount = uniqueLabIds.size;

  // Calculate dynamic height based on number of charts
  const chartCount = (hasParentData ? 1 : 0) + childKpisWithData.length;
  const baseHeight = 280;
  const childHeight = 220;

  return (
    <div className="p-2">
      <div className="p-4 relative rounded-2xl border-primary-light border bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Parent KPI Badge - Same style as KpiCard */}
        <div className="absolute top-0 right-0">
          <Badge
            size="sm"
            color="light"
            className="rounded-tl-none rounded-bl-xl rounded-br-none rounded-tr-xl"
          >
            <Tooltip
              content={parentKpi.description}
              placement="left"
              iconClassName="h-3 w-3 text-primary"
            >
              KPI {parentKpi.kpi_number} {parentKpi.description && "ⓘ"}
            </Tooltip>
          </Badge>
        </div>

        {/* Parent KPI Title */}
        <div className="flex flex-col text-center my-2 mb-4 pr-16">
          <h6 className="text-center text-black font-semibold">
            {parentKpi?.name ?? "KPI"}
          </h6>
          {parentKpi?.metric_description && (
            <div className="text-sm text-muted mt-1 max-w-xl mx-auto">
              {parentKpi?.metric_description}
            </div>
          )}
        </div>

        {/* Parent KPI Chart (if data exists) */}
        {hasParentData && (
          <div className="mt-4 mb-6">
            <div className="text-sm font-medium text-gray-700 mb-2 px-2">
              Overall: {parentKpi.name}
            </div>
            <D3TimelineChart
              data={parentTimelines}
              metricType={parentKpi.metric}
              height={baseHeight}
            />
          </div>
        )}

        {/* Child KPI Charts */}
        {childKpisWithData.length > 0 && (
          <div className="space-y-6 mt-4">
            {childKpisWithData.map((childKpi) => {
              const childTimelines = kpiTimelineMap.get(childKpi.id) || [];

              return (
                <div key={childKpi.id}>
                  <div className="text-sm font-medium text-gray-700 mb-2 px-2 flex items-center gap-2">
                    <span className="text-primary">▸</span>
                    <span>{childKpi.name}</span>
                    {childKpi.metric_description && (
                      <Tooltip
                        content={childKpi.metric_description}
                        placement="top"
                        iconClassName="h-3 w-3 text-gray-400"
                      >
                        ⓘ
                      </Tooltip>
                    )}
                  </div>
                  <D3TimelineChart
                    data={childTimelines}
                    metricType={childKpi.metric}
                    height={childHeight}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Summary footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <span className="text-sm text-gray-500">
            {labCount} living lab{labCount !== 1 ? "s" : ""} • {chartCount}{" "}
            chart
            {chartCount !== 1 ? "s" : ""} • {totalDataPoints} data point
            {totalDataPoints !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};
