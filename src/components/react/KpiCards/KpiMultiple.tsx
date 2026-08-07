import type { IKpi, IKpiResultGroup } from "../../../types/KPIs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  formatValue,
  formatMonthYear,
  getChange,
  getFormattedValueString,
} from "../../../lib/helpers";
import { Badge, Tooltip } from "../ui";
import { COLORS } from "../../../styles/constants";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv/TriggerDownloadCsv";
import { KpiBaselineValue } from "./KpiBaselineValue";
import { getKpiDisplayMode } from "../../../lib/utils/kpiSufficiency";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Filler,
  Legend,
);

type Props = {
  parentKpi: IKpi;
  kpis: IKpi[];
  results: IKpiResultGroup[];
  lab_validated_at?: Date | null;
};

export function KpiMultiple({ parentKpi, kpis, results, lab_validated_at }: Props) {
  // Partition child results by display mode based on data-sufficiency rule
  const chartResults = results.filter(
    (r) => getKpiDisplayMode(r.results, lab_validated_at) === "chart",
  );
  const baselineResults = results.filter(
    (r) => getKpiDisplayMode(r.results, lab_validated_at) === "baseline",
  );
  // "hidden" results (0 validated) are dropped silently

  if (chartResults.length === 0 && baselineResults.length === 0) return null;

  // Build chart data using only chart-eligible results
  const chartLabels: string[] = [];
  const chartDatasets: any[] = [];

  const dates = new Set<string>();
  chartResults.forEach((kpi) => {
    kpi.results.forEach((result) => {
      if (result.date) {
        dates.add(result.date);
      }
    });
  });
  const sortedDates = Array.from(dates).sort();
  chartLabels.push(...sortedDates.map((date) => formatMonthYear(date)));

  chartResults.forEach((kpiRes, index) => {
    const kpiData = kpis.find((item) => item.id === kpiRes.kpidefinition_id);
    const data: (number | null)[] = sortedDates.map((date) => {
      const matchedResult = kpiRes.results.find(
        (result) => result.date === date,
      );
      if (matchedResult?.value !== null && matchedResult?.value !== undefined) {
        return formatValue(matchedResult.value, kpiData?.metric);
      }
      return null;
    });

    const colors = COLORS;
    const color = colors[index % colors.length];

    chartDatasets.push({
      label: kpiData?.name,
      data,
      borderColor: color,
      backgroundColor: color,
      tension: 0.1,
      spanGaps: true,
    });
  });

  const chartData = {
    labels: ["", ...chartLabels, ""],
    datasets: chartDatasets.map((ds) => ({
      ...ds,
      data: [null, ...ds.data, null],
    })),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
      },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="p-1 lg:p-2">
      <div className="p-2 relative rounded-2xl border-primary-light border ">
        <div className="absolute -top-1 right-0">
          <Badge size="sm" color="light" className="rounded-2xl">
            KPI {parentKpi.kpi_number}
            <Tooltip
              content={parentKpi.description}
              placement="left"
              iconClassName="h-3 w-3 text-primary"
            />
          </Badge>
        </div>

        <h6 className="text-center text-black  mt-1 mb-2">
          {parentKpi?.name ?? "KPI"}
        </h6>

        {parentKpi?.metric_description ? (
          <div className="text-sm text-muted mt-2 max-w-xl mx-auto text-center">
            {parentKpi?.metric_description}
          </div>
        ) : null}

        {/* Chart section — only children with ≥2 validated estimations */}
        {chartResults.length > 0 && (
          <>
            <div className="flex flex-row flex-wrap items-stretch gap-0 mx-auto">
              {chartResults.map((kpiRes, index) => {
                const kpiData = kpis.find(
                  (item) => item.id === kpiRes.kpidefinition_id,
                );

                const before = kpiRes.results[0] ?? null;
                const after = kpiRes.results[kpiRes.results.length - 1] ?? null;

                const currentValue = formatValue(
                  after?.value ?? before?.value ?? null,
                  kpiData?.metric,
                );
                const beforeValue = before?.value
                  ? formatValue(before?.value, kpiData?.metric)
                  : null;
                const displayDate = formatMonthYear(
                  after?.date ?? before?.date,
                  true,
                );

                const change = getChange(
                  before?.value ?? null,
                  after?.value ?? null,
                  kpiData?.metric,
                  kpiData?.progression_target,
                );

                return (
                  <div
                    key={index}
                    className="flex flex-col w-1/2  p-1 min-w-1/3 max-w-1/2 md:max-w-1/4 md:p-2"
                  >
                    <p className="leading-none">{kpiData?.name}</p>
                    <div className="mt-6 flex flex-row items-end justify-between gap-1">
                      <div className="flex flex-col items-start justify-end w-1/2">
                        <p className="text-4xl font-extrabold text-primary dark:text-white leading-none">
                          {getFormattedValueString(currentValue, kpiData?.metric)}
                        </p>
                        <small className="mt-2 text-lg text-muted">
                          {displayDate}
                        </small>
                      </div>

                      {change?.length > 0 && (
                        <div className="flex flex-col items-end justify-end w-1/2">
                          <small className="font-semibold">
                            {getFormattedValueString(beforeValue, kpiData?.metric)}
                          </small>
                          <span
                            className={`text-[8px] italic items-end justify-end text-right ${
                              change?.startsWith("+")
                                ? "text-success"
                                : "text-danger"
                            }`}
                            style={{ marginLeft: "auto" }}
                          >
                            {before?.date
                              ? `in ${formatMonthYear(before.date, true)} `
                              : ""}
                            {change === null ? "" : `(${change})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col w-full mt-4 h-fit ">
              <Line
                options={chartOptions}
                data={chartData}
                className="w-full"
                height={200}
              />
            </div>
          </>
        )}

        {/* Baseline rows — children with exactly 1 validated estimation */}
        {baselineResults.length > 0 && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            {baselineResults.map((r) => {
              const kpiData = kpis.find((k) => k.id === r.kpidefinition_id);
              return (
                <KpiBaselineValue
                  key={r.kpidefinition_id}
                  kpiResults={r}
                  metricType={kpiData?.metric}
                  labValidatedAt={lab_validated_at}
                  label={kpiData?.name}
                />
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-2">
          <TriggerDownloadCsv
            type="kpi-results-lab"
            size="sm"
            living_lab_id={results[0]?.living_lab_id}
            kpidefinition_id={parentKpi.id}
          />
        </div>
      </div>
    </div>
  );
}
