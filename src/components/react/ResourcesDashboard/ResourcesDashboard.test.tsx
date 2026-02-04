import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourcesDashboard } from "./ResourcesDashboard";
import type { ResourcesDashboardProps } from "./types";
import type { IProject } from "../../../types/Project";
import type { IResource, IResourceCategory } from "../../../types";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockProject = (overrides: Partial<IProject> = {}): IProject => ({
  id: 1,
  name: "Urban Mobility Project",
  description: "A project about urban mobility",
  type: "research",
  image_url: null,
  ...overrides,
});

const createMockTag = (
  overrides: Partial<{ id: number; name: string; color: string }> = {},
) => ({
  id: 1,
  item_id: 1,
  tag_id: 1,
  tags: {
    id: 1,
    name: "sustainability",
    color: "#22c55e",
    ...overrides,
  },
});

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockResources = (): IResource[] => [
  {
    id: 1,
    name: "Research Paper Alpha",
    description: "A comprehensive study on urban mobility",
    url: "https://example.com/alpha",
    category_id: 1,
    category: { id: 1, name: "Research & Innovation", type: "RESOURCES" },
  },
  {
    id: 2,
    name: "Research Paper Beta",
    description: "Analysis of transportation patterns",
    url: "https://example.com/beta",
    category_id: 1,
    category: { id: 1, name: "Research & Innovation", type: "RESOURCES" },
  },
  {
    id: 3,
    name: "Dataset Gamma",
    description: "Traffic data from European cities",
    url: "https://example.com/gamma",
    category_id: 2,
    category: { id: 2, name: "Data", type: "RESOURCES" },
  },
];

