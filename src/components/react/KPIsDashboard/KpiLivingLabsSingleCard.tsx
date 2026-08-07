import React from "react";
import type { KpiLivingLabsCardProps } from "./types";
import { Badge, Tooltip } from "../ui";
import { D3TimelineChart } from "./D3TimelineChart";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv";
import { formatValue, formatMonthYear } from "../../../lib/helpers";
import { getKpiReading, formatDirection } from "../../../config/kpiReadings";

export const KpiLivingLabsSingleCard: React.FC<KpiLivingLabsCardProps> = ({
  kpi,
  labTimelines,
  baselineLabs,
}) => {
  const hasChart = labTimelines.length > 0;
  const hasBaseline = baselineLabs.length > 0;

  if (!hasChart && !hasBaseline) return null;

  // Count total data points for footer
  const totalDataPoints = labTimelines.reduce(
    (sum, lab) => sum + lab.dataPoints.length,
    0,
  );
  const labCount = labTimelines.length + baselineLabs.length;

  const reading = getKpiReading(kpi.id);

  // Freshness: find the most recent data point date across all labs
  const allDates = [
    ...labTimelines.flatMap((lab) => lab.dataPoints.map((dp) => dp.date)),
    ...baselineLabs.map((bl) => bl.result.date),
  ].filter(Boolean).sort();
  const lastDataDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;
  const firstDataDate = allDates.length > 0 ? allDates[0] : null;

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
          {reading && (
            <div className="mt-1 text-xs text-gray-500 space-y-0.5">
              {reading.reading !== "PLACEHOLDER — awaiting WP1 content" && (
                <p className="italic">{reading.reading}</p>
              )}
              <p>
                {reading.unit !== "?" && (
                  <span className="font-medium">{reading.unit}</span>
                )}{" "}
                &middot; {formatDirection(reading.direction)}
              </p>
            </div>
          )}
        </div>

        {/* D3 Timeline Chart — only when there are chart-eligible labs */}
        {hasChart && (
          <div className="mt-4">
            <D3TimelineChart
              data={labTimelines}
              metricType={kpi.metric}
              height={280}
              showLegend={false}
            />
          </div>
        )}

        {/* Baseline table — labs with exactly 1 validated estimation */}
        {hasBaseline && (
          <div
            className={`mt-3 ${hasChart ? "pt-3 border-t border-gray-100" : ""}`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-1 font-normal">City</th>
                  <th className="pb-1 font-normal">Value</th>
                  <th className="pb-1 font-normal">Reporting date</th>
                  <th className="pb-1"></th>
                </tr>
              </thead>
              <tbody>
                {baselineLabs.map((bl) => (
                  <tr key={bl.labId} className="border-t border-gray-50">
                    <td className="py-1 font-medium" style={{ color: bl.color }}>
                      {bl.labName}
                    </td>
                    <td className="py-1">
                      {formatValue(bl.result.value, kpi.metric)}
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
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-gray-500 text-left">
              {labCount} living lab{labCount !== 1 ? "s" : ""}
              {hasChart && ` • ${totalDataPoints} data point${totalDataPoints !== 1 ? "s" : ""}`}
            </span>
            {firstDataDate && (
              <span className="text-xs text-gray-400">
                Period:{" "}
                <span className="font-medium text-gray-600">
                  {formatMonthYear(firstDataDate)}
                  {lastDataDate && lastDataDate !== firstDataDate
                    ? ` – ${formatMonthYear(lastDataDate)}`
                    : ""}
                </span>
              </span>
            )}
          </div>
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
