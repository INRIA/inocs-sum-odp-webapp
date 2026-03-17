import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICoverageTable } from "./KPICoverageTable";
import type { KpiCoverageRow } from "./types";

describe("KPICoverageTable component - User Story 4", () => {
  const mockRows: KpiCoverageRow[] = [
    {
      kpiId: 1,
      kpiNumber: "1",
      kpiName: "Energy Efficiency",
      kpiType: "GLOBAL",
      labsWithResultsCount: 8,
      totalLabs: 12,
    },
    {
      kpiId: 2,
      kpiNumber: "2",
      kpiName: "Modal Split",
      kpiType: "GLOBAL",
      labsWithResultsCount: 5,
      totalLabs: 12,
    },
    {
      kpiId: 3,
      kpiNumber: "3",
      kpiName: "Local Emissions",
      kpiType: "LOCAL",
      labsWithResultsCount: 0,
      totalLabs: 12,
    },
  ];

  it("renders table with all columns", () => {
    render(<KPICoverageTable rows={mockRows} />);

    // Check column headers
    expect(screen.getByText("KPI #")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Labs with Results")).toBeInTheDocument();
  });

  it("renders all KPI rows with correct data", () => {
    render(<KPICoverageTable rows={mockRows} />);

    // Check KPI 1 data
    expect(screen.getByText("Energy Efficiency")).toBeInTheDocument();
    expect(screen.getByText("8 / 12")).toBeInTheDocument();

    // Check KPI 2 data
    expect(screen.getByText("Modal Split")).toBeInTheDocument();
    expect(screen.getByText("5 / 12")).toBeInTheDocument();

    // Check KPI 3 data
    expect(screen.getByText("Local Emissions")).toBeInTheDocument();
    expect(screen.getByText("0 / 12")).toBeInTheDocument();
  });

  it("renders KPI type badges correctly", () => {
    render(<KPICoverageTable rows={mockRows} />);

    // Should have GLOBAL badges
    const globalBadges = screen.getAllByText("GLOBAL");
    expect(globalBadges.length).toBe(2);

    // Should have LOCAL badge
    expect(screen.getByText("LOCAL")).toBeInTheDocument();
  });

  it("applies correct styling to KPI type badges", () => {
    render(<KPICoverageTable rows={mockRows} />);

    const globalBadge = screen.getAllByText("GLOBAL")[0];
    expect(globalBadge).toHaveClass("bg-blue-100");
    expect(globalBadge).toHaveClass("text-blue-800");

    const localBadge = screen.getByText("LOCAL");
    expect(localBadge).toHaveClass("bg-green-100");
    expect(localBadge).toHaveClass("text-green-800");
  });

  it("renders empty state message when no rows", () => {
    render(<KPICoverageTable rows={[]} />);

    expect(screen.getByText("No KPI definitions found")).toBeInTheDocument();
  });

  it("shows KPI number correctly", () => {
    render(<KPICoverageTable rows={mockRows} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("only includes parent KPIs (verified by fixture)", () => {
    // This test verifies the fixture - actual filtering happens in the helper
    // The component should only receive parent KPIs from computeKpiCoverageTable
    render(<KPICoverageTable rows={mockRows} />);

    // All 3 rows should be rendered as they represent parent KPIs
    const rows = screen.getAllByRole("row");
    // 1 header row + 3 data rows
    expect(rows.length).toBe(4);
  });
});