const createMockCategories = (): IResourceCategory[] => [
  {
    id: 1,
    name: "Research & Innovation",
    resources: [
      {
        id: 1,
        name: "Research Paper Alpha",
        description: "A comprehensive study on urban mobility",
        url: "https://example.com/alpha",
        category_id: 1,
        category: { id: 1, name: "Research & Innovation", type: "RESOURCES" },
      },
      {
        id: 2,
        name: "Research Paper Beta",
        description: "Analysis of transportation patterns",
        url: "https://example.com/beta",
        category_id: 1,
        category: { id: 1, name: "Research & Innovation", type: "RESOURCES" },
      },
    ],
  },
  {
    id: 2,
    name: "Data",
    resources: [
      {
        id: 3,
        name: "Dataset Gamma",
        description: "Traffic data from European cities",
        url: "https://example.com/gamma",
        category_id: 2,
        category: { id: 2, name: "Data", type: "RESOURCES" },
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
    it("should render the dashboard with metrics and resource cards", () => {
      // Arrange
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // Assert - metrics are displayed
      expect(
        screen.getByText(/2.*Research & Innovation.*resources/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/1.*Data.*resource\b/i)).toBeInTheDocument();

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
  });

  describe("Edge cases - Single category", () => {
    it("should handle a single category with multiple resources", () => {
      // Arrange
      const props: ResourcesDashboardProps = {
        resources: [
          {
            id: 1,
            name: "Resource One",
            description: "Description one",
            url: "https://example.com/one",
            category_id: 1,
            category: {
              id: 1,
              name: "Research & Innovation",
              type: "RESOURCES",
            },
          },
          {
            id: 2,
            name: "Resource Two",
            description: "Description two",
            url: "https://example.com/two",
            category_id: 1,
            category: {
              id: 1,
              name: "Research & Innovation",
              type: "RESOURCES",
            },
          },
        ],
        categories: [
          {
            id: 1,
            name: "Research & Innovation",
            resources: [
              {
                id: 1,
                name: "Resource One",
                description: "Description one",
                url: "https://example.com/one",
                category_id: 1,
                category: {
                  id: 1,
                  name: "Research & Innovation",
                  type: "RESOURCES",
                },
              },
              {
                id: 2,
                name: "Resource Two",
                description: "Description two",
                url: "https://example.com/two",
                category_id: 1,
                category: {
                  id: 1,
                  name: "Research & Innovation",
                  type: "RESOURCES",
                },
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

  // ==========================================================================
  // Filter Panel Feature Tests
  // ==========================================================================

  describe("Happy path - Filter panel visibility", () => {
    it("should display 'Show filters' button when resources are available", () => {
      // Arrange
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // Assert
      expect(
        screen.getByRole("button", { name: /show filters/i }),
      ).toBeInTheDocument();
    });

    it("should open the filter panel when 'Show filters' button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - filter panel is visible
      expect(
        screen.getByRole("button", { name: /hide filters/i }),
      ).toBeInTheDocument();
    });

    it("should close the filter panel when 'Hide filters' button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /hide filters/i }));

      // Assert - filter panel is hidden
      expect(
        screen.getByRole("button", { name: /show filters/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Happy path - Filter panel sections", () => {
    it("should display 'Type of resource' filter section with category options from props", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - section is visible
      expect(screen.getByText("Type of resource")).toBeInTheDocument();

      // Assert - category options from props are displayed (within the filter section)
      const filterSection = document.getElementById("data-dashboard-filters");
      expect(filterSection).not.toBeNull();
      props.categories.forEach((category) => {
        expect(
          within(filterSection!).getByRole("button", {
            name: new RegExp(`^${category.name}$`, "i"),
          }),
        ).toBeInTheDocument();
      });
    });

    it("should display 'Policy measure' filter section with project options from props", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProjects: IProject[] = [
        createMockProject({ id: 1, name: "Sustainable Transport" }),
        createMockProject({ id: 2, name: "Green Energy Initiative" }),
      ];
      const props: ResourcesDashboardProps = {
        ...createDefaultProps(),
        projects: mockProjects,
      };

      // Act
      render(<ResourcesDashboard {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - section is visible
      expect(screen.getByText("Policy measure")).toBeInTheDocument();

      // Assert - project options from props are displayed
      mockProjects.forEach((project) => {
        expect(
          screen.getByRole("button", { name: new RegExp(project.name, "i") }),
        ).toBeInTheDocument();
      });
    });

    it("should display 'Keywords' filter section with tag options from props", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockTags = [
        { id: 1, name: "sustainability", color: "#22c55e" },
        { id: 2, name: "electric-vehicles", color: "#3b82f6" },
        { id: 3, name: "public-transport", color: "#f59e0b" },
      ];
      const props: ResourcesDashboardProps = {
        ...createDefaultProps(),
        tags: mockTags,
      };

      // Act
      render(<ResourcesDashboard {...props} />);
      await user.click(screen.getByRole("button", { name: /show filters/i }));

      // Assert - section is visible
      expect(screen.getByText("Keywords")).toBeInTheDocument();

      // Assert - tag options from props are displayed
      mockTags.forEach((tag) => {
        expect(
          screen.getByRole("button", { name: new RegExp(tag.name, "i") }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Happy path - Filter data displayed", () => {
    it("should filter resources when a category is deselected in filter panel", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // Verify all resources are initially displayed
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
      expect(screen.getByText("Dataset Gamma")).toBeInTheDocument();

      // Open filter panel and deselect "Data" category
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /^Data$/i }));

      // Assert - Data category resources are hidden, Research & Innovation resources remain
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
      expect(screen.queryByText("Dataset Gamma")).not.toBeInTheDocument();
    });

    it("should filter resources when a project is deselected in filter panel", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockProjects: IProject[] = [
        createMockProject({ id: 1, name: "Sustainable Transport" }),
        createMockProject({ id: 2, name: "Green Energy Initiative" }),
      ];
      const categoriesWithProjects: IResourceCategory[] = [
        {
          id: 1,
          name: "Research & Innovation",
          resources: [
            {
              id: 1,
              name: "Transport Research Paper",
              description: "Research on sustainable transport",
              url: "https://example.com/transport",
              category_id: 1,
              category: {
                id: 1,
                name: "Research & Innovation",
                type: "RESOURCES",
              },
              project: {
                id: 1,
                name: "Sustainable Transport",
                description: null,
                type: "research",
                image_url: null,
              },
            },
            {
              id: 2,
              name: "Energy Research Paper",
              description: "Research on green energy",
              url: "https://example.com/energy",
              category_id: 1,
              category: {
                id: 1,
                name: "Research & Innovation",
                type: "RESOURCES",
              },
              project: {
                id: 2,
                name: "Green Energy Initiative",
                description: null,
                type: "research",
                image_url: null,
              },
            },
          ],
        },
      ];
      const props: ResourcesDashboardProps = {
        categories: categoriesWithProjects,
        projects: mockProjects,
      };

      // Act
      render(<ResourcesDashboard {...props} />);

      // Verify all resources are initially displayed
      expect(screen.getByText("Transport Research Paper")).toBeInTheDocument();
      expect(screen.getByText("Energy Research Paper")).toBeInTheDocument();

      // Open filter panel and deselect "Green Energy Initiative" project
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      const filterSection = document.getElementById("data-dashboard-filters");
      await user.click(
        within(filterSection!).getByRole("button", {
          name: /Green Energy Initiative/i,
        }),
      );

      // Assert - Green Energy resources are hidden, Sustainable Transport resources remain
      expect(screen.getByText("Transport Research Paper")).toBeInTheDocument();
      expect(
        screen.queryByText("Energy Research Paper"),
      ).not.toBeInTheDocument();
    });

    it("should filter resources when a tag is deselected in filter panel", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockTags = [
        { id: 1, name: "sustainability", color: "#22c55e" },
        { id: 2, name: "electric-vehicles", color: "#3b82f6" },
      ];
      const categoriesWithTags: IResourceCategory[] = [
        {
          id: 1,
          name: "Research & Innovation",
          resources: [
            {
              id: 1,
              name: "Sustainability Report",
              description: "Report on sustainability",
              url: "https://example.com/sustainability",
              category_id: 1,
              category: {
                id: 1,
                name: "Research & Innovation",
                type: "RESOURCES",
              },
              item_tag: [
                {
                  id: 1,
                  item_id: 1,
                  tag_id: 1,
                  tags: { id: 1, name: "sustainability", color: "#22c55e" },
                },
              ],
            },
            {
              id: 2,
              name: "EV Analysis",
              description: "Analysis of electric vehicles",
              url: "https://example.com/ev",
              category_id: 1,
              category: {
                id: 1,
                name: "Research & Innovation",
                type: "RESOURCES",
              },
              item_tag: [
                {
                  id: 2,
                  item_id: 2,
                  tag_id: 2,
                  tags: { id: 2, name: "electric-vehicles", color: "#3b82f6" },
                },
              ],
            },
          ],
        },
      ];
      const props: ResourcesDashboardProps = {
        categories: categoriesWithTags,
        tags: mockTags,
      };

      // Act
      render(<ResourcesDashboard {...props} />);

      // Verify all resources are initially displayed
      expect(screen.getByText("Sustainability Report")).toBeInTheDocument();
      expect(screen.getByText("EV Analysis")).toBeInTheDocument();

      // Open filter panel and deselect "electric-vehicles" tag
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      const filterSection = document.getElementById("data-dashboard-filters");
      await user.click(
        within(filterSection!).getByRole("button", {
          name: /electric-vehicles/i,
        }),
      );

      // Assert - EV resources are hidden, sustainability resources remain
      expect(screen.getByText("Sustainability Report")).toBeInTheDocument();
      expect(screen.queryByText("EV Analysis")).not.toBeInTheDocument();
    });

    it("should show all resources when a previously deselected filter is re-selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const props = createDefaultProps();

      // Act
      render(<ResourcesDashboard {...props} />);

      // Open filter panel and deselect "Data" category
      await user.click(screen.getByRole("button", { name: /show filters/i }));
      await user.click(screen.getByRole("button", { name: /^Data$/i }));

      // Verify Data resources are hidden
      expect(screen.queryByText("Dataset Gamma")).not.toBeInTheDocument();

      // Re-select "Data" category
      await user.click(screen.getByRole("button", { name: /^Data$/i }));

      // Assert - all resources are visible again
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
      expect(screen.getByText("Dataset Gamma")).toBeInTheDocument();
    });
  });
});
