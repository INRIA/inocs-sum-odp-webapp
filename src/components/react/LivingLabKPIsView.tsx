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
import { KpiCard, KpiMultiple } from "./KpiCards";

interface IKpiResultsByCategory extends ICategory {
  kpiResults: IIKpiResultBeforeAfter[];
}
type Props = {
  kpis?: IKpi[];
  categories: IKpiResultsByCategory[];
};

export function LivingLabKPIsView({ categories = [], kpis }: Props) {
  const getKpiSection = (
    parentKpi: IKpi,
    resultKpis: IIKpiResultBeforeAfter[] = []
  ) => {
    console.log("resultKpis:", resultKpis.length);
    if (resultKpis.length === 1) {
      return <KpiCard key={parentKpi.id} kpiResults={resultKpis[0]} />;
    }
    if (resultKpis.length > 1) {
      return (
        <KpiMultiple
          key={parentKpi.id}
          results={resultKpis}
          title={parentKpi?.name}
          subtitle={parentKpi?.description}
          kpiNumber={parentKpi?.kpi_number}
        />
      );
    }
  };
  const getCategorySection = (kpiResults: IIKpiResultBeforeAfter[]) => {
    const parentKpis = new Map<number, IIKpiResultBeforeAfter>();
    const kpiResultsMap = new Map<number, IIKpiResultBeforeAfter[]>();
    kpiResults?.forEach((kpi) => {
      const key = kpi.parent_kpi_id ? kpi.parent_kpi_id : kpi.id;
      if (!kpiResultsMap.has(key)) {
        kpiResultsMap.set(key, []);
      }
      kpiResultsMap.get(key)?.push(kpi);

      const parentKpiData = kpis?.find((p) => p.id === key);
      if (parentKpiData && !parentKpis.has(key)) {
        parentKpis.set(key, parentKpiData);
      }
    });

    return (
      <div className="grid grid-flow-row-dense grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0">
        {Array.from(parentKpis.entries())
          .sort(
            ([a], [b]) =>
              (kpiResultsMap.get(b)?.length ?? 0) -
              (kpiResultsMap.get(a)?.length ?? 0)
          )
          .map(([key, parentKpi]) => (
            // <div className="break-inside-avoid">
            <div
              className={`break-inside-avoid ${
                (kpiResultsMap.get(key) ?? [])?.length > 1
                  ? "md:col-span-2"
                  : "col-span-1"
              } `}
            >
              {getKpiSection(parentKpi, kpiResultsMap.get(key) ?? [])}
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 mx-auto w-full">
      {categories.map(
        ({ id, name, kpiResults }, index) =>
          kpiResults?.length > 0 && (
            <ExpansionPanel
              key={id}
              header={
                <div className="flex flex-row justify-center items-center gap-2 rounded-2xl border-info bg-info px-1 py-1">
                  <h5 className="text-center">{name}</h5>
                  <Badge
                    color="light"
                    size="sm"
                    tooltip="Number of KPIs in this category"
                    displayTooltipIcon={false}
                  >
                    {kpiResults?.length || 0}
                  </Badge>
                </div>
              }
              arrow
              open={true}
              content={getCategorySection(kpiResults)}
            />
          )
      )}
    </div>
  );
}

export default LivingLabKPIsView;
