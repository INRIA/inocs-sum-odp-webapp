import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { D3BarChartLabMeasures } from "./D3BarChartLabMeasures";
import type { LabMeasuresBarData } from "./types";

// Mock ResizeObserver for D3 chart tests
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  window.ResizeObserver = ResizeObserverMock as any;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("D3BarChartLabMeasures component - User Story 3", () => {
  const mockData: LabMeasuresBarData[] = [
    { labName: "Lab 1", pushCount: 5, pullCount: 3 },
    { labName: "Lab 2", pushCount: 2, pullCount: 7 },
    { labName: "Lab 3", pushCount: 0, pullCount: 4 },
  ];

  it("renders SVG container", () => {
    const { container } = render(<D3BarChartLabMeasures data={mockData} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders with responsive container", () => {
    const { container } = render(<D3BarChartLabMeasures data={mockData} />);

    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer).toHaveClass("w-full");
    expect(chartContainer).toHaveClass("h-full");
  });

  it("renders legend with PUSH and PULL labels", () => {
    render(<D3BarChartLabMeasures data={mockData} />);

    expect(screen.getByText("PUSH")).toBeInTheDocument();
    expect(screen.getByText("PULL")).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    const { container } = render(<D3BarChartLabMeasures data={[]} />);

    // Should render without crashing
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("handles labs with zero measures correctly", () => {
    const zeroData: LabMeasuresBarData[] = [
      { labName: "Empty Lab", pushCount: 0, pullCount: 0 },
    ];

    const { container } = render(<D3BarChartLabMeasures data={zeroData} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("handles single lab data", () => {
    const singleLab: LabMeasuresBarData[] = [
      { labName: "Single Lab", pushCount: 3, pullCount: 2 },
    ];

    const { container } = render(<D3BarChartLabMeasures data={singleLab} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
