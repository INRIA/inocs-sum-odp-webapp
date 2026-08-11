import { describe, it, expect } from "vitest";
import {
  buildCityCard,
  buildCityCards,
  computeAlignedChange,
  filterCityCards,
  formatChangePercent,
  getKpiTargetDirection,
  CITY_FILTERS,
} from "./cityCards";
import type { IKpi, IKpiResultGroup, ILivingLabPopulated } from "../../types";
import { EnumKpiMetricType, EnumKpiType } from "../../types/KPIs";

function kpi(overrides: Partial<IKpi> & Pick<IKpi, "id" | "name">): IKpi {
  return {
    kpi_number: String(overrides.id),
    type: EnumKpiType.GLOBAL,
    progression_target: 1,
    metric: EnumKpiMetricType.RATIO,
    ...overrides,
  } as IKpi;
}

function resultGroup(
  kpidefinition_id: number,
  before: number | null,
  after: number | null,
  dates: [string, string] = ["2023-01-01", "2024-01-01"],
): IKpiResultGroup {
  const mk = (value: number, date: string, id: number) => ({
    id,
    kpidefinition_id,
    living_lab_id: 1,
    value,
    date,
  });
  const result_before = before === null ? null : mk(before, dates[0], 1);
  const result_after = after === null ? null : mk(after, dates[1], 2);
  return {
    living_lab_id: 1,
    kpidefinition_id,
    result_before,
    result_after,
    results: [result_before, result_after].filter(
      (r): r is NonNullable<typeof r> => r !== null,
    ),
  };
}

function lab(
  overrides: Partial<ILivingLabPopulated> & Pick<ILivingLabPopulated, "id" | "name">,
): ILivingLabPopulated {
  return {
    country: "Portugal",
    population: 143000,
    area: 319,
    projects: [],
    kpi_results: [],
    ...overrides,
  } as ILivingLabPopulated;
}

describe("getKpiTargetDirection", () => {
  it("treats progression_target 1 as 'increase is the target'", () => {
    expect(getKpiTargetDirection(1)).toBe(1);
  });

  it("treats progression_target 0 as 'decrease is the target'", () => {
    expect(getKpiTargetDirection(0)).toBe(-1);
  });

  it("falls back to 'increase is the target' when unknown", () => {
    expect(getKpiTargetDirection(null)).toBe(1);
    expect(getKpiTargetDirection(undefined)).toBe(1);
  });
});

describe("computeAlignedChange", () => {
  it("returns a positive change when an increase-target KPI goes up", () => {
    expect(computeAlignedChange(100, 110, 1)).toBeCloseTo(0.1);
  });

  it("returns a negative change when an increase-target KPI goes down", () => {
    expect(computeAlignedChange(100, 90, 1)).toBeCloseTo(-0.1);
  });

  it("returns a positive change when a decrease-target KPI goes down", () => {
    expect(computeAlignedChange(100, 90, 0)).toBeCloseTo(0.1);
  });

  it("returns a negative change when a decrease-target KPI goes up", () => {
    expect(computeAlignedChange(100, 110, 0)).toBeCloseTo(-0.1);
  });

  it("returns null when a value is missing or the baseline is zero", () => {
    expect(computeAlignedChange(null, 10, 1)).toBeNull();
    expect(computeAlignedChange(10, null, 1)).toBeNull();
    expect(computeAlignedChange(0, 10, 1)).toBeNull();
  });

  it("uses the absolute baseline so negative baselines keep their direction", () => {
    expect(computeAlignedChange(-100, -90, 1)).toBeCloseTo(0.1);
  });
});

describe("formatChangePercent", () => {
  it("prefixes improvements with a plus sign", () => {
    expect(formatChangePercent(0.042)).toBe("+4.2%");
  });

  it("prefixes regressions with a true minus sign", () => {
    expect(formatChangePercent(-0.014)).toBe("−1.4%");
  });
});

