import { describe, expect, it } from "vitest";
import {
  getMainKpis,
  buildKpiParentMap,
  computeMetricCards,
  computeLabMetricsTable,
  computeLabKpiTimeline,
  computeLabMeasuresBar,
  computeKpiCoverageTable,
  computeAlerts,
  computePerLabMetricCards,
  computePerLabAlerts,
} from "./analytics";
import type {
  IKpi,
  ILivingLabPopulated,
  IProject,
  User,
  IKpiResultGroup,
  IKpiResult,
} from "../../types";

// Test fixtures
const createKpi = (
  id: number,
  kpi_number: string,
  name: string,
  type: "GLOBAL" | "LOCAL" = "GLOBAL",
  parent_kpi_id: number | null = null,
): IKpi => ({
  id,
  kpi_number,
  name,
  type: type as any,
  parent_kpi_id,
  progression_target: 0,
  metric: "absolute" as any,
});

const createResult = (
  id: number,
  kpidefinition_id: number,
  living_lab_id: number,
  date: string,
  value: number = 100,
): IKpiResult => ({
  id,
  kpidefinition_id,
  living_lab_id,
  date,
  value,
});

const createLab = (
  id: number,
  name: string,
  kpiResults: IKpiResultGroup[] = [],
  implementations: any[] = [],
): ILivingLabPopulated => ({
  id,
  name,
  kpi_results: kpiResults,
  living_lab_projects_implementation: implementations,
});

const createUser = (
  id: string,
  email: string,
  name: string,
  status: "signup" | "active" | "disabled" = "active",
): User =>
  ({
    id,
    email,
    name,
    status,
    role_id: 1,
    created_at: new Date(),
  }) as User;

const createImplementation = (
  id: number,
  projectType: "PUSH" | "PULL" | "OTHER",
  start_at?: string,
  updated_at?: string,
) => ({
  id,
  project_id: id,
  living_lab_id: 1,
  project: { id, name: `Project ${id}`, type: projectType },
  start_at,
  updated_at,
});

const createMeasure = (
  id: number,
  name: string,
  type: "PUSH" | "PULL" | "OTHER",
): IProject => ({
  id,
  name,
  type,
});

describe("getMainKpis", () => {
  it("filters out child KPIs (those with parent_kpi_id)", () => {
    const kpis = [
      createKpi(1, "1", "Parent KPI 1"),
      createKpi(2, "1.1", "Child KPI 1.1", "GLOBAL", 1),
      createKpi(3, "2", "Parent KPI 2"),
      createKpi(4, "2.1", "Child KPI 2.1", "LOCAL", 3),
    ];

    const mainKpis = getMainKpis(kpis);

    expect(mainKpis).toHaveLength(2);
    expect(mainKpis.map((k) => k.id)).toEqual([1, 3]);
  });

  it("returns empty array for empty input", () => {
    expect(getMainKpis([])).toHaveLength(0);
  });

  it("returns all KPIs when none have parents", () => {
    const kpis = [createKpi(1, "1", "KPI 1"), createKpi(2, "2", "KPI 2")];

    expect(getMainKpis(kpis)).toHaveLength(2);
  });
});

describe("buildKpiParentMap", () => {
  it("maps child KPIs to their parents and parents to themselves", () => {
    const kpis = [
      createKpi(1, "1", "Parent KPI 1"),
      createKpi(2, "1.1", "Child KPI 1.1", "GLOBAL", 1),
      createKpi(3, "2", "Parent KPI 2"),
    ];

    const parentMap = buildKpiParentMap(kpis);

    expect(parentMap.get(1)).toBe(1); // parent maps to itself
    expect(parentMap.get(2)).toBe(1); // child maps to parent
    expect(parentMap.get(3)).toBe(3); // parent maps to itself
  });
});

