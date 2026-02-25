import { useState, useEffect } from "react";
import { LivingLabTransportModeForm } from "./form/LivingLabTransportModeForm";
import {
  type ITransportMode,
  type IKpiResultGroup,
  type IKpi,
  type ITransportModeLivingLabImplementation,
} from "../../types";
import { DefaultCollectionDate, KpiResultList } from "./form";
import { TransportTypeBadge } from "./TransportTypeBadge";
import {
  Table,
  TableHead,
  TableCell,
  TableHeader,
  TableRow,
} from "../react-catalyst-ui-kit";
import { Tabs, Tooltip, type Tab } from "./ui";
import { getKpiValueByMetricType, getYearFromDate } from "../../lib/helpers";
import { ModalSplitChart, type SplitItem } from "./KpiCards";

interface Props {
  modes: ITransportMode[];
  kpis: IKpi[];
  livingLabId: number;
  livingLabTransportModes: ITransportModeLivingLabImplementation[];
  kpiResults: IKpiResultGroup[];
  defaultDate?: string;
}

export function LivingLabModalSplit({
  modes = [],
  kpis = [],
  livingLabId,
  livingLabTransportModes = [],
  kpiResults = [],
  defaultDate: initialDefaultDate,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [defaultDate, setDefaultDate] = useState<string>(
    initialDefaultDate ?? today,
  );

  const [livingLabTransportModesMap, setLivingLabTransportModesMap] = useState<
    Map<number, ITransportModeLivingLabImplementation>
  >(
    new Map(
      livingLabTransportModes.map((mode) => [mode.transport_mode_id, mode]),
    ),
  );

  const [livingLabKpiMap] = useState<Map<string, IKpiResultGroup>>(
    new Map(
      kpiResults.map((resultKpi) => [
        `${resultKpi.kpidefinition_id}_${
          resultKpi?.transport_mode_id ?? "none"
        }`,
        resultKpi,
      ]),
    ),
  );

  // compute totals per KPI id by summing all result values in the group
  const computeTotals = () => {
    const totals = new Map<number, number>();
    kpis.forEach((kpi) => {
      let sum = 0;
      Array.from(livingLabKpiMap.values())
        .filter((r) => r.kpidefinition_id === kpi.id)
        .forEach((r) => {
          r.results?.forEach((result) => {
            const v = typeof result.value === "number" ? result.value : Number(result.value ?? 0);
            if (!isNaN(v)) sum += v;
          });
        });
      totals.set(kpi.id, sum);
    });
    return totals;
  };

  const [kpiTotals] = useState<Map<number, number>>(computeTotals);

  const getChartValues = (kpiId: number) => {
    const tabs: { label: string; data: SplitItem[] }[] = [];
    // Collect all results for this KPI grouped by date year
    const byYear = new Map<string, SplitItem[]>();
    Array.from(livingLabKpiMap.values())
      .filter((result) => result.kpidefinition_id === kpiId)
      .forEach((result) => {
        const transportModeId = result.transport_mode_id;
        const mode = modes.find((m) => m.id === transportModeId);
        result.results?.forEach((r) => {
          const year = String(getYearFromDate(r.date) ?? r.date);
          if (!byYear.has(year)) byYear.set(year, []);
          byYear.get(year)!.push({
            label: mode?.name || `Mode ${transportModeId}`,
            value: r.value ?? 0,
            color: mode?.color || "#ccc",
          });
        });
      });
    byYear.forEach((data, year) => {
      tabs.push({
        label: `${kpis.find((k) => k.id === kpiId)?.name} (${year})`,
        data,
      });
    });
    return tabs;
  };

  const getTabs = () => {
    const tabs: Tab[] = [];
    kpis.forEach((kpi) => {
      const chartData = getChartValues(kpi.id);
      if (chartData.length > 0) {
        tabs.push({
          id: `modal-split-${kpi.id}`,
          label: <p>{kpi.name}</p>,
          content: <ModalSplitChart data={chartData} />,
        });
      }
    });
    return <Tabs align="right" tabs={tabs}></Tabs>;
  };

  return (
    <div className="bg-white shadow rounded-md flex flex-col gap-6">
      <DefaultCollectionDate
        value={defaultDate}
        onChange={setDefaultDate}
      />
      {getTabs()}
      <div className="p-4 overflow-x-auto">
        <Table
          grid
          dense
          striped
          className="[--gutter:--spacing(6)] sm:[--gutter:--spacing(8)]"
        >
          <TableHead>
            <TableRow>
              <TableHeader className="whitespace-normal break-words">
                Name
              </TableHeader>
              <TableHeader className="whitespace-normal break-words">
                Status
              </TableHeader>
              {kpis.map((kpi) => (
                <TableHeader
                  key={kpi.id}
                  className="font-extrabold whitespace-normal break-words text-primary"
                >
                  <div className="flex flex-col">
                    {kpi.name}
                    <span className="text-sm font-normal text-gray-500">
                      {!!kpiTotals.get(kpi.id) &&
                        getKpiValueByMetricType(
                          kpiTotals.get(kpi.id),
                          kpi.metric,
                        )}
                    </span>
                  </div>
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <tbody className="bg-white divide-y divide-gray-100 content-start">
            {modes.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="max-w-52 content-start items-start flex gap-1">
                  <Tooltip content={m.description}>
                    {m.name}
                    {m.description && <> ⓘ</>}
                  </Tooltip>
                  {m.type === "NSM" && <TransportTypeBadge type={m.type} />}
                </TableCell>
                <TableCell className="content-start">
                  <LivingLabTransportModeForm
                    value={livingLabTransportModesMap.get(m.id)}
                    transportModeId={m.id}
                    livingLabId={livingLabId}
                    onChange={(result) => {
                      setLivingLabTransportModesMap((prevMap) => {
                        const updatedMap = new Map(prevMap);
                        const prevValue = prevMap.get(m.id);

                        updatedMap.set(m.id, {
                          ...prevValue,
                          ...result,
                        });
                        return updatedMap;
                      });
                    }}
                  />
                </TableCell>
                {livingLabTransportModesMap.get(m.id)?.status &&
                  kpis.map((kpi) => (
                    <TableCell key={kpi.id} className="content-start">
                      <div className="flex flex-row">
                        <KpiResultList
                          transportModeId={m.id}
                          livingLabId={livingLabId}
                          kpi={kpi}
                          initialResults={
                            livingLabKpiMap.get(`${kpi.id}_${m.id}`)
                              ?.results ?? []
                          }
                          defaultDate={defaultDate}
                          changeDateAllowed={false}
                        />
                      </div>
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
