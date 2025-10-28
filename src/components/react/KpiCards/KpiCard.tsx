import { type IIKpiResultBeforeAfter, type IKpi } from "../../../types";
import { Badge, Tooltip } from "../ui";
import KpiDefault from "./KpiDefault";

type Props = {
  kpi: IKpi;
  kpiResults: IIKpiResultBeforeAfter;
};

export function KpiCard({ kpi, kpiResults }: Props) {
  return (
    <div className="p-1 lg:p-2 ">
      <div className="p-2 relative rounded-2xl border-primary-light border ">
        <div className="absolute -top-1 right-0">
          <Badge size="sm" color="light" className="rounded-2xl">
            <Tooltip
              content={kpi.description}
              placement="left"
              iconClassName="h-3 w-3 text-primary"
            >
              KPI {kpi.kpi_number} ⓘ
            </Tooltip>
          </Badge>
        </div>

        <div className="flex flex-col text-center mt-2">
          <h6 className="text-center text-black">{kpi?.name ?? "KPI"}</h6>
          {kpi?.metric_description ? (
            <div className="text-sm text-muted mt-2 max-w-xl mx-auto">
              {kpi?.metric_description}
            </div>
          ) : null}
        </div>

        {
          <KpiDefault
            kpiResults={kpiResults}
            metricType={kpi.metric}
            progressionTarget={kpi.progression_target}
          />
        }
      </div>
    </div>
  );
}