describe("computeMetricCards - User Story 1", () => {
  it("computes expanded metric cards correctly", () => {
    const labs = [
      createLab(1, "Lab 1", [
        {
          living_lab_id: 1,
          kpidefinition_id: 1,
          results: [
            createResult(1, 1, 1, "2024-01-01"),
            createResult(2, 1, 1, "2024-02-01"),
          ],
        },
      ]),
      createLab(
        2,
        "Lab 2",
        [],
        [createImplementation(1, "PUSH"), createImplementation(2, "PULL")],
      ),
    ];
    const kpis = [
      createKpi(1, "1", "KPI 1"),
      createKpi(2, "2", "KPI 2"),
      createKpi(3, "2.1", "KPI 2.1", "GLOBAL", 2),
      createKpi(4, "3", "KPI 3", "LOCAL"),
    ];
    const users = [
      createUser("1", "active@test.com", "Active User", "active"),
      createUser("2", "pending@test.com", "Pending User", "signup"),
      createUser("3", "another@test.com", "Another Active", "active"),
    ];

    const measures = [
      createMeasure(1, "Measure A", "PUSH"),
      createMeasure(2, "Measure B", "PULL"),
      createMeasure(3, "Measure C", "OTHER"),
    ];

    const cards = computeMetricCards(labs, kpis, users, measures);
    const byLabel = (label: string) => cards.find((c) => c.label === label);

    expect(cards).toHaveLength(8);
    expect(byLabel("Living Labs")).toEqual({
      label: "Living Labs",
      value: "2",
      icon: "building",
      color: "text-primary",
    });
    expect(byLabel("Users (active / pending)")).toEqual({
      label: "Users (active / pending)",
      value: "2 / 1",
      icon: "users",
      color: "text-primary",
    });
    expect(byLabel("Total measures identified")).toEqual({
      label: "Total measures identified",
      value: "3",
      icon: "check",
      color: "text-primary",
    });
    expect(byLabel("Total measures implemented")).toEqual({
      label: "Total measures implemented",
      value: "2",
      icon: "check",
      color: "text-success",
    });
    expect(byLabel("Total KPI results entries recorded")).toEqual({
      label: "Total KPI results entries recorded",
      value: "2",
      icon: "clipboard",
      color: "text-success",
    });
    expect(byLabel("Total KPIs coverage")).toEqual({
      label: "Total KPIs coverage",
      value: "33% (1/3)",
      icon: "chart",
      color: "text-danger",
    });
    expect(byLabel("Global KPIs coverage")).toEqual({
      label: "Global KPIs coverage",
      value: "50% (1/2)",
      icon: "chart",
      color: "text-success",
    });
    expect(byLabel("Local KPIs coverage")).toEqual({
      label: "Local KPIs coverage",
      value: "0% (0/1)",
      icon: "chart",
      color: "text-danger",
    });
  });

  it("handles empty data (zero counts)", () => {
    const kpis = [
      createKpi(1, "1", "KPI 1", "GLOBAL"),
      createKpi(2, "2", "KPI 2", "LOCAL"),
    ];

    const cards = computeMetricCards([], kpis, [], []);
    const byLabel = (label: string) => cards.find((c) => c.label === label);

    expect(cards).toHaveLength(8);
    expect(byLabel("Living Labs")?.value).toBe("0");
    expect(byLabel("Users (active / pending)")?.value).toBe("0 / 0");
    expect(byLabel("Total measures identified")?.value).toBe("0");
    expect(byLabel("Total measures implemented")?.value).toBe("0");
    expect(byLabel("Total KPI results entries recorded")?.value).toBe("0");
    expect(byLabel("Total KPIs coverage")?.value).toBe("0% (0/2)");
    expect(byLabel("Global KPIs coverage")?.value).toBe("0% (0/1)");
    expect(byLabel("Local KPIs coverage")?.value).toBe("0% (0/1)");
  });

  it("counts active vs pending users correctly", () => {
    const users = [
      createUser("1", "a@test.com", "A", "active"),
      createUser("2", "b@test.com", "B", "active"),
      createUser("3", "c@test.com", "C", "signup"),
      createUser("4", "d@test.com", "D", "disabled"),
    ];

    const cards = computeMetricCards([], [], users, []);

    // Should be "2 / 1" (2 active, 1 pending/signup, disabled not counted as pending)
    expect(cards.find((c) => c.label === "Users (active / pending)")?.value).toBe(
      "2 / 1",
    );
  });
});