describe("buildCityCard", () => {
  const kpis: IKpi[] = [
    kpi({ id: 1, name: "Public transport share", progression_target: 1 }),
    kpi({ id: 2, name: "Travel time", progression_target: 0 }),
    kpi({ id: 3, name: "Private car share", progression_target: 0 }),
    kpi({ id: 4, name: "Cost of travel", progression_target: 0 }),
    kpi({ id: 5, name: "Modal split", progression_target: 1 }),
    kpi({ id: 6, name: "car-sharing", parent_kpi_id: 5, progression_target: 1 }),
    kpi({ id: 7, name: "micro-mobility", parent_kpi_id: 5, progression_target: 1 }),
  ];

  it("maps identity, type and context fields", () => {
    const card = buildCityCard(
      lab({
        id: 1,
        name: "Coimbra",
        kpi_results: [resultGroup(1, 100, 110)],
      }),
      kpis,
    );

    expect(card.id).toBe("1");
    expect(card.name).toBe("Coimbra");
    expect(card.country).toBe("Portugal");
    expect(card.type).toBe("sum_living_lab");
    expect(card.typeLabel).toBe("SUM Living Lab");
    expect(card.population).toBe(143000);
    expect(card.area).toBe(319);
    expect(card.dataStatus).toBe("has_data");
  });

  it("classifies labs beyond the SUM project range as contributing cities", () => {
    const card = buildCityCard(lab({ id: 42, name: "Example City" }), kpis);
    expect(card.type).toBe("contributing_city");
    expect(card.typeLabel).toBe("Contributing city");
  });

  it("counts push and pull measures", () => {
    const card = buildCityCard(
      lab({
        id: 1,
        name: "Coimbra",
        projects: [
          { id: 1, name: "Parking pricing", type: "PUSH" },
          { id: 2, name: "Bike lanes", type: "PULL" },
          { id: 3, name: "Shared e-scooters", type: "PULL" },
          { id: 4, name: "Awareness campaign", type: "OTHER" },
        ],
      }),
      kpis,
    );

    expect(card.measures).toEqual({
      total: 4,
      push: 1,
      pull: 2,
      other: 1,
      pushNames: ["Parking pricing"],
      pullNames: ["Bike lanes", "Shared e-scooters"],
      otherNames: ["Awareness campaign"],
    });
  });

  it("derives the first reporting year from the earliest KPI result", () => {
    const card = buildCityCard(
      lab({
        id: 1,
        name: "Coimbra",
        kpi_results: [resultGroup(1, 100, 110, ["2022-06-01", "2024-01-01"])],
      }),
      kpis,
    );

    expect(card.reportingSince).toBe(2022);
  });

  it("ranks improved KPIs first and regressed KPIs last, using the KPI target", () => {
    const card = buildCityCard(
      lab({
        id: 1,
        name: "Coimbra",
        kpi_results: [
          // increase target, went up 6% -> improvement
          resultGroup(1, 100, 106),
          // decrease target, went down 3% -> improvement
          resultGroup(2, 100, 97),
          // decrease target, went up 5% -> regression
          resultGroup(3, 100, 105),
          // decrease target, went up 1% -> smaller regression
          resultGroup(4, 100, 101),
        ],
      }),
      kpis,
    );

    expect(card.improved.map((k) => k.name)).toEqual([
      "Public transport share",
      "Travel time",
    ]);
    expect(card.improved[0].display).toBe("+6.0%");
    expect(card.regressed.map((k) => k.name)).toEqual([
      "Private car share",
      "Cost of travel",
    ]);
    expect(card.regressed[0].display).toBe("−5.0%");
    expect(card.indicatorsImproved).toBe(2);
    expect(card.indicatorsTotal).toBe(4);
  });

  it("keeps at most three improved and three regressed KPIs", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      kpi({ id: 100 + i, name: `KPI ${i}`, progression_target: 1 }),
    );
    const card = buildCityCard(
      lab({
        id: 1,
        name: "Coimbra",
        kpi_results: [
          ...Array.from({ length: 5 }, (_, i) =>
            resultGroup(100 + i, 100, 101 + i),
          ),
          ...Array.from({ length: 5 }, (_, i) =>
            resultGroup(105 + i, 100, 99 - i),
          ),
        ],
      }),
      many,
    );

    expect(card.improved).toHaveLength(3);
    expect(card.regressed).toHaveLength(3);
    expect(card.indicatorsTotal).toBe(10);
  });

  it("aggregates child KPI results under their parent KPI", () => {
    const card = buildCityCard(
      lab({
        id: 1,
        name: "Coimbra",
        kpi_results: [resultGroup(6, 100, 110), resultGroup(7, 100, 130)],
      }),
      kpis,
    );

    expect(card.improved).toHaveLength(1);
    expect(card.improved[0].name).toBe("Modal split");
    expect(card.improved[0].display).toBe("+20.0%");
    expect(card.indicatorsTotal).toBe(1);
  });

  it("marks a city with no comparable results as pending", () => {
    const card = buildCityCard(
      lab({
        id: 1,
        name: "Fredrikstad",
        kpi_results: [resultGroup(1, 100, null)],
      }),
      kpis,
    );

    expect(card.dataStatus).toBe("data_pending");
    expect(card.improved).toEqual([]);
    expect(card.regressed).toEqual([]);
    expect(card.indicatorsTotal).toBe(0);
  });

  it("falls back to a readable label when the KPI definition is unknown", () => {
    const card = buildCityCard(
      lab({ id: 1, name: "Coimbra", kpi_results: [resultGroup(999, 100, 110)] }),
      kpis,
    );

    expect(card.improved[0].name).toBe("KPI 999");
  });
});

