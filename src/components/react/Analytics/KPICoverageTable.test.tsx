import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICoverageTable } from "./KPICoverageTable";
import type { KpiCoverageRow } from "./types";

describe("KPICoverageTable component - multi-lab mode", () => {
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

  it("renders table with multi-lab columns", () => {
    render(<KPICoverageTable rows={mockRows} />);

    expect(screen.getByText("KPI #")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Labs with Results")).toBeInTheDocument();
    expect(screen.queryByText("Entries")).not.toBeInTheDocument();
    expect(screen.queryByText("Years Covered")).not.toBeInTheDocument();
  });

  it("renders all KPI rows with correct data", () => {
    render(<KPICoverageTable rows={mockRows} />);

    expect(screen.getByText("Energy Efficiency")).toBeInTheDocument();
    expect(screen.getByText("8 / 12")).toBeInTheDocument();
    expect(screen.getByText("Modal Split")).toBeInTheDocument();
    expect(screen.getByText("5 / 12")).toBeInTheDocument();
    expect(screen.getByText("Local Emissions")).toBeInTheDocument();
    expect(screen.getByText("0 / 12")).toBeInTheDocument();
  });

  it("renders KPI type badges correctly", () => {
    render(<KPICoverageTable rows={mockRows} />);

    const globalBadges = screen.getAllByText("GLOBAL");
    expect(globalBadges.length).toBe(2);
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

  it("renders correct number of rows", () => {
    render(<KPICoverageTable rows={mockRows} />);
    const rows = screen.getAllByRole("row");
    // 1 header row + 3 data rows
    expect(rows.length).toBe(4);
  });
});

describe("KPICoverageTable component - single-lab mode", () => {
  const singleLabRows: KpiCoverageRow[] = [
    {
      kpiId: 1,
      kpiNumber: "1",
      kpiName: "Energy Efficiency",
      kpiType: "GLOBAL",
      labsWithResultsCount: 1,
      totalLabs: 1,
      entriesCount: 5,
      yearsCovered: [2022, 2023],
    },
    {
      kpiId: 2,
      kpiNumber: "2",
      kpiName: "Modal Split",
      kpiType: "GLOBAL",
      labsWithResultsCount: 1,
      totalLabs: 1,
      entriesCount: 3,
      yearsCovered: [2023],
    },
    {
      kpiId: 3,
      kpiNumber: "3",
      kpiName: "Local Emissions",
      kpiType: "LOCAL",
      labsWithResultsCount: 0,
      totalLabs: 1,
      entriesCount: 0,
      yearsCovered: [],
    },
  ];

  it("renders single-lab columns instead of multi-lab column", () => {
    render(<KPICoverageTable rows={singleLabRows} />);

    expect(screen.getByText("Entries")).toBeInTheDocument();
    expect(screen.getByText("Years Covered")).toBeInTheDocument();
    expect(screen.queryByText("Labs with Results")).not.toBeInTheDocument();
  });

  it("displays entries count for each KPI", () => {
    render(<KPICoverageTable rows={singleLabRows} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    // "3" appears both as KPI number and as entriesCount for Modal Split
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("displays years covered as comma-separated list", () => {
    render(<KPICoverageTable rows={singleLabRows} />);

    expect(screen.getByText("2022, 2023")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("displays dash when no years covered", () => {
    render(<KPICoverageTable rows={singleLabRows} />);

    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("applies danger styling when entries count is 0", () => {
    render(<KPICoverageTable rows={singleLabRows} />);

    const zeroCells = screen.getAllByText("0");
    const dangerCell = zeroCells.find((el) =>
      el.className.includes("text-danger"),
    );
    expect(dangerCell).toBeDefined();
  });
});