describe("computeLabMetricsTable - User Story 2", () => {
  it("computes per-lab metrics correctly", () => {
    const kpis = [
      createKpi(1, "1", "KPI 1"),
      createKpi(2, "1.1", "KPI 1.1", "GLOBAL", 1),
      createKpi(3, "2", "KPI 2"),
    ];
    const labs = [
      createLab(
        1,
        "Lab 1",
        [
          {
            living_lab_id: 1,
            kpidefinition_id: 1,
            results: [
              createResult(1, 1, 1, "2024-01-01"),
              createResult(2, 2, 1, "2024-02-01"), // Child KPI, should resolve to parent 1
            ],
          },
        ],
        [createImplementation(1, "PUSH"), createImplementation(2, "PULL")],
      ),
    ];

    const rows = computeLabMetricsTable(labs, kpis);

    expect(rows).toHaveLength(1);
    expect(rows[0].labId).toBe(1);
    expect(rows[0].labName).toBe("Lab 1");
    expect(rows[0].totalResultEntries).toBe(2);
    expect(rows[0].kpisCoveredCount).toBe(1); // Both results map to parent KPI 1
    expect(rows[0].totalMainKpis).toBe(2);
    expect(rows[0].pushMeasuresCount).toBe(1);
    expect(rows[0].pullMeasuresCount).toBe(1);
  });

  it("handles labs with zero KPI results", () => {
    const kpis = [createKpi(1, "1", "KPI 1")];
    const labs = [createLab(1, "Empty Lab")];

    const rows = computeLabMetricsTable(labs, kpis);

    expect(rows).toHaveLength(1);
    expect(rows[0].totalResultEntries).toBe(0);
    expect(rows[0].kpisCoveredCount).toBe(0);
  });

  it("computes lastUpdatedAt as max of all dates", () => {
    const kpis = [createKpi(1, "1", "KPI 1")];
    const labs = [
      createLab(
        1,
        "Lab 1",
        [
          {
            living_lab_id: 1,
            kpidefinition_id: 1,
            results: [createResult(1, 1, 1, "2023-06-15")],
          },
        ],
        [createImplementation(1, "PUSH", "2024-01-01", "2024-03-15")],
      ),
    ];

    const rows = computeLabMetricsTable(labs, kpis);

    // Should be the max date: 2024-03-15
    expect(rows[0].lastUpdatedAt).not.toBeNull();
    expect(new Date(rows[0].lastUpdatedAt!).getFullYear()).toBe(2024);
  });
});

describe("computeLabKpiTimeline - User Story 2", () => {
  it("groups KPI results by year per lab", () => {
    const labs = [
      createLab(1, "Lab 1", [
        {
          living_lab_id: 1,
          kpidefinition_id: 1,
          results: [
            createResult(1, 1, 1, "2023-01-01"),
            createResult(2, 1, 1, "2023-06-01"),
            createResult(3, 1, 1, "2024-01-01"),
          ],
        },
      ]),
    ];

    const series = computeLabKpiTimeline(labs);

    expect(series).toHaveLength(1);
    expect(series[0].labName).toBe("Lab 1");
    expect(series[0].dataPoints).toHaveLength(2);
    expect(series[0].dataPoints[0]).toEqual({ year: 2023, count: 2 });
    expect(series[0].dataPoints[1]).toEqual({ year: 2024, count: 1 });
  });

  it("returns empty dataPoints for labs with no results", () => {
    const labs = [createLab(1, "Empty Lab")];

    const series = computeLabKpiTimeline(labs);

    expect(series).toHaveLength(1);
    expect(series[0].dataPoints).toHaveLength(0);
  });

  it("assigns different colors to different labs", () => {
    const labs = [
      createLab(1, "Lab 1"),
      createLab(2, "Lab 2"),
      createLab(3, "Lab 3"),
    ];

    const series = computeLabKpiTimeline(labs);

    const colors = series.map((s) => s.color);
    expect(new Set(colors).size).toBe(3); // All different
  });
});

describe("computeLabMeasuresBar - User Story 3", () => {
  it("counts PUSH and PULL measures per lab", () => {
    const labs = [
      createLab(
        1,
        "Lab 1",
        [],
        [
          createImplementation(1, "PUSH"),
          createImplementation(2, "PUSH"),
          createImplementation(3, "PULL"),
          createImplementation(4, "OTHER"),
        ],
      ),
      createLab(2, "Lab 2", [], [createImplementation(5, "PULL")]),
    ];

    const data = computeLabMeasuresBar(labs);

    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      labName: "Lab 1",
      pushCount: 2,
      pullCount: 1,
    });
    expect(data[1]).toEqual({
      labName: "Lab 2",
      pushCount: 0,
      pullCount: 1,
    });
  });

  it("handles labs with zero measures", () => {
    const labs = [createLab(1, "Empty Lab")];

    const data = computeLabMeasuresBar(labs);

    expect(data).toHaveLength(1);
    expect(data[0].pushCount).toBe(0);
    expect(data[0].pullCount).toBe(0);
  });
});

