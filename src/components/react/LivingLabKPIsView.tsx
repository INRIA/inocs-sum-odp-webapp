import { useState } from "react";
import type { IKpi, IKpiResultGroup } from "../../types";
import { Badge, ExpansionPanel, Tabs } from "./ui";
import type { ICategory } from "../../types/Category";
import { KpiCard, KpiMultiple } from "./KpiCards";
import {
  ModalSplitChart,
  type SplitItem,
  type ModalSplitChartView,
} from "./KpiCards";
import { ChartPieIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { TriggerDownloadCsv } from "./TriggerDownloadCsv/TriggerDownloadCsv";
import { ImplementationRecordTable } from "./KPIsDashboard/ImplementationRecordTable";

interface IKpiResultsByCategory extends ICategory {
  kpiResults: IKpiResultGroup[];
}

type Props = {
  kpis?: IKpi[];
  /** Implementation-record KPIs — rendered in a table, not as charts (T02) */
  implementationKpis?: IKpi[];
  categories?: IKpiResultsByCategory[];
  living_lab_id?: number;
  /** Lab validation timestamp for data-sufficiency check (T03) */
  lab_validated_at?: Date | null;

  modalSplitKpis?: {
    kpiName: string;
    kpidefinition_id?: number;
    entries: { label: string; data: SplitItem[] }[];
    before?: { label: string; data: SplitItem[] };
    after?: { label: string; data: SplitItem[] };
  }[];
};

export function LivingLabKPIsView({
  categories = [],
  kpis,
  implementationKpis,
  living_lab_id,
  lab_validated_at,
  modalSplitKpis,
}: Props) {
  const [chartView, setChartView] = useState<ModalSplitChartView>("doughnut");

  const getKpiSection = (
    parentKpi: IKpi,
    resultKpis: IKpiResultGroup[] = [],
  ) => {
    if (resultKpis.length === 1) {
      return (
        <KpiCard
          kpi={parentKpi}
          key={parentKpi.id}
          kpiResults={resultKpis[0]}
          lab_validated_at={lab_validated_at}
        />
      );
    }
    if (resultKpis.length > 1) {
      return (
        <KpiMultiple
          key={parentKpi.id}
          parentKpi={parentKpi}
          kpis={kpis ?? []}
          results={resultKpis}
          lab_validated_at={lab_validated_at}
        />
      );
    }
  };

  const getCategorySection = (kpiResults: IKpiResultGroup[]) => {
    const parentKpis = new Map<number, IKpi>();
    const kpiResultsMap = new Map<number, IKpiResultGroup[]>();
    kpiResults?.forEach((kpi) => {
      const kpiData = kpis?.find((k) => k.id === kpi.kpidefinition_id);
      if (!kpiData) return;
      const key = kpiData.parent_kpi_id ?? kpiData.id;
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
              (kpiResultsMap.get(a)?.length ?? 0),
          )
          .map(([key, parentKpi]) => (
            <div
              key={key}
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

  const renderModalSplitContent = () => (
    <>
      {modalSplitKpis &&
        modalSplitKpis.length > 0 &&
        modalSplitKpis.map(
          ({ kpiName, kpidefinition_id, entries, before, after }) => {
            const chartEntries =
              entries?.length > 0
                ? entries
                : [before, after].filter(
                    (entry): entry is { label: string; data: SplitItem[] } =>
                      Boolean(entry),
                  );

            return (
              chartEntries.length > 0 && (
                <div key={kpiName} className="flex flex-col gap-4">
                  <div className="flex flex-row items-center justify-between">
                    <h5 className="text-center flex-1">{kpiName}</h5>
                    <TriggerDownloadCsv
                      type="kpi-results-lab"
                      size="sm"
                      living_lab_id={living_lab_id}
                      kpidefinition_id={kpidefinition_id}
                    />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <ModalSplitChart
                      data={chartEntries}
                      view={chartView}
                      orientation="vertical"
                    />
                  </div>
                </div>
              )
            );
          },
        )}
    </>
  );

  const chartViewTabs = [
    {
      id: "doughnut",
      label: (
        <span className="flex items-center gap-1">
          <ChartPieIcon className="w-4 h-4" />
          Pie Chart
        </span>
      ),
      content: renderModalSplitContent(),
    },
    {
      id: "stacked-bar",
      label: (
        <span className="flex items-center gap-1">
          <ChartBarIcon className="w-4 h-4" />
          Stacked Bar
        </span>
      ),
      content: renderModalSplitContent(),
    },
  ];

  if (modalSplitKpis && modalSplitKpis?.length > 0) {
    return (
      <ExpansionPanel
        header={
          <div className="flex flex-row justify-center items-center gap-2 rounded-2xl border-info bg-info px-1 py-1">
            <h5 className="text-center">Modal Split</h5>
            <Badge
              color="light"
              size="sm"
              tooltip="Number of KPIs in this category"
              displayTooltipIcon={false}
            >
              {modalSplitKpis?.length || 0}
            </Badge>
          </div>
        }
        content={
          <Tabs
            tabs={chartViewTabs}
            defaultTabId="doughnut"
            onChange={(id) => setChartView(id as ModalSplitChartView)}
            align="right"
          />
        }
        arrow
        open={true}
      />
    );
  }

  // Collect all kpiResults across categories that match an implementationKpi
  const implementationResults: IKpiResultGroup[] =
    (implementationKpis ?? []).length > 0
      ? categories.flatMap((cat) =>
          (cat.kpiResults ?? []).filter((kr) =>
            (implementationKpis ?? []).some(
              (k) => k.id === kr.kpidefinition_id,
            ),
          ),
        )
      : [];

  return (
    <div className="flex flex-col gap-4 mx-auto w-full">
      {/* Outcome KPI charts grouped by category */}
      {categories.map(
        ({ id, name, kpiResults }, index) =>
          kpiResults?.length > 0 &&
          kpiResults.some((kr) =>
            kpis?.some((k) => k.id === kr.kpidefinition_id),
          ) && (
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
          ),
      )}

      {/* Implementation Record Table — process metrics, no charts */}
      {implementationResults.length > 0 && living_lab_id !== undefined && (
        <div className="mt-4">
          <h5 className="text-center mb-3">Implementation Record</h5>
          <ImplementationRecordTable
            view="lab"
            kpis={implementationKpis ?? []}
            kpiResults={implementationResults}
            living_lab_id={living_lab_id}
          />
        </div>
      )}
    </div>
  );
}

export default LivingLabKPIsView;
