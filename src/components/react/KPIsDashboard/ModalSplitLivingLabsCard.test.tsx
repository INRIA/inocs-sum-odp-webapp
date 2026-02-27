import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModalSplitLivingLabsCard } from "./ModalSplitLivingLabsCard";
import type {
  ModalSplitLivingLabsCardProps,
  KpiLivingLabsCardsFilter,
} from "./types";

// Mock the ModalSplitStackedBarChart component
vi.mock("../KpiCards/ModalSplitStackedBarChart", () => ({
  ModalSplitStackedBarChart: ({
    data,
    orientation,
  }: {
    data: unknown[];
    orientation: string;
  }) => (
    <div data-testid="stacked-bar-chart" data-orientation={orientation}>
      Mocked Chart - {data.length} datasets
    </div>
  ),
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockFilter = (
  overrides?: Partial<KpiLivingLabsCardsFilter>,
): KpiLivingLabsCardsFilter => ({
  selectedLabIds: ["lab-1", "lab-2", "lab-3"],
  selectedYears: [2023, 2024],
  selectedCategoryIds: [1, 2],
  ...overrides,
});

const createMockLabs = () => [
  {
    labId: "lab-1",
    labName: "Geneva Lab",
    entries: [
      {
        label: "2022",
        date: "2022-01-01",
        year: 2022,
        data: [
          { label: "Car", value: 0.45, color: "#ff0000" },
          { label: "Public Transit", value: 0.25, color: "#00ff00" },
        ],
      },
      {
        label: "2023",
        date: "2023-01-01",
        year: 2023,
        data: [
          { label: "Car", value: 0.4, color: "#ff0000" },
          { label: "Public Transit", value: 0.3, color: "#00ff00" },
          { label: "Bicycle", value: 0.2, color: "#0000ff" },
          { label: "Walking", value: 0.1, color: "#ffff00" },
        ],
      },
      {
        label: "2024",
        date: "2024-01-01",
        year: 2024,
        data: [
          { label: "Car", value: 0.3, color: "#ff0000" },
          { label: "Public Transit", value: 0.35, color: "#00ff00" },
          { label: "Bicycle", value: 0.25, color: "#0000ff" },
          { label: "Walking", value: 0.1, color: "#ffff00" },
        ],
      },
    ],
    before: {
      label: "2023",
      date: "2023-01-01",
      year: 2023,
      data: [
        { label: "Car", value: 0.4, color: "#ff0000" },
        { label: "Public Transit", value: 0.3, color: "#00ff00" },
        { label: "Bicycle", value: 0.2, color: "#0000ff" },
        { label: "Walking", value: 0.1, color: "#ffff00" },
      ],
    },
    after: {
      label: "2024",
      date: "2024-01-01",
      year: 2024,
      data: [
        { label: "Car", value: 0.3, color: "#ff0000" },
        { label: "Public Transit", value: 0.35, color: "#00ff00" },
        { label: "Bicycle", value: 0.25, color: "#0000ff" },
        { label: "Walking", value: 0.1, color: "#ffff00" },
      ],
    },
  },
  {
    labId: "lab-2",
    labName: "Lyon Lab",
    entries: [
      {
        label: "2022",
        date: "2022-01-01",
        year: 2022,
        data: [
          { label: "Car", value: 0.55, color: "#ff0000" },
          { label: "Public Transit", value: 0.2, color: "#00ff00" },
        ],
      },
      {
        label: "2023",
        date: "2023-01-01",
        year: 2023,
        data: [
          { label: "Car", value: 0.5, color: "#ff0000" },
          { label: "Public Transit", value: 0.25, color: "#00ff00" },
          { label: "Bicycle", value: 0.15, color: "#0000ff" },
          { label: "Walking", value: 0.1, color: "#ffff00" },
        ],
      },
      {
        label: "2024",
        date: "2024-01-01",
        year: 2024,
        data: [
          { label: "Car", value: 0.4, color: "#ff0000" },
          { label: "Public Transit", value: 0.3, color: "#00ff00" },
          { label: "Bicycle", value: 0.2, color: "#0000ff" },
          { label: "Walking", value: 0.1, color: "#ffff00" },
        ],
      },
    ],
    before: {
      label: "2023",
      date: "2023-01-01",
      year: 2023,
      data: [
        { label: "Car", value: 0.5, color: "#ff0000" },
        { label: "Public Transit", value: 0.25, color: "#00ff00" },
        { label: "Bicycle", value: 0.15, color: "#0000ff" },
        { label: "Walking", value: 0.1, color: "#ffff00" },
      ],
    },
    after: {
      label: "2024",
      date: "2024-01-01",
      year: 2024,
      data: [
        { label: "Car", value: 0.4, color: "#ff0000" },
        { label: "Public Transit", value: 0.3, color: "#00ff00" },
        { label: "Bicycle", value: 0.2, color: "#0000ff" },
        { label: "Walking", value: 0.1, color: "#ffff00" },
      ],
    },
  },
];

const createDefaultProps = (
  overrides?: Partial<ModalSplitLivingLabsCardProps>,
): ModalSplitLivingLabsCardProps => ({
  kpiId: "kpi-15a",
  kpiNumber: "15.a",
  kpiName: "Modal Split - Trips",
  labs: createMockLabs(),
  filter: createMockFilter(),
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe("ModalSplitLivingLabsCard", () => {
  describe("Rendering", () => {
    it("should render the KPI name and badge", () => {
      render(<ModalSplitLivingLabsCard {...createDefaultProps()} />);

      expect(screen.getByText("Modal Split - Trips")).toBeInTheDocument();
      // Multiple KPI badges may appear (in badge and tooltip), just check at least one exists
      expect(screen.getAllByText(/KPI 15.a/).length).toBeGreaterThan(0);
    });

    it("should render all living labs when all are selected", () => {
      render(<ModalSplitLivingLabsCard {...createDefaultProps()} />);

      expect(screen.getByText("Geneva Lab")).toBeInTheDocument();
      expect(screen.getByText("Lyon Lab")).toBeInTheDocument();
    });

    it("should render stacked bar charts for each lab", () => {
      render(<ModalSplitLivingLabsCard {...createDefaultProps()} />);

      const charts = screen.getAllByTestId("stacked-bar-chart");
      expect(charts).toHaveLength(2); // One for each lab
    });

    it("should use horizontal orientation for charts", () => {
      render(<ModalSplitLivingLabsCard {...createDefaultProps()} />);

      const charts = screen.getAllByTestId("stacked-bar-chart");
      charts.forEach((chart) => {
        expect(chart).toHaveAttribute("data-orientation", "horizontal");
      });
    });

    it("should show correct lab count in summary", () => {
      render(<ModalSplitLivingLabsCard {...createDefaultProps()} />);

      expect(screen.getByText("2 living labs")).toBeInTheDocument();
    });

    it("should show singular 'lab' when only one lab", () => {
      const props = createDefaultProps({
        filter: createMockFilter({ selectedLabIds: ["lab-1"] }),
      });
      render(<ModalSplitLivingLabsCard {...props} />);

      expect(screen.getByText("1 living lab")).toBeInTheDocument();
    });
  });

  describe("Filtering by Lab", () => {
    it("should only render selected labs", () => {
      const props = createDefaultProps({
        filter: createMockFilter({ selectedLabIds: ["lab-1"] }),
      });
      render(<ModalSplitLivingLabsCard {...props} />);

      expect(screen.getByText("Geneva Lab")).toBeInTheDocument();
      expect(screen.queryByText("Lyon Lab")).not.toBeInTheDocument();
    });

    it("should return null when no labs are selected", () => {
      const props = createDefaultProps({
        filter: createMockFilter({ selectedLabIds: [] }),
      });
      const { container } = render(<ModalSplitLivingLabsCard {...props} />);

      expect(container.firstChild).toBeNull();
    });

    it("should return null when selected labs have no matching data", () => {
      const props = createDefaultProps({
        filter: createMockFilter({ selectedLabIds: ["non-existent-lab"] }),
      });
      const { container } = render(<ModalSplitLivingLabsCard {...props} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Filtering by Year", () => {
    it("should filter out labs when their years are not selected", () => {
      const props = createDefaultProps({
        filter: createMockFilter({ selectedYears: [2025] }), // Year not in data
      });
      const { container } = render(<ModalSplitLivingLabsCard {...props} />);

      // No labs should match since 2025 is not in the data
      expect(container.firstChild).toBeNull();
    });

    it("should show labs when at least one year matches", () => {
      const props = createDefaultProps({
        filter: createMockFilter({ selectedYears: [2023] }), // Only before year
      });
      render(<ModalSplitLivingLabsCard {...props} />);

      // Labs should still be shown as they have 2023 data
      expect(screen.getByText("Geneva Lab")).toBeInTheDocument();
      expect(screen.getByText("Lyon Lab")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should return null when labs array is empty", () => {
      const props = createDefaultProps({ labs: [] });
      const { container } = render(<ModalSplitLivingLabsCard {...props} />);

      expect(container.firstChild).toBeNull();
    });

    it("should return null when all labs are filtered out", () => {
      const props = createDefaultProps({
        labs: createMockLabs(),
        filter: createMockFilter({
          selectedLabIds: ["non-existent"],
          selectedYears: [2020],
        }),
      });
      const { container } = render(<ModalSplitLivingLabsCard {...props} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Chart Data", () => {
    it("should pass before and after datasets to chart", () => {
      render(<ModalSplitLivingLabsCard {...createDefaultProps()} />);

      const charts = screen.getAllByTestId("stacked-bar-chart");
      // selectedYears default is [2023, 2024], so each chart has 2 datasets
      charts.forEach((chart) => {
        expect(chart).toHaveTextContent("2 datasets");
      });
    });

    it("should pass all matching entries datasets to chart", () => {
      const props = createDefaultProps({
        filter: createMockFilter({ selectedYears: [2022, 2023, 2024] }),
      });
      render(<ModalSplitLivingLabsCard {...props} />);

      const charts = screen.getAllByTestId("stacked-bar-chart");
      charts.forEach((chart) => {
        expect(chart).toHaveTextContent("3 datasets");
      });
    });
  });
});
