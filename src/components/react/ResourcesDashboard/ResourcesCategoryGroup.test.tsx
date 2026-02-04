import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { ResourcesCategoryGroup } from "./ResourcesCategoryGroup";
import type { IResource, ResourcesCategoryGroupProps } from "./types";

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
    name: "Research Paper Gamma",
    description: "Study of electric vehicles adoption",
    url: "https://example.com/gamma",
    categoryId: 1,
    categoryName: "Research & Innovation",
  },
];

// ============================================================================
// Tests
// ============================================================================

describe("ResourcesCategoryGroup", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Happy path - Display category group", () => {
    it("should display the category name as a heading", () => {
      // Arrange
      const props: ResourcesCategoryGroupProps = {
        categoryName: "Research & Innovation",
        resources: createMockResources(),
      };

      // Act
      render(<ResourcesCategoryGroup {...props} />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /Research & Innovation/i }),
      ).toBeInTheDocument();
    });

    it("should render the group as a region with accessible name", () => {
      // Arrange
      const props: ResourcesCategoryGroupProps = {
        categoryName: "Research & Innovation",
        resources: createMockResources(),
      };

      // Act
      render(<ResourcesCategoryGroup {...props} />);

      // Assert
      const region = screen.getByRole("region", {
        name: /Research & Innovation/i,
      });
      expect(region).toBeInTheDocument();
    });

    it("should display all resource cards within the group", () => {
      // Arrange
      const props: ResourcesCategoryGroupProps = {
        categoryName: "Research & Innovation",
        resources: createMockResources(),
      };

      // Act
      render(<ResourcesCategoryGroup {...props} />);

      // Assert
      const region = screen.getByRole("region", {
        name: /Research & Innovation/i,
      });
      expect(
        within(region).getByText("Research Paper Alpha"),
      ).toBeInTheDocument();
      expect(
        within(region).getByText("Research Paper Beta"),
      ).toBeInTheDocument();
      expect(
        within(region).getByText("Research Paper Gamma"),
      ).toBeInTheDocument();
    });

    it("should display resource cards with their descriptions", () => {
      // Arrange
      const props: ResourcesCategoryGroupProps = {
        categoryName: "Research & Innovation",
        resources: createMockResources(),
      };

      // Act
      render(<ResourcesCategoryGroup {...props} />);

      // Assert
      expect(
        screen.getByText("A comprehensive study on urban mobility"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Analysis of transportation patterns"),
      ).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should not render anything when resources array is empty", () => {
      // Arrange
      const props: ResourcesCategoryGroupProps = {
        categoryName: "Empty Category",
        resources: [],
      };

      // Act
      const { container } = render(<ResourcesCategoryGroup {...props} />);

      // Assert
      expect(container.textContent).toBe("");
    });

    it("should handle a single resource", () => {
      // Arrange
      const props: ResourcesCategoryGroupProps = {
        categoryName: "Data",
        resources: [
          {
            id: "1",
            name: "Single Dataset",
            description: "The only dataset",
            url: "https://example.com/dataset",
            categoryId: 2,
            categoryName: "Data",
          },
        ],
      };

      // Act
      render(<ResourcesCategoryGroup {...props} />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /Data/i, level: 2 }),
      ).toBeInTheDocument();
      expect(screen.getByText("Single Dataset")).toBeInTheDocument();
    });
  });
});
