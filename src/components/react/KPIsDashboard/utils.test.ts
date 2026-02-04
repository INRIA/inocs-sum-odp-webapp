import { describe, it, expect } from "vitest";
import {
  processKpiResults,
  buildLabTimelines,
  buildKpiDataMap,
  groupKpisByParentChild,
} from "./utils";
import type { ILivingLabKpiData, KpiLivingLabsCardsFilter } from "./types";
import type { IKpi } from "../../../types";
import { COLOR_GRAY } from "../../../types/Constants";

describe("KPIsDashboard Utils", () => {
  describe("processKpiResults", () => {
    it("returns empty array when no results provided", () => {
      const result = processKpiResults({}, [2023, 2024]);

      expect(result).toEqual([]);
    });

    it("returns empty array when results are null", () => {
      const result = processKpiResults(
        { result_before: null, result_after: null },
        [2023, 2024],
      );

      expect(result).toEqual([]);
    });

    it("processes before result when year is selected", () => {
      const kpiResult = {
        result_before: {
          id: "1",
          kpidefinition_id: "kpi-1",
          living_lab_id: "lab-1",
          value: 100,
          date: "2023-06-15",
        },
      };

      const result = processKpiResults(kpiResult, [2023, 2024]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        year: 2023,
        value: 100,
        date: "2023-06-15",
      });
    });

    it("processes after result when year is selected", () => {
      const kpiResult = {
        result_after: {
          id: "2",
          kpidefinition_id: "kpi-1",
          living_lab_id: "lab-1",
          value: 120,
          date: "2024-06-15",
        },
      };

      const result = processKpiResults(kpiResult, [2023, 2024]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        year: 2024,
        value: 120,
        date: "2024-06-15",
      });
    });

    it("processes both before and after results", () => {
      const kpiResult = {
        result_before: {
          id: "1",
          kpidefinition_id: "kpi-1",
          living_lab_id: "lab-1",
          value: 100,
          date: "2023-06-15",
        },
        result_after: {
          id: "2",
          kpidefinition_id: "kpi-1",
          living_lab_id: "lab-1",
          value: 120,
          date: "2024-06-15",
        },
      };

      const result = processKpiResults(kpiResult, [2023, 2024]);

      expect(result).toHaveLength(2);
      expect(result[0].year).toBe(2023);
      expect(result[1].year).toBe(2024);
    });

    it("filters out results from unselected years", () => {
      const kpiResult = {
        result_before: {
          id: "1",
          kpidefinition_id: "kpi-1",
          living_lab_id: "lab-1",
          value: 100,
          date: "2023-06-15",
        },
        result_after: {
          id: "2",
          kpidefinition_id: "kpi-1",
          living_lab_id: "lab-1",
          value: 120,
          date: "2024-06-15",
        },
      };

      const result = processKpiResults(kpiResult, [2024]); // Only 2024 selected

      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(2024);
    });

    it("handles results with undefined values", () => {
      const kpiResult = {
        result_before: {
          id: "1",
          kpidefinition_id: "kpi-1",
          living_lab_id: "lab-1",
          value: undefined as any,
          date: "2023-06-15",
        },
      };

      const result = processKpiResults(kpiResult, [2023]);

      expect(result).toEqual([]);
    });
  });

  describe("buildLabTimelines", () => {
    const mockKpi: IKpi = {
      id: "kpi-1",
      kpi_number: "KPI-001",
      name: "Test KPI",
      type: "SIEF" as never,
      progression_target: 10,
      metric: "percentage" as never,
    };

    const mockLivingLabs: ILivingLabKpiData[] = [
      {
        id: "lab-1",
        name: "Geneva Lab",
        kpiResults: [
          {
            living_lab_id: "lab-1",
            kpidefinition_id: "kpi-1",
            result_before: {
              id: "1",
              kpidefinition_id: "kpi-1",
              living_lab_id: "lab-1",
              value: 100,
              date: "2023-06-15",
            },
            result_after: null,
          },
        ],
      },
      {
        id: "lab-2",
        name: "Lyon Lab",
        kpiResults: [
          {
            living_lab_id: "lab-2",
            kpidefinition_id: "kpi-1",
            result_before: {
              id: "2",
              kpidefinition_id: "kpi-1",
              living_lab_id: "lab-2",
              value: 80,
              date: "2023-06-15",
            },
            result_after: null,
          },
        ],
      },
    ];

    const mockFilter: KpiLivingLabsCardsFilter = {
      selectedLabIds: ["lab-1", "lab-2"],
      selectedYears: [2023],
      selectedCategoryIds: [1],
    };

    const mockColorMap = new Map([
      ["lab-1", "#004494"],
      ["lab-2", "#98c33a"],
    ]);

    it("builds timelines for all selected labs with data", () => {
      const result = buildLabTimelines(
        mockKpi,
        mockLivingLabs,
        mockFilter,
        mockColorMap,
        COLOR_GRAY,
      );

      expect(result).toHaveLength(2);
      expect(result[0].labId).toBe("lab-1");
      expect(result[0].labName).toBe("Geneva Lab");
      expect(result[0].color).toBe("#004494");
      expect(result[0].dataPoints).toHaveLength(1);
    });

    it("skips unselected labs", () => {
      const filterWithOneLab: KpiLivingLabsCardsFilter = {
        ...mockFilter,
        selectedLabIds: ["lab-1"],
      };

      const result = buildLabTimelines(
        mockKpi,
        mockLivingLabs,
        filterWithOneLab,
        mockColorMap,
        COLOR_GRAY,
      );

      expect(result).toHaveLength(1);
      expect(result[0].labId).toBe("lab-1");
    });

    it("skips labs without KPI results", () => {
      const labsWithNoResults: ILivingLabKpiData[] = [
        {
          id: "lab-3",
          name: "Barcelona Lab",
          kpiResults: [],
        },
      ];

      const result = buildLabTimelines(
        mockKpi,
        labsWithNoResults,
        { ...mockFilter, selectedLabIds: ["lab-3"] },
        mockColorMap,
        COLOR_GRAY,
      );

      expect(result).toEqual([]);
    });

    it("uses fallback color when lab color not in map", () => {
      const result = buildLabTimelines(
        mockKpi,
        [mockLivingLabs[0]],
        { ...mockFilter, selectedLabIds: ["lab-1"] },
        new Map(), // Empty color map
        COLOR_GRAY,
      );

      expect(result[0].color).toBe(COLOR_GRAY);
    });

    it("skips labs with no data points after filtering", () => {
      const filterNoYears: KpiLivingLabsCardsFilter = {
        ...mockFilter,
        selectedYears: [2025], // Year with no data
      };

      const result = buildLabTimelines(
        mockKpi,
        mockLivingLabs,
        filterNoYears,
        mockColorMap,
        COLOR_GRAY,
      );

      expect(result).toEqual([]);
    });
  });

  describe("buildKpiDataMap", () => {
    const mockKpis: IKpi[] = [
      {
        id: "kpi-1",
        kpi_number: "KPI-001",
        name: "Air Quality",
        type: "SIEF" as never,
        progression_target: 10,
        metric: "percentage" as never,
      },
      {
        id: "kpi-2",
        kpi_number: "KPI-002",
        name: "Traffic",
        type: "SIEF" as never,
        progression_target: 20,
        metric: "percentage" as never,
      },
    ];

    const mockLivingLabs: ILivingLabKpiData[] = [
      {
        id: "lab-1",
        name: "Geneva Lab",
        kpiResults: [
          {
            living_lab_id: "lab-1",
            kpidefinition_id: "kpi-1",
            result_before: {
              id: "1",
              kpidefinition_id: "kpi-1",
              living_lab_id: "lab-1",
              value: 100,
              date: "2023-06-15",
            },
            result_after: null,
          },
        ],
      },
    ];

    const mockFilter: KpiLivingLabsCardsFilter = {
      selectedLabIds: ["lab-1"],
      selectedYears: [2023],
      selectedCategoryIds: [1],
    };

    const mockColorMap = new Map([["lab-1", "#004494"]]);

    it("builds map for KPIs with data", () => {
      const result = buildKpiDataMap(
        [mockKpis[0]],
        mockLivingLabs,
        mockFilter,
        mockColorMap,
        COLOR_GRAY,
      );

      expect(result.size).toBe(1);
      expect(result.has("kpi-1")).toBe(true);
      expect(result.get("kpi-1")).toHaveLength(1);
    });

    it("excludes KPIs without data", () => {
      const result = buildKpiDataMap(
        [mockKpis[1]], // KPI-2 has no data in mockLivingLabs
        mockLivingLabs,
        mockFilter,
        mockColorMap,
        COLOR_GRAY,
      );

      expect(result.size).toBe(0);
    });

    it("processes multiple KPIs", () => {
      const labsWithMultipleKpis: ILivingLabKpiData[] = [
        {
          id: "lab-1",
          name: "Geneva Lab",
          kpiResults: [
            {
              living_lab_id: "lab-1",
              kpidefinition_id: "kpi-1",
              result_before: {
                id: "1",
                kpidefinition_id: "kpi-1",
                living_lab_id: "lab-1",
                value: 100,
                date: "2023-06-15",
              },
              result_after: null,
            },
            {
              living_lab_id: "lab-1",
              kpidefinition_id: "kpi-2",
              result_before: {
                id: "2",
                kpidefinition_id: "kpi-2",
                living_lab_id: "lab-1",
                value: 80,
                date: "2023-06-15",
              },
              result_after: null,
            },
          ],
        },
      ];

      const result = buildKpiDataMap(
        mockKpis,
        labsWithMultipleKpis,
        mockFilter,
        mockColorMap,
        COLOR_GRAY,
      );

      expect(result.size).toBe(2);
      expect(result.has("kpi-1")).toBe(true);
      expect(result.has("kpi-2")).toBe(true);
    });

    it("returns empty map when no KPIs provided", () => {
      const result = buildKpiDataMap(
        [],
        mockLivingLabs,
        mockFilter,
        mockColorMap,
        COLOR_GRAY,
      );

      expect(result.size).toBe(0);
    });
  });

  describe("groupKpisByParentChild", () => {
    const createMockKpi = (
      id: string,
      parentId?: string | null,
    ): IKpi => ({
      id,
      kpi_number: id,
      name: `KPI ${id}`,
      parent_kpi_id: parentId,
      type: "SIEF" as never,
      progression_target: 10,
      metric: "percentage" as never,
    });

    it("groups single KPIs without parent or children", () => {
      const kpis: IKpi[] = [
        createMockKpi("kpi-1"),
        createMockKpi("kpi-2"),
      ];

      const result = groupKpisByParentChild(kpis);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "single",
        kpi: kpis[0],
      });
      expect(result[1]).toEqual({
        type: "single",
        kpi: kpis[1],
      });
    });

    it("groups parent KPI with its children", () => {
      const kpis: IKpi[] = [
        createMockKpi("parent-1"),
        createMockKpi("child-1", "parent-1"),
        createMockKpi("child-2", "parent-1"),
      ];

      const result = groupKpisByParentChild(kpis);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("parent");
      if (result[0].type === "parent") {
        expect(result[0].parentKpi.id).toBe("parent-1");
        expect(result[0].childKpis).toHaveLength(2);
        expect(result[0].childKpis[0].id).toBe("child-1");
        expect(result[0].childKpis[1].id).toBe("child-2");
      }
    });

    it("handles mixed single and parent-child KPIs", () => {
      const kpis: IKpi[] = [
        createMockKpi("single-1"),
        createMockKpi("parent-1"),
        createMockKpi("child-1", "parent-1"),
        createMockKpi("single-2"),
        createMockKpi("child-2", "parent-1"),
      ];

      const result = groupKpisByParentChild(kpis);

      expect(result).toHaveLength(3);
      
      // First should be single-1
      expect(result[0].type).toBe("single");
      if (result[0].type === "single") {
        expect(result[0].kpi.id).toBe("single-1");
      }

      // Second should be parent-1 with children
      expect(result[1].type).toBe("parent");
      if (result[1].type === "parent") {
        expect(result[1].parentKpi.id).toBe("parent-1");
        expect(result[1].childKpis).toHaveLength(2);
      }

      // Third should be single-2
      expect(result[2].type).toBe("single");
      if (result[2].type === "single") {
        expect(result[2].kpi.id).toBe("single-2");
      }
    });

    it("handles multiple parent KPIs each with children", () => {
      const kpis: IKpi[] = [
        createMockKpi("parent-1"),
        createMockKpi("child-1a", "parent-1"),
        createMockKpi("parent-2"),
        createMockKpi("child-2a", "parent-2"),
        createMockKpi("child-2b", "parent-2"),
      ];

      const result = groupKpisByParentChild(kpis);

      expect(result).toHaveLength(2);
      
      const parent1Group = result.find(
        (g) => g.type === "parent" && g.parentKpi.id === "parent-1",
      );
      expect(parent1Group).toBeDefined();
      if (parent1Group?.type === "parent") {
        expect(parent1Group.childKpis).toHaveLength(1);
      }

      const parent2Group = result.find(
        (g) => g.type === "parent" && g.parentKpi.id === "parent-2",
      );
      expect(parent2Group).toBeDefined();
      if (parent2Group?.type === "parent") {
        expect(parent2Group.childKpis).toHaveLength(2);
      }
    });

    it("returns empty array for empty input", () => {
      const result = groupKpisByParentChild([]);
      expect(result).toEqual([]);
    });

    it("handles parent with many children", () => {
      const kpis: IKpi[] = [
        createMockKpi("parent-1"),
        createMockKpi("child-1", "parent-1"),
        createMockKpi("child-2", "parent-1"),
        createMockKpi("child-3", "parent-1"),
        createMockKpi("child-4", "parent-1"),
      ];

      const result = groupKpisByParentChild(kpis);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("parent");
      if (result[0].type === "parent") {
        expect(result[0].childKpis).toHaveLength(4);
      }
    });

    it("preserves order of KPIs in groups", () => {
      const kpis: IKpi[] = [
        createMockKpi("kpi-3"),
        createMockKpi("kpi-1"),
        createMockKpi("kpi-2"),
      ];

      const result = groupKpisByParentChild(kpis);

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe("single");
      if (result[0].type === "single") {
        expect(result[0].kpi.id).toBe("kpi-3");
      }
      expect(result[1].type).toBe("single");
      if (result[1].type === "single") {
        expect(result[1].kpi.id).toBe("kpi-1");
      }
      expect(result[2].type).toBe("single");
      if (result[2].type === "single") {
        expect(result[2].kpi.id).toBe("kpi-2");
      }
    });
  });
});
