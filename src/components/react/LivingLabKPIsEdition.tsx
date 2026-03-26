import { useState } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../react-catalyst-ui-kit";
import type { IKpi, IKpiResultGroup } from "../../types";
import { DefaultCollectionDate, KpiResultList } from "./form";
import { KpiTypeBadge } from "./KpiTypeBadge";
import { Badge, ExpansionPanel, Tooltip } from "./ui";
import type { ICategory } from "../../types/Category";

type Props = {
  kpis: IKpi[];
  livingLabId: number;
  kpiResults: IKpiResultGroup[];
  categories: ICategory[];
  defaultDate?: string;
};

export function LivingLabKPIsEdition({
  kpis = [],
  livingLabId,
  kpiResults = [],
  categories = [],
  defaultDate: initialDefaultDate,
}: Props) {
  if (!kpis || kpis.length === 0) {
    return <div>No KPIs available.</div>;
  }

  const livingLabKpiMap = new Map(
    kpiResults.map((kpi) => [kpi.kpidefinition_id, kpi])
  );
  // Data collection date input state (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const [defaultDate, setDefaultDate] = useState<string>(
    initialDefaultDate ?? today
  );

  const getKpiRow = (kpiId: number) => {
    let kpi = kpis.find((k) => k.id === kpiId);
    const hasChildren = kpis.some((k) => k.parent_kpi_id === kpiId);
    const idChild = kpi?.parent_kpi_id ? true : false;

    if (!kpi) return null;
    return (
      <TableRow
        key={kpiId}
        className={hasChildren || !idChild ? "border-t-2 border-info/30" : ""}
      >
        <TableCell className={`flex flex-col w-22 ${idChild ? "ml-2" : ""}`}>
          {kpi.kpi_number}
          <KpiTypeBadge type={kpi.type} />
        </TableCell>
        <TableCell className="whitespace-pre-line break-words">
          <Tooltip content={kpi.description} placement="top">
            <p className={idChild ? "ml-2" : "font-bold"}>{kpi.name} ⓘ</p>
          </Tooltip>
        </TableCell>
        <TableCell>
          <div className="flex flex-col text-xs">
            {kpi.metric_description}
            <span>
              {typeof kpi.min_value === "number" && <>min: {kpi.min_value} </>}
              {typeof kpi.max_value === "number" && <>max: {kpi.max_value}</>}
            </span>
          </div>
        </TableCell>
        <TableCell className="w-20">
          {!hasChildren && (
            <KpiResultList
              livingLabId={livingLabId}
              kpi={kpi}
              initialResults={livingLabKpiMap.get(kpi.id)?.results ?? []}
              defaultDate={defaultDate}
            />
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="flex flex-col gap-6 mx-auto w-full xl:w-4/5">
      <DefaultCollectionDate
        value={defaultDate}
        onChange={setDefaultDate}
      />
      {categories.map(({ id, name, kpis }, index) => (
        <ExpansionPanel
          key={id}
          header={
            <div className="flex flex-row justify-start items-center gap-2 rounded-2xl border-info bg-info px-2 py-1">
              <h5>{name}</h5>
              <Badge
                color="light"
                size="sm"
                tooltip="Number of KPIs in this category"
                displayTooltipIcon={false}
              >
                {kpis?.length || 0} KPIs
              </Badge>
            </div>
          }
          arrow
          open={index === 0}
          content={
            <Table dense className="mx-auto">
              <TableHead>
                <TableRow>
                  <TableHeader>KPI Number</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Metric unit</TableHeader>
                  <TableHeader>Values</TableHeader>
                </TableRow>
              </TableHead>

              <TableBody>{kpis?.map(({ id }) => getKpiRow(id))}</TableBody>
            </Table>
          }
        />
      ))}
    </div>
  );
}

export default LivingLabKPIsEdition;
