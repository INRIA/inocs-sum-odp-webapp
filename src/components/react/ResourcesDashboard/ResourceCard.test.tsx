import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ResourceCard } from "./ResourceCard";
import type { ResourceCardProps } from "./types";
import type { IResource } from "../../../types";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockResource = (overrides: Partial<IResource> = {}): IResource => ({
  id: "1",
  name: "Research Paper Alpha",
  description: "A comprehensive study on urban mobility",
  url: "https://example.com/alpha",
  categoryId: 1,
  categoryName: "Research & Innovation",
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe("ResourceCard", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Happy path - Display resource card", () => {
    it("should display the resource title", () => {
      // Arrange
      const props: ResourceCardProps = {
        resource: createMockResource(),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
    });

    it("should display the resource description", () => {
      // Arrange
      const props: ResourceCardProps = {
        resource: createMockResource(),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert
      expect(
        screen.getByText("A comprehensive study on urban mobility"),
      ).toBeInTheDocument();
    });

    it("should render the resource as a clickable link with correct url", () => {
      // Arrange
      const props: ResourceCardProps = {
        resource: createMockResource(),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0]).toHaveAttribute("href", "https://example.com/alpha");
    });

    it("should open link in new tab with security attributes", () => {
      // Arrange
      const props: ResourceCardProps = {
        resource: createMockResource(),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert
      const links = screen.getAllByRole("link");
      const externalLink = links.find(
        (link) => link.getAttribute("target") === "_blank",
      );
      expect(externalLink).toBeInTheDocument();
      expect(externalLink).toHaveAttribute(
        "rel",
        expect.stringContaining("noopener"),
      );
    });

    it("should render as an article element for semantic structure", () => {
      // Arrange
      const props: ResourceCardProps = {
        resource: createMockResource(),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert
      expect(screen.getByRole("article")).toBeInTheDocument();
    });
  });

  describe("Edge cases - Optional fields", () => {
    it("should handle resource with null description", () => {
      // Arrange
      const props: ResourceCardProps = {
        resource: createMockResource({ description: null }),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert - title is still shown
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
      // No description text
      expect(
        screen.queryByText("A comprehensive study on urban mobility"),
      ).not.toBeInTheDocument();
    });

    it("should handle resource with null url by not rendering as link", () => {
      // Arrange
      const props: ResourceCardProps = {
        resource: createMockResource({ url: null }),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert - title is shown but not as a link
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /Research Paper Alpha/i }),
      ).not.toBeInTheDocument();
    });

    it("should handle resource with empty string description", () => {
      // Arrange
      const props: ResourceCardProps = {
        resource: createMockResource({ description: "" }),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert - card still renders properly
      expect(screen.getByText("Research Paper Alpha")).toBeInTheDocument();
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    it("should handle resource with very long title", () => {
      // Arrange
      const longTitle =
        "This is a very long research paper title that might need to be truncated or wrapped properly in the UI to maintain a good user experience";
      const props: ResourceCardProps = {
        resource: createMockResource({ name: longTitle }),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle resource with very long description by truncating it", () => {
      // Arrange
      const longDescription =
        "This is a very comprehensive and detailed description of the research paper that covers multiple topics including urban mobility, sustainable transportation, electric vehicles, public transit systems, cycling infrastructure, pedestrian safety, and many other related subjects that are important for modern city planning.";
      const props: ResourceCardProps = {
        resource: createMockResource({ description: longDescription }),
      };

      // Act
      render(<ResourceCard {...props} />);

      // Assert - description is truncated with ellipsis
      expect(
        screen.getByText(/This is a very comprehensive.*…/),
      ).toBeInTheDocument();
    });
  });
});
