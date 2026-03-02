import React, { useMemo } from "react";
import type { KpiLivingLabsMultipleCardProps, IFacetData } from "./types";
import { Badge, Tooltip } from "../ui";
import { D3TimelineChart } from "./D3TimelineChart";
import { D3FacetedTimelineChart } from "./D3FacetedTimelineChart";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv";

export const KpiLivingLabsMultipleCard: React.FC<
  KpiLivingLabsMultipleCardProps
> = ({ parentKpi, childKpis, kpiTimelineMap, className }) => {
  // Get parent KPI timelines if data exists
  const parentTimelines = kpiTimelineMap.get(parentKpi.id) || [];
  const hasParentData = parentTimelines.length > 0;

  // Filter child KPIs that have data
  const childKpisWithData = childKpis.filter(
    (child) =>
      kpiTimelineMap.has(child.id) && kpiTimelineMap.get(child.id)!.length > 0,
  );

  // Build facets for the faceted chart
  const facets: IFacetData[] = useMemo(() => {
    return childKpisWithData.map((child) => ({
      kpiId: child.id,
      kpiName: child.name,
      labTimelines: kpiTimelineMap.get(child.id) || [],
    }));
  }, [childKpisWithData, kpiTimelineMap]);

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

  // Parent chart height
  const parentChartHeight = 250;

  return (
    <div className={`p-2 ${className ?? ""}`}>
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
        <div className="flex flex-col text-center my-2 mb-4">
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
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2 px-2">
              Overall: {parentKpi.name}
            </div>
            <D3TimelineChart
              data={parentTimelines}
              metricType={parentKpi.metric}
              height={parentChartHeight}
              showLegend={false}
            />
          </div>
        )}
        {/* Faceted Chart for Child KPIs - Side by side comparison */}
        {facets.length > 0 && (
          <div className="mt-4" data-testid="subindicators-chart">
            <D3FacetedTimelineChart
              facets={facets}
              metricType={parentKpi.metric}
              facetHeight={180}
              showLegend={false}
            />
          </div>
        )}
        {/* Summary footer */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex w-full items-center justify-between">
          <span className="text-sm text-gray-500 text-left">
            {labCount} living lab{labCount !== 1 ? "s" : ""} • {facets.length}{" "}
            sub-indicator{facets.length !== 1 ? "s" : ""} • {totalDataPoints}{" "}
            data point{totalDataPoints !== 1 ? "s" : ""}
          </span>
          <div className="flex justify-end">
            <TriggerDownloadCsv
              type="kpi-results-definition"
              size="sm"
              kpidefinition_id={parentKpi.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
