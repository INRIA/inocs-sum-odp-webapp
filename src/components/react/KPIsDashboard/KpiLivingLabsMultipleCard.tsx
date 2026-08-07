import React, { useMemo } from "react";
import type {
  KpiLivingLabsMultipleCardProps,
  IFacetData,
  ILabPartition,
} from "./types";
import { Badge, Tooltip } from "../ui";
import { D3TimelineChart } from "./D3TimelineChart";
import { D3FacetedTimelineChart } from "./D3FacetedTimelineChart";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv";
import { formatValue, formatMonthYear } from "../../../lib/helpers";

export const KpiLivingLabsMultipleCard: React.FC<
  KpiLivingLabsMultipleCardProps
> = ({ parentKpi, childKpis, kpiTimelineMap, className }) => {
  const parentPartition = kpiTimelineMap.get(parentKpi.id);
  const parentTimelines = parentPartition?.chartLabs ?? [];
  const hasParentChart = parentTimelines.length > 0;

  // Child KPIs — use chartLabs only for the faceted chart
  const childKpisWithData = childKpis.filter((child) => {
    const partition = kpiTimelineMap.get(child.id);
    return partition && partition.chartLabs.length > 0;
  });

  const facets: IFacetData[] = useMemo(() => {
    return childKpisWithData.map((child) => ({
      kpiId: child.id,
      kpiName: child.name,
      labTimelines: kpiTimelineMap.get(child.id)!.chartLabs,
    }));
  }, [childKpisWithData, kpiTimelineMap]);

  // Collect baseline labs across parent + children (deduplicated by labId)
  const allBaselineLabs = useMemo(() => {
    const seen = new Set<number>();
    const baselines: ILabPartition["baselineLabs"] = [];
    const partitions = [
      parentPartition,
      ...childKpis.map((c) => kpiTimelineMap.get(c.id)),
    ].filter((p): p is ILabPartition => Boolean(p));

    partitions.forEach((partition) => {
      partition.baselineLabs.forEach((bl) => {
        if (!seen.has(bl.labId)) {
          seen.add(bl.labId);
          baselines.push(bl);
        }
      });
    });
    return baselines;
  }, [parentPartition, childKpis, kpiTimelineMap]);

  const hasBaseline = allBaselineLabs.length > 0;

  // Count total data points and unique labs for footer
  const allTimelines = [
    ...(hasParentChart ? parentTimelines : []),
    ...childKpisWithData.flatMap(
      (child) => kpiTimelineMap.get(child.id)!.chartLabs,
    ),
  ];

  const totalDataPoints = allTimelines.reduce(
    (sum, lab) => sum + lab.dataPoints.length,
    0,
  );
  const uniqueLabIds = new Set([
    ...allTimelines.map((lab) => lab.labId),
    ...allBaselineLabs.map((bl) => bl.labId),
  ]);
  const labCount = uniqueLabIds.size;

  const parentChartHeight = 250;

  return (
    <div className={`p-2 ${className ?? ""}`}>
      <div className="p-4 relative rounded-2xl border-primary-light border bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Parent KPI Badge */}
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
        {hasParentChart && (
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

        {/* Faceted Chart for Child KPIs — chart-eligible labs only */}
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

        {/* Baseline table — labs with exactly 1 validated estimation across any KPI */}
        {hasBaseline && (
          <div
            className={`mt-3 ${hasParentChart || facets.length > 0 ? "pt-3 border-t border-gray-100" : ""}`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-1 font-normal">City</th>
                  <th className="pb-1 font-normal">Reporting date</th>
                  <th className="pb-1"></th>
                </tr>
              </thead>
              <tbody>
                {allBaselineLabs.map((bl) => (
                  <tr key={bl.labId} className="border-t border-gray-50">
                    <td className="py-1 font-medium" style={{ color: bl.color }}>
                      {bl.labName}
                    </td>
                    <td className="py-1 text-gray-400">
                      {formatMonthYear(bl.result.date)}
                    </td>
                    <td className="py-1">
                      <span className="text-xs italic text-gray-400">
                        Baseline only — no follow-up yet
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary footer */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex w-full items-center justify-between">
          <span className="text-sm text-gray-500 text-left">
            {labCount} living lab{labCount !== 1 ? "s" : ""} •{" "}
            {facets.length} sub-indicator{facets.length !== 1 ? "s" : ""}
            {totalDataPoints > 0 &&
              ` • ${totalDataPoints} data point${totalDataPoints !== 1 ? "s" : ""}`}
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
