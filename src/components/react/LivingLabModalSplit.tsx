import { useState, useEffect } from "react";
import { LivingLabTransportModeForm } from "./form/LivingLabTransportModeForm";
import {
  type ITransportMode,
  type IIKpiResultBeforeAfter,
  type IKpi,
  type ITransportModeLivingLabImplementation,
} from "../../types";
import { BeforeAndAfterDates, LivingLabKpiResultsForm } from "./form";
import { TransportTypeBadge } from "./TransportTypeBadge";
import {
  Table,
  TableHead,
  TableCell,
  TableHeader,
  TableRow,
} from "../react-catalyst-ui-kit";
import { Tabs, Tooltip } from "./ui";
import { getKpiValueByMetricType, getYearFromDate } from "../../lib/helpers";
import ModalSplitChart, { type SplitItem } from "./KpiCards/ModalSplitChart";

interface Props {
  modes: ITransportMode[];
  kpis: IKpi[];
  livingLabId: string;
  livingLabTransportModes: ITransportModeLivingLabImplementation[];
  kpiResults: IIKpiResultBeforeAfter[];
  valueBeforeDate?: string;
  valueAfterDate?: string;
}

export function LivingLabModalSplit({
  modes = [],
  kpis = [],
  livingLabId,
  livingLabTransportModes = [],
  kpiResults = [],
  valueBeforeDate,
  valueAfterDate,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [beforeDate, setBeforeDate] = useState<string>(
    valueBeforeDate ?? today
  );
  const [afterDate, setAfterDate] = useState<string | undefined>(
    valueAfterDate
  );

  const [livingLabTransportModesMap, setLivingLabTransportModesMap] = useState<
    Map<string, ITransportModeLivingLabImplementation>
  >(
    new Map(
      livingLabTransportModes.map((mode) => [mode.transport_mode_id, mode])
    )
  );

  const [livingLabKpiMap, setLivingLabKpiMap] = useState<
    Map<string, IIKpiResultBeforeAfter>
  >(
    new Map(
      kpiResults.map((resultKpi) => [
        `${resultKpi.kpidefinition_id}_${
          resultKpi?.transport_mode_id ?? "none"
        }`,
        resultKpi,
      ])
    )
  );
  // totals per KPI id: { before: number, after: number }
  const [kpiTotals, setKpiTotals] = useState<
    Map<string, { before: number; after: number }>
  >(new Map());

  // compute initial totals on mount from kpis + kpiResults
  useEffect(() => {
    const totals = new Map<string, { before: number; after: number }>();
    kpis.forEach((kpi) => {
      let beforeSum = 0;
      let afterSum = 0;
      kpiResults.forEach((r) => {
        if (r.kpidefinition_id !== kpi.id) return;
        const b = r.result_before?.value;
        const a = r.result_after?.value;
        const bn = typeof b === "number" ? b : Number(b ?? 0);
        const an = typeof a === "number" ? a : Number(a ?? 0);
        if (!isNaN(bn)) beforeSum += bn;
        if (!isNaN(an)) afterSum += an;
      });
      totals.set(kpi.id, { before: beforeSum, after: afterSum });
    });
    setKpiTotals(totals);
    // run only on mount as requested
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getChartValues = (kpiId: string) => {
    let beforeDate = "";
    let afterDate = "";
    const dataBefore: SplitItem[] = [];
    const dataAfter: SplitItem[] = [];
    Array.from(livingLabKpiMap.values())
      .filter((result) => result.kpidefinition_id === kpiId)
      .forEach((result) => {
        const transportModeId = result.result_before?.transport_mode_id;
        const mode = modes.find((m) => m.id === transportModeId);
        beforeDate = result.result_before?.date || "";
        afterDate = result.result_after?.date || "";
        if (result.result_before?.value)
          dataBefore.push({
            label: mode?.name || `Mode ${transportModeId}`,
            value: result.result_before?.value || 0,
            color: mode?.color || "#ccc",
          });
        if (result.result_after?.value)
          dataAfter.push({
            label: mode?.name || `Mode ${transportModeId}`,
            value: result.result_after?.value || 0,
            color: mode?.color || "#ccc",
          });
      });

    return [
      {
        label: `${kpis.find((k) => k.id === kpiId)?.name} (${getYearFromDate(
          beforeDate
        )})`,
        data: dataBefore,
      },
      {
        label: `${kpis.find((k) => k.id === kpiId)?.name} (${
          afterDate ? getYearFromDate(afterDate) : ""
        })`,
        data: dataAfter as SplitItem[],
      },
    ];
  };

  const getTabs = () => {
    return (
      <Tabs
        align="right"
        tabs={
          kpis.map((kpi) => ({
            id: `modal-split-${kpi.id}`,
            label: <p>{kpi.name}</p>,
            content: <ModalSplitChart data={getChartValues(kpi.id)} />,
          })) ?? []
        }
      ></Tabs>
    );
  };

  const onKpiValuesChange = (
    kpiId: string,
    transportModeId: string,
    before: number | null,
    after: number | null
  ) => {
    const key = `${kpiId}_${transportModeId}`;
    // previous entry for this KPI+mode
    const prevEntry = livingLabKpiMap.get(key);

    const prevBefore = prevEntry?.result_before?.value ?? null;
    const prevAfter = prevEntry?.result_after?.value ?? null;

    // compute deltas (treat null as 0 for totals adjustment)
    const deltaBefore = (before ?? 0) - (prevBefore ?? 0);
    const deltaAfter = (after ?? 0) - (prevAfter ?? 0);

    setLivingLabKpiMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      updatedMap.set(key, {
        ...prevEntry,
        result_before: {
          transport_mode_id: transportModeId,
          value: before,
        },
        result_after: {
          transport_mode_id: transportModeId,
          value: after,
        },
      });
      return updatedMap;
    });
    // update totals for this KPI
    setKpiTotals((prev) => {
      const updated = new Map(prev);
      const existingTotals = updated.get(kpiId) ?? {
        before: 0,
        after: 0,
      };
      existingTotals.before = (existingTotals.before ?? 0) + deltaBefore;
      existingTotals.after = (existingTotals.after ?? 0) + deltaAfter;
      updated.set(kpiId, existingTotals);
      return updated;
    });
  };

  return (
    <div className="bg-white shadow rounded-md flex flex-col gap-6">
      <BeforeAndAfterDates
        valueBeforeDate={beforeDate}
        valueAfterDate={afterDate}
        onChangeBeforeDate={setBeforeDate}
        onChangeAfterDate={setAfterDate}
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
                    <span className="text-sm font-normal text-gray-500 flex flex-row justify-between w-full">
                      <span className="text-left">
                        {!!kpiTotals.get(kpi.id)?.before &&
                          getKpiValueByMetricType(
                            kpiTotals.get(kpi.id)?.before,
                            kpi.metric
                          )}
                      </span>
                      <span className="text-right">
                        {!!kpiTotals.get(kpi.id)?.after &&
                          getKpiValueByMetricType(
                            kpiTotals.get(kpi.id)?.after,
                            kpi.metric
                          )}
                      </span>
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
                        <LivingLabKpiResultsForm
                          transportModeId={m.id}
                          livingLabId={livingLabId}
                          kpi={kpi}
                          initialBefore={
                            livingLabKpiMap.get(`${kpi.id}_${m.id}`)
                              ?.result_before
                          }
                          initialAfter={
                            livingLabKpiMap.get(`${kpi.id}_${m.id}`)
                              ?.result_after
                          }
                          defaultBeforeDate={beforeDate}
                          defaultAfterDate={afterDate}
                          onChange={(before, after) => {
                            onKpiValuesChange(kpi.id, m.id, before, after);
                          }}
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
