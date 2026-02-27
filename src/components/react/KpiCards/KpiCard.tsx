import { type IKpi, type IKpiResultGroup } from "../../../types";
import { Badge, Tooltip } from "../ui";
import KpiDefault from "./KpiDefault";

type Props = {
  kpi: IKpi;
  kpiResults?: IKpiResultGroup;
};

export function KpiCard({ kpi, kpiResults }: Props) {
  return (
    <div className="p-1 lg:p-2 ">
      <div className="p-2 relative rounded-2xl border-primary-light border ">
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

        <div className="flex flex-col text-center my-2">
          <h6 className="text-center text-black">{kpi?.name ?? "KPI"}</h6>
          {kpi?.metric_description ? (
            <div className="text-sm text-muted mt-2 max-w-xl mx-auto">
              {kpi?.metric_description}
            </div>
          ) : null}
        </div>

        {kpiResults && (
          <KpiDefault
            kpiResults={kpiResults}
            metricType={kpi.metric}
            progressionTarget={kpi.progression_target}
          />
        )}
      </div>
    </div>
  );
}
