import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { KpiLivingLabsCards } from "./KpiLivingLabsCards";
import type { IKpi } from "../../../types";
import type {
  ILivingLabKpiData,
  KpiLivingLabsCardsFilter,
  ILabColorAssignment,
} from "./types";
import type { ICategory } from "../../../types/Category";

// Mock the child card components
vi.mock("./KpiLivingLabsSingleCard", () => ({
  KpiLivingLabsSingleCard: ({ kpi }: { kpi: IKpi }) => (
    <div data-testid={`single-card-${kpi.id}`}>{kpi.name}</div>
  ),
}));

vi.mock("./KpiLivingLabsMultipleCard", () => ({
  KpiLivingLabsMultipleCard: ({ parentKpi }: { parentKpi: IKpi }) => (
    <div data-testid={`multiple-card-${parentKpi.id}`}>{parentKpi.name}</div>
  ),
}));

// Mock UI components
vi.mock("../ui", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
  ExpansionPanel: ({
    header,
    content,
  }: {
    header: React.ReactNode;
    content: React.ReactNode;
  }) => (
    <div data-testid="expansion-panel">
      <div data-testid="expansion-header">{header}</div>
      <div data-testid="expansion-content">{content}</div>
    </div>
  ),
  TopStickyLegend: ({ title, items }: { title: string; items: unknown[] }) => (
    <div data-testid="top-sticky-legend">
      {title} ({items.length} labs)
    </div>
  ),
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockKpi = (id: string, name: string, categoryId: number): IKpi => ({
  id,
  kpi_number: id.replace("kpi-", "KPI-"),
  name,
  type: "SIEF" as never,
  progression_target: 10,
  metric: "percentage" as never,
});

const createMockLivingLab = (
  id: string,
  name: string,
  kpiResults: ILivingLabKpiData["kpiResults"] = [],
): ILivingLabKpiData => ({
  id,
  name,
  kpiResults,
});

const createMockCategory = (
  id: number,
  name: string,
  kpis: IKpi[],
): ICategory => ({
  id,
  name,
  type: "KPI_SIEF",
  kpis,
});

const createMockLabColors = (labIds: string[]): ILabColorAssignment[] =>
  labIds.map((id, index) => ({
    labId: id,
    color: `#color${index}`,
  }));

// ============================================================================
// Tests
// ============================================================================

describe("KpiLivingLabsCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("Edge Cases - Year Filtering with No Data", () => {
    it("does not crash when filtering to years with no data after having data", () => {
      // Setup: Labs with KPI data for 2023 only
      const kpi1 = createMockKpi("kpi-1", "Air Quality", 1);
      const kpis = [kpi1];

      const livingLabs = [
        createMockLivingLab("lab-1", "Geneva", [
          {
            id: "result-1",
            kpidefinition_id: "kpi-1",
            livinglab_id: "lab-1",
            result_before: { id: "rb-1", date: "2023-01-01", value: 50 },
            result_after: { id: "ra-1", date: "2023-12-31", value: 60 },
          },
        ]),
      ];

      const category = createMockCategory(1, "Environment", kpis);
      const categories = [category];
      const labColors = createMockLabColors(["lab-1"]);

      // First render: Filter includes years that have data
      const filterWithData: KpiLivingLabsCardsFilter = {
        selectedLabIds: ["lab-1"],
        selectedYears: [2023], // Has data
        selectedCategoryIds: [1],
      };

      const { rerender } = render(
        <KpiLivingLabsCards
          livingLabs={livingLabs}
          kpis={kpis}
          filter={filterWithData}
          labColors={labColors}
          categories={categories}
        />,
      );

      // Should render the card
      expect(screen.getByTestId("single-card-kpi-1")).toBeInTheDocument();

      // Second render: Filter to years that have NO data
      // This is the bug scenario - should NOT crash due to hook order violation
      const filterWithNoData: KpiLivingLabsCardsFilter = {
        selectedLabIds: ["lab-1"],
        selectedYears: [2025], // No data for this year
        selectedCategoryIds: [1],
      };

      // This should NOT throw an error
      expect(() => {
        rerender(
          <KpiLivingLabsCards
            livingLabs={livingLabs}
            kpis={kpis}
            filter={filterWithNoData}
            labColors={labColors}
            categories={categories}
          />,
        );
      }).not.toThrow();

      // Should show the "no data" message
      expect(
        screen.getByText("No KPI data available for the selected filters."),
      ).toBeInTheDocument();
    });

    it("handles clicking Deselect All years gracefully when some charts have limited data", () => {
      // Setup: Multiple labs with data for different years
      // Lab 1 has data for 2023, 2024
      // Lab 2 has data for 2024 only
      // So if we filter to only 2023, Lab 2 will have no data
      const kpi1 = createMockKpi("kpi-1", "Air Quality", 1);
      const kpis = [kpi1];

      const livingLabs = [
        createMockLivingLab("lab-1", "Geneva", [
          {
            id: "result-1",
            kpidefinition_id: "kpi-1",
            livinglab_id: "lab-1",
            result_before: { id: "rb-1", date: "2023-01-01", value: 50 },
            result_after: { id: "ra-1", date: "2024-12-31", value: 60 },
          },
        ]),
        createMockLivingLab("lab-2", "Lyon", [
          {
            id: "result-2",
            kpidefinition_id: "kpi-1",
            livinglab_id: "lab-2",
            result_before: { id: "rb-2", date: "2024-01-01", value: 70 },
            result_after: { id: "ra-2", date: "2024-12-31", value: 80 },
          },
        ]),
      ];

      const category = createMockCategory(1, "Environment", kpis);
      const categories = [category];
      const labColors = createMockLabColors(["lab-1", "lab-2"]);

      // Render with all years selected
      const filterAllYears: KpiLivingLabsCardsFilter = {
        selectedLabIds: ["lab-1", "lab-2"],
        selectedYears: [2023, 2024],
        selectedCategoryIds: [1],
      };

      const { rerender } = render(
        <KpiLivingLabsCards
          livingLabs={livingLabs}
          kpis={kpis}
          filter={filterAllYears}
          labColors={labColors}
          categories={categories}
        />,
      );

      expect(screen.getByTestId("single-card-kpi-1")).toBeInTheDocument();

      // Simulate "Deselect All" - leaves only first year (2023)
      // Lab 2 has no data for 2023, but Lab 1 does
      const filterAfterDeselectAll: KpiLivingLabsCardsFilter = {
        selectedLabIds: ["lab-1", "lab-2"],
        selectedYears: [2023], // Only 2023
        selectedCategoryIds: [1],
      };

      // This should not crash
      expect(() => {
        rerender(
          <KpiLivingLabsCards
            livingLabs={livingLabs}
            kpis={kpis}
            filter={filterAfterDeselectAll}
            labColors={labColors}
            categories={categories}
          />,
        );
      }).not.toThrow();

      // Card should still be visible (Lab 1 has 2023 data)
      expect(screen.getByTestId("single-card-kpi-1")).toBeInTheDocument();
    });

    it("shows no data message when all selected years have no data for any lab", () => {
      const kpi1 = createMockKpi("kpi-1", "Air Quality", 1);
      const kpis = [kpi1];

      // Lab only has data for 2022
      const livingLabs = [
        createMockLivingLab("lab-1", "Geneva", [
          {
            id: "result-1",
            kpidefinition_id: "kpi-1",
            livinglab_id: "lab-1",
            result_before: { id: "rb-1", date: "2022-01-01", value: 50 },
            result_after: null,
          },
        ]),
      ];

      const category = createMockCategory(1, "Environment", kpis);
      const categories = [category];
      const labColors = createMockLabColors(["lab-1"]);

      // Filter to years that have no data
      const filter: KpiLivingLabsCardsFilter = {
        selectedLabIds: ["lab-1"],
        selectedYears: [2024, 2025], // No data exists for these years
        selectedCategoryIds: [1],
      };

      render(
        <KpiLivingLabsCards
          livingLabs={livingLabs}
          kpis={kpis}
          filter={filter}
          labColors={labColors}
          categories={categories}
        />,
      );

      // Should show the no data message
      expect(
        screen.getByText("No KPI data available for the selected filters."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Try selecting more living labs or years."),
      ).toBeInTheDocument();
    });

    it("transitions smoothly between having data and no data multiple times", () => {
      const kpi1 = createMockKpi("kpi-1", "Air Quality", 1);
      const kpis = [kpi1];

      const livingLabs = [
        createMockLivingLab("lab-1", "Geneva", [
          {
            id: "result-1",
            kpidefinition_id: "kpi-1",
            livinglab_id: "lab-1",
            result_before: { id: "rb-1", date: "2023-01-01", value: 50 },
            result_after: null,
          },
        ]),
      ];

      const category = createMockCategory(1, "Environment", kpis);
      const categories = [category];
      const labColors = createMockLabColors(["lab-1"]);

      // Start with data
      const filterWithData: KpiLivingLabsCardsFilter = {
        selectedLabIds: ["lab-1"],
        selectedYears: [2023],
        selectedCategoryIds: [1],
      };

      const filterWithNoData: KpiLivingLabsCardsFilter = {
        selectedLabIds: ["lab-1"],
        selectedYears: [2025],
        selectedCategoryIds: [1],
      };

      const { rerender } = render(
        <KpiLivingLabsCards
          livingLabs={livingLabs}
          kpis={kpis}
          filter={filterWithData}
          labColors={labColors}
          categories={categories}
        />,
      );

      expect(screen.getByTestId("single-card-kpi-1")).toBeInTheDocument();

      // Toggle to no data
      rerender(
        <KpiLivingLabsCards
          livingLabs={livingLabs}
          kpis={kpis}
          filter={filterWithNoData}
          labColors={labColors}
          categories={categories}
        />,
      );
      expect(
        screen.getByText("No KPI data available for the selected filters."),
      ).toBeInTheDocument();

      // Toggle back to having data
      rerender(
        <KpiLivingLabsCards
          livingLabs={livingLabs}
          kpis={kpis}
          filter={filterWithData}
          labColors={labColors}
          categories={categories}
        />,
      );
      expect(screen.getByTestId("single-card-kpi-1")).toBeInTheDocument();

      // Toggle to no data again
      rerender(
        <KpiLivingLabsCards
          livingLabs={livingLabs}
          kpis={kpis}
          filter={filterWithNoData}
          labColors={labColors}
          categories={categories}
        />,
      );
      expect(
        screen.getByText("No KPI data available for the selected filters."),
      ).toBeInTheDocument();
    });
  });

  describe("Basic Rendering", () => {
    it("renders KPI cards grouped by category", () => {
      const kpi1 = createMockKpi("kpi-1", "Air Quality", 1);
      const kpi2 = createMockKpi("kpi-2", "Traffic", 2);
      const kpis = [kpi1, kpi2];

      const livingLabs = [
        createMockLivingLab("lab-1", "Geneva", [
          {
            id: "result-1",
            kpidefinition_id: "kpi-1",
            livinglab_id: "lab-1",
            result_before: { id: "rb-1", date: "2023-01-01", value: 50 },
            result_after: null,
          },
          {
            id: "result-2",
            kpidefinition_id: "kpi-2",
            livinglab_id: "lab-1",
            result_before: { id: "rb-2", date: "2023-01-01", value: 100 },
            result_after: null,
          },
        ]),
      ];

      const category1 = createMockCategory(1, "Environment", [kpi1]);
      const category2 = createMockCategory(2, "Mobility", [kpi2]);
      const categories = [category1, category2];
      const labColors = createMockLabColors(["lab-1"]);

      const filter: KpiLivingLabsCardsFilter = {
        selectedLabIds: ["lab-1"],
        selectedYears: [2023],
        selectedCategoryIds: [1, 2],
      };

      render(
        <KpiLivingLabsCards
          livingLabs={livingLabs}
          kpis={kpis}
          filter={filter}
          labColors={labColors}
          categories={categories}
        />,
      );

      // Both cards should be rendered
      expect(screen.getByTestId("single-card-kpi-1")).toBeInTheDocument();
      expect(screen.getByTestId("single-card-kpi-2")).toBeInTheDocument();
    });
  });
});
