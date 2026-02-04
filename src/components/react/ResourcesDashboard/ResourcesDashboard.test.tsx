import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourcesDashboard } from "./ResourcesDashboard";
import type {
  IResource,
  IResourceCategory,
  ResourcesDashboardProps,
} from "./types";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockResources = (): IResource[] => [
  {
    id: "1",
    name: "Research Paper Alpha",
    description: "A comprehensive study on urban mobility",
    url: "https://example.com/alpha",
    categoryId: 1,
    categoryName: "Research & Innovation",
  },
  {
    id: "2",
    name: "Research Paper Beta",
    description: "Analysis of transportation patterns",
    url: "https://example.com/beta",
    categoryId: 1,
    categoryName: "Research & Innovation",
  },
  {
    id: "3",
    name: "Dataset Gamma",
    description: "Traffic data from European cities",
    url: "https://example.com/gamma",
    categoryId: 2,
    categoryName: "Data",
  },
];

const createMockCategories = (): IResourceCategory[] => [
  {
    id: 1,
    name: "Research & Innovation",
    resources: [
      {
        id: "1",
        name: "Research Paper Alpha",
        description: "A comprehensive study on urban mobility",
        url: "https://example.com/alpha",
        categoryId: 1,
        categoryName: "Research & Innovation",
      },
      {
        id: "2",
        name: "Research Paper Beta",
        description: "Analysis of transportation patterns",
        url: "https://example.com/beta",
        categoryId: 1,
        categoryName: "Research & Innovation",
      },
    ],
  },
  {
    id: 2,
    name: "Data",
    resources: [
      {
        id: "3",
        name: "Dataset Gamma",
        description: "Traffic data from European cities",
        url: "https://example.com/gamma",
        categoryId: 2,
        categoryName: "Data",
      },
    ],
  },
];

const createDefaultProps = (): ResourcesDashboardProps => ({
  resources: createMockResources(),
  categories: createMockCategories(),
});

// ============================================================================
// Tests
// ============================================================================

describe("ResourcesDashboard", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Happy path - Display resources dashboard", () => {
    it("should render the dashboard with metrics, filters, and resource cards", () => {
      // Arrange
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // Assert - metrics are displayed
      expect(
        screen.getByText(/2.*Research & Innovation.*resources/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/1.*Data.*resource\b/i)).toBeInTheDocument();

      // Assert - filter buttons are displayed
      expect(
        screen.getByRole("button", { name: /All/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Data/i }),
      ).toBeInTheDocument();

      // Assert - resource cards are displayed
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
      expect(screen.getByText("Research Paper Beta")).toBeInTheDocument();
      expect(screen.getByText("Dataset Gamma")).toBeInTheDocument();
    });

    it("should display resources grouped by category name", () => {
      // Arrange
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // Assert - category groups are displayed
      const researchGroup = screen.getByRole("region", {
        name: /Research & Innovation/i,
      });
      expect(researchGroup).toBeInTheDocument();
      expect(
        within(researchGroup).getByText("Research Paper Alpha"),
      ).toBeInTheDocument();
      expect(
        within(researchGroup).getByText("Research Paper Beta"),
      ).toBeInTheDocument();

      const dataGroup = screen.getByRole("region", { name: /Data/i });
      expect(dataGroup).toBeInTheDocument();
      expect(within(dataGroup).getByText("Dataset Gamma")).toBeInTheDocument();
    });

    it("should filter resources when a category filter is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // Click on "Data" filter
      await user.click(screen.getByRole("button", { name: /^Data$/i }));

      // Assert - only Data resources are shown
      expect(screen.getByText("Dataset Gamma")).toBeInTheDocument();
      expect(screen.queryByText("Research Paper Alpha")).not.toBeInTheDocument();
      expect(screen.queryByText("Research Paper Beta")).not.toBeInTheDocument();
    });

    it("should show all resources when 'All' filter is selected after filtering", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // First filter by Data
      await user.click(screen.getByRole("button", { name: /^Data$/i }));
      // Then click All
      await user.click(screen.getByRole("button", { name: /All/i }));

      // Assert - all resources are shown again
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
      expect(screen.getByText("Research Paper Beta")).toBeInTheDocument();
      expect(screen.getByText("Dataset Gamma")).toBeInTheDocument();
    });

    it("should highlight the active filter button", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // Assert - "All" is active by default
      const allButton = screen.getByRole("button", { name: /All/i });
      expect(allButton).toHaveAttribute("aria-pressed", "true");

      // Click on Data filter
      await user.click(screen.getByRole("button", { name: /^Data$/i }));

      // Assert - Data is now active, All is not
      expect(allButton).toHaveAttribute("aria-pressed", "false");
      expect(
        screen.getByRole("button", { name: /^Data$/i }),
      ).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Edge cases - Empty state", () => {
    it("should display 'Coming soon' message when no resources are available", () => {
      // Arrange
      const props: ResourcesDashboardProps = {
        resources: [],
        categories: [],
      };

      // Act
      render(<ResourcesDashboard {...props} />);

      // Assert
      expect(screen.getByText("Coming soon")).toBeInTheDocument();
    });

    it("should not display metrics or filters when no resources are available", () => {
      // Arrange
      const props: ResourcesDashboardProps = {
        resources: [],
        categories: [],
      };

      // Act
      render(<ResourcesDashboard {...props} />);

      // Assert - no filter buttons
      expect(screen.queryByRole("button", { name: /All/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Research & Innovation/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Edge cases - Single category", () => {
    it("should handle a single category with multiple resources", () => {
      // Arrange
      const props: ResourcesDashboardProps = {
        resources: [
          {
            id: "1",
            name: "Resource One",
            description: "Description one",
            url: "https://example.com/one",
            categoryId: 1,
            categoryName: "Research & Innovation",
          },
          {
            id: "2",
            name: "Resource Two",
            description: "Description two",
            url: "https://example.com/two",
            categoryId: 1,
            categoryName: "Research & Innovation",
          },
        ],
        categories: [
          {
            id: 1,
            name: "Research & Innovation",
            resources: [
              {
                id: "1",
                name: "Resource One",
                description: "Description one",
                url: "https://example.com/one",
                categoryId: 1,
                categoryName: "Research & Innovation",
              },
              {
                id: "2",
                name: "Resource Two",
                description: "Description two",
                url: "https://example.com/two",
                categoryId: 1,
                categoryName: "Research & Innovation",
              },
            ],
          },
        ],
      };

      // Act
      render(<ResourcesDashboard {...props} />);

      // Assert
      expect(
        screen.getByText(/2.*Research & Innovation.*resources/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Resource One")).toBeInTheDocument();
      expect(screen.getByText("Resource Two")).toBeInTheDocument();
    });
  });
});
