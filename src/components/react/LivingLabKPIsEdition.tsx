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
import { KpiMetricTypeBadge } from "./KpiMetricTypeBadge";
import { Badge, ExpansionPanel } from "./ui";
import type { ICategory } from "../../types/Category";

type Props = {
  kpis: IKpi[];
  livingLabId: string;
  kpiResults: IIKpiResultBeforeAfter[];
  categories: ICategory[];
};

export function LivingLabKPIsEdition({
  kpis = [],
  livingLabId,
  kpiResults = [],
  categories = [],
}: Props) {
  if (!kpis || kpis.length === 0) {
    return <div>No KPIs available.</div>;
  }

  const livingLabKpiMap = new Map(
    kpiResults.map((kpi) => [kpi.kpidefinition_id, kpi])
  );
  // Data collection date input state (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const [beforeDate, setBeforeDate] = useState<string>(today);
  const [afterDate, setAfterDate] = useState<string>(today);

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
        <TableCell className="flex flex-col w-22">
          {kpi.kpi_number}
          <KpiTypeBadge type={kpi.type} />
        </TableCell>
        <TableCell className="whitespace-pre-line break-words">
          {kpi.name}
          <Badge tooltip={kpi.description} size="sm" color="info" />
        </TableCell>
        <TableCell>
          {!hasChildren && (
            <div className="flex flex-col text-xs">
              <KpiMetricTypeBadge type={kpi.metric} />
              {kpi.metric_description?.length &&
                kpi.metric_description?.length > 0 && (
                  <strong>{kpi.metric_description}</strong>
                )}
              {typeof kpi.min_value === "number" && (
                <span>Min: {kpi.min_value} </span>
              )}
              {typeof kpi.max_value === "number" && (
                <span>Max: {kpi.max_value}</span>
              )}
            </div>
          )}
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
        onChangeBeforeDate={setBeforeDate}
        onChangeAfterDate={setAfterDate}
      />
      {categories.map(({ id, name, kpis }, index) => (
        <ExpansionPanel
          key={id}
          header={
            <div className="flex flex-row justify-center items-center gap-2 rounded-2xl border-info bg-info px-2 py-1">
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
