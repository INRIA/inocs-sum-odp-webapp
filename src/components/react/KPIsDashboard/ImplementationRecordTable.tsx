import type { IKpi } from "../../../types";
import type { ILivingLabKpiData } from "./types";
import type { IKpiResultGroup } from "../../../types/KPIs";
import {
  formatValue,
  formatMonthYear,
  getFormattedValueString,
} from "../../../lib/helpers";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv/TriggerDownloadCsv";

type Props =
  | {
      view: "global";
      kpis: IKpi[];
      livingLabs: ILivingLabKpiData[];
    }
  | {
      view: "lab";
      kpis: IKpi[];
      kpiResults: IKpiResultGroup[];
      living_lab_id: number;
    };

interface GlobalRow {
  kpiId: number;
  kpiName: string;
  kpiNumber: string;
  metric: IKpi["metric"];
  labId: number;
  labName: string;
  value: number;
  date: string;
}

interface LabRow {
  kpiId: number;
  kpiName: string;
  kpiNumber: string;
  metric: IKpi["metric"];
  labId: number;
  value: number;
  date: string;
}

export function ImplementationRecordTable(props: Props) {
  if (props.view === "global") {
    const rows: GlobalRow[] = [];

    props.kpis.forEach((kpi) => {
      props.livingLabs.forEach((lab) => {
        const group = lab.kpiResults.find(
          (r) => r.kpidefinition_id === kpi.id,
        );
        if (!group || group.results.length === 0) return;

        // Show most recent result by date
        const latest = [...group.results].sort(
          (a, b) => Date.parse(b.date) - Date.parse(a.date),
        )[0];

        rows.push({
          kpiId: kpi.id,
          kpiName: kpi.name,
          kpiNumber: kpi.kpi_number,
          metric: kpi.metric,
          labId: lab.id,
          labName: lab.name,
          value: latest.value,
          date: latest.date,
        });
      });
    });

    if (rows.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        {/* Explanatory text — TODO: replace with confirmed text from WP1 leader */}
        <p className="text-sm text-gray-600 italic">
          These indicators track the progress of SUMP implementation across
          living labs. They are process metrics, not outcome trends.
        </p>
        <div className="overflow-x-auto rounded-xl border border-primary-light">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  KPI
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  City
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">
                  Value
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Reporting date
                </th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.kpiId}-${row.labId}`}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <span className="font-medium">{row.kpiName}</span>
                    <span className="ml-1 text-xs text-gray-400">
                      KPI {row.kpiNumber}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.labName}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {getFormattedValueString(
                      formatValue(row.value, row.metric),
                      row.metric,
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {formatMonthYear(row.date)}
                  </td>
                  <td className="px-3 py-2">
                    <TriggerDownloadCsv
                      type="kpi-results-definition"
                      size="sm"
                      kpidefinition_id={row.kpiId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // view === "lab"
  const rows: LabRow[] = [];

  props.kpis.forEach((kpi) => {
    const group = props.kpiResults.find((r) => r.kpidefinition_id === kpi.id);
    if (!group || group.results.length === 0) return;

    const latest = [...group.results].sort(
      (a, b) => Date.parse(b.date) - Date.parse(a.date),
    )[0];

    rows.push({
      kpiId: kpi.id,
      kpiName: kpi.name,
      kpiNumber: kpi.kpi_number,
      metric: kpi.metric,
      labId: props.living_lab_id,
      value: latest.value,
      date: latest.date,
    });
  });

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Explanatory text — TODO: replace with confirmed text from WP1 leader */}
      <p className="text-sm text-gray-600 italic">
        These indicators track the progress of SUMP implementation for this
        city. They are process metrics, not outcome trends.
      </p>
      <div className="overflow-x-auto rounded-xl border border-primary-light">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                KPI
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">
                Value
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Reporting date
              </th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.kpiId}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-3 py-2">
                  <span className="font-medium">{row.kpiName}</span>
                  <span className="ml-1 text-xs text-gray-400">
                    KPI {row.kpiNumber}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {getFormattedValueString(
                    formatValue(row.value, row.metric),
                    row.metric,
                  )}
                </td>
                <td className="px-3 py-2 text-gray-500">
                  {formatMonthYear(row.date)}
                </td>
                <td className="px-3 py-2">
                  <TriggerDownloadCsv
                    type="kpi-results-lab"
                    size="sm"
                    living_lab_id={row.labId}
                    kpidefinition_id={row.kpiId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
