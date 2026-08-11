import { describe, it, expect } from "vitest";
import { buildMapLabs } from "./mapLabs";
import type { IKpi, ILivingLabPopulated } from "../../types";
import { EnumKpiMetricType, EnumKpiType } from "../../types/KPIs";

const kpis: IKpi[] = [
  {
    id: 1,
    kpi_number: "1",
    name: "Parent",
    type: EnumKpiType.GLOBAL,
    progression_target: 1,
    metric: EnumKpiMetricType.RATIO,
  },
  {
    id: 2,
    kpi_number: "1.1",
    parent_kpi_id: 1,
    name: "Child",
    type: EnumKpiType.GLOBAL,
    progression_target: 1,
    metric: EnumKpiMetricType.RATIO,
  },
];

const lab = {
  id: 1,
  name: "Munich",
  lat: "48.1351",
  lng: "11.5820",
  radius: 20,
  projects: [{ id: 1, name: "Bike lanes", type: "PULL" }],
  transport_modes: [
    { id: 1, name: "car-sharing", type: "NSM" },
    { id: 2, name: "bus", type: "PT" },
  ],
  kpi_results: [
    {
      living_lab_id: 1,
      kpidefinition_id: 2,
      result_before: { id: 1, kpidefinition_id: 2, living_lab_id: 1, value: 1, date: "2023-01-01" },
      result_after: { id: 2, kpidefinition_id: 2, living_lab_id: 1, value: 2, date: "2024-01-01" },
      results: [],
    },
  ],
} as unknown as ILivingLabPopulated;

describe("buildMapLabs", () => {
  it("maps coordinates, radius, type and status", () => {
    const [mapped] = buildMapLabs([lab], kpis);

    expect(mapped.id).toBe("1");
    expect(mapped.coordinates).toEqual({ lat: 48.1351, lng: 11.582 });
    expect(mapped.radius).toBe(20);
    expect(mapped.cityType).toBe("sum_living_lab");
    expect(mapped.dataStatus).toBe("has_data");
  });

  it("counts measures, NSM transport modes and distinct parent KPIs", () => {
    const [mapped] = buildMapLabs([lab], kpis);

    expect(mapped.totalMeasures).toBe(1);
    expect(mapped.transportModes).toBe(1);
    expect(mapped.kpisCollected).toBe(1);
    expect(mapped.yearsCollected).toEqual([2024]);
  });

  it("returns null coordinates when the lab has no position", () => {
    const [mapped] = buildMapLabs(
      [{ ...lab, lat: null, lng: null } as ILivingLabPopulated],
      kpis,
    );

    expect(mapped.coordinates).toBeNull();
    expect(mapped.radius).toBe(20);
  });
});
