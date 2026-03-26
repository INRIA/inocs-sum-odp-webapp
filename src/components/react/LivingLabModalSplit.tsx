import { useState, useMemo } from "react";
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
import { getKpiValueByMetricType } from "../../lib/helpers";
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

  const [livingLabKpiMap, setLivingLabKpiMap] = useState<
    Map<string, IKpiResultGroup>
  >(
    new Map(
      kpiResults.map((resultKpi) => [
        `${resultKpi.kpidefinition_id}_${
          resultKpi?.transport_mode_id ?? "none"
        }`,
        resultKpi,
      ]),
    ),
  );

  // totals per KPI grouped by month-year — recomputed whenever results change
  const kpiTotals = useMemo(() => {
    const totals = new Map<number, Map<string, number>>();
    kpis.forEach((kpi) => {
      const byDate = new Map<string, number>();
      Array.from(livingLabKpiMap.values())
        .filter((r) => r.kpidefinition_id === kpi.id)
        .forEach((r) => {
          r.results?.forEach((result) => {
            const v =
              typeof result.value === "number"
                ? result.value
                : Number(result.value ?? 0);
            if (isNaN(v)) return;
            const label = result.date
              ? new Date(result.date).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })
              : "—";
            byDate.set(label, (byDate.get(label) ?? 0) + v);
          });
        });
      totals.set(kpi.id, byDate);
    });
    return totals;
  }, [livingLabKpiMap, kpis]);

  // chart tabs — one tab per KPI, all month-years shown together in the same chart
  const chartTabs = useMemo(() => {
    const tabs: Tab[] = [];
    kpis.forEach((kpi) => {
      const byMonthYear = new Map<string, SplitItem[]>();
      Array.from(livingLabKpiMap.values())
        .filter((r) => r.kpidefinition_id === kpi.id)
        .forEach((r) => {
          const mode = modes.find((m) => m.id === r.transport_mode_id);
          r.results?.forEach((result) => {
            const label = result.date
              ? new Date(result.date).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })
              : "—";
            if (!byMonthYear.has(label)) byMonthYear.set(label, []);
            byMonthYear.get(label)!.push({
              label: mode?.name || `Mode ${r.transport_mode_id}`,
              value: result.value ?? 0,
              color: mode?.color || "#ccc",
            });
          });
        });
      if (byMonthYear.size > 0) {
        const datasets = Array.from(byMonthYear.entries()).map(
          ([monthYear, data]) => ({ label: monthYear, data }),
        );
        tabs.push({
          id: `modal-split-${kpi.id}`,
          label: <p>{kpi.name}</p>,
          content: <ModalSplitChart data={datasets} />,
        });
      }
    });
    return <Tabs align="right" tabs={tabs} />;
  }, [livingLabKpiMap, kpis, modes]);

  return (
    <div className="bg-white shadow rounded-md flex flex-col gap-6">
      {chartTabs}
      <DefaultCollectionDate value={defaultDate} onChange={setDefaultDate} />
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
                  <div className="flex flex-col gap-1">
                    {kpi.name}
                    {Array.from(kpiTotals.get(kpi.id)?.entries() ?? []).map(
                      ([dateLabel, total]) => (
                        <span
                          key={dateLabel}
                          className="text-sm font-normal text-gray-500"
                        >
                          {getKpiValueByMetricType(total, kpi.metric)} total —{" "}
                          {dateLabel}
                        </span>
                      ),
                    )}
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
                            livingLabKpiMap.get(`${kpi.id}_${m.id}`)?.results ??
                            []
                          }
                          defaultDate={defaultDate}
                          changeDateAllowed={false}
                          onChange={(newResults) => {
                            setLivingLabKpiMap((prev) => {
                              const updated = new Map(prev);
                              const key = `${kpi.id}_${m.id}`;
                              updated.set(key, {
                                ...updated.get(key)!,
                                results: newResults,
                              });
                              return updated;
                            });
                          }}
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
