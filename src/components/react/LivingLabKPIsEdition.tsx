import { useState } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../react-catalyst-ui-kit";
import type { IKpi, IIKpiResultBeforeAfter } from "../../types";
import { BeforeAndAfterDates, LivingLabKpiResultsForm } from "./form";
import { KpiTypeBadge } from "./KpiTypeBadge";
import { Badge, ExpansionPanel, Tooltip } from "./ui";
import type { ICategory } from "../../types/Category";

type Props = {
  kpis: IKpi[];
  livingLabId: string;
  kpiResults: IIKpiResultBeforeAfter[];
  categories: ICategory[];
  valueBeforeDate?: string;
  valueAfterDate?: string;
};

export function LivingLabKPIsEdition({
  kpis = [],
  livingLabId,
  kpiResults = [],
  categories = [],
  valueBeforeDate,
  valueAfterDate,
}: Props) {
  if (!kpis || kpis.length === 0) {
    return <div>No KPIs available.</div>;
  }

  const livingLabKpiMap = new Map(
    kpiResults.map((kpi) => [kpi.kpidefinition_id, kpi])
  );
  // Data collection date input state (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const [beforeDate, setBeforeDate] = useState<string>(
    valueBeforeDate ?? today
  );
  const [afterDate, setAfterDate] = useState<string | undefined>(
    valueAfterDate
  );

  const getKpiRow = (kpiId: string) => {
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
            <LivingLabKpiResultsForm
              livingLabId={livingLabId}
              kpi={kpi}
              initialBefore={livingLabKpiMap.get(kpi.id)?.result_before}
              initialAfter={livingLabKpiMap.get(kpi.id)?.result_after}
              defaultBeforeDate={beforeDate}
              defaultAfterDate={afterDate}
            />
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="flex flex-col gap-8 mx-auto">
      <BeforeAndAfterDates
        valueBeforeDate={beforeDate}
        valueAfterDate={afterDate}
        onChangeBeforeDate={setBeforeDate}
        onChangeAfterDate={setAfterDate}
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
            <Table dense className="lg:min-w-3xl max-w-5xl">
              <TableHead>
                <TableRow>
                  <TableHeader>KPI Number</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Metric unit</TableHeader>
                  <TableHeader>Value Before vs After</TableHeader>
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
