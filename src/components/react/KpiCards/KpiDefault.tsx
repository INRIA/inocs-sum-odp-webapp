import type {
  EnumKpiMetricType,
  IIKpiResultBeforeAfter,
} from "../../../types/KPIs";
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
  formatValue,
  formatMonthYear,
  getChange,
  getFormattedValueString,
  notNullOrUndefined,
} from "../../../lib/helpers";
import {
  COLOR_GREEN,
  COLOR_GREEN_OPACITY_50,
  COLOR_ORANGE_OPACITY_50,
  COLOR_RED,
} from "../../../styles/constants";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

type Props = {
  kpiResults: IIKpiResultBeforeAfter;
  metricType: EnumKpiMetricType;
  progressionTarget: number;
};

export function KpiDefault({
  kpiResults,
  metricType,
  progressionTarget,
}: Props) {
  const before = kpiResults?.result_before ?? null;
  const after = kpiResults?.result_after ?? null;

  const currentValue = formatValue(
    after?.value ?? before?.value ?? null,
    metricType,
  );
  const beforeValue = notNullOrUndefined<number>(before?.value)
    ? formatValue(before?.value, metricType)
    : null;
  const displayDate = formatMonthYear(after?.date ?? before?.date);

  const change = getChange(
    before?.value ?? null,
    after?.value ?? null,
    metricType,
    progressionTarget,
  );

  //Chartjs data
  const chartDatasets: number[] = [];
  const chartLabels: string[] = [];
  if (before && beforeValue !== undefined && beforeValue !== null) {
    chartDatasets.push(beforeValue);
    chartLabels.push(before.date ? formatMonthYear(before.date) : "?");
  }
  if (after && currentValue !== undefined && currentValue !== null) {
    chartDatasets.push(currentValue);
    chartLabels.push(after.date ? formatMonthYear(after.date) : "?");
  }
  const backgroundColor = change?.startsWith("+")
    ? COLOR_GREEN_OPACITY_50
    : COLOR_ORANGE_OPACITY_50;
  const borderColor = change?.startsWith("+") ? COLOR_GREEN : COLOR_RED;
  const chartData = {
    labels: ["", ...chartLabels, ""],
    datasets: [
      {
        label: "",
        data: [null, ...chartDatasets, null],
        //fill: true,
        backgroundColor,
        borderColor,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: { enabled: true },
    },
    // scales: {
    //   y: {
    //     min: 0,
    //     max: 100,
    //   },
    // },
  };

  return (
    <div className="flex flex-col gap-3 md:gap-6">
      <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-1 md:gap-2">
        <div className="flex flex-col items-start justify-end">
          <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-none">
            {getFormattedValueString(currentValue, metricType)}
          </h3>
          <p className="mt-2 text-lg text-muted">{displayDate}</p>
        </div>

        {change?.length > 0 && (
          <div className="flex flex-col items-end justify-end mb-1">
            <p className="font-semibold">
              {getFormattedValueString(beforeValue, metricType)}{" "}
              {before?.date ? `in ${new Date(before.date).getFullYear()}` : ""}
            </p>
            <small
              className={`italic ${
                change?.startsWith("+") ? "text-success" : "text-danger"
              }`}
            >
              {change === null ? "" : `${change}`}
            </small>
          </div>
        )}
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
  );
}

export default KpiDefault;