describe("computeKpiCoverageTable - User Story 4", () => {
  it("computes how many labs have results for each KPI", () => {
    const kpis = [
      createKpi(1, "1", "KPI 1", "GLOBAL"),
      createKpi(2, "2", "KPI 2", "LOCAL"),
      createKpi(3, "1.1", "KPI 1.1", "GLOBAL", 1),
    ];
    const labs = [
      createLab(1, "Lab 1", [
        {
          living_lab_id: 1,
          kpidefinition_id: 1,
          results: [createResult(1, 1, 1, "2024-01-01")],
        },
      ]),
      createLab(2, "Lab 2", [
        {
          living_lab_id: 2,
          kpidefinition_id: 3, // Child KPI, should resolve to parent 1
          results: [createResult(2, 3, 2, "2024-01-01")],
        },
      ]),
    ];

    const rows = computeKpiCoverageTable(labs, kpis);

    expect(rows).toHaveLength(2); // Only main KPIs
    const kpi1Row = rows.find((r) => r.kpiId === 1)!;
    const kpi2Row = rows.find((r) => r.kpiId === 2)!;

    expect(kpi1Row.labsWithResultsCount).toBe(2); // Both labs have results for KPI 1
    expect(kpi2Row.labsWithResultsCount).toBe(0); // No results for KPI 2
    expect(kpi1Row.totalLabs).toBe(2);
    expect(kpi1Row.kpiType).toBe("GLOBAL");
    expect(kpi2Row.kpiType).toBe("LOCAL");
  });

  it("only includes parent KPIs in the table", () => {
    const kpis = [
      createKpi(1, "1", "Parent"),
      createKpi(2, "1.1", "Child", "GLOBAL", 1),
      createKpi(3, "1.2", "Child 2", "GLOBAL", 1),
    ];

    const rows = computeKpiCoverageTable([], kpis);

    expect(rows).toHaveLength(1);
    expect(rows[0].kpiNumber).toBe("1");
  });

  it("includes entriesCount and yearsCovered in single-lab mode", () => {
    const lab = createLab(1, "Lab 1", [
      {
        living_lab_id: 1,
        kpidefinition_id: 1,
        transport_mode_id: null,
        result_before: null,
        result_after: null,
        results: [
          createResult(1, 1, 1, "2022-01-01"),
          createResult(2, 1, 1, "2023-06-01"),
        ],
      },
    ]);
    const kpis = [
      createKpi(1, "1", "KPI 1"),
      createKpi(2, "2", "KPI 2"),
    ];

    const rows = computeKpiCoverageTable([lab], kpis);

    const kpi1Row = rows.find((r) => r.kpiId === 1);
    expect(kpi1Row?.entriesCount).toBe(2);
    expect(kpi1Row?.yearsCovered).toEqual([2022, 2023]);

    const kpi2Row = rows.find((r) => r.kpiId === 2);
    expect(kpi2Row?.entriesCount).toBe(0);
    expect(kpi2Row?.yearsCovered).toEqual([]);
  });

  it("does not include entriesCount in multi-lab mode", () => {
    const labs = [
      createLab(1, "Lab 1"),
      createLab(2, "Lab 2"),
    ];
    const kpis = [createKpi(1, "1", "KPI 1")];

    const rows = computeKpiCoverageTable(labs, kpis);
    expect(rows[0].entriesCount).toBeUndefined();
    expect(rows[0].yearsCovered).toBeUndefined();
  });
});

