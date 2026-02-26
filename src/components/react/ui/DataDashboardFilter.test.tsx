import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataDashboardFilter } from "./DataDashboardFilter";
import type { DataDashboardFilterProps } from "./DataDashboardFilter";
import type {
  ILivingLabKpiData,
  KpiLivingLabsCardsFilter,
} from "../KPIsDashboard/types";
import type { ICategory } from "../../../types/Category";
import type { IProject } from "../../../types/Project";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockLivingLabs = (): ILivingLabKpiData[] => [
  { id: 1, name: "Geneva Living Lab", kpiResults: [] },
  { id: 2, name: "Paris Living Lab", kpiResults: [] },
];

const createMockYears = (): number[] => [2023, 2024, 2025];

const createMockCategories = (): ICategory[] => [
  { id: 1, name: "Research & Innovation", type: "RESOURCES" },
  { id: 2, name: "Data", type: "RESOURCES" },
];

const createMockProjects = (): IProject[] => [
  {
    id: 1,
    name: "Urban Mobility Project",
    description: "A project about urban mobility",
    type: "research",
  },
  {
    id: 2,
    name: "Green Transport Initiative",
    description: "Sustainable transport solutions",
    type: "policy",
  },
];

const createMockTags = (): { id: number; name: string; color: string }[] => [
  { id: 1, name: "sustainability", color: "#22c55e" },
  { id: 2, name: "electric-vehicles", color: "#3b82f6" },
  { id: 3, name: "public-transport", color: "#f59e0b" },
];

const createDefaultFilter = (): KpiLivingLabsCardsFilter => ({
  selectedLabIds: [1, 2],
  selectedYears: [2023, 2024, 2025],
  selectedCategoryIds: [1, 2],
});

const createDefaultProps = (): DataDashboardFilterProps => ({
  livingLabs: createMockLivingLabs(),
  availableYears: createMockYears(),
  categories: createMockCategories(),
  filter: createDefaultFilter(),
  onFilterChange: () => {},
});

// ============================================================================
// Tests - Existing functionality (should pass)
// ============================================================================

