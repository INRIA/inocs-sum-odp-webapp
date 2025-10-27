import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export interface SplitItem {
  label: string;
  value: number;
  color: string;
}

export interface ModalSplitChartDataset {
  label: string;
  data: SplitItem[];
}

interface Props {
  data: ModalSplitChartDataset[];
  colors?: string[];
}

function normalizePercentages(items: SplitItem[]) {
  const total = items.reduce((s, it) => s + (Number(it.value) || 0), 0);
  if (total === 0) {
    // avoid division by zero: produce equal slices if all zero
    const len = items.length || 3;
    return items.map(() => +(100 / len).toFixed(1));
  }
  return items.map((it) => +((Number(it.value) || 0) * 100).toFixed(1));
}

export default function ModalSplitChart({ data }: Props) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        boxWidth: 5,
        position: "right" as const,
        align: "center" as const,
        display: false, // custom legend below for clearer percent display
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  const getChartDataAndOptions = (dataset: Dataset) => {
    const labels = dataset.data.map((d) => d.label);
    const values = normalizePercentages(dataset.data);
    const backgroundColor = dataset.data.map((d) => d.color);

    const chartData = {
      labels,
      datasets: [
        {
          //label: dataset.label,
          data: values,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor,
          borderWidth: 1,
        },
      ],
    };
    if (values?.length === 0 || values.every((v) => v === 0)) {
      return <></>;
    }
    return (
      <div className="flex flex-col gap-2 w-full">
        <h5>{dataset.label}</h5>
        <div className="flex flex-row gap-2">
          <div className="h-60 w-1/2">
            <Doughnut data={chartData} options={options} />
          </div>
          <div className="w-1/2 flex flex-col h-60 gap-0">
            {[...dataset.data]
              .map((item, i) => ({ ...item, percent: values[i] }))
              .sort((a, b) => b.percent - a.percent)
              .map((item, i) => (
                <li
                  key={item.label}
                  className="flex items-center gap-1 justify-between text-sm"
                >
                  <span
                    className="inline-block rounded-[3px] flex-shrink-0 w-3 h-3"
                    style={{
                      background: item.color ?? "#ccc",
                    }}
                  />
                  <small className="flex-1">{item.label}</small>
                  <strong className="lg:min-w-[48px] text-right">
                    {values[i]}%
                  </strong>
                </li>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {data.map((dataset, i) => (
        <div
          key={i}
          className={`flex-1 ${
            i !== 0
              ? "border-t pt-8 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-8 border-gray-300"
              : ""
          }`}
        >
          {getChartDataAndOptions(dataset)}
        </div>
      ))}
    </div>
  );
}
