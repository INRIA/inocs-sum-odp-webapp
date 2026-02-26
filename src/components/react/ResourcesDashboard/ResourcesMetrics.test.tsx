import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ResourcesMetrics } from "./ResourcesMetrics";
import type { ResourcesMetricsProps } from "./types";
import type { IResourceCategory } from "../../../types";

const createMockResource = (
  id: number,
  categoryId: number,
  categoryName: string,
  name: string,
) => ({
  id,
  name,
  description: null,
  url: null,
  category_id: categoryId,
  category: { id: categoryId, name: categoryName, type: "RESOURCES" as const },
});

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockCategories = (): IResourceCategory[] => [
  {
    id: 1,
    name: "Research & Innovation",
    resources: Array.from({ length: 10 }, (_, i) => ({
      ...createMockResource(i + 1, 1, "Research & Innovation", `Research ${i + 1}`),
      description: `Research description ${i + 1}`,
      url: `https://example.com/research${i + 1}`,
    })),
  },
  {
    id: 2,
    name: "Data",
    resources: Array.from({ length: 5 }, (_, i) => ({
      ...createMockResource(i + 100, 2, "Data", `Dataset ${i + 1}`),
      description: `Data description ${i + 1}`,
      url: `https://example.com/data${i + 1}`,
    })),
  },
];

// ============================================================================
// Tests
// ============================================================================

describe("ResourcesMetrics", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Happy path - Display resource counts by category", () => {
    it("should display the number of resources for each category", () => {
      // Arrange
      const props: ResourcesMetricsProps = {
        categories: createMockCategories(),
      };

      // Act
      render(<ResourcesMetrics {...props} />);

      // Assert - shows "10 Research & Innovation resources - 5 Data resources"
      expect(
        screen.getByText(/10.*Research & Innovation.*resources/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/5.*Data.*resources/i)).toBeInTheDocument();
    });

    it("should display singular 'resource' when category has exactly 1 resource", () => {
      // Arrange
      const props: ResourcesMetricsProps = {
        categories: [
          {
            id: 1,
            name: "Research & Innovation",
            resources: [
              {
                id: 1,
                name: "Single Research",
                description: "The only research",
                url: "https://example.com/research",
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
      render(<ResourcesMetrics {...props} />);

      // Assert - singular form
      expect(
        screen.getByText(/1.*Research & Innovation.*resource\b/i),
      ).toBeInTheDocument();
    });

    it("should display metrics for multiple categories in order", () => {
      // Arrange
      const props: ResourcesMetricsProps = {
        categories: [
          {
            id: 1,
            name: "Research & Innovation",
            resources: Array.from({ length: 3 }, (_, i) => ({
              ...createMockResource(i + 1, 1, "Research & Innovation", `Research ${i}`),
            })),
          },
          {
            id: 2,
            name: "Data",
            resources: Array.from({ length: 7 }, (_, i) => ({
              ...createMockResource(i + 100, 2, "Data", `Data ${i}`),
            })),
          },
          {
            id: 3,
            name: "Tools",
            resources: Array.from({ length: 2 }, (_, i) => ({
              ...createMockResource(i + 200, 3, "Tools", `Tool ${i}`),
            })),
          },
        ],
      };

      // Act
      render(<ResourcesMetrics {...props} />);

      // Assert - all categories shown
      expect(
        screen.getByText(/3.*Research & Innovation.*resources/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/7.*Data.*resources/i)).toBeInTheDocument();
      expect(screen.getByText(/2.*Tools.*resources/i)).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should not render anything when categories array is empty", () => {
      // Arrange
      const props: ResourcesMetricsProps = {
        categories: [],
      };

      // Act
      const { container } = render(<ResourcesMetrics {...props} />);

      // Assert - nothing rendered (or empty container)
      expect(container.textContent).toBe("");
    });

    it("should handle category with zero resources", () => {
      // Arrange
      const props: ResourcesMetricsProps = {
        categories: [
          {
            id: 1,
            name: "Empty Category",
            resources: [],
          },
        ],
      };

      // Act
      render(<ResourcesMetrics {...props} />);

      // Assert - shows 0 resources
      expect(
        screen.getByText(/0.*Empty Category.*resources/i),
      ).toBeInTheDocument();
    });
  });
});
