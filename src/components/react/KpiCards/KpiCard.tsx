import { type IKpi, type IKpiResultGroup } from "../../../types";
import { Badge, Tooltip } from "../ui";
import KpiDefault from "./KpiDefault";
import { KpiBaselineValue } from "./KpiBaselineValue";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv";
import { getKpiDisplayMode } from "../../../lib/utils/kpiSufficiency";
import { getKpiReading, formatDirection } from "../../../config/kpiReadings";
import { formatMonthYear } from "../../../lib/helpers";

type Props = {
  kpi: IKpi;
  kpiResults?: IKpiResultGroup;
  lab_validated_at?: Date | null;
};

export function KpiCard({ kpi, kpiResults, lab_validated_at }: Props) {
  const displayMode = kpiResults
    ? getKpiDisplayMode(kpiResults.results, lab_validated_at)
    : "hidden";

  // 0 validated estimations → omit entirely (empty state handled by Epic 5 / T06)
  if (displayMode === "hidden" || !kpiResults) return null;

  const reading = getKpiReading(kpi.id);

  // Compute period range and last updated from results
  const sortedDates = (kpiResults.results ?? [])
    .map((r) => r.date)
    .filter(Boolean)
    .sort();
  const periodStart = sortedDates.length > 0 ? sortedDates[0] : null;
  const periodEnd = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : null;
  const lastUpdatedDate = (kpiResults.results ?? [])
    .map((r) => r.updated_at)
    .filter(Boolean)
    .sort()
    .pop() ?? null;

  const badge = (
    <div className="absolute top-0 sm:-top-0.5 right-0">
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
  );

  const title = (
    <div className="flex flex-col text-center my-2">
      <h6 className="text-center text-black">{kpi?.name ?? "KPI"}</h6>
      {kpi?.metric_description ? (
        <div className="text-sm text-muted mt-2 max-w-xl mx-auto">
          {kpi?.metric_description}
        </div>
      ) : null}
      {reading && (
        <div className="mt-2 text-xs text-gray-500 space-y-0.5">
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
  );

  const metadataFooter = (
    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-400">
      {periodStart && (
        <span>
          Period:{" "}
          <span className="font-medium text-gray-600">
            {formatMonthYear(periodStart)}
            {periodEnd ? ` – ${formatMonthYear(periodEnd)}` : ""}
          </span>
        </span>
      )}
      {lastUpdatedDate && (
        <span>
          Last updated:{" "}
          <span className="font-medium text-gray-600">
            {formatMonthYear(String(lastUpdatedDate))}
          </span>
        </span>
      )}
    </div>
  );

  // Exactly 1 validated estimation → baseline value display
  if (displayMode === "baseline") {
    return (
      <div className="p-1 lg:p-2">
        <div className="p-2 relative rounded-2xl border-primary-light border">
          {badge}
          {title}
          <KpiBaselineValue
            kpiResults={kpiResults}
            metricType={kpi.metric}
            labValidatedAt={lab_validated_at}
          />
          {metadataFooter}
        </div>
      </div>
    );
  }

  // ≥2 validated estimations → full chart display
  return (
    <div className="p-1 lg:p-2 ">
      <div className="p-2 relative rounded-2xl border-primary-light border ">
        {badge}
        {title}
        <KpiDefault
          kpiResults={kpiResults}
          metricType={kpi.metric}
          progressionTarget={kpi.progression_target}
        />
        {metadataFooter}
        <div className="flex justify-end mt-2">
          <TriggerDownloadCsv
            type="kpi-results-lab"
            size="sm"
            living_lab_id={kpiResults.living_lab_id}
            kpidefinition_id={kpi.id}
          />
        </div>
      </div>
    </div>
  );
}
