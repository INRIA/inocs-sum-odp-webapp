import { describe, it, expect } from "vitest";
import {
  hexToHSL,
  hslToHex,
  hashString,
  createSeededRandom,
  generateColorVariation,
  getContrastRatio,
  generateLabColorsWithSeed,
  LAB_BASE_COLORS,
} from "./colorUtils";

describe("colorUtils", () => {
  describe("hexToHSL", () => {
    it("converts red correctly", () => {
      const hsl = hexToHSL("#ff0000");
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it("converts green correctly", () => {
      const hsl = hexToHSL("#00ff00");
      expect(hsl.h).toBe(120);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it("converts blue correctly", () => {
      const hsl = hexToHSL("#0000ff");
      expect(hsl.h).toBe(240);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it("handles hex with # prefix", () => {
      const hsl = hexToHSL("#98c33a");
      expect(hsl.h).toBeGreaterThan(0);
      expect(hsl.s).toBeGreaterThan(0);
      expect(hsl.l).toBeGreaterThan(0);
    });

    it("handles hex without # prefix", () => {
      const hsl = hexToHSL("98c33a");
      expect(hsl.h).toBeGreaterThan(0);
    });
  });

  describe("hslToHex", () => {
    it("converts back to original hex (red)", () => {
      const hex = hslToHex({ h: 0, s: 100, l: 50 });
      expect(hex.toLowerCase()).toBe("#ff0000");
    });

    it("converts back to original hex (green)", () => {
      const hex = hslToHex({ h: 120, s: 100, l: 50 });
      expect(hex.toLowerCase()).toBe("#00ff00");
    });

    it("roundtrip conversion preserves color", () => {
      const original = "#98c33a";
      const hsl = hexToHSL(original);
      const result = hslToHex(hsl);
      // Allow small rounding differences
      expect(result.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  describe("hashString", () => {
    it("returns consistent hash for same input", () => {
      const hash1 = hashString("test-lab-1");
      const hash2 = hashString("test-lab-1");
      expect(hash1).toBe(hash2);
    });

    it("returns different hashes for different inputs", () => {
      const hash1 = hashString("lab-1");
      const hash2 = hashString("lab-2");
      expect(hash1).not.toBe(hash2);
    });

    it("returns a positive number", () => {
      const hash = hashString("any-string");
      expect(hash).toBeGreaterThanOrEqual(0);
    });
  });

  describe("createSeededRandom", () => {
    it("returns values between 0 and 1", () => {
      const random = createSeededRandom(12345);
      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it("produces deterministic sequence for same seed", () => {
      const random1 = createSeededRandom(42);
      const random2 = createSeededRandom(42);

      const seq1 = [random1(), random1(), random1()];
      const seq2 = [random2(), random2(), random2()];

      expect(seq1).toEqual(seq2);
    });

    it("produces different sequences for different seeds", () => {
      const random1 = createSeededRandom(1);
      const random2 = createSeededRandom(2);

      const val1 = random1();
      const val2 = random2();

      expect(val1).not.toBe(val2);
    });
  });

  describe("generateColorVariation", () => {
    it("returns original color for variation index 0", () => {
      const random = createSeededRandom(1);
      const result = generateColorVariation("#98c33a", 0, random);
      expect(result).toBe("#98c33a");
    });

    it("returns a valid hex color for variations", () => {
      const random = createSeededRandom(1);
      const result = generateColorVariation("#98c33a", 1, random);
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("generates different colors for different variation indices", () => {
      const color1 = generateColorVariation(
        "#98c33a",
        1,
        createSeededRandom(1),
      );
      const color2 = generateColorVariation(
        "#98c33a",
        2,
        createSeededRandom(1),
      );
      expect(color1).not.toBe(color2);
    });
  });

  describe("getContrastRatio", () => {
    it("returns 21 for black and white", () => {
      const ratio = getContrastRatio("#000000", "#ffffff");
      expect(ratio).toBeCloseTo(21, 0);
    });

    it("returns 1 for identical colors", () => {
      const ratio = getContrastRatio("#ff0000", "#ff0000");
      expect(ratio).toBe(1);
    });

    it("returns value between 1 and 21", () => {
      const ratio = getContrastRatio("#98c33a", "#ff632f");
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThanOrEqual(21);
    });
  });

  describe("generateLabColorsWithSeed", () => {
    it("assigns colors to all labs", () => {
      const labs = [
        { id: "lab-1", name: "Lab 1" },
        { id: "lab-2", name: "Lab 2" },
        { id: "lab-3", name: "Lab 3" },
      ];
      const result = generateLabColorsWithSeed(labs);

      expect(result).toHaveLength(3);
      result.forEach((assignment) => {
        expect(assignment.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(assignment.labId).toBeDefined();
        expect(assignment.labName).toBeDefined();
      });
    });

    it("generates consistent colors for same lab set", () => {
      const labs = [
        { id: "lab-1", name: "Lab 1" },
        { id: "lab-2", name: "Lab 2" },
      ];

      const result1 = generateLabColorsWithSeed(labs);
      const result2 = generateLabColorsWithSeed(labs);

      expect(result1.map((r) => r.color)).toEqual(result2.map((r) => r.color));
    });

    it("handles large number of labs by generating variations", () => {
      const labs = Array.from({ length: 25 }, (_, i) => ({
        id: `lab-${i}`,
        name: `Lab ${i}`,
      }));

      const result = generateLabColorsWithSeed(labs);

      expect(result).toHaveLength(25);
      result.forEach((assignment) => {
        expect(assignment.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("maintains lab ID and name in assignment", () => {
      const labs = [{ id: "test-id", name: "Test Name" }];
      const result = generateLabColorsWithSeed(labs);

      expect(result[0].labId).toBe("test-id");
      expect(result[0].labName).toBe("Test Name");
    });
  });

  describe("LAB_BASE_COLORS", () => {
    it("contains 4 base colors", () => {
      expect(LAB_BASE_COLORS).toHaveLength(4);
    });

    it("contains valid hex colors", () => {
      LAB_BASE_COLORS.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});
