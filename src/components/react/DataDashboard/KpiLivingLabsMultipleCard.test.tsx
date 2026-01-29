import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiLivingLabsMultipleCard } from "./KpiLivingLabsMultipleCard";
import type { IKpi } from "../../../types";
import type { IKpiTimelineMap, ILabKpiTimeline } from "./types";

// Mock the D3TimelineChart component
const mockD3TimelineChart = vi.fn();
vi.mock("./D3TimelineChart", () => ({
  D3TimelineChart: (props: unknown) => {
    mockD3TimelineChart(props);
    return <div data-testid="d3-timeline-chart">Mocked D3TimelineChart</div>;
  },
}));

// Mock UI components
vi.mock("../ui", () => ({
  Badge: ({ children, ...props }: any) => (
    <div data-testid="badge" {...props}>
      {children}
    </div>
  ),
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  ),
}));

describe("KpiLivingLabsMultipleCard", () => {
  const createMockKpi = (
    id: string,
    name: string,
    parentId?: string | null,
  ): IKpi => ({
    id,
    kpi_number: id.replace("kpi-", "KPI-"),
    name,
    description: `Description for ${name}`,
    parent_kpi_id: parentId,
    type: "SIEF" as never,
    progression_target: 10,
    metric: "percentage" as never,
    metric_description: `Metric for ${name}`,
  });

  const createMockTimeline = (labId: string): ILabKpiTimeline => ({
    labId,
    labName: `Lab ${labId}`,
    color: "#004494",
    dataPoints: [
      { year: 2023, value: 100, date: "2023-06-15" },
      { year: 2024, value: 120, date: "2024-06-15" },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders parent KPI title and badge", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [];
    const kpiTimelineMap: IKpiTimelineMap = new Map();

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText("Air Quality")).toBeInTheDocument();
    expect(screen.getByText(/KPI-1/)).toBeInTheDocument();
  });

  it("renders parent KPI chart when parent has data", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-1", [createMockTimeline("lab-1")]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText("Overall: Air Quality")).toBeInTheDocument();
    expect(mockD3TimelineChart).toHaveBeenCalled();
  });

  it("does not render parent chart when parent has no data", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [];
    const kpiTimelineMap: IKpiTimelineMap = new Map();

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.queryByText(/Overall:/)).not.toBeInTheDocument();
  });

  it("renders all child KPI charts", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [
      createMockKpi("kpi-2", "PM2.5", "kpi-1"),
      createMockKpi("kpi-3", "PM10", "kpi-1"),
    ];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-2", [createMockTimeline("lab-1")]],
      ["kpi-3", [createMockTimeline("lab-1")]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText("PM2.5")).toBeInTheDocument();
    expect(screen.getByText("PM10")).toBeInTheDocument();
    
    // Should have called D3TimelineChart twice (once for each child)
    expect(mockD3TimelineChart).toHaveBeenCalledTimes(2);
  });

  it("skips child KPIs without data", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [
      createMockKpi("kpi-2", "PM2.5", "kpi-1"),
      createMockKpi("kpi-3", "PM10", "kpi-1"),
    ];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-2", [createMockTimeline("lab-1")]],
      // kpi-3 has no data
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText("PM2.5")).toBeInTheDocument();
    expect(screen.queryByText("PM10")).not.toBeInTheDocument();
    
    // Should only render one chart
    expect(mockD3TimelineChart).toHaveBeenCalledTimes(1);
  });

  it("renders parent and child charts together when both have data", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [
      createMockKpi("kpi-2", "PM2.5", "kpi-1"),
    ];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-1", [createMockTimeline("lab-1")]],
      ["kpi-2", [createMockTimeline("lab-1")]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText("Overall: Air Quality")).toBeInTheDocument();
    expect(screen.getByText("PM2.5")).toBeInTheDocument();
    
    // Should render both charts
    expect(mockD3TimelineChart).toHaveBeenCalledTimes(2);
  });

  it("passes correct height to parent chart", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-1", [createMockTimeline("lab-1")]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    const firstCall = mockD3TimelineChart.mock.calls[0][0];
    expect(firstCall.height).toBe(280); // baseHeight
  });

  it("passes correct height to child charts", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [
      createMockKpi("kpi-2", "PM2.5", "kpi-1"),
    ];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-2", [createMockTimeline("lab-1")]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    const firstCall = mockD3TimelineChart.mock.calls[0][0];
    expect(firstCall.height).toBe(220); // childHeight
  });

  it("displays correct summary with parent and child data", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [
      createMockKpi("kpi-2", "PM2.5", "kpi-1"),
    ];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-1", [createMockTimeline("lab-1"), createMockTimeline("lab-2")]],
      ["kpi-2", [createMockTimeline("lab-1")]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    // 2 unique labs, 2 charts (parent + 1 child), 6 data points (2*2 + 1*2)
    expect(screen.getByText(/2 living labs/)).toBeInTheDocument();
    expect(screen.getByText(/2 charts/)).toBeInTheDocument();
    expect(screen.getByText(/6 data points/)).toBeInTheDocument();
  });

  it("displays singular text for single lab and chart", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-1", [{ ...createMockTimeline("lab-1"), dataPoints: [{ year: 2023, value: 100, date: "2023-06-15" }] }]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText(/1 living lab •/)).toBeInTheDocument();
    expect(screen.getByText(/1 chart •/)).toBeInTheDocument();
    expect(screen.getByText(/1 data point/)).toBeInTheDocument();
  });

  it("passes correct metric type to D3TimelineChart", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    parentKpi.metric = "ratio" as never;
    const childKpis: IKpi[] = [
      createMockKpi("kpi-2", "PM2.5", "kpi-1"),
    ];
    childKpis[0].metric = "absolute" as never;
    
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      ["kpi-1", [createMockTimeline("lab-1")]],
      ["kpi-2", [createMockTimeline("lab-1")]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    const parentChartCall = mockD3TimelineChart.mock.calls[0][0];
    expect(parentChartCall.metricType).toBe("ratio");

    const childChartCall = mockD3TimelineChart.mock.calls[1][0];
    expect(childChartCall.metricType).toBe("absolute");
  });

  it("handles empty kpiTimelineMap gracefully", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [
      createMockKpi("kpi-2", "PM2.5", "kpi-1"),
    ];
    const kpiTimelineMap: IKpiTimelineMap = new Map();

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    // Should not crash, just show title
    expect(screen.getByText("Air Quality")).toBeInTheDocument();
    expect(mockD3TimelineChart).not.toHaveBeenCalled();
  });
});
