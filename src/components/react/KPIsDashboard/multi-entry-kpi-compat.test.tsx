import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { processKpiResults } from "./utils";
import { KpiLivingLabsSingleCard } from "./KpiLivingLabsSingleCard";
import KpiDefault from "../KpiCards/KpiDefault";
import type { IKpiResultGroup } from "../../../types";
import type { IKpi } from "../../../types";

vi.mock("./D3TimelineChart", () => ({
  D3TimelineChart: ({ data }: { data: { dataPoints: { date: string }[] }[] }) => (
    <div data-testid="mock-d3-chart">
      {data.flatMap((lab) => lab.dataPoints).map((point) => (
        <span key={point.date}>{point.date}</span>
      ))}
    </div>
  ),
}));

describe("multi-entry KPI compatibility", () => {
  it("returns all results[] entries in chronological order", () => {
    const group: IKpiResultGroup = {
      living_lab_id: 1,
      kpidefinition_id: 10,
      results: [
        { id: 5, kpidefinition_id: 10, living_lab_id: 1, value: 50, date: "2025-01-01" },
        { id: 1, kpidefinition_id: 10, living_lab_id: 1, value: 10, date: "2021-01-01" },
        { id: 4, kpidefinition_id: 10, living_lab_id: 1, value: 40, date: "2024-01-01" },
        { id: 2, kpidefinition_id: 10, living_lab_id: 1, value: 20, date: "2022-01-01" },
        { id: 3, kpidefinition_id: 10, living_lab_id: 1, value: 30, date: "2023-01-01" },
      ],
    };

    const timeline = processKpiResults(group, [2021, 2022, 2023, 2024, 2025]);

    expect(timeline).toHaveLength(5);
    expect(timeline.map((point) => point.date)).toEqual([
      "2021-01-01",
      "2022-01-01",
      "2023-01-01",
      "2024-01-01",
      "2025-01-01",
    ]);
  });

  it("renders all date labels for a 5-entry timeline", () => {
    const kpi: IKpi = {
      id: 10,
      kpi_number: "KPI-010",
      name: "Timeline KPI",
      type: "GLOBAL" as never,
      progression_target: 100,
      metric: "percentage" as never,
    };

    const labTimelines = [
      {
        labId: 1,
        labName: "Lab 1",
        color: "#004494",
        dataPoints: [
          { year: 2021, value: 10, date: "2021-01-01" },
          { year: 2022, value: 20, date: "2022-01-01" },
          { year: 2023, value: 30, date: "2023-01-01" },
          { year: 2024, value: 40, date: "2024-01-01" },
          { year: 2025, value: 50, date: "2025-01-01" },
        ],
      },
    ];

    render(<KpiLivingLabsSingleCard kpi={kpi} labTimelines={labTimelines} baselineLabs={[]} />);

    expect(screen.getByText("2021-01-01")).toBeInTheDocument();
    expect(screen.getByText("2022-01-01")).toBeInTheDocument();
    expect(screen.getByText("2023-01-01")).toBeInTheDocument();
    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01")).toBeInTheDocument();
  });

  it("returns no points when results is empty", () => {
    const group: IKpiResultGroup = {
      living_lab_id: 1,
      kpidefinition_id: 10,
      results: [],
    };

    expect(processKpiResults(group, [2021, 2022])).toEqual([]);
  });

  it("skips entries with invalid date or non-numeric value", () => {
    const group: IKpiResultGroup = {
      living_lab_id: 1,
      kpidefinition_id: 10,
      results: [
        {
          id: 1,
          kpidefinition_id: 10,
          living_lab_id: 1,
          value: 10,
          date: "invalid-date",
        },
        {
          id: 2,
          kpidefinition_id: 10,
          living_lab_id: 1,
          value: Number.NaN,
          date: "2024-01-01",
        },
      ],
    };

    expect(processKpiResults(group, [2024])).toEqual([]);
  });

  it("keeps deterministic ordering for duplicate dates", () => {
    const group: IKpiResultGroup = {
      living_lab_id: 1,
      kpidefinition_id: 10,
      results: [
        { id: 2, kpidefinition_id: 10, living_lab_id: 1, value: 20, date: "2024-01-01" },
        { id: 1, kpidefinition_id: 10, living_lab_id: 1, value: 10, date: "2024-01-01" },
      ],
    };

    const timeline = processKpiResults(group, [2024]);

    expect(timeline).toHaveLength(2);
    expect(timeline.map((point) => point.value)).toEqual([10, 20]);
  });

  it("shows no-data message when kpi results are empty", () => {
    render(
      <KpiDefault
        kpiResults={{
          living_lab_id: 1,
          kpidefinition_id: 10,
          results: [],
        }}
        metricType={"percentage" as never}
        progressionTarget={0}
      />,
    );

    expect(screen.getByText("No data to display")).toBeInTheDocument();
  });
});
