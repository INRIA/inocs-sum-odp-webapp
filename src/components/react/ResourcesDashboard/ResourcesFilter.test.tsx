import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourcesFilter } from "./ResourcesFilter";
import type { IResourceCategory, ResourcesFilterProps } from "./types";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockCategories = (): IResourceCategory[] => [
  {
    id: 1,
    name: "Research & Innovation",
    resources: [
      {
        id: "1",
        name: "Research 1",
        description: null,
        url: null,
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
        id: "2",
        name: "Data 1",
        description: null,
        url: null,
        categoryId: 2,
        categoryName: "Data",
      },
    ],
  },
];

// ============================================================================
// Tests
// ============================================================================

describe("ResourcesFilter", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Happy path - Display filter buttons", () => {
    it("should render 'All' button and one button per category", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const props: ResourcesFilterProps = {
        categories: createMockCategories(),
        selectedCategoryId: null,
        onCategoryChange: mockOnChange,
      };

      // Act
      render(<ResourcesFilter {...props} />);

      // Assert
      expect(screen.getByRole("button", { name: /All/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Data/i })).toBeInTheDocument();
    });

    it("should mark 'All' button as active when no category is selected", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const props: ResourcesFilterProps = {
        categories: createMockCategories(),
        selectedCategoryId: null,
        onCategoryChange: mockOnChange,
      };

      // Act
      render(<ResourcesFilter {...props} />);

      // Assert
      expect(screen.getByRole("button", { name: /All/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      ).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByRole("button", { name: /Data/i })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("should mark selected category button as active", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const props: ResourcesFilterProps = {
        categories: createMockCategories(),
        selectedCategoryId: 2,
        onCategoryChange: mockOnChange,
      };

      // Act
      render(<ResourcesFilter {...props} />);

      // Assert
      expect(screen.getByRole("button", { name: /All/i })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(screen.getByRole("button", { name: /Data/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  describe("Happy path - User interactions", () => {
    it("should call onCategoryChange with category id when category button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      const props: ResourcesFilterProps = {
        categories: createMockCategories(),
        selectedCategoryId: null,
        onCategoryChange: mockOnChange,
      };

      // Act
      render(<ResourcesFilter {...props} />);
      await user.click(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      );

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it("should call onCategoryChange with null when 'All' button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      const props: ResourcesFilterProps = {
        categories: createMockCategories(),
        selectedCategoryId: 1,
        onCategoryChange: mockOnChange,
      };

      // Act
      render(<ResourcesFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /All/i }));

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it("should call onCategoryChange with new category id when switching categories", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      const props: ResourcesFilterProps = {
        categories: createMockCategories(),
        selectedCategoryId: 1,
        onCategoryChange: mockOnChange,
      };

      // Act
      render(<ResourcesFilter {...props} />);
      await user.click(screen.getByRole("button", { name: /Data/i }));

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(2);
    });
  });

  describe("Edge cases", () => {
    it("should not render filter buttons when categories array is empty", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const props: ResourcesFilterProps = {
        categories: [],
        selectedCategoryId: null,
        onCategoryChange: mockOnChange,
      };

      // Act
      const { container } = render(<ResourcesFilter {...props} />);

      // Assert - no buttons rendered
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(container.textContent).toBe("");
    });

    it("should handle single category correctly", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const props: ResourcesFilterProps = {
        categories: [
          {
            id: 1,
            name: "Research & Innovation",
            resources: [],
          },
        ],
        selectedCategoryId: null,
        onCategoryChange: mockOnChange,
      };

      // Act
      render(<ResourcesFilter {...props} />);

      // Assert
      expect(screen.getByRole("button", { name: /All/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Research & Innovation/i }),
      ).toBeInTheDocument();
    });
  });
});
