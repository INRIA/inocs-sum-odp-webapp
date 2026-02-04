import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KPIsDashboard } from "./KPIsDashboard";
import type {
  KPIsDashboardProps,
  ILivingLabKpiData,
  KpiLivingLabsCardsFilter,
  ILabColorAssignment,
} from "./types";
import type { IKpi } from "../../../types";
import type { ICategory } from "../../../types/Category";

// Mock the KpiLivingLabsCards component to capture props
const mockKpiLivingLabsCards = vi.fn();
vi.mock("./KpiLivingLabsCards", () => ({
  KpiLivingLabsCards: (props: unknown) => {
    mockKpiLivingLabsCards(props);
    return (
      <div data-testid="kpi-living-labs-cards">Mocked KpiLivingLabsCards</div>
    );
  },
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockLivingLabs = (): ILivingLabKpiData[] => [
  {
    id: "lab-1",
    name: "Geneva Lab",
    kpiResults: [],
  },
  {
    id: "lab-2",
    name: "Lyon Lab",
    kpiResults: [],
  },
  {
    id: "lab-3",
    name: "Barcelona Lab",
    kpiResults: [],
  },
];

const createMockKpis = (): IKpi[] => [
  {
    id: "kpi-1",
    kpi_number: "KPI-001",
    name: "Air Quality Index",
    type: "SIEF" as never,
    progression_target: 10,
    metric: "percentage" as never,
  },
  {
    id: "kpi-2",
    kpi_number: "KPI-002",
    name: "Traffic Reduction",
    type: "SIEF" as never,
    progression_target: 20,
    metric: "percentage" as never,
  },
];

const createMockCategories = (): ICategory[] => [
  {
    id: 1,
    name: "Environment",
    type: "KPI_SIEF",
    kpis: [],
  },
  {
    id: 2,
    name: "Mobility",
    type: "KPI_SIEF",
    kpis: [],
  },
  {
    id: 3,
    name: "Safety",
    type: "KPI_SIEF",
    kpis: [],
  },
];

const createMockYears = (): number[] => [2023, 2024, 2025];

const createDefaultProps = (): KPIsDashboardProps => ({
  livingLabs: createMockLivingLabs(),
  kpis: createMockKpis(),
  availableYears: createMockYears(),
  categories: createMockCategories(),
});

// ============================================================================
// Helper to get last call props from mock
// ============================================================================

const getLastMockCallProps = () => {
  const calls = mockKpiLivingLabsCards.mock.calls;
  return calls[calls.length - 1][0] as {
    livingLabs: ILivingLabKpiData[];
    kpis: IKpi[];
    filter: KpiLivingLabsCardsFilter;
    labColors: ILabColorAssignment[];
    categories: ICategory[];
  };
};

// ============================================================================
// Tests - Focused on initial render and filter → data display integration
// ============================================================================

describe("KPIsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("displays correct summary text with all items selected", () => {
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      expect(
        screen.getByText(
          `Showing ${props.livingLabs.length} of ${props.livingLabs.length} living labs • ${props.kpis.length} KPIs • ${props.availableYears.length} years`,
        ),
      ).toBeInTheDocument();
    });

    it("passes all labs, years, and categories as selected to child component", () => {
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      const childProps = getLastMockCallProps();

      expect(childProps.filter.selectedLabIds).toEqual(
        props.livingLabs.map((lab) => lab.id),
      );
      expect(childProps.filter.selectedYears).toEqual(props.availableYears);
      expect(childProps.filter.selectedCategoryIds).toEqual(
        props.categories.map((cat) => cat.id),
      );
    });

    it("renders child component", () => {
      render(<KPIsDashboard {...createDefaultProps()} />);

      expect(screen.getByTestId("kpi-living-labs-cards")).toBeInTheDocument();
    });

    it("passes all required props to KpiLivingLabsCards", () => {
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      const childProps = getLastMockCallProps();

      expect(childProps.livingLabs).toEqual(props.livingLabs);
      expect(childProps.kpis).toEqual(props.kpis);
      expect(childProps.categories).toEqual(props.categories);
      expect(childProps.filter).toBeDefined();
      expect(childProps.labColors).toBeDefined();
    });
  });

  describe("Filter Changes → Data Display Updates", () => {
    it("updates summary when labs are deselected", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      // Open filter panel first
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      // Click on Geneva Lab to deselect it
      await user.click(screen.getByRole("button", { name: /Geneva Lab/ }));

      expect(
        screen.getByText(
          `Showing 2 of ${props.livingLabs.length} living labs • ${props.kpis.length} KPIs • ${props.availableYears.length} years`,
        ),
      ).toBeInTheDocument();
    });

    it("updates summary when categories are deselected", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      // Open filter panel first
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      // Click on Environment to deselect it
      await user.click(screen.getByRole("button", { name: "Environment" }));

      // Summary text remains unchanged as it no longer shows category count
      expect(
        screen.getByText(
          `Showing ${props.livingLabs.length} of ${props.livingLabs.length} living labs • ${props.kpis.length} KPIs • ${props.availableYears.length} years`,
        ),
      ).toBeInTheDocument();
    });

    it("updates child component filter when lab selection changes", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      const initialCallCount = mockKpiLivingLabsCards.mock.calls.length;

      // Open filter panel first
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      // Click on Geneva Lab to deselect it
      await user.click(screen.getByRole("button", { name: /Geneva Lab/ }));

      // Should have been called again with updated filter
      expect(mockKpiLivingLabsCards.mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedLabIds).not.toContain("lab-1");
    });

    it("updates child component filter when year selection changes", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      // Open filter panel first
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      // Click on 2024 to deselect it
      await user.click(screen.getByRole("button", { name: "2024" }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedYears).not.toContain(2024);
    });

    it("updates child component filter when category selection changes", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      // Open filter panel first
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      // Click on Environment to deselect it
      await user.click(screen.getByRole("button", { name: "Environment" }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedCategoryIds).not.toContain(1);
    });
  });

  describe("Color Assignment", () => {
    it("assigns consistent colors to living labs", () => {
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      const childProps = getLastMockCallProps();

      expect(childProps.labColors).toHaveLength(props.livingLabs.length);
      childProps.labColors.forEach((colorAssignment, index) => {
        expect(colorAssignment.labId).toBe(props.livingLabs[index].id);
        expect(colorAssignment.labName).toBe(props.livingLabs[index].name);
        expect(colorAssignment.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("assigns unique colors to each lab from the dynamic palette", () => {
      const props = createDefaultProps();
      render(<KPIsDashboard {...props} />);

      const childProps = getLastMockCallProps();

      // Each lab should have a color assigned
      expect(childProps.labColors[0].color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(childProps.labColors[1].color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(childProps.labColors[2].color).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Colors should be unique for different labs
      const colors = childProps.labColors.map(
        (lc: { color: string }) => lc.color,
      );
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });

    it("generates consistent colors for the same set of labs", () => {
      const props = createDefaultProps();

      // First render
      const { unmount } = render(<KPIsDashboard {...props} />);
      const firstRenderColors = getLastMockCallProps().labColors.map(
        (lc: { color: string }) => lc.color,
      );
      unmount();

      // Second render with same props
      render(<KPIsDashboard {...props} />);
      const secondRenderColors = getLastMockCallProps().labColors.map(
        (lc: { color: string }) => lc.color,
      );

      // Colors should be identical across renders
      expect(firstRenderColors).toEqual(secondRenderColors);
    });

    it("handles many labs by generating color variations", () => {
      const props = createDefaultProps();
      // Create 20 labs (more than the base palette)
      props.livingLabs = Array.from({ length: 20 }, (_, i) => ({
        id: `lab-${i + 1}`,
        name: `Lab ${i + 1}`,
        kpiResults: [],
      }));
      render(<KPIsDashboard {...props} />);

      const childProps = getLastMockCallProps();

      // All 20 labs should have colors assigned
      expect(childProps.labColors).toHaveLength(20);

      // Each should be a valid hex color
      childProps.labColors.forEach((lc: { color: string }) => {
        expect(lc.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty living labs array", () => {
      const props = createDefaultProps();
      props.livingLabs = [];
      render(<KPIsDashboard {...props} />);

      // Child component should still render
      expect(screen.getByTestId("kpi-living-labs-cards")).toBeInTheDocument();

      const childProps = getLastMockCallProps();
      expect(childProps.livingLabs).toEqual([]);
      expect(childProps.labColors).toEqual([]);
    });

    it("handles empty kpis array", () => {
      const props = createDefaultProps();
      props.kpis = [];
      render(<KPIsDashboard {...props} />);

      // KpiLivingLabsCards should not render when there are no KPIs
      expect(
        screen.queryByTestId("kpi-living-labs-cards"),
      ).not.toBeInTheDocument();
    });

    it("handles empty categories array", () => {
      const props = createDefaultProps();
      props.categories = [];
      render(<KPIsDashboard {...props} />);

      const childProps = getLastMockCallProps();
      expect(childProps.categories).toEqual([]);
    });
  });
});
