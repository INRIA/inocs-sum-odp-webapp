import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataDashboard } from "./DataDashboard";
import type {
  DataDashboardProps,
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

const createDefaultProps = (): DataDashboardProps => ({
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
// Tests
// ============================================================================

describe("DataDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders the filters section with correct heading", () => {
      render(<DataDashboard {...createDefaultProps()} />);

      expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("renders all living lab filter buttons", () => {
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      props.livingLabs.forEach((lab) => {
        expect(
          screen.getByRole("button", { name: new RegExp(lab.name) }),
        ).toBeInTheDocument();
      });
    });

    it("renders all year filter buttons", () => {
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      props.availableYears.forEach((year) => {
        expect(
          screen.getByRole("button", { name: String(year) }),
        ).toBeInTheDocument();
      });
    });

    it("renders all category filter buttons", () => {
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      props.categories.forEach((category) => {
        expect(
          screen.getByRole("button", { name: category.name }),
        ).toBeInTheDocument();
      });
    });

    it("shows 'Deselect All' buttons when all items are selected initially", () => {
      render(<DataDashboard {...createDefaultProps()} />);

      // All three filter sections should show "Deselect All" initially
      const deselectButtons = screen.getAllByRole("button", {
        name: "Deselect All",
      });
      expect(deselectButtons).toHaveLength(3);
    });

    it("displays correct summary text with all items selected", () => {
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      expect(
        screen.getByText(
          `Showing ${props.livingLabs.length} of ${props.livingLabs.length} living labs • ${props.categories.length} of ${props.categories.length} categories`,
        ),
      ).toBeInTheDocument();
    });

    it("passes all labs, years, and categories as selected to child component", () => {
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      const childProps = getLastMockCallProps();

      expect(childProps.filter.selectedLabIds).toEqual(
        props.livingLabs.map((lab) => lab.id),
      );
      expect(childProps.filter.selectedYears).toEqual(props.availableYears);
      expect(childProps.filter.selectedCategoryIds).toEqual(
        props.categories.map((cat) => cat.id),
      );
    });

    it("assigns consistent colors to living labs", () => {
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      const childProps = getLastMockCallProps();

      expect(childProps.labColors).toHaveLength(props.livingLabs.length);
      childProps.labColors.forEach((colorAssignment, index) => {
        expect(colorAssignment.labId).toBe(props.livingLabs[index].id);
        expect(colorAssignment.labName).toBe(props.livingLabs[index].name);
        expect(colorAssignment.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("does not render years section when no years available", () => {
      const props = createDefaultProps();
      props.availableYears = [];
      render(<DataDashboard {...props} />);

      expect(screen.queryByText("Years")).not.toBeInTheDocument();
    });

    it("does not render categories section when no categories available", () => {
      const props = createDefaultProps();
      props.categories = [];
      render(<DataDashboard {...props} />);

      expect(screen.queryByText("KPI Categories")).not.toBeInTheDocument();
    });
  });

  describe("Living Lab Filter Interactions", () => {
    it("deselects a lab when clicking on a selected lab button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      // Click on Geneva Lab to deselect it
      await user.click(screen.getByRole("button", { name: /Geneva Lab/ }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedLabIds).not.toContain("lab-1");
      expect(childProps.filter.selectedLabIds).toContain("lab-2");
      expect(childProps.filter.selectedLabIds).toContain("lab-3");
    });

    it("selects a lab when clicking on a deselected lab button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      // First deselect Geneva Lab
      await user.click(screen.getByRole("button", { name: /Geneva Lab/ }));
      // Then re-select it
      await user.click(screen.getByRole("button", { name: /Geneva Lab/ }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedLabIds).toContain("lab-1");
    });

    it("prevents deselecting the last remaining lab", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      props.livingLabs = [createMockLivingLabs()[0]]; // Only one lab
      render(<DataDashboard {...props} />);

      // Try to deselect the only lab
      await user.click(screen.getByRole("button", { name: /Geneva Lab/ }));

      const childProps = getLastMockCallProps();
      // Should still have the lab selected
      expect(childProps.filter.selectedLabIds).toContain("lab-1");
      expect(childProps.filter.selectedLabIds).toHaveLength(1);
    });

    it("toggles all labs when clicking 'Deselect All' button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      // Find the Living Labs section and click its Deselect All button
      const labsSection = screen
        .getByText("Living Labs")
        .closest("div")?.parentElement;
      const deselectButton = within(labsSection!).getByRole("button", {
        name: "Deselect All",
      });
      await user.click(deselectButton);

      const childProps = getLastMockCallProps();
      // Should keep only one lab (the first one)
      expect(childProps.filter.selectedLabIds).toHaveLength(1);
      expect(childProps.filter.selectedLabIds).toContain("lab-1");
    });

    it("selects all labs when clicking 'Select All' button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      // First deselect all
      const labsSection = screen
        .getByText("Living Labs")
        .closest("div")?.parentElement;
      const toggleButton = within(labsSection!).getByRole("button", {
        name: "Deselect All",
      });
      await user.click(toggleButton);

      // Now click Select All
      const selectAllButton = within(labsSection!).getByRole("button", {
        name: "Select All",
      });
      await user.click(selectAllButton);

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedLabIds).toHaveLength(
        props.livingLabs.length,
      );
    });
  });

  describe("Year Filter Interactions", () => {
    it("deselects a year when clicking on a selected year button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      await user.click(screen.getByRole("button", { name: "2024" }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedYears).not.toContain(2024);
      expect(childProps.filter.selectedYears).toContain(2023);
      expect(childProps.filter.selectedYears).toContain(2025);
    });

    it("selects a year when clicking on a deselected year button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      // Deselect then re-select
      await user.click(screen.getByRole("button", { name: "2024" }));
      await user.click(screen.getByRole("button", { name: "2024" }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedYears).toContain(2024);
    });

    it("prevents deselecting the last remaining year", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      props.availableYears = [2024]; // Only one year
      render(<DataDashboard {...props} />);

      await user.click(screen.getByRole("button", { name: "2024" }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedYears).toContain(2024);
      expect(childProps.filter.selectedYears).toHaveLength(1);
    });

    it("toggles all years when clicking 'Deselect All' button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      const yearsSection = screen
        .getByText("Years")
        .closest("div")?.parentElement;
      const deselectButton = within(yearsSection!).getByRole("button", {
        name: "Deselect All",
      });
      await user.click(deselectButton);

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedYears).toHaveLength(1);
      expect(childProps.filter.selectedYears).toContain(2023); // First year kept
    });
  });

  describe("Category Filter Interactions", () => {
    it("deselects a category when clicking on a selected category button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      await user.click(screen.getByRole("button", { name: "Environment" }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedCategoryIds).not.toContain(1);
      expect(childProps.filter.selectedCategoryIds).toContain(2);
      expect(childProps.filter.selectedCategoryIds).toContain(3);
    });

    it("selects a category when clicking on a deselected category button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      // Deselect then re-select
      await user.click(screen.getByRole("button", { name: "Environment" }));
      await user.click(screen.getByRole("button", { name: "Environment" }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedCategoryIds).toContain(1);
    });

    it("prevents deselecting the last remaining category", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      props.categories = [createMockCategories()[0]]; // Only one category
      render(<DataDashboard {...props} />);

      await user.click(screen.getByRole("button", { name: "Environment" }));

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedCategoryIds).toContain(1);
      expect(childProps.filter.selectedCategoryIds).toHaveLength(1);
    });

    it("toggles all categories when clicking 'Deselect All' button", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      const categoriesSection = screen
        .getByText("KPI Categories")
        .closest("div")?.parentElement;
      const deselectButton = within(categoriesSection!).getByRole("button", {
        name: "Deselect All",
      });
      await user.click(deselectButton);

      const childProps = getLastMockCallProps();
      expect(childProps.filter.selectedCategoryIds).toHaveLength(1);
      expect(childProps.filter.selectedCategoryIds).toContain(1); // First category kept
    });
  });

  describe("Summary Text Updates", () => {
    it("updates summary when labs are deselected", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      await user.click(screen.getByRole("button", { name: /Geneva Lab/ }));

      expect(
        screen.getByText(
          `Showing 2 of ${props.livingLabs.length} living labs • ${props.categories.length} of ${props.categories.length} categories`,
        ),
      ).toBeInTheDocument();
    });

    it("updates summary when categories are deselected", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      await user.click(screen.getByRole("button", { name: "Environment" }));

      expect(
        screen.getByText(
          `Showing ${props.livingLabs.length} of ${props.livingLabs.length} living labs • 2 of ${props.categories.length} categories`,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Props Propagation to Child Component", () => {
    it("passes all required props to KpiLivingLabsCards", () => {
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      const childProps = getLastMockCallProps();

      expect(childProps.livingLabs).toEqual(props.livingLabs);
      expect(childProps.kpis).toEqual(props.kpis);
      expect(childProps.categories).toEqual(props.categories);
      expect(childProps.filter).toBeDefined();
      expect(childProps.labColors).toBeDefined();
    });

    it("updates child component filter when lab selection changes", async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      const initialCallCount = mockKpiLivingLabsCards.mock.calls.length;

      await user.click(screen.getByRole("button", { name: /Geneva Lab/ }));

      // Should have been called again with updated filter
      expect(mockKpiLivingLabsCards.mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );
    });
  });

  describe("Color Assignment", () => {
    it("assigns colors from the predefined palette in order", () => {
      const props = createDefaultProps();
      render(<DataDashboard {...props} />);

      const childProps = getLastMockCallProps();

      // First lab should get first color
      expect(childProps.labColors[0].color).toBe("#004494");
      // Second lab should get second color
      expect(childProps.labColors[1].color).toBe("#98c33a");
      // Third lab should get third color
      expect(childProps.labColors[2].color).toBe("#ff632f");
    });

    it("cycles colors when there are more labs than palette colors", () => {
      const props = createDefaultProps();
      // Create 16 labs (more than the 15-color palette)
      props.livingLabs = Array.from({ length: 16 }, (_, i) => ({
        id: `lab-${i + 1}`,
        name: `Lab ${i + 1}`,
        kpiResults: [],
      }));
      render(<DataDashboard {...props} />);

      const childProps = getLastMockCallProps();

      // 16th lab should cycle back to first color
      expect(childProps.labColors[15].color).toBe("#004494");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty living labs array", () => {
      const props = createDefaultProps();
      props.livingLabs = [];
      render(<DataDashboard {...props} />);

      expect(screen.getByText("Living Labs")).toBeInTheDocument();
      // No lab buttons should be rendered
      expect(
        screen.queryByRole("button", { name: /Lab/ }),
      ).not.toBeInTheDocument();
    });

    it("handles empty kpis array", () => {
      const props = createDefaultProps();
      props.kpis = [];
      render(<DataDashboard {...props} />);

      const childProps = getLastMockCallProps();
      expect(childProps.kpis).toEqual([]);
    });

    it("renders child component", () => {
      render(<DataDashboard {...createDefaultProps()} />);

      expect(screen.getByTestId("kpi-living-labs-cards")).toBeInTheDocument();
    });
  });
});
