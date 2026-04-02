import { describe, expect, it } from "vitest";
import type { IJobRun } from "../../types";
import { buildQuantitativeMethodologySection } from "./mcda-format";

const createQuantitativeJobRun = (
  overrides: Partial<IJobRun> = {},
): IJobRun => ({
  id: "job-1",
  job_name: "mcda_analysis_quantitative_regulatory",
  status: "SUCCESS",
  created_at: new Date("2026-04-02T10:00:00.000Z"),
  started_at: new Date("2026-04-02T10:00:00.000Z"),
  completed_at: new Date("2026-04-02T10:05:00.000Z"),
  input_data: {
    kpis: [
      {
        id: "1",
        name: "KPI 1",
        value_max: 1,
        value_min: 0,
        value_type: "percentage",
        parent_kpi_id: null,
        parent_kpi_name: null,
        progression_target: 1,
      },
      {
        id: "2",
        name: "KPI 2",
        value_max: 1,
        value_min: 0,
        value_type: "percentage",
        parent_kpi_id: null,
        parent_kpi_name: null,
        progression_target: 1,
      },
      {
        id: "3",
        name: "KPI 3",
        value_max: 1,
        value_min: 0,
        value_type: "percentage",
        parent_kpi_id: null,
        parent_kpi_name: null,
        progression_target: 1,
      },
    ],
    kpi_groups: [
      {
        id: "g1",
        name: "Improve Safety",
        kpi_ids: ["1", "2"],
        kpis: [],
      },
      {
        id: "g2",
        name: "Improve Public Transport",
        kpi_ids: ["3"],
        kpis: [],
      },
    ],
    living_labs: [
      { id: "1", name: "Geneva", country: "CH" },
      { id: "2", name: "Athens", country: "GR" },
    ],
    alternatives: [
      {
        name: "Mobility hubs",
        values: {
          "Improve Safety": 0.14,
        },
      },
      {
        name: "Demand-responsive mobility",
        values: {
          "Improve Safety": 0.11,
        },
      },
    ],
  },
  output_data: {
    mcda_results: {
      ranking: ["a1", "a2"],
      alternative_labels: {
        a1: "Mobility hubs",
        a2: "Demand-responsive mobility",
      },
      gaia_quality: 0.875,
      criteria_labels: {
        c1: "Improve Safety",
        c2: "Improve Public Transport",
      },
    },
  },
  ...overrides,
});

describe("buildQuantitativeMethodologySection", () => {
  it("builds methodology metrics from structured quantitative job data", () => {
    const section = buildQuantitativeMethodologySection(
      createQuantitativeJobRun(),
    );

    expect(section.infoCards).toEqual([
      {
        title: "3",
        description: "KPI indicators included in this analysis",
        showIcon: false,
        textAlign: "center",
      },
      {
        title: "2",
        description: "KPI groups used as MCDA criteria",
        showIcon: false,
        textAlign: "center",
      },
      {
        title: "2",
        description: "Living labs contributing quantitative data",
        showIcon: false,
        textAlign: "center",
      },
      {
        title: "2",
        description: "Policy measures evaluated as alternatives",
        showIcon: false,
        textAlign: "center",
      },
    ]);
    expect(section.participantsIntro).toBe(
      "KPI groups used as criteria in this run:",
    );
    expect(section.participants).toEqual([
      "Improve Safety",
      "Improve Public Transport",
    ]);
    expect(section.details).toContain(
      "ridge regression model that estimates the positive or negative contribution of policy measures to KPI changes",
    );
    expect(section.details).toContain(
      "Top-ranked policy measure: Mobility hubs.",
    );
    expect(section.details).toContain("GAIA plane quality: 87.5%.");
    expect(section.details).toContain("Analysis completed on");
  });

  it("falls back to ranking length and criteria labels when alternatives or groups are missing", () => {
    const section = buildQuantitativeMethodologySection(
      createQuantitativeJobRun({
        input_data: {
          kpis: [],
          living_labs: [],
          alternatives: [],
          kpi_groups: [],
        },
        output_data: {
          mcda_results: {
            ranking: ["a1", "a2", "a3"],
            alternative_labels: {
              a1: "Mobility hubs",
              a2: "Bike sharing",
              a3: "Mobility as a Service",
            },
            criteria_labels: {
              c1: "Improve Safety",
              c2: "Improve Accessibility",
            },
          },
        },
      }),
    );

    expect(section.infoCards[3]).toEqual({
      title: "3",
      description: "Policy measures evaluated as alternatives",
      showIcon: false,
      textAlign: "center",
    });
    expect(section.participants).toEqual([
      "Improve Safety",
      "Improve Accessibility",
    ]);
  });
});