describe("computeAlerts - Phase 7", () => {
  it("generates alert for labs with no KPI results", () => {
    const labs = [
      createLab(1, "Lab 1"),
      createLab(2, "Lab 2", [
        {
          living_lab_id: 2,
          kpidefinition_id: 1,
          results: [createResult(1, 1, 2, "2024-01-01")],
        },
      ]),
    ];
    const kpis = [createKpi(1, "1", "KPI 1")];

    const alerts = computeAlerts(labs, kpis, []);

    const labsNoKpisAlert = alerts.find(
      (a) => a.label === "Labs with no KPI results",
    );
    expect(labsNoKpisAlert).toBeDefined();
    expect(labsNoKpisAlert!.value).toBe(1);
    expect(labsNoKpisAlert!.items).toContain("Lab 1");
    expect(labsNoKpisAlert!.severity).toBe("warning");
  });

  it("generates alert for labs with no measures", () => {
    const labs = [
      createLab(1, "Lab 1"),
      createLab(2, "Lab 2", [], [createImplementation(1, "PUSH")]),
    ];

    const alerts = computeAlerts(labs, [], []);

    const labsNoMeasuresAlert = alerts.find(
      (a) => a.label === "Labs with no measures",
    );
    expect(labsNoMeasuresAlert).toBeDefined();
    expect(labsNoMeasuresAlert!.value).toBe(1);
    expect(labsNoMeasuresAlert!.items).toContain("Lab 1");
  });

  it("generates alert for KPIs with no results", () => {
    const kpis = [createKpi(1, "1", "KPI 1"), createKpi(2, "2", "KPI 2")];
    const labs = [
      createLab(1, "Lab 1", [
        {
          living_lab_id: 1,
          kpidefinition_id: 1,
          results: [createResult(1, 1, 1, "2024-01-01")],
        },
      ]),
    ];

    const alerts = computeAlerts(labs, kpis, []);

    const kpisNoResultsAlert = alerts.find(
      (a) => a.label === "KPIs with no results",
    );
    expect(kpisNoResultsAlert).toBeDefined();
    expect(kpisNoResultsAlert!.value).toBe(1);
    expect(kpisNoResultsAlert!.items?.[0]).toContain("KPI 2");
    expect(kpisNoResultsAlert!.severity).toBe("info");
  });

  it("generates alert for pending users", () => {
    const users = [
      createUser("1", "active@test.com", "Active", "active"),
      createUser("2", "pending@test.com", "Pending", "signup"),
    ];

    const alerts = computeAlerts([], [], users);

    const pendingAlert = alerts.find((a) => a.label === "Pending user signups");
    expect(pendingAlert).toBeDefined();
    expect(pendingAlert!.value).toBe(1);
    expect(pendingAlert!.items).toContain("pending@test.com");
  });

  it("returns empty array when no alerts apply", () => {
    const kpis = [createKpi(1, "1", "KPI 1")];
    const labs = [
      createLab(
        1,
        "Lab 1",
        [
          {
            living_lab_id: 1,
            kpidefinition_id: 1,
            results: [createResult(1, 1, 1, "2024-01-01")],
          },
        ],
        [createImplementation(1, "PUSH")],
      ),
    ];
    const users = [createUser("1", "active@test.com", "Active", "active")];

    const alerts = computeAlerts(labs, kpis, users);

    expect(alerts).toHaveLength(0);
  });

  it("handles empty platform (no living labs)", () => {
    const alerts = computeAlerts([], [], []);

    // No alerts about labs with no data when there are no labs
    expect(alerts).toHaveLength(0);
  });

  it("handles data retrieval partial success scenarios", () => {
    // Even with partial data (e.g., labs exist but no results), alerts should generate correctly
    const labs = [createLab(1, "Lab 1"), createLab(2, "Lab 2")];
    const kpis: IKpi[] = [];
    const users: User[] = [];

    const alerts = computeAlerts(labs, kpis, users);

    const labsNoKpisAlert = alerts.find(
      (a) => a.label === "Labs with no KPI results",
    );
    const labsNoMeasuresAlert = alerts.find(
      (a) => a.label === "Labs with no measures",
    );

    expect(labsNoKpisAlert).toBeDefined();
    expect(labsNoKpisAlert!.value).toBe(2);
    expect(labsNoMeasuresAlert).toBeDefined();
    expect(labsNoMeasuresAlert!.value).toBe(2);
  });
});

