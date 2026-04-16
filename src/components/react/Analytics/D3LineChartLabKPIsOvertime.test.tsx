import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { D3LineChartLabKPIsOvertime } from "./D3LineChartLabKPIsOvertime";
import type { LabKpiTimelineSeries } from "./types";

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

describe("D3LineChartLabKPIsOvertime component - User Story 2", () => {
  const mockData: LabKpiTimelineSeries[] = [
    {
      labId: 1,
      labName: "Lab 1",
      color: "#3B82F6",
      dataPoints: [
        { year: 2022, count: 5 },
        { year: 2023, count: 12 },
        { year: 2024, count: 8 },
      ],
    },
    {
      labId: 2,
      labName: "Lab 2",
      color: "#10B981",
      dataPoints: [
        { year: 2022, count: 3 },
        { year: 2023, count: 7 },
      ],
    },
  ];

  it("renders SVG container", () => {
    const { container } = render(<D3LineChartLabKPIsOvertime data={mockData} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders with responsive container", () => {
    const { container } = render(<D3LineChartLabKPIsOvertime data={mockData} />);

    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer).toHaveClass("w-full");
    expect(chartContainer).toHaveClass("h-full");
  });

  it("renders legend with lab names", () => {
    render(<D3LineChartLabKPIsOvertime data={mockData} />);

    expect(screen.getByText("Lab 1")).toBeInTheDocument();
    expect(screen.getByText("Lab 2")).toBeInTheDocument();
  });

  it("renders clickable legend buttons with initial selection count", () => {
    render(<D3LineChartLabKPIsOvertime data={mockData} />);

    expect(
      screen.getByRole("button", { name: /lab 1/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /lab 2/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2/2 selected")).toBeInTheDocument();
  });

  it("allows hiding and re-adding a lab from the legend", async () => {
    const user = userEvent.setup();

    render(<D3LineChartLabKPIsOvertime data={mockData} />);

    const lab1Button = screen.getByRole("button", { name: /lab 1/i });

    await user.click(lab1Button);

    expect(lab1Button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("1/2 selected")).toBeInTheDocument();

    await user.click(lab1Button);

    expect(lab1Button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2/2 selected")).toBeInTheDocument();
  });

  it("prevents deselecting the last visible lab", async () => {
    const user = userEvent.setup();

    render(<D3LineChartLabKPIsOvertime data={mockData} />);

    const lab1Button = screen.getByRole("button", { name: /lab 1/i });
    const lab2Button = screen.getByRole("button", { name: /lab 2/i });

    await user.click(lab1Button);

    expect(lab2Button).toBeDisabled();
    expect(lab2Button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1/2 selected")).toBeInTheDocument();
  });

  it("shows an empty state when the selected labs have no timeline data", async () => {
    const user = userEvent.setup();
    const mixedData: LabKpiTimelineSeries[] = [
      {
        labId: 1,
        labName: "Lab With Data",
        color: "#3B82F6",
        dataPoints: [{ year: 2024, count: 5 }],
      },
      {
        labId: 2,
        labName: "Lab Without Data",
        color: "#10B981",
        dataPoints: [],
      },
    ];

    render(<D3LineChartLabKPIsOvertime data={mixedData} />);

    await user.click(screen.getByRole("button", { name: /lab with data/i }));

    expect(
      screen.getByText(/no kpi timeline data available for the selected labs/i),
    ).toBeInTheDocument();
    expect(screen.getByText("1/2 selected")).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    const { container } = render(<D3LineChartLabKPIsOvertime data={[]} />);

    // Should render without crashing
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("handles single data point per series", () => {
    const singlePoint: LabKpiTimelineSeries[] = [
      {
        labId: 1,
        labName: "Lab 1",
        color: "#3B82F6",
        dataPoints: [{ year: 2024, count: 5 }],
      },
    ];

    const { container } = render(<D3LineChartLabKPIsOvertime data={singlePoint} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders with series that have no data points", () => {
    const emptyPoints: LabKpiTimelineSeries[] = [
      {
        labId: 1,
        labName: "Empty Lab",
        color: "#3B82F6",
        dataPoints: [],
      },
    ];

    const { container } = render(<D3LineChartLabKPIsOvertime data={emptyPoints} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
