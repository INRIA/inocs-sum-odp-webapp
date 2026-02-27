import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiLivingLabsMultipleCard } from "./KpiLivingLabsMultipleCard";
import type { IKpi } from "../../../types";
import type { IKpiTimelineMap, ILabKpiTimeline } from "./types";

const mockD3TimelineChart = vi.fn();
vi.mock("./D3TimelineChart", () => ({
  D3TimelineChart: (props: unknown) => {
    mockD3TimelineChart(props);
    return <div data-testid="d3-timeline-chart">Mocked D3TimelineChart</div>;
  },
}));

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
    id: number,
    name: string,
    parentId?: number | null,
  ): IKpi => ({
    id,
    kpi_number: `KPI-${id}`,
    name,
    description: `Description for ${name}`,
    parent_kpi_id: parentId,
    type: "SIEF" as never,
    progression_target: 10,
    metric: "percentage" as never,
    metric_description: `Metric for ${name}`,
  });

  const createMockTimeline = (labId: number): ILabKpiTimeline => ({
    labId,
    labName: `Lab ${labId}`,
    color: "#004494",
    dataPoints: [
      { year: 2022, value: 90, date: "2022-06-15" },
      { year: 2023, value: 100, date: "2023-06-15" },
      { year: 2024, value: 120, date: "2024-06-15" },
      { year: 2025, value: 130, date: "2025-06-15" },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders parent KPI title and badge", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={[]}
        kpiTimelineMap={new Map()}
      />,
    );

    expect(screen.getByText("Air Quality")).toBeInTheDocument();
    expect(screen.getByText(/KPI-1/)).toBeInTheDocument();
  });

  it("renders parent chart when parent has data", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    const kpiTimelineMap: IKpiTimelineMap = new Map([[1, [createMockTimeline(1)]]]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={[]}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText("Overall: Air Quality")).toBeInTheDocument();
    expect(mockD3TimelineChart).toHaveBeenCalledTimes(1);
  });

  it("renders faceted chart for child KPIs with data", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    const childKpis: IKpi[] = [
      createMockKpi(2, "PM2.5", 1),
      createMockKpi(3, "PM10", 1),
    ];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      [2, [createMockTimeline(1)]],
      [3, [createMockTimeline(1)]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(mockD3FacetedTimelineChart).toHaveBeenCalledTimes(1);
    const call = mockD3FacetedTimelineChart.mock.calls[0][0] as {
      facets: Array<{ kpiName: string }>;
    };
    expect(call.facets).toHaveLength(2);
    expect(call.facets[0].kpiName).toBe("PM2.5");
    expect(call.facets[1].kpiName).toBe("PM10");
  });

  it("skips child KPI facets without data", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    const childKpis: IKpi[] = [
      createMockKpi(2, "PM2.5", 1),
      createMockKpi(3, "PM10", 1),
    ];
    const kpiTimelineMap: IKpiTimelineMap = new Map([[2, [createMockTimeline(1)]]]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    const call = mockD3FacetedTimelineChart.mock.calls[0][0] as {
      facets: Array<{ kpiName: string }>;
    };
    expect(call.facets).toHaveLength(1);
    expect(call.facets[0].kpiName).toBe("PM2.5");
  });

  it("shows summary counts", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    const childKpis: IKpi[] = [createMockKpi(2, "PM2.5", 1)];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      [1, [createMockTimeline(1), createMockTimeline(2)]],
      [2, [createMockTimeline(1)]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect(screen.getByText(/2 living labs/)).toBeInTheDocument();
    expect(screen.getByText(/1 sub-indicator/)).toBeInTheDocument();
    expect(screen.getByText(/12 data points/)).toBeInTheDocument();
  });

  it("passes configured height to parent timeline chart", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    const kpiTimelineMap: IKpiTimelineMap = new Map([[1, [createMockTimeline(1)]]]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={[]}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    const call = mockD3TimelineChart.mock.calls[0][0] as { height: number };
    expect(call.height).toBe(250);
  });

  it("passes configured facetHeight to faceted chart", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    const childKpis: IKpi[] = [createMockKpi(2, "PM2.5", 1)];
    const kpiTimelineMap: IKpiTimelineMap = new Map([[2, [createMockTimeline(1)]]]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    const call = mockD3FacetedTimelineChart.mock.calls[0][0] as {
      facetHeight: number;
    };
    expect(call.facetHeight).toBe(180);
  });

  it("passes parent metric type to both chart variants", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    parentKpi.metric = "ratio" as never;
    const childKpis: IKpi[] = [createMockKpi(2, "PM2.5", 1)];
    const kpiTimelineMap: IKpiTimelineMap = new Map([
      [1, [createMockTimeline(1)]],
      [2, [createMockTimeline(1)]],
    ]);

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={kpiTimelineMap}
      />,
    );

    expect((mockD3TimelineChart.mock.calls[0][0] as { metricType: string }).metricType).toBe("ratio");
    expect((mockD3FacetedTimelineChart.mock.calls[0][0] as { metricType: string }).metricType).toBe("ratio");
  });

  it("handles empty map without crashing", () => {
    const parentKpi = createMockKpi(1, "Air Quality");
    const childKpis: IKpi[] = [createMockKpi(2, "PM2.5", 1)];

    render(
      <KpiLivingLabsMultipleCard
        parentKpi={parentKpi}
        childKpis={childKpis}
        kpiTimelineMap={new Map()}
      />,
    );

    expect(screen.getByText("Air Quality")).toBeInTheDocument();
    expect(mockD3TimelineChart).not.toHaveBeenCalled();
    expect(mockD3FacetedTimelineChart).not.toHaveBeenCalled();
  });
});