describe("computePerLabMetricCards", () => {
  const kpis = [
    createKpi(1, "1", "Global KPI 1", "GLOBAL"),
    createKpi(2, "2", "Global KPI 2", "GLOBAL"),
    createKpi(3, "3", "Local KPI 1", "LOCAL"),
    createKpi(4, "3.1", "Local KPI 1 child", "LOCAL", 3),
  ];

  it("computes coverage and entries for a lab with full data", () => {
    const lab = createLab(
      1,
      "Lab 1",
      [
        {
          living_lab_id: 1,
          kpidefinition_id: 1,
          transport_mode_id: null,
          result_before: null,
          result_after: null,
          results: [createResult(1, 1, 1, "2023-01-01")],
        },
        {
          living_lab_id: 1,
          kpidefinition_id: 3,
          transport_mode_id: null,
          result_before: null,
          result_after: null,
          results: [createResult(2, 3, 1, "2023-06-01")],
        },
      ],
      [
        createImplementation(1, "PUSH"),
        createImplementation(2, "PULL"),
      ],
    );

    const cards = computePerLabMetricCards(lab, kpis);

    const entriesCard = cards.find((c) => c.label === "KPI result entries recorded");
    expect(entriesCard?.value).toBe("2");

    const overallCard = cards.find((c) => c.label === "Overall KPI coverage");
    // 2 of 3 parent KPIs covered (KPI 1, KPI 3; not KPI 2)
    expect(overallCard?.value).toContain("2/3");

    const measuresCard = cards.find((c) => c.label === "Measures implemented (PUSH / PULL)");
    expect(measuresCard?.value).toBe("1 / 1");
  });

  it("returns zero-value cards for a lab with no data", () => {
    const lab = createLab(1, "Empty Lab");
    const cards = computePerLabMetricCards(lab, kpis);

    const entriesCard = cards.find((c) => c.label === "KPI result entries recorded");
    expect(entriesCard?.value).toBe("0");

    const overallCard = cards.find((c) => c.label === "Overall KPI coverage");
    expect(overallCard?.value).toContain("0/3");
    expect(overallCard?.color).toBe("text-danger");

    const measuresCard = cards.find((c) => c.label === "Measures implemented (PUSH / PULL)");
    expect(measuresCard?.value).toBe("0 / 0");
    expect(measuresCard?.color).toBe("text-danger");
  });

  it("handles empty kpis list", () => {
    const lab = createLab(1, "Lab 1");
    const cards = computePerLabMetricCards(lab, []);
    // With 0 KPIs, coverage cards show 0/0 and color is text-success (not danger since no deficit)
    const overallCard = cards.find((c) => c.label === "Overall KPI coverage");
    expect(overallCard?.value).toContain("0/0");
  });

  it("returns exactly 5 cards", () => {
    const lab = createLab(1, "Lab 1");
    const cards = computePerLabMetricCards(lab, kpis);
    expect(cards).toHaveLength(5);
  });
});

describe("computePerLabAlerts", () => {
  const kpis = [
    createKpi(1, "1", "Global KPI 1", "GLOBAL"),
    createKpi(2, "2", "Global KPI 2", "GLOBAL"),
    createKpi(3, "3", "Local KPI 1", "LOCAL"),
  ];

  it("reports missing KPIs and no measures for an empty lab", () => {
    const lab = createLab(1, "Empty Lab");
    const alerts = computePerLabAlerts(lab, kpis);

    const missingKpisAlert = alerts.find((a) => a.label === "KPIs with no results");
    expect(missingKpisAlert).toBeDefined();
    expect(missingKpisAlert!.value).toBe(3);
    expect(missingKpisAlert!.items).toHaveLength(3);

    const noMeasuresAlert = alerts.find((a) => a.label === "No measures recorded");
    expect(noMeasuresAlert).toBeDefined();
    expect(noMeasuresAlert!.severity).toBe("warning");
  });

  it("reports only missing KPIs when measures exist", () => {
    const lab = createLab(1, "Lab 1", [], [createImplementation(1, "PUSH")]);
    const alerts = computePerLabAlerts(lab, kpis);

    const noMeasuresAlert = alerts.find((a) => a.label === "No measures recorded");
    expect(noMeasuresAlert).toBeUndefined();

    const missingKpisAlert = alerts.find((a) => a.label === "KPIs with no results");
    expect(missingKpisAlert).toBeDefined();
  });

  it("produces no alerts for a lab with full KPI coverage and measures", () => {
    const lab = createLab(
      1,
      "Full Lab",
      [
        {
          living_lab_id: 1,
          kpidefinition_id: 1,
          transport_mode_id: null,
          result_before: null,
          result_after: null,
          results: [createResult(1, 1, 1, "2023-01-01")],
        },
        {
          living_lab_id: 1,
          kpidefinition_id: 2,
          transport_mode_id: null,
          result_before: null,
          result_after: null,
          results: [createResult(2, 2, 1, "2023-01-01")],
        },
        {
          living_lab_id: 1,
          kpidefinition_id: 3,
          transport_mode_id: null,
          result_before: null,
          result_after: null,
          results: [createResult(3, 3, 1, "2023-01-01")],
        },
      ],
      [createImplementation(1, "PUSH")],
    );

    const alerts = computePerLabAlerts(lab, kpis);
    expect(alerts).toHaveLength(0);
  });

  it("returns empty alerts for empty kpis list", () => {
    const lab = createLab(1, "Lab 1", [], [createImplementation(1, "PUSH")]);
    const alerts = computePerLabAlerts(lab, []);
    // No KPIs defined → no missing KPIs alert; measures exist → no measures alert
    expect(alerts).toHaveLength(0);
  });
});
