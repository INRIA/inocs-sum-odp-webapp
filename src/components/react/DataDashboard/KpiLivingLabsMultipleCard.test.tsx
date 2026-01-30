import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiLivingLabsMultipleCard } from "./KpiLivingLabsMultipleCard";
import type { IKpi } from "../../../types";
import type { IKpiTimelineMap, ILabKpiTimeline } from "./types";

// Mock the D3TimelineChart component (used for parent KPI)
const mockD3TimelineChart = vi.fn();
vi.mock("./D3TimelineChart", () => ({
  D3TimelineChart: (props: unknown) => {
    mockD3TimelineChart(props);
    return <div data-testid="d3-timeline-chart">Mocked D3TimelineChart</div>;
  },
}));

// Mock the D3FacetedTimelineChart component (used for child KPIs)
const mockD3FacetedTimelineChart = vi.fn();
vi.mock("./D3FacetedTimelineChart", () => ({
  D3FacetedTimelineChart: (props: unknown) => {
    mockD3FacetedTimelineChart(props);
    return (
      <div data-testid="d3-faceted-timeline-chart">
        Mocked D3FacetedTimelineChart
      </div>
    );
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

  it("renders faceted chart for child KPIs with data", () => {
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

    // Faceted chart should be rendered with 2 facets
    expect(mockD3FacetedTimelineChart).toHaveBeenCalledTimes(1);
    const facetedChartCall = mockD3FacetedTimelineChart.mock.calls[0][0];
    expect(facetedChartCall.facets).toHaveLength(2);
    expect(facetedChartCall.facets[0].kpiName).toBe("PM2.5");
    expect(facetedChartCall.facets[1].kpiName).toBe("PM10");
  });

  it("skips child KPIs without data in faceted chart", () => {
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

    // Faceted chart should only have 1 facet
    const facetedChartCall = mockD3FacetedTimelineChart.mock.calls[0][0];
    expect(facetedChartCall.facets).toHaveLength(1);
    expect(facetedChartCall.facets[0].kpiName).toBe("PM2.5");
  });

  it("renders both parent and faceted child charts when both have data", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [createMockKpi("kpi-2", "PM2.5", "kpi-1")];
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

    // Parent chart is rendered via D3TimelineChart
    expect(mockD3TimelineChart).toHaveBeenCalledTimes(1);
    // Child faceted chart is rendered via D3FacetedTimelineChart
    expect(mockD3FacetedTimelineChart).toHaveBeenCalledTimes(1);
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
    expect(firstCall.height).toBe(250); // parentChartHeight
  });

  it("passes correct facetHeight to D3FacetedTimelineChart", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [createMockKpi("kpi-2", "PM2.5", "kpi-1")];
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

    const facetedCall = mockD3FacetedTimelineChart.mock.calls[0][0];
    expect(facetedCall.facetHeight).toBe(180);
  });

  it("displays correct summary with parent and child data", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [createMockKpi("kpi-2", "PM2.5", "kpi-1")];
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

    // 2 unique labs, 1 sub-indicator, 6 data points (2*2 + 1*2)
    expect(screen.getByText(/2 living labs/)).toBeInTheDocument();
    expect(screen.getByText(/1 sub-indicator/)).toBeInTheDocument();
    expect(screen.getByText(/6 data points/)).toBeInTheDocument();
  });

  it("displays singular text for single lab and no sub-indicators", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      [
        "kpi-1",
        [
          {
            ...createMockTimeline("lab-1"),
            dataPoints: [{ year: 2023, value: 100, date: "2023-06-15" }],
          },
        ],
      ],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText(/1 living lab/)).toBeInTheDocument();
    expect(screen.getByText(/0 sub-indicators/)).toBeInTheDocument();
    expect(screen.getByText(/1 data point$/)).toBeInTheDocument();
  });

  it("passes correct metric type to D3TimelineChart for parent", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    parentKpi.metric = "ratio" as never;
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

    const parentChartCall = mockD3TimelineChart.mock.calls[0][0];
    expect(parentChartCall.metricType).toBe("ratio");
  });

  it("passes parent metric type to D3FacetedTimelineChart for children", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    parentKpi.metric = "ratio" as never;
    const childKpis: IKpi[] = [createMockKpi("kpi-2", "PM2.5", "kpi-1")];

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

    // Faceted chart uses parent's metric type
    const facetedChartCall = mockD3FacetedTimelineChart.mock.calls[0][0];
    expect(facetedChartCall.metricType).toBe("ratio");
  });

  it("handles empty kpiTimelineMap gracefully", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [createMockKpi("kpi-2", "PM2.5", "kpi-1")];
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
    expect(mockD3FacetedTimelineChart).not.toHaveBeenCalled();
  });

  it("shows sub-indicators comparison section only when facets exist", () => {
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

    expect(screen.queryByTestId("subindicators-chart")).not.toBeInTheDocument();
  });

  it("shows sub-indicators comparison section when child KPIs have data", () => {
    const parentKpi = createMockKpi("kpi-1", "Air Quality");
    const childKpis: IKpi[] = [createMockKpi("kpi-2", "PM2.5", "kpi-1")];
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

    expect(screen.getByTestId("subindicators-chart")).toBeInTheDocument();
  });
});
