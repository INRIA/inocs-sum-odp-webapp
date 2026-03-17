import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsAlerts } from "./AnalyticsAlerts";
import type { AlertCardData } from "./types";

describe("AnalyticsAlerts component - Phase 7", () => {
  const mockAlerts: AlertCardData[] = [
    {
      label: "Labs with no KPI results",
      value: 3,
      severity: "warning",
      items: ["Lab A", "Lab B", "Lab C"],
    },
    {
      label: "KPIs with no results",
      value: 5,
      severity: "info",
      items: ["1: KPI One", "2: KPI Two", "3: KPI Three", "4: KPI Four", "5: KPI Five"],
    },
    {
      label: "Critical alert",
      value: 1,
      severity: "danger",
      items: ["Critical Item"],
    },
  ];

  it("renders all alert cards", () => {
    render(<AnalyticsAlerts alerts={mockAlerts} />);

    expect(screen.getByText("Labs with no KPI results")).toBeInTheDocument();
    expect(screen.getByText("KPIs with no results")).toBeInTheDocument();
    expect(screen.getByText("Critical alert")).toBeInTheDocument();
  });

  it("renders alert values correctly", () => {
    render(<AnalyticsAlerts alerts={mockAlerts} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("applies correct styling for warning severity", () => {
    render(<AnalyticsAlerts alerts={mockAlerts} />);

    const warningCard = screen.getByText("Labs with no KPI results").closest("div");
    expect(warningCard).toHaveClass("bg-yellow-50");
    expect(warningCard).toHaveClass("border-yellow-200");
  });

  it("applies correct styling for info severity", () => {
    render(<AnalyticsAlerts alerts={mockAlerts} />);

    const infoCard = screen.getByText("KPIs with no results").closest("div");
    expect(infoCard).toHaveClass("bg-blue-50");
    expect(infoCard).toHaveClass("border-blue-200");
  });

  it("applies correct styling for danger severity", () => {
    render(<AnalyticsAlerts alerts={mockAlerts} />);

    const dangerCard = screen.getByText("Critical alert").closest("div");
    expect(dangerCard).toHaveClass("bg-red-50");
    expect(dangerCard).toHaveClass("border-red-200");
  });

  it("renders details summary for alerts with items", () => {
    render(<AnalyticsAlerts alerts={mockAlerts} />);

    // Should have "View details" summaries
    const summaries = screen.getAllByText("View details");
    expect(summaries.length).toBe(3);
  });

  it("shows first 5 items in details", () => {
    render(<AnalyticsAlerts alerts={mockAlerts} />);

    // Items from first alert
    expect(screen.getByText("Lab A")).toBeInTheDocument();
    expect(screen.getByText("Lab B")).toBeInTheDocument();
    expect(screen.getByText("Lab C")).toBeInTheDocument();
  });

  it("handles empty alerts array", () => {
    const { container } = render(<AnalyticsAlerts alerts={[]} />);

    // Should render nothing (or empty container)
    expect(container.textContent).toBe("");
  });

  it("handles alerts without items", () => {
    const alertsNoItems: AlertCardData[] = [
      {
        label: "No items alert",
        value: 0,
        severity: "info",
      },
    ];

    render(<AnalyticsAlerts alerts={alertsNoItems} />);

    expect(screen.getByText("No items alert")).toBeInTheDocument();
    // Should not have details section
    expect(screen.queryByText("View details")).not.toBeInTheDocument();
  });

  it("truncates long item lists with 'and X more' message", () => {
    const manyItemsAlert: AlertCardData[] = [
      {
        label: "Many items",
        value: 10,
        severity: "warning",
        items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6", "Item 7", "Item 8", "Item 9", "Item 10"],
      },
    ];

    render(<AnalyticsAlerts alerts={manyItemsAlert} />);

    expect(screen.getByText(/and 5 more/)).toBeInTheDocument();
  });
});
