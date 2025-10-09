import { type IIKpiResultBeforeAfter } from "../../../types";
import { Badge, Tooltip } from "../ui";
import KpiDefault from "./KpiDefault";

type Props = {
  kpiResults: IIKpiResultBeforeAfter;
};

export function KpiCard({ kpiResults }: Props) {
  return (
    <div className="p-1 lg:p-2 ">
      <div className="p-2 relative rounded-2xl border-primary-light border ">
        <div className="absolute -top-1 right-0">
          <Badge size="sm" color="light" className="rounded-2xl">
            KPI {kpiResults.kpi_number}
            <Tooltip
              content={kpiResults.description}
              placement="left"
              iconClassName="h-3 w-3 text-primary"
            />
          </Badge>
        </div>

        <div className="flex flex-col text-center mt-2">
          <h6 className="text-center text-black">
            {kpiResults?.name ?? "KPI"}
          </h6>
          {/* {kpiResults?.description ? (
          <div className="text-sm text-muted mt-2 max-w-xl mx-auto">
            {kpiResults.description}
          </div>
        ) : null} */}
        </div>

        {<KpiDefault kpiResults={kpiResults} />}
      </div>
    </div>
  );
}
