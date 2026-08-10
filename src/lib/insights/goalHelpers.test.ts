import { describe, it, expect } from "vitest";
import {
  getGroupsForGoal,
  countMeasuresForGoal,
  countCitiesForGoal,
  hasQualifyingEvidence,
  computeTopFindings,
  getMeasuresForGoal,
} from "./goalHelpers";
import type { IJobRunImpactAnalysisSuccess } from "../../types";
import type { Goal } from "./goals";
import { GOALS } from "./goals";

const safetyGoal: Goal = {
  slug: "improve-safety",
  title: "Improve safety",
  description: "Make journeys safer.",
  kpiGroupPatterns: ["safety"],
  icon: "shield",
};

const accessibilityGoal: Goal = {
  slug: "improve-accessibility",
  title: "Improve accessibility",
  description: "Shorten travel times.",
  kpiGroupPatterns: ["accessibility", "travel time"],
  icon: "clock",
};

const mockSuccessItems: IJobRunImpactAnalysisSuccess[] = [
  {
    group_id: 1,
    group_name: "Improve Safety",
    results: {
      id: 1,
      name: "Improve Safety",
      kpi_ids: [],
      kpis: [],
      msqe: 0,
      variation_under_no_measures: 0,
      measure_coefficients: [
        { id: 10, name: "Speed limit reduction", coefficient: 0.8, kpi_group_id: 1, times_implemented: 5 },
        { id: 11, name: "Cycle lane", coefficient: 0.4, kpi_group_id: 1, times_implemented: 2 },
        { id: 12, name: "Not implemented", coefficient: 0.1, kpi_group_id: 1, times_implemented: 0 },
      ],
      living_labs_analysis: [
        {
          id: 100,
          name: "City A",
          kpis: [],
          measures: [
            { measure_id: "10", measure_name: "Speed limit reduction" },
            { measure_id: "11", measure_name: "Cycle lane" },
          ],
        },
        {
          id: 101,
          name: "City B",
          kpis: [],
          measures: [
            { measure_id: "10", measure_name: "Speed limit reduction" },
          ],
        },
      ],
    },
  },
  {
    group_id: 2,
    group_name: "Improve Accessibility",
    results: {
      id: 2,
      name: "Improve Accessibility",
      kpi_ids: [],
      kpis: [],
      msqe: 0,
      variation_under_no_measures: 0,
      measure_coefficients: [
        { id: 20, name: "Bus rapid transit", coefficient: -0.3, kpi_group_id: 2, times_implemented: 3 },
      ],
      living_labs_analysis: [
        {
          id: 102,
          name: "City C",
          kpis: [],
          measures: [{ measure_id: "20", measure_name: "Bus rapid transit" }],
        },
      ],
    },
  },
];

const mockLabs = [
  { id: 100, name: "City A" },
  { id: 101, name: "City B" },
  { id: 102, name: "City C" },
] as unknown as Parameters<typeof getMeasuresForGoal>[2];

describe("getGroupsForGoal", () => {
  it("returns groups matching the goal pattern", () => {
    const groups = getGroupsForGoal(safetyGoal, mockSuccessItems);
    expect(groups).toHaveLength(1);
    expect(groups[0].group_name).toBe("Improve Safety");
  });

  it("returns empty when no match", () => {
    const emissionsGoal: Goal = {
      slug: "cut-emissions",
      title: "Cut emissions",
      description: "",
      kpiGroupPatterns: ["emission", "co2"],
      icon: "leaf",
    };
    const groups = getGroupsForGoal(emissionsGoal, mockSuccessItems);
    expect(groups).toHaveLength(0);
  });

  it("matches case-insensitively", () => {
    const groups = getGroupsForGoal(accessibilityGoal, mockSuccessItems);
    expect(groups).toHaveLength(1);
    expect(groups[0].group_name).toBe("Improve Accessibility");
  });
});

describe("countMeasuresForGoal", () => {
  it("counts unique measures with times_implemented > 0", () => {
    const count = countMeasuresForGoal(safetyGoal, mockSuccessItems);
    expect(count).toBe(2);
  });

  it("excludes measures with times_implemented = 0", () => {
    const count = countMeasuresForGoal(safetyGoal, mockSuccessItems);
    expect(count).toBe(2);
  });

  it("returns 0 when no matching groups", () => {
    const emissionsGoal: Goal = { slug: "cut-emissions", title: "", description: "", kpiGroupPatterns: ["co2"], icon: "" };
    const count = countMeasuresForGoal(emissionsGoal, mockSuccessItems);
    expect(count).toBe(0);
  });
});

