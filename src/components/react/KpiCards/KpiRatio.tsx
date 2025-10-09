import type { IIKpiResultBeforeAfter } from "../../../types/KPIs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  COLOR_DANGER,
  COLOR_DANGER_OPACITY_50,
  COLOR_PRIMARY,
  COLOR_SUCCESS,
  COLOR_SUCCESS_OPACITY_50,
} from "../../../types";
import {
  formatMonthYear,
  formatValue,
  getChange,
  getRatioComparedToCar,
} from "../../../lib/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

type Props = {
  kpiResults: IIKpiResultBeforeAfter;
};

export default function KpiRatio({ kpiResults }: Props) {
  const before = kpiResults?.result_before ?? null;
  const after = kpiResults?.result_after ?? null;

  const currentValue = formatValue(
    after?.value ?? before?.value ?? null,
    kpiResults.metric
  );
  const beforeValue = before?.value
    ? formatValue(before?.value, kpiResults.metric)
    : null;
  const displayDate = formatMonthYear(after?.date ?? before?.date);

  const change = getChange(
    before?.value ?? null,
    after?.value ?? null,
    kpiResults.metric,
    kpiResults.progression_target
  );
  const comparison = getRatioComparedToCar(currentValue);

  // Build chart labels & datasets
  const labels: string[] = [];
  const nsmData: number[] = [];
  const carsData: number[] = [];

  if (before?.value !== undefined && before?.value !== null) {
    labels.push(before.date ? formatMonthYear(before.date) : "");
    nsmData.push(before.value);
    carsData.push(1);
  }
  if (after?.value !== undefined && after?.value !== null) {
    labels.push(after.date ? formatMonthYear(after.date) : "");
    nsmData.push(after.value);
    carsData.push(1);
  }

  const nsmBackground = change?.startsWith("+")
    ? COLOR_SUCCESS_OPACITY_50
    : COLOR_DANGER_OPACITY_50;
  const nsmBorder = change?.startsWith("+") ? COLOR_SUCCESS : COLOR_DANGER;

  const chartData = {
    labels,
    datasets: [
      {
        label: "Cars",
        data: carsData,
        borderColor: COLOR_PRIMARY,
        tension: 0.1,
        pointRadius: 3,
        fill: false,
      },
      {
        label: "NSM + Public transport",
        data: nsmData,
        borderColor: nsmBorder,
        tension: 0.1,
        pointRadius: 3,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        min: 0,
        // let chart scale automatically, but ensure 0 baseline
      },
    },
  };

  return (
    <div className="flex flex-col gap-3 md:gap-6">
      <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-1 md:gap-4">
        <div className="flex flex-col items-start justify-end">
          <h3 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-none">
            {displayValue}
          </h3>
          <p>{displayDate}</p>
        </div>
        {change?.length > 0 && (
          <div className="flex flex-col items-end justify-end mb-1">
            <div
              className={`text-lg font-semibold ${
                change?.startsWith("+") ? "text-success" : "text-danger"
              }`}
            >
              {change === null ? "" : `${change}`}
            </div>
            <span className="text-xs">
              {before?.date
                ? `since ${new Date(before.date).getFullYear()}`
                : ""}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col w-full">
        {change?.length > 0 && (
          <small className="text-xs">
            NSM and/or public transport is{" "}
            <span
              className={`font-semibold ${
                comparison.isLess ? "text-blue-500" : "text-success"
              }`}
            >
              {comparison.highlight}
            </span>{" "}
            {comparison.isLess ? "less accessible" : "more accessible"} than
            private cars
          </small>
        )}
        <div className="w-full">
          <Line options={chartOptions} data={chartData} className="w-full" />
        </div>
      </div>
    </div>
  );
}