describe("buildCityCards", () => {
  const kpis: IKpi[] = [kpi({ id: 1, name: "Public transport share" })];

  it("sorts cities with data alphabetically and pushes cities without data to the bottom", () => {
    const cards = buildCityCards(
      [
        lab({ id: 3, name: "Zagreb", kpi_results: [resultGroup(1, 100, 110)] }),
        lab({ id: 1, name: "Aarhus" }),
        lab({ id: 2, name: "Bilbao", kpi_results: [resultGroup(1, 100, 90)] }),
        lab({ id: 4, name: "Malmo" }),
      ],
      kpis,
    );

    expect(cards.map((c) => c.name)).toEqual([
      "Bilbao",
      "Zagreb",
      "Aarhus",
      "Malmo",
    ]);
  });
});

describe("filterCityCards", () => {
  const kpis: IKpi[] = [kpi({ id: 1, name: "Public transport share" })];
  const cards = buildCityCards(
    [
      lab({ id: 1, name: "Coimbra", kpi_results: [resultGroup(1, 100, 110)] }),
      lab({ id: 2, name: "Larnaca" }),
      lab({ id: 42, name: "Example City", kpi_results: [resultGroup(1, 100, 110)] }),
      lab({ id: 43, name: "Another City" }),
    ],
    kpis,
  );

  it("exposes the four filters from the design", () => {
    expect(CITY_FILTERS.map((f) => f.label)).toEqual([
      "All",
      "SUM Living Labs",
      "Contributing cities",
      "Data reported",
    ]);
  });

  it("returns everything for 'all'", () => {
    expect(filterCityCards(cards, "all")).toHaveLength(4);
  });

  it("filters SUM Living Labs", () => {
    expect(filterCityCards(cards, "sum_living_labs").map((c) => c.name)).toEqual([
      "Coimbra",
      "Larnaca",
    ]);
  });

  it("filters contributing cities", () => {
    expect(
      filterCityCards(cards, "contributing_cities").map((c) => c.name),
    ).toEqual(["Example City", "Another City"]);
  });

  it("filters cities that reported data", () => {
    expect(filterCityCards(cards, "data_reported").map((c) => c.name)).toEqual([
      "Coimbra",
      "Example City",
    ]);
  });
});
