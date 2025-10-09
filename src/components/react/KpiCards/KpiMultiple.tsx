import type { IIKpiResultBeforeAfter } from "../../../types/KPIs";
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
import { COLOR_DANGER, COLOR_SUCCESS, COLOR_PRIMARY } from "../../../types";
import {
  formatValue,
  formatMonthYear,
  getChange,
  getFormattedValueString,
} from "../../../lib/helpers";
import { Badge, Tooltip } from "../ui";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Filler,
  Legend
);

type Props = {
  results: IIKpiResultBeforeAfter[];
  title?: string;
  subtitle?: string;
  kpiNumber?: string;
};

export function KpiMultiple({ results, title, subtitle, kpiNumber }: Props) {
  // Prepare chart data
  const chartLabels: string[] = [];
  const chartDatasets: any[] = [];

  // Get unique dates for labels
  const dates = new Set<string>();
  results.forEach((kpi) => {
    if (kpi.result_before?.date) dates.add(kpi.result_before.date);
    if (kpi.result_after?.date) dates.add(kpi.result_after.date);
  });
  const sortedDates = Array.from(dates).sort();
  chartLabels.push(...sortedDates.map((date) => formatMonthYear(date)));

  // Create dataset for each KPI
  results.forEach((kpi, index) => {
    const data: (number | null)[] = sortedDates.map((date) => {
      if (
        kpi.result_before?.date === date &&
        kpi.result_before?.value !== null
      ) {
        return formatValue(kpi.result_before.value, kpi.metric);
      }
      if (kpi.result_after?.date === date && kpi.result_after?.value !== null) {
        return formatValue(kpi.result_after.value, kpi.metric);
      }
      return null;
    });

    const colors = [COLOR_PRIMARY, COLOR_SUCCESS, COLOR_DANGER];
    const color = colors[index % colors.length];

    chartDatasets.push({
      label: kpi.name,
      data,
      borderColor: color,
      backgroundColor: color,
      tension: 0.1,
    });
  });

  const chartData = {
    labels: chartLabels,
    datasets: chartDatasets,
  };
  // Add padding to X axis by extending labels with empty strings
  chartData.labels = ["", ...chartData.labels, ""];
  chartData.datasets.forEach((dataset) => {
    dataset.data = [null, ...dataset.data, null];
  });
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
            KPI {kpiNumber}
            <Tooltip
              content={subtitle}
              placement="left"
              iconClassName="h-3 w-3 text-primary"
            />
          </Badge>
        </div>

        <h6 className="text-center text-black  mt-1 mb-2">{title ?? "KPI"}</h6>
        <div className="flex flex-row flex-wrap items-stretch gap-0 mx-auto">
          {results.map((kpi, index) => {
            const before = kpi.result_before ?? null;
            const after = kpi.result_after ?? null;

            const currentValue = formatValue(
              after?.value ?? before?.value ?? null,
              kpi.metric
            );
            const beforeValue = before?.value
              ? formatValue(before?.value, kpi.metric)
              : null;
            const displayDate = formatMonthYear(
              after?.date ?? before?.date,
              true
            );

            const change = getChange(
              before?.value ?? null,
              after?.value ?? null,
              kpi.metric,
              kpi.progression_target
            );

            return (
              <div
                key={index}
                className="flex flex-col w-1/2  p-1 min-w-1/3 max-w-1/2 md:max-w-1/4 md:p-2"
              >
                <p className="leading-none">{kpi.name}</p>
                <div className="mt-6 flex flex-row items-end justify-between gap-1">
                  <div className="flex flex-col items-start justify-end w-1/2">
                    <p className="text-4xl font-extrabold text-primary dark:text-white leading-none">
                      {getFormattedValueString(currentValue, kpi.metric)}
                    </p>
                    <small className="mt-2 text-lg text-muted">
                      {displayDate}
                    </small>
                  </div>

                  {change?.length > 0 && (
                    <div className="flex flex-col items-end justify-end w-1/2">
                      <small className="font-semibold">
                        {getFormattedValueString(beforeValue, kpi.metric)}
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
      </div>
    </div>
  );
}
