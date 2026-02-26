import type {
  EnumKpiMetricType,
  IKpiResultGroup,
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
  kpiResults: IKpiResultGroup;
  metricType: EnumKpiMetricType;
  progressionTarget: number;
};

export function KpiDefault({
  kpiResults,
  metricType,
  progressionTarget,
}: Props) {
  const sortedResults = [...(kpiResults?.results ?? [])].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  );

  if (sortedResults.length === 0) {
    return (
      <div className="py-8 text-center text-muted">No data to display</div>
    );
  }

  const before = sortedResults[0] ?? null;
  const after = sortedResults[sortedResults.length - 1] ?? null;

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
  const chartDatasets = sortedResults.map((result) =>
    formatValue(result.value, metricType),
  );
  const chartLabels = sortedResults.map((result) =>
    result.date ? formatMonthYear(result.date) : "?",
  );
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
