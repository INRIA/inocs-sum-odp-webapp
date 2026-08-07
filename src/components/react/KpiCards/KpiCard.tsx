import { type IKpi, type IKpiResultGroup } from "../../../types";
import { Badge, Tooltip } from "../ui";
import KpiDefault from "./KpiDefault";
import { KpiBaselineValue } from "./KpiBaselineValue";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv";
import { getKpiDisplayMode } from "../../../lib/utils/kpiSufficiency";

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
