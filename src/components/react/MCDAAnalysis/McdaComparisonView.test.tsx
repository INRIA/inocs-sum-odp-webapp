import { describe, it, expect } from "vitest";
import { compareRankings } from "./McdaComparisonView";

const makePerspective = (
  key: string,
  label: string,
  ranking: string[],
  alternativeLabels: Record<string, string> = {},
) => ({
  key,
  label,
  results: {
    ranking,
    alternative_labels: alternativeLabels,
  },
  goals: [],
});

describe("compareRankings", () => {
  it("detects convergence when all ranks match within tolerance", () => {
    const perspectives = [
      makePerspective("regulatory", "Regulatory", ["a", "b", "c"], {
        a: "Alpha",
        b: "Beta",
        c: "Gamma",
      }),
      makePerspective("pto", "PTO", ["a", "c", "b"], {
        a: "Alpha",
        b: "Beta",
        c: "Gamma",
      }),
      makePerspective("nsm", "NSM", ["a", "b", "c"], {
        a: "Alpha",
        b: "Beta",
        c: "Gamma",
      }),
    ];

    // Alpha is 1st everywhere (spread 0)
    // Beta is 2nd in reg/nsm, 3rd in pto (spread 1)
    // Gamma is 3rd in reg/nsm, 2nd in pto (spread 1)
    // All within tolerance of 1
    const { allConverge } = compareRankings(perspectives);
    expect(allConverge).toBe(true);
  });

  it("detects divergence when spread exceeds tolerance", () => {
    const perspectives = [
      makePerspective("regulatory", "Regulatory", ["a", "b", "c", "d"]),
      makePerspective("pto", "PTO", ["a", "d", "c", "b"]),
      makePerspective("nsm", "NSM", ["a", "b", "c", "d"]),
    ];
    // b is 2nd in reg/nsm, 4th in pto — spread is 2 > tolerance 1
    const { allConverge } = compareRankings(perspectives);
    expect(allConverge).toBe(false);
  });

  it("produces convergence statement naming top alternative when all agree on first", () => {
    const perspectives = [
      makePerspective("regulatory", "Regulatory", ["a", "b"], {
        a: "Alpha",
        b: "Beta",
      }),
      makePerspective("pto", "PTO", ["a", "b"], {
        a: "Alpha",
        b: "Beta",
      }),
      makePerspective("nsm", "NSM", ["a", "b"], {
        a: "Alpha",
        b: "Beta",
      }),
    ];
    const { convergenceStatement } = compareRankings(perspectives);
    expect(convergenceStatement).toContain("Alpha");
    expect(convergenceStatement).toContain("ranks first");
  });

  it("produces divergence statement when perspectives disagree", () => {
    const perspectives = [
      makePerspective("regulatory", "Regulatory", ["a", "b", "c"]),
      makePerspective("pto", "PTO", ["c", "a", "b"]),
      makePerspective("nsm", "NSM", ["a", "b", "c"]),
    ];
    // c is 3rd in reg/nsm, 1st in pto — spread 2
    const { allConverge, convergenceStatement } =
      compareRankings(perspectives);
    expect(allConverge).toBe(false);
    expect(convergenceStatement).toContain("diverge");
  });

  it("handles empty ranking data gracefully", () => {
    const perspectives = [
      { key: "a", label: "A", results: null, goals: [] },
      { key: "b", label: "B", results: null, goals: [] },
    ];
    const { comparisons, allConverge } = compareRankings(perspectives);
    expect(comparisons).toHaveLength(0);
    expect(allConverge).toBe(true);
  });

  it("handles single perspective with data gracefully", () => {
    const perspectives = [
      makePerspective("regulatory", "Regulatory", ["a", "b"]),
      { key: "pto", label: "PTO", results: null, goals: [] },
    ];
    const { comparisons, allConverge } = compareRankings(perspectives);
    expect(comparisons).toHaveLength(0);
    expect(allConverge).toBe(true);
  });
});
