import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiMultiple } from "./KpiMultiple";
import type { IKpi, IKpiResultGroup } from "../../../types";

const lineMock = vi.fn();

vi.mock("react-chartjs-2", () => ({
  Line: (props: unknown) => {
    lineMock(props);
    return <div data-testid="line-chart" />;
  },
}));

vi.mock("../ui", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="badge">{children}</div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip">{children}</span>
  ),
}));

describe("KpiMultiple", () => {
  beforeEach(() => {
    lineMock.mockClear();
  });

  const parentKpi: IKpi = {
    id: 100,
    kpi_number: "15.a",
    name: "Modal Split",
    description: "desc",
    type: "GLOBAL" as never,
    progression_target: 100,
    metric: "percentage" as never,
    metric_description: "metric",
  };

  const kpis: IKpi[] = [
    parentKpi,
    {
      id: 101,
      kpi_number: "15.a.1",
      name: "Car",
      type: "LOCAL" as never,
      progression_target: 100,
      metric: "percentage" as never,
    },
    {
      id: 102,
      kpi_number: "15.a.2",
      name: "Bike",
      type: "LOCAL" as never,
      progression_target: 100,
      metric: "percentage" as never,
    },
  ];

  const results: IKpiResultGroup[] = [
    {
      living_lab_id: 1,
      kpidefinition_id: 101,
      results: [
        { id: 1, kpidefinition_id: 101, living_lab_id: 1, value: 40, date: "2022-01-01" },
        { id: 2, kpidefinition_id: 101, living_lab_id: 1, value: 35, date: "2023-01-01" },
        { id: 3, kpidefinition_id: 101, living_lab_id: 1, value: 30, date: "2024-01-01" },
      ],
    },
    {
      living_lab_id: 1,
      kpidefinition_id: 102,
      results: [
        { id: 4, kpidefinition_id: 102, living_lab_id: 1, value: 20, date: "2022-01-01" },
        { id: 5, kpidefinition_id: 102, living_lab_id: 1, value: 25, date: "2023-01-01" },
        { id: 6, kpidefinition_id: 102, living_lab_id: 1, value: 30, date: "2024-01-01" },
      ],
    },
  ];

  it("renders parent and child KPI sections", () => {
    render(<KpiMultiple parentKpi={parentKpi} kpis={kpis} results={results} />);

    expect(screen.getByText("Modal Split")).toBeInTheDocument();
    expect(screen.getByText("Car")).toBeInTheDocument();
    expect(screen.getByText("Bike")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("builds line chart with all sorted dates and datasets", () => {
    render(<KpiMultiple parentKpi={parentKpi} kpis={kpis} results={results} />);

    expect(lineMock).toHaveBeenCalledTimes(1);
    const props = lineMock.mock.calls[0][0] as {
      data: { labels: string[]; datasets: { data: (number | null)[] }[] };
    };

    expect(props.data.labels.length).toBe(5);
    expect(props.data.datasets).toHaveLength(2);
    expect(props.data.datasets[0].data.length).toBe(5);
    expect(props.data.datasets[1].data.length).toBe(5);
  });
});
