import { describe, it, expect } from "vitest";
import { buildCoverageMatrix } from "./coverageMatrix";
import type { ILivingLabPopulated } from "../../types/LivingLab";
import type { IKpi } from "../../types/KPIs";
import type { ICategory } from "../../types/Category";

const fakeCategory = (id: number, name: string): ICategory => ({
  id,
  name,
  type: "KPI_SIEF",
});

const fakeKpi = (id: number, catId: number, catName: string): IKpi => ({
  id,
  kpi_number: String(id),
  name: `KPI ${id}`,
  type: "GLOBAL" as any,
  progression_target: 1,
  metric: "percentage" as any,
  categories: [fakeCategory(catId, catName)],
});

function makeLab(
  id: number,
  kpiResultGroups: any[],
  validatedAt?: Date,
): ILivingLabPopulated {
  return {
    id,
    name: `City ${id}`,
    kpi_results: kpiResultGroups,
    validated_at: validatedAt ?? new Date("2025-01-01"),
  } as ILivingLabPopulated;
}

function makeGroup(kpiDefId: number, before: boolean, after: boolean) {
  return {
    kpidefinition_id: kpiDefId,
    result_before: before ? { id: 1 } : null,
    result_after: after ? { id: 2 } : null,
    results: [],
  };
}

describe("buildCoverageMatrix", () => {
  const kpiDefs = [fakeKpi(1, 10, "Group A"), fakeKpi(2, 10, "Group A"), fakeKpi(3, 20, "Group B")];

  it("marks >=2 validated groups as before-after", () => {
    const lab = makeLab(1, [makeGroup(1, true, true), makeGroup(2, true, true)]);
    const matrix = buildCoverageMatrix([lab], kpiDefs);
    const cell = matrix.cells.find((c) => c.labId === 1 && c.kpiGroupId === "10");
    expect(cell?.state).toBe("before-after");
    expect(cell?.label).toBe("Before & after");
  });

  it("marks exactly 1 validated group as baseline-only", () => {
    const lab = makeLab(1, [makeGroup(1, true, false)]);
    const matrix = buildCoverageMatrix([lab], kpiDefs);
    const cell = matrix.cells.find((c) => c.labId === 1 && c.kpiGroupId === "10");
    expect(cell?.state).toBe("baseline-only");
    expect(cell?.label).toBe("Baseline only");
  });

  it("marks 0 validated groups as none", () => {
    const lab = makeLab(1, []);
    const matrix = buildCoverageMatrix([lab], kpiDefs);
    const cell = matrix.cells.find((c) => c.labId === 1 && c.kpiGroupId === "10");
    expect(cell?.state).toBe("none");
    expect(cell?.label).toBe("—");
  });

  it("correctly segregates KPIs into their groups", () => {
    const lab = makeLab(1, [makeGroup(3, true, true), makeGroup(3, true, true)]);
    const matrix = buildCoverageMatrix([lab], kpiDefs);
    const cellA = matrix.cells.find((c) => c.labId === 1 && c.kpiGroupId === "10");
    const cellB = matrix.cells.find((c) => c.labId === 1 && c.kpiGroupId === "20");
    expect(cellA?.state).toBe("none");
    expect(cellB?.state).toBe("before-after");
  });

  it("includes lab and group metadata", () => {
    const lab = makeLab(42, []);
    const matrix = buildCoverageMatrix([lab], kpiDefs);
    expect(matrix.labs).toContainEqual({ id: 42, name: "City 42" });
    expect(matrix.kpiGroups.map((g) => g.name)).toContain("Group A");
  });
});
