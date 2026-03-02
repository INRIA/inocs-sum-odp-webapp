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

// T025 — mock TriggerDownloadCsv to spy on its rendered props
vi.mock("../TriggerDownloadCsv", () => ({
  TriggerDownloadCsv: (props: Record<string, unknown>) => (
    <button data-testid="trigger-download-csv" data-props={JSON.stringify(props)}>
      Download
    </button>
  ),
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

  // T025 — TriggerDownloadCsv integration tests
  it("renders TriggerDownloadCsv with kpi-results-lab type when kpiResults is defined", () => {
    const kpiResults: IKpiResultGroup = {
      living_lab_id: 3,
      kpidefinition_id: 1,
      results: [
        { id: 2, kpidefinition_id: 1, living_lab_id: 3, value: 20, date: "2024-01-01" },
      ],
    };

    render(<KpiCard kpi={kpi} kpiResults={kpiResults} />);

    const downloadBtn = screen.getByTestId("trigger-download-csv");
    expect(downloadBtn).toBeInTheDocument();
    const props = JSON.parse(downloadBtn.getAttribute("data-props") ?? "{}");
    expect(props.type).toBe("kpi-results-lab");
  });

  it("passes correct living_lab_id from kpiResults to TriggerDownloadCsv", () => {
    const kpiResults: IKpiResultGroup = {
      living_lab_id: 5,
      kpidefinition_id: 1,
      results: [
        { id: 3, kpidefinition_id: 1, living_lab_id: 5, value: 30, date: "2024-02-01" },
      ],
    };

    render(<KpiCard kpi={kpi} kpiResults={kpiResults} />);

    const downloadBtn = screen.getByTestId("trigger-download-csv");
    const props = JSON.parse(downloadBtn.getAttribute("data-props") ?? "{}");
    expect(props.living_lab_id).toBe(5);
  });

  it("passes correct kpidefinition_id from kpi.id to TriggerDownloadCsv", () => {
    const kpiResults: IKpiResultGroup = {
      living_lab_id: 1,
      kpidefinition_id: 1,
      results: [
        { id: 4, kpidefinition_id: 1, living_lab_id: 1, value: 40, date: "2024-03-01" },
      ],
    };

    render(<KpiCard kpi={kpi} kpiResults={kpiResults} />);

    const downloadBtn = screen.getByTestId("trigger-download-csv");
    const props = JSON.parse(downloadBtn.getAttribute("data-props") ?? "{}");
    expect(props.kpidefinition_id).toBe(kpi.id);
  });

  it("passes size='sm' to TriggerDownloadCsv", () => {
    const kpiResults: IKpiResultGroup = {
      living_lab_id: 1,
      kpidefinition_id: 1,
      results: [
        { id: 5, kpidefinition_id: 1, living_lab_id: 1, value: 50, date: "2024-04-01" },
      ],
    };

    render(<KpiCard kpi={kpi} kpiResults={kpiResults} />);

    const downloadBtn = screen.getByTestId("trigger-download-csv");
    const props = JSON.parse(downloadBtn.getAttribute("data-props") ?? "{}");
    expect(props.size).toBe("sm");
  });

  it("does NOT render TriggerDownloadCsv when kpiResults is undefined", () => {
    render(<KpiCard kpi={kpi} />);

    expect(screen.queryByTestId("trigger-download-csv")).toBeNull();
  });
});