describe("DataDashboardFilter", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Happy path 1 - Filter button visibility", () => {
    it("should display 'Show Filters' button when component renders", () => {
      // Arrange
      const props = createDefaultProps();

      // Act
      render(<DataDashboardFilter {...props} />);

      // Assert
      expect(
        screen.getByRole("button", { name: /show filters/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Happy path 2 - Filter panel with full data", () => {
    it("should open filter card when 'Show Filters' button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - filter panel heading is visible
      expect(
        screen.getByRole("heading", { name: /filters/i }),
      ).toBeInTheDocument();
    });

    it("should display 'Hide Filters' text in button when filter panel is open", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert
      expect(
        screen.getByRole("button", { name: /hide filters/i }),
      ).toBeInTheDocument();
    });

    it("should display 'Living Labs' filter section when living labs data is available", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert
      expect(screen.getByText("Living Labs")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Geneva Living Lab/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Paris Living Lab/i }),
      ).toBeInTheDocument();
    });

    it("should display 'Years' filter section when years data is available", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert
      expect(screen.getByText("Years")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /2023/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /2024/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /2025/i })).toBeInTheDocument();
    });

    it("should display 'Type of resource' filter section when categories data is available", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert
      expect(screen.getByText("Type of resource")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Data/i })).toBeInTheDocument();
    });

    it("should display 'Policy measure' filter section when projects data is available", async () => {
      // Arrange
      const user = userEvent.setup();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        projects: createMockProjects(),
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert
      expect(screen.getByText("Policy measure")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Urban Mobility Project/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Green Transport Initiative/i }),
      ).toBeInTheDocument();
    });

    it("should display 'Keywords' filter section when tags data is available", async () => {
      // Arrange
      const user = userEvent.setup();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        tags: createMockTags(),
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert
      expect(screen.getByText("Keywords")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sustainability/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /electric-vehicles/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /public-transport/i }),
      ).toBeInTheDocument();
    });
  });
  describe("Happy - Filter selected state visually", () => {
    it("should reflect selected state visually for category filter items", async () => {
      // Arrange
      const user = userEvent.setup();
      const categories = createMockCategories();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        categories,
        filter: {
          ...createDefaultFilter(),
          selectedCategoryIds: [1], // Only first category selected
        },
        onFilterChange: () => {},
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - selected category has different styling than unselected
      const selectedButton = screen.getByRole("button", {
        name: /Research & Innovation/i,
      });
      const unselectedButton = screen.getByRole("button", { name: /^Data$/i });

      expect(selectedButton.className).toContain("bg-dark");
      expect(unselectedButton.className).toContain("bg-gray-100");
    });

    it("should reflect selected state visually for project filter items", async () => {
      // Arrange
      const user = userEvent.setup();
      const projects = createMockProjects();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        projects,
        filter: {
          ...createDefaultFilter(),
          selectedProjectIds: [1], // Only first project selected
        },
        onFilterChange: () => {},
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - selected project has different styling than unselected
      const selectedButton = screen.getByRole("button", {
        name: /Urban Mobility Project/i,
      });
      const unselectedButton = screen.getByRole("button", {
        name: /Green Transport Initiative/i,
      });

      expect(selectedButton.className).toContain("bg-dark");
      expect(unselectedButton.className).toContain("bg-gray-100");
    });

    it("should reflect selected state visually for tag filter items", async () => {
      // Arrange
      const user = userEvent.setup();
      const tags = createMockTags();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        tags,
        filter: {
          ...createDefaultFilter(),
          selectedTagIds: [1], // Only first tag selected
        },
        onFilterChange: () => {},
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - selected tag has different styling than unselected
      const selectedButton = screen.getByRole("button", {
        name: /sustainability/i,
      });
      const unselectedButton = screen.getByRole("button", {
        name: /electric-vehicles/i,
      });

      expect(selectedButton.className).toContain("bg-dark");
      expect(unselectedButton.className).toContain("bg-gray-100");
    });
  });

  describe("Happy path 3 - Close filter panel", () => {
    it("should close filter card when 'Hide Filters' button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /hide filters/i }));

      // Assert - filter panel is hidden, show filters button is back
      expect(
        screen.getByRole("button", { name: /show filters/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Happy path 4 - Partial data (only living labs)", () => {
    it("should display only 'Living Labs' filter when only living labs data is available", async () => {
      // Arrange
      const user = userEvent.setup();
      const props: DataDashboardFilterProps = {
        livingLabs: createMockLivingLabs(),
        filter: {
          selectedLabIds: [1, 2],
        },
        onFilterChange: () => {},
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - only Living Labs section is visible
      expect(screen.getByText("Living Labs")).toBeInTheDocument();
      expect(screen.queryByText("Years")).not.toBeInTheDocument();
      expect(screen.queryByText("Type of resource")).not.toBeInTheDocument();
      expect(screen.queryByText("Policy measure")).not.toBeInTheDocument();
      expect(screen.queryByText("Keywords")).not.toBeInTheDocument();
    });
    it("should display only 'Years' filter when only years data is available", async () => {
      // Arrange
      const user = userEvent.setup();
      const props: DataDashboardFilterProps = {
        availableYears: createMockYears(),
        filter: {
          selectedYears: [2023, 2024, 2025],
        },
        onFilterChange: () => {},
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - only Years section is visible
      expect(screen.queryByText("Living Labs")).not.toBeInTheDocument();
      expect(screen.getByText("Years")).toBeInTheDocument();
      expect(screen.queryByText("Type of resource")).not.toBeInTheDocument();
      expect(screen.queryByText("Policy measure")).not.toBeInTheDocument();
      expect(screen.queryByText("Keywords")).not.toBeInTheDocument();
    });
  });

  describe("Error case - No filter data available", () => {
    it("should display 'Not enough data available' message when no filter data exists", async () => {
      // Arrange
      const user = userEvent.setup();
      const props: DataDashboardFilterProps = {
        livingLabs: [],
        availableYears: [],
        categories: [],
        filter: {
          selectedLabIds: [],
          selectedYears: [],
          selectedCategoryIds: [],
        },
        onFilterChange: () => {},
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert
      expect(screen.getByText("Not enough data available")).toBeInTheDocument();
    });

    it("should display 'Not enough data available' when projects and tags are empty but passed", async () => {
      // Arrange
      const user = userEvent.setup();
      const props: DataDashboardFilterProps = {
        livingLabs: [],
        availableYears: [],
        categories: [],
        projects: [],
        tags: [],
        filter: {
          selectedLabIds: [],
          selectedYears: [],
          selectedCategoryIds: [],
        },
        onFilterChange: () => {},
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert
      expect(screen.getByText("Not enough data available")).toBeInTheDocument();
    });
  });

  describe("Filter interactions - Living Labs", () => {
    it("should call onFilterChange with updated selectedLabIds when a living lab is deselected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(
        screen.getByRole("button", { name: /Geneva Living Lab/i }),
      );

      // Assert - onFilterChange called with lab-1 removed from selectedLabIds
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedLabIds: [2],
        }),
      );
    });

    it("should call onFilterChange with updated selectedLabIds when a living lab is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        filter: {
          selectedLabIds: [2], // Only lab-2 selected initially
          selectedYears: [2023, 2024, 2025],
          selectedCategoryIds: [1, 2],
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(
        screen.getByRole("button", { name: /Geneva Living Lab/i }),
      );

      // Assert - onFilterChange called with lab-1 added to selectedLabIds
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedLabIds: expect.arrayContaining([1, 2]),
        }),
      );
    });

    it("should prevent deselecting the last remaining living lab", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        livingLabs: [{ id: 1, name: "Geneva Living Lab", kpiResults: [] }],
        filter: {
          selectedLabIds: [1],
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(
        screen.getByRole("button", { name: /Geneva Living Lab/i }),
      );

      // Assert - onFilterChange should NOT be called since we can't deselect the last item
      expect(onFilterChange).not.toHaveBeenCalled();
    });
  });

  describe("Filter interactions - Years", () => {
    it("should call onFilterChange with updated selectedYears when a year is deselected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /^2023$/i }));

      // Assert - onFilterChange called with 2023 removed from selectedYears
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedYears: [2024, 2025],
        }),
      );
    });

    it("should call onFilterChange with updated selectedYears when a year is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        filter: {
          selectedLabIds: [1, 2],
          selectedYears: [2024, 2025], // 2023 not selected initially
          selectedCategoryIds: [1, 2],
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /^2023$/i }));

      // Assert - onFilterChange called with 2023 added to selectedYears
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedYears: expect.arrayContaining([2023, 2024, 2025]),
        }),
      );
    });

    it("should prevent deselecting the last remaining year", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        availableYears: [2024],
        filter: {
          selectedYears: [2024],
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /^2024$/i }));

      // Assert - onFilterChange should NOT be called since we can't deselect the last item
      expect(onFilterChange).not.toHaveBeenCalled();
    });
  });

  describe("Filter interactions - Categories", () => {
    it("should call onFilterChange with updated selectedCategoryIds when a category is deselected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      );

      // Assert - onFilterChange called with category 1 removed from selectedCategoryIds
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedCategoryIds: [2],
        }),
      );
    });

    it("should call onFilterChange with updated selectedCategoryIds when a category is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        filter: {
          selectedLabIds: [1, 2],
          selectedYears: [2023, 2024, 2025],
          selectedCategoryIds: [2], // Only category 2 selected initially
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      );

      // Assert - onFilterChange called with category 1 added to selectedCategoryIds
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedCategoryIds: expect.arrayContaining([1, 2]),
        }),
      );
    });

    it("should prevent deselecting the last remaining category", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        categories: [{ id: 1, name: "Research & Innovation", type: "RESOURCES" }],
        filter: {
          selectedCategoryIds: [1],
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      );

      // Assert - onFilterChange should NOT be called since we can't deselect the last item
      expect(onFilterChange).not.toHaveBeenCalled();
    });
  });

  describe("Filter interactions - Projects (Policy measure)", () => {
    it("should call onFilterChange with updated selectedProjectIds when a project is deselected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        projects: createMockProjects(),
        filter: {
          ...createDefaultFilter(),
          selectedProjectIds: [1, 2],
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(
        screen.getByRole("button", { name: /Urban Mobility Project/i }),
      );

      // Assert - onFilterChange called with project-1 removed from selectedProjectIds
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedProjectIds: [2],
        }),
      );
    });

    it("should call onFilterChange with updated selectedProjectIds when a project is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        projects: createMockProjects(),
        filter: {
          ...createDefaultFilter(),
          selectedProjectIds: [2], // Only project-2 selected initially
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(
        screen.getByRole("button", { name: /Urban Mobility Project/i }),
      );

      // Assert - onFilterChange called with project-1 added to selectedProjectIds
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedProjectIds: expect.arrayContaining([1, 2]),
        }),
      );
    });
  });

  describe("Filter interactions - Tags (Keywords)", () => {
    it("should call onFilterChange with updated selectedTagIds when a tag is deselected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        tags: createMockTags(),
        filter: {
          ...createDefaultFilter(),
          selectedTagIds: [1, 2, 3],
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /sustainability/i }));

      // Assert - onFilterChange called with tag 1 removed from selectedTagIds
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedTagIds: [2, 3],
        }),
      );
    });

    it("should call onFilterChange with updated selectedTagIds when a tag is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const props: DataDashboardFilterProps = {
        ...createDefaultProps(),
        tags: createMockTags(),
        filter: {
          ...createDefaultFilter(),
          selectedTagIds: [2, 3], // Tag 1 not selected initially
        },
        onFilterChange,
      };

      // Act
      render(<DataDashboardFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /sustainability/i }));

      // Assert - onFilterChange called with tag 1 added to selectedTagIds
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedTagIds: expect.arrayContaining([1, 2, 3]),
        }),
      );
    });
  });
});
