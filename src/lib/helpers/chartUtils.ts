import type { IMeasureCoefficient, ILivingLabAnalysis } from "../../types";

const PERCENTAGE_DECIMALS = 2;
const COEFFICIENT_MULTIPLIER = 100;
/**
 * Format coefficient as percentage with sign
 */
export function formatCoefficient(
  coefficient: number,
  decimals: number = PERCENTAGE_DECIMALS
): string {
  const percentage = (coefficient * COEFFICIENT_MULTIPLIER).toFixed(decimals);
  const sign = coefficient >= 0 ? "+" : "";
  return `${sign}${percentage}%`;
}

/**
 * Format coefficient as raw percentage number
 */
export function coefficientToPercentage(coefficient: number): number {
  return parseFloat(
    (coefficient * COEFFICIENT_MULTIPLIER).toFixed(PERCENTAGE_DECIMALS)
  );
}

/**
 * Determine color based on coefficient value
 */
export function getCoefficientColor(coefficient: number): string {
  if (coefficient >= 0) {
    return "#10b981"; // green-500
  } else {
    return "#ef4444"; // red-500
  }
}

/**
 * Get gradient color scale from red to green
 */
export function getCoefficientGradientColor(
  coefficient: number,
  minCoeff: number,
  maxCoeff: number
): string {
  // Normalize coefficient to 0-1 range
  const normalized = (coefficient - minCoeff) / (maxCoeff - minCoeff || 1);

  if (normalized < 0.5) {
    // Red to Yellow (negative to neutral)
    const r = 239;
    const g = Math.round(68 + (244 - 68) * (normalized * 2));
    const b = 68;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to Green (neutral to positive)
    const r = Math.round(244 - (244 - 16) * ((normalized - 0.5) * 2));
    const g = Math.round(244 - (244 - 185) * ((normalized - 0.5) * 2));
    const b = 68;
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Find living labs that implemented a specific measure
 */
export function findImplementingLabs(
  measureId: string,
  livingLabsAnalysis: ILivingLabAnalysis[]
): string[] {
  const implementingLabs: string[] = [];

  livingLabsAnalysis.forEach((lab) => {
    const hasMeasure = lab.measures?.some(
      (m) => String(m.id) === String(measureId)
    );
    if (hasMeasure) {
      implementingLabs.push(lab.name);
    }
  });

  return implementingLabs;
}

/**
 * Calculate chart dimensions based on data length
 */
export function calculateChartDimensions(dataLength: number): {
  width: number;
  height: number;
  barHeight: number;
} {
  const barHeight = 40;
  const padding = 10;
  const height = dataLength * (barHeight + padding) + 100; // Add padding for axes
  const width = 800; // Fixed width, will be responsive in component

  return { width, height, barHeight };
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Sort measures by coefficient (descending)
 */
export function sortMeasuresByCoefficient(
  measures: IMeasureCoefficient[],
  ascending: boolean = false
): IMeasureCoefficient[] {
  return [...measures].sort((a, b) =>
    ascending ? a.coefficient - b.coefficient : b.coefficient - a.coefficient
  );
}

/**
 * Get top N measures by coefficient
 */
export function getTopMeasures(
  measures: IMeasureCoefficient[],
  count: number = 3
): IMeasureCoefficient[] {
  return sortMeasuresByCoefficient(measures, false).slice(0, count);
}

/**
 * Get bottom N measures by coefficient
 */
export function getBottomMeasures(
  measures: IMeasureCoefficient[],
  count: number = 3
): IMeasureCoefficient[] {
  return sortMeasuresByCoefficient(measures, true).slice(0, count);
}

/**
 * Calculate statistics from coefficients
 */
export function calculateStatistics(measures: IMeasureCoefficient[]): {
  mean: number;
  median: number;
  positiveCount: number;
  negativeCount: number;
} {
  if (measures.length === 0) {
    return { mean: 0, median: 0, positiveCount: 0, negativeCount: 0 };
  }

  const sorted = [...measures].sort((a, b) => a.coefficient - b.coefficient);
  const sum = measures.reduce((acc, m) => acc + m.coefficient, 0);
  const mean = sum / measures.length;

  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1].coefficient +
          sorted[sorted.length / 2].coefficient) /
        2
      : sorted[Math.floor(sorted.length / 2)].coefficient;

  const positiveCount = measures.filter((m) => m.coefficient >= 0).length;
  const negativeCount = measures.filter((m) => m.coefficient < 0).length;

  return { mean, median, positiveCount, negativeCount };
}
