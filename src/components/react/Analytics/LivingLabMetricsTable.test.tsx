import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LivingLabMetricsTable } from "./LivingLabMetricsTable";
import type { LivingLabMetricsRow } from "./types";

describe("LivingLabMetricsTable component - User Story 2", () => {
  const mockRows: LivingLabMetricsRow[] = [
    {
      labId: 1,
      labName: "Lab 1",
      totalResultEntries: 15,
      kpisCoveredCount: 5,
      totalMainKpis: 10,
      pushMeasuresCount: 3,
      pullMeasuresCount: 2,
      lastUpdatedAt: "2024-03-15T10:30:00Z",
    },
    {
      labId: 2,
      labName: "Lab 2",
      totalResultEntries: 8,
      kpisCoveredCount: 3,
      totalMainKpis: 10,
      pushMeasuresCount: 1,
      pullMeasuresCount: 4,
      lastUpdatedAt: null,
    },
  ];

  it("renders table with all columns", () => {
    render(<LivingLabMetricsTable rows={mockRows} />);

    // Check column headers
    expect(screen.getByText("Living Lab")).toBeInTheDocument();
    expect(screen.getByText("KPI Results")).toBeInTheDocument();
    expect(screen.getByText("KPIs Covered")).toBeInTheDocument();
    expect(screen.getByText("PUSH Measures")).toBeInTheDocument();
    expect(screen.getByText("PULL Measures")).toBeInTheDocument();
    expect(screen.getByText("Last Updated")).toBeInTheDocument();
  });

  it("renders all rows with correct data", () => {
    render(<LivingLabMetricsTable rows={mockRows} />);

    // Check Lab 1 data
    expect(screen.getByText("Lab 1")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("5 / 10")).toBeInTheDocument();

    // Check Lab 2 data
    expect(screen.getByText("Lab 2")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("displays dash for null lastUpdatedAt", () => {
    render(<LivingLabMetricsTable rows={mockRows} />);

    // Lab 2 has null lastUpdatedAt, should show "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("formats date for valid lastUpdatedAt", () => {
    render(<LivingLabMetricsTable rows={mockRows} />);

    // Lab 1 has a valid date
    // The exact format depends on locale, but the date should be visible
    expect(screen.getByText(/2024|Mar|3\/15/)).toBeInTheDocument();
  });

  it("renders empty state message when no rows", () => {
    render(<LivingLabMetricsTable rows={[]} />);

    expect(screen.getByText("No living labs found")).toBeInTheDocument();
  });

  it("shows zero values correctly for labs with no KPI results", () => {
    const emptyLab: LivingLabMetricsRow[] = [
      {
        labId: 1,
        labName: "Empty Lab",
        totalResultEntries: 0,
        kpisCoveredCount: 0,
        totalMainKpis: 10,
        pushMeasuresCount: 0,
        pullMeasuresCount: 0,
        lastUpdatedAt: null,
      },
    ];

    render(<LivingLabMetricsTable rows={emptyLab} />);

    expect(screen.getByText("Empty Lab")).toBeInTheDocument();
    // Should see "0" for KPI results
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });
});
