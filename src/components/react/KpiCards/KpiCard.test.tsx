import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "./KpiCard";
import type { IKpi, IKpiResultGroup } from "../../../types";

vi.mock("../ui", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("react-chartjs-2", () => ({
  Line: () => <div data-testid="line-chart" />,
}));

describe("KpiCard", () => {
  const kpi: IKpi = {
    id: 1,
    kpi_number: "1",
    name: "Air quality",
    description: "desc",
    type: "GLOBAL" as never,
    progression_target: 100,
    metric: "percentage" as never,
  };

  it("renders KPI metadata and chart when data exists", () => {
    const kpiResults: IKpiResultGroup = {
      living_lab_id: 1,
      kpidefinition_id: 1,
      results: [
        { id: 1, kpidefinition_id: 1, living_lab_id: 1, value: 10, date: "2023-01-01" },
      ],
    };

    render(<KpiCard kpi={kpi} kpiResults={kpiResults} />);

    expect(screen.getByText("Air quality")).toBeInTheDocument();
    expect(screen.getByText(/KPI 1/)).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders no-data message when results is empty", () => {
    const kpiResults: IKpiResultGroup = {
      living_lab_id: 1,
      kpidefinition_id: 1,
      results: [],
    };

    render(<KpiCard kpi={kpi} kpiResults={kpiResults} />);

    expect(screen.getByText("No data to display")).toBeInTheDocument();
  });
});
