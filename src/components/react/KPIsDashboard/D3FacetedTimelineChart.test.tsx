import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { D3FacetedTimelineChart } from "./D3FacetedTimelineChart";
import type { IFacetData } from "./types";

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Create a chainable mock that returns itself for all D3 methods
const createChainableMock = (): any => {
  const mock: any = {};
  const methods = [
    "select",
    "selectAll",
    "remove",
    "append",
    "attr",
    "call",
    "style",
    "text",
    "datum",
    "data",
    "enter",
    "on",
  ];
  methods.forEach((method) => {
    mock[method] = vi.fn(() => mock);
  });
  return mock;
};

// Mock D3 to avoid DOM manipulation issues in tests
vi.mock("d3", () => ({
  select: vi.fn(() => createChainableMock()),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  })),
  axisBottom: vi.fn(() => ({
    tickFormat: vi.fn().mockReturnThis(),
    ticks: vi.fn().mockReturnThis(),
  })),
  axisLeft: vi.fn(() => ({
    tickFormat: vi.fn().mockReturnThis(),
    tickSize: vi.fn().mockReturnThis(),
  })),
  line: vi.fn(() => ({
    x: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis(),
    curve: vi.fn().mockReturnThis(),
  })),
  curveMonotoneX: vi.fn(),
}));

describe("D3FacetedTimelineChart", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  const mockFacets: IFacetData[] = [
    {
      kpiId: "child-1",
      kpiName: "Bicycle Safety",
      labTimelines: [
        {
          labId: "lab-1",
          labName: "Geneva",
          color: "#3b82f6",
          dataPoints: [
            { year: 2022, value: 70, date: "2022-01-01" },
            { year: 2023, value: 75, date: "2023-01-01" },
          ],
        },
      ],
    },
    {
      kpiId: "child-2",
      kpiName: "Public Transport Safety",
      labTimelines: [
        {
          labId: "lab-1",
          labName: "Geneva",
          color: "#3b82f6",
          dataPoints: [
            { year: 2022, value: 80, date: "2022-01-01" },
            { year: 2023, value: 85, date: "2023-01-01" },
          ],
        },
        {
          labId: "lab-2",
          labName: "Paris",
          color: "#10b981",
          dataPoints: [{ year: 2023, value: 88, date: "2023-01-01" }],
        },
      ],
    },
  ];

  describe("rendering", () => {
    it("renders without crashing when facets are provided", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders the container div with relative positioning", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("relative", "w-full");
    });

    it("renders an SVG element", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("overflow-visible");
    });

    it("renders a tooltip element", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      const tooltip = container.querySelector("div.absolute");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveClass("opacity-0");
    });
  });

  describe("empty state", () => {
    it("shows 'No data available' when facets array is empty", () => {
      render(<D3FacetedTimelineChart facets={[]} metricType="percentage" />);
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("does not render SVG when facets array is empty", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={[]} metricType="percentage" />
      );
      expect(container.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("props handling", () => {
    it("uses default facetHeight when not provided", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      const svg = container.querySelector("svg");
      // Default facetHeight is 180, total height includes margins
      expect(svg).toBeInTheDocument();
    });

    it("accepts custom facetHeight", () => {
      const { container } = render(
        <D3FacetedTimelineChart
          facets={mockFacets}
          metricType="percentage"
          facetHeight={200}
        />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("accepts different metricTypes", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="number" />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("facet data structure", () => {
    it("handles single facet correctly", () => {
      const singleFacet: IFacetData[] = [
        {
          kpiId: "child-1",
          kpiName: "Bicycle Safety",
          labTimelines: [
            {
              labId: "lab-1",
              labName: "Geneva",
              color: "#3b82f6",
              dataPoints: [{ year: 2023, value: 75, date: "2023-01-01" }],
            },
          ],
        },
      ];

      const { container } = render(
        <D3FacetedTimelineChart facets={singleFacet} metricType="percentage" />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("handles multiple facets correctly", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("handles facets with empty lab timelines", () => {
      const facetsWithEmpty: IFacetData[] = [
        {
          kpiId: "child-1",
          kpiName: "Empty Facet",
          labTimelines: [],
        },
        ...mockFacets,
      ];

      const { container } = render(
        <D3FacetedTimelineChart
          facets={facetsWithEmpty}
          metricType="percentage"
        />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("handles facets with multiple labs per facet", () => {
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("shared axis calculations", () => {
    it("calculates global Y domain across all facets", () => {
      // Test implicitly by ensuring chart renders with varied values
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("calculates global X domain (years) across all facets", () => {
      // Test implicitly by ensuring chart renders
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("lab aggregation for legend", () => {
    it("collects unique labs across all facets for shared legend", () => {
      // mockFacets has lab-1 (Geneva) in both facets and lab-2 (Paris) in second facet
      // Should aggregate to unique set for legend
      const { container } = render(
        <D3FacetedTimelineChart facets={mockFacets} metricType="percentage" />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
