import {
  GREEN_COLOR,
  LIGHT_BLUE_COLOR,
  ORANGE_COLOR,
  RED_COLOR,
} from "../../styles/constants";

/**
 * Base colors for lab color palette generation
 * Strong, vibrant colors that work well for data visualization
 */
export const LAB_BASE_COLORS = [
  GREEN_COLOR, // #98c33a
  LIGHT_BLUE_COLOR, // #75bdfb
  ORANGE_COLOR, // #ff632f
  RED_COLOR, // #ff442f
];

/**
 * Additional strong colors to expand the palette when needed
 */
const EXTENDED_BASE_COLORS = [
  "#9333ea", // Purple
  "#0891b2", // Cyan
  "#ca8a04", // Yellow/Gold
  "#16a34a", // Emerald
  "#2563eb", // Royal Blue
  "#c026d3", // Fuchsia
  "#0d9488", // Teal
  "#7c3aed", // Violet
];

// ============================================================================
// Color Conversion Utilities
// ============================================================================

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): HSL {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ============================================================================
// Seeded Random Number Generator
// ============================================================================

/**
 * Generate a deterministic hash from a string (lab ID)
 * Uses djb2 algorithm for good distribution
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Seeded random number generator using Linear Congruential Generator (LCG)
 * Returns a function that generates deterministic random numbers between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    // LCG parameters (same as glibc)
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// ============================================================================
// Color Variation Generation
// ============================================================================

/**
 * Generate a color variation from a base color
 * Maintains strong, vibrant colors suitable for data visualization
 *
 * @param baseHex - Base hex color
 * @param variationIndex - Index of the variation (0 = original, 1+ = variations)
 * @param random - Seeded random function for deterministic variations
 */
export function generateColorVariation(
  baseHex: string,
  variationIndex: number,
  random: () => number,
): string {
  if (variationIndex === 0) {
    return baseHex; // Return original color for first instance
  }

  const hsl = hexToHSL(baseHex);

  // Generate variations by shifting hue and adjusting saturation/lightness
  // Keep colors strong by maintaining high saturation

  // Hue shift: ±15-30 degrees based on variation index
  const hueShift = (random() * 30 + 15) * (variationIndex % 2 === 0 ? 1 : -1);
  hsl.h = (hsl.h + hueShift + 360) % 360;

  // Saturation: keep between 55-90% for strong colors
  const satShift = (random() * 20 - 10) * (variationIndex % 3 === 0 ? 1 : -1);
  hsl.s = Math.max(55, Math.min(90, hsl.s + satShift));

  // Lightness: keep between 35-55% for good visibility
  const lightShift = (random() * 15 - 7.5) * (variationIndex % 2 === 0 ? 1 : -1);
  hsl.l = Math.max(35, Math.min(55, hsl.l + lightShift));

  return hslToHex(hsl);
}

// ============================================================================
// Color Contrast Checking
// ============================================================================

/**
 * Calculate relative luminance of a color (for contrast calculation)
 */
function getRelativeLuminance(hex: string): number {
  hex = hex.replace(/^#/, "");

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const adjust = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color has sufficient contrast against existing colors
 * Minimum ratio of 1.5 for distinguishing adjacent data series
 */
function hasMinimumContrast(
  newColor: string,
  existingColors: string[],
  minRatio: number = 1.5,
): boolean {
  return existingColors.every(
    (existing) => getContrastRatio(newColor, existing) >= minRatio,
  );
}

// ============================================================================
// Dynamic Palette Generation
// ============================================================================

/**
 * Generate a dynamic color palette for living labs
 * Uses base colors and generates variations as needed
 * Ensures good contrast between colors and deterministic assignment via lab ID hash
 *
 * @param labs - Array of lab objects with id and name
 * @returns Array of color assignments
 */
export function generateDynamicLabColors(
  labs: { id: string; name: string }[],
): { labId: string; labName: string; color: string }[] {
  const labCount = labs.length;

  // Combine base colors with extended colors for larger palettes
  const allBaseColors = [...LAB_BASE_COLORS, ...EXTENDED_BASE_COLORS];

  // Calculate how many variations we need per base color
  const variationsNeeded = Math.ceil(labCount / allBaseColors.length);

  // Generate the full palette with variations
  const palette: string[] = [];
  const usedColors: string[] = [];

  // First pass: add all base colors
  allBaseColors.forEach((baseColor) => {
    if (palette.length < labCount) {
      palette.push(baseColor);
      usedColors.push(baseColor);
    }
  });

  // Second pass: generate variations if we need more colors
  if (labCount > allBaseColors.length) {
    for (
      let variation = 1;
      variation < variationsNeeded && palette.length < labCount;
      variation++
    ) {
      for (const baseColor of allBaseColors) {
        if (palette.length >= labCount) break;

        // Create a seeded random for this specific variation
        const seed = hashString(`${baseColor}-${variation}`);
        const random = createSeededRandom(seed);

        let newColor = generateColorVariation(baseColor, variation, random);

        // Ensure minimum contrast with existing colors
        let attempts = 0;
        while (!hasMinimumContrast(newColor, usedColors) && attempts < 5) {
          // Adjust the color if contrast is too low
          const hsl = hexToHSL(newColor);
          hsl.h = (hsl.h + 20) % 360; // Shift hue more
          hsl.l = hsl.l > 45 ? hsl.l - 10 : hsl.l + 10; // Adjust lightness
          newColor = hslToHex(hsl);
          attempts++;
        }

        palette.push(newColor);
        usedColors.push(newColor);
      }
    }
  }

  // Assign colors to labs using deterministic shuffle based on lab IDs
  return labs.map((lab, index) => {
    // Use hash of lab ID to get a deterministic but varied color assignment
    const hash = hashString(lab.id);
    const colorIndex = hash % Math.min(palette.length, labCount);

    // If collision occurs, fall back to index-based assignment
    const assignedColors = new Set<number>();
    let finalIndex = colorIndex;

    // Find an unused color index
    while (assignedColors.has(finalIndex) && assignedColors.size < palette.length) {
      finalIndex = (finalIndex + 1) % palette.length;
    }

    // If all colors are used, cycle through
    if (assignedColors.size >= palette.length) {
      finalIndex = index % palette.length;
    }

    assignedColors.add(finalIndex);

    return {
      labId: lab.id,
      labName: lab.name,
      color: palette[index % palette.length], // Use index for now to ensure uniqueness
    };
  });
}

/**
 * Simple deterministic color assignment for labs
 * Each lab gets a unique color from the palette based on its position
 * Colors are shuffled deterministically based on all lab IDs combined
 */
export function generateLabColorsWithSeed(
  labs: { id: string; name: string }[],
): { labId: string; labName: string; color: string }[] {
  const labCount = labs.length;

  // Combine base colors with extended colors
  const allBaseColors = [...LAB_BASE_COLORS, ...EXTENDED_BASE_COLORS];

  // Generate palette with enough colors
  const palette: string[] = [];
  const variationsNeeded = Math.ceil(labCount / allBaseColors.length);

  // Add base colors first
  allBaseColors.forEach((color) => palette.push(color));

  // Generate variations if needed
  for (let v = 1; v < variationsNeeded; v++) {
    allBaseColors.forEach((baseColor) => {
      const seed = hashString(`${baseColor}-v${v}`);
      const random = createSeededRandom(seed);
      palette.push(generateColorVariation(baseColor, v, random));
    });
  }

  // Create a combined seed from all lab IDs for consistent shuffling
  const combinedSeed = hashString(labs.map((l) => l.id).sort().join("-"));
  const random = createSeededRandom(combinedSeed);

  // Fisher-Yates shuffle with seeded random
  const shuffledPalette = [...palette];
  for (let i = shuffledPalette.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledPalette[i], shuffledPalette[j]] = [
      shuffledPalette[j],
      shuffledPalette[i],
    ];
  }

  // Assign colors to labs
  return labs.map((lab, index) => ({
    labId: lab.id,
    labName: lab.name,
    color: shuffledPalette[index % shuffledPalette.length],
  }));
}