describe("countCitiesForGoal", () => {
  it("counts cities that implemented at least one qualifying measure", () => {
    const count = countCitiesForGoal(safetyGoal, mockSuccessItems);
    expect(count).toBe(2);
  });

  it("returns 0 when no matching groups", () => {
    const emissionsGoal: Goal = { slug: "cut-emissions", title: "", description: "", kpiGroupPatterns: ["co2"], icon: "" };
    const count = countCitiesForGoal(emissionsGoal, mockSuccessItems);
    expect(count).toBe(0);
  });
});

describe("hasQualifyingEvidence", () => {
  it("returns true when a group has a measure with times_implemented > 0", () => {
    expect(hasQualifyingEvidence(safetyGoal, mockSuccessItems)).toBe(true);
  });

  it("returns false when no groups match", () => {
    const emissionsGoal: Goal = { slug: "cut-emissions", title: "", description: "", kpiGroupPatterns: ["co2"], icon: "" };
    expect(hasQualifyingEvidence(emissionsGoal, mockSuccessItems)).toBe(false);
  });

  it("returns false when all times_implemented are 0", () => {
    const items: IJobRunImpactAnalysisSuccess[] = [
      {
        group_id: 99,
        group_name: "Some co2 group",
        results: {
          id: 99, name: "Some co2 group", kpi_ids: [], kpis: [], msqe: 0, variation_under_no_measures: 0,
          measure_coefficients: [{ id: 1, name: "test", coefficient: 0.1, kpi_group_id: 99, times_implemented: 0 }],
          living_labs_analysis: [],
        },
      },
    ];
    const emissionsGoal: Goal = { slug: "cut-emissions", title: "", description: "", kpiGroupPatterns: ["co2"], icon: "" };
    expect(hasQualifyingEvidence(emissionsGoal, items)).toBe(false);
  });
});

describe("computeTopFindings", () => {
  it("returns up to count findings", () => {
    const findings = computeTopFindings(mockSuccessItems, GOALS, 2);
    expect(findings.length).toBeLessThanOrEqual(2);
  });

  it("returns findings sorted by times_implemented descending", () => {
    const findings = computeTopFindings(mockSuccessItems, GOALS, 10);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].measureName).toBe("Speed limit reduction");
  });

  it("includes direction based on coefficient sign", () => {
    const findings = computeTopFindings(mockSuccessItems, GOALS, 10);
    const safetyFinding = findings.find((f) => f.measureName === "Speed limit reduction");
    expect(safetyFinding?.direction).toBe("improvement");
    const accessFinding = findings.find((f) => f.measureName === "Bus rapid transit");
    expect(accessFinding?.direction).toBe("decline");
  });

  it("assigns correct evidenceLabel", () => {
    const findings = computeTopFindings(mockSuccessItems, GOALS, 10);
    const strongFinding = findings.find((f) => f.measureName === "Speed limit reduction");
    expect(strongFinding?.evidenceLabel).toBe("Strong evidence");
    const moderateFinding = findings.find((f) => f.measureName === "Cycle lane");
    expect(moderateFinding?.evidenceLabel).toBe("Moderate evidence");
  });

  it("returns empty array when no items match any goal", () => {
    const findings = computeTopFindings([], GOALS, 3);
    expect(findings).toHaveLength(0);
  });
});

describe("getMeasuresForGoal", () => {
  it("returns ranked measures for a goal", () => {
    const measures = getMeasuresForGoal(safetyGoal, mockSuccessItems, mockLabs);
    expect(measures.length).toBe(2);
    expect(measures[0].plainName).toBe("Speed limit reduction");
    expect(measures[0].evidenceScore).toBe(5);
    expect(measures[0].evidenceLabel).toBe("Strong evidence");
  });

  it("sorts by evidenceScore descending", () => {
    const measures = getMeasuresForGoal(safetyGoal, mockSuccessItems, mockLabs);
    expect(measures[0].evidenceScore).toBeGreaterThanOrEqual(measures[1].evidenceScore);
  });

  it("includes contributing cities", () => {
    const measures = getMeasuresForGoal(safetyGoal, mockSuccessItems, mockLabs);
    const speedLimit = measures.find((m) => m.plainName === "Speed limit reduction");
    expect(speedLimit?.contributingCities).toHaveLength(2);
    const names = speedLimit?.contributingCities.map((c) => c.name);
    expect(names).toContain("City A");
    expect(names).toContain("City B");
  });

  it("returns empty array when no groups match", () => {
    const emissionsGoal: Goal = { slug: "cut-emissions", title: "", description: "", kpiGroupPatterns: ["co2"], icon: "" };
    const measures = getMeasuresForGoal(emissionsGoal, mockSuccessItems, mockLabs);
    expect(measures).toHaveLength(0);
  });

  it("sets outcomeDescription based on coefficient sign", () => {
    const measures = getMeasuresForGoal(accessibilityGoal, mockSuccessItems, mockLabs);
    expect(measures[0].outcomeDescription).toContain("decline");
  });
});
