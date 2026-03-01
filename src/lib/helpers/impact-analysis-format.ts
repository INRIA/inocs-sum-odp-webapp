import { COLOR_GREEN, COLOR_ORANGE, COLOR_RED } from "../../styles/constants";
import {
  type IMeasureCoefficient,
  type ILivingLabAnalysis,
  type IKpiVariationData,
  type ILivingLabVariation,
  type IKpiVariation,
  type IGroupAnalysisResult,
  type ILivingLab,
  type IKpiDefinition,
} from "../../types";

const PERCENTAGE_DECIMALS = 2;
const COEFFICIENT_MULTIPLIER = 1;
/**
 * Format coefficient as percentage with sign
 */
export function formatCoefficient(
  coefficient: number,
  decimals: number = PERCENTAGE_DECIMALS,
  suffix: string = "",
): string {
  const percentage = (coefficient * COEFFICIENT_MULTIPLIER).toFixed(decimals);
  const sign = coefficient >= 0 ? "+" : "";
  return `${sign}${percentage}${suffix}`;
}

/**
 * Format coefficient as raw percentage number
 */
export function coefficientToPercentage(coefficient: number): number {
  return parseFloat(
    (coefficient * COEFFICIENT_MULTIPLIER).toFixed(PERCENTAGE_DECIMALS),
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
  maxCoeff: number,
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
  livingLabsAnalysis: ILivingLabAnalysis[],
): string[] {
  const implementingLabs: string[] = [];

  livingLabsAnalysis.forEach((lab) => {
    const hasMeasure = lab.measures?.some(
      (m) => String(m.id) === String(measureId),
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
  ascending: boolean = false,
): IMeasureCoefficient[] {
  return [...measures].sort((a, b) =>
    ascending ? a.coefficient - b.coefficient : b.coefficient - a.coefficient,
  );
}

/**
 * Get top N measures by coefficient
 */
export function getTopMeasures(
  measures: IMeasureCoefficient[],
  count: number = 3,
): IMeasureCoefficient[] {
  return sortMeasuresByCoefficient(measures, false)
    .filter((m) => m.coefficient > 0)
    .slice(0, count);
}

/**
 * Get bottom N measures by coefficient
 */
export function getBottomMeasures(
  measures: IMeasureCoefficient[],
  count: number = 3,
): IMeasureCoefficient[] {
  return sortMeasuresByCoefficient(measures, true)
    .filter((m) => m.coefficient < 0)
    .slice(0, count);
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

/**
 * Convert ratio variation to percentage string
 * Ratio values are normalized from -1 to +1 (can exceed these bounds)
 * representing -100% to +100% change
 */
export function ratioToPercentage(
  ratio: number | null,
  decimals: number = PERCENTAGE_DECIMALS,
): string {
  if (ratio === null || ratio === undefined) {
    return "N/A";
  }
  const percentage = (ratio * COEFFICIENT_MULTIPLIER).toFixed(decimals);
  const sign = ratio >= 0 ? "+" : "";
  return `${sign}${percentage}%`;
}

/**
 * Convert ratio variation to raw percentage number
 */
export function ratioToPercentageNumber(ratio: number | null): number | null {
  if (ratio === null || ratio === undefined) {
    return null;
  }
  return parseFloat(
    (ratio * COEFFICIENT_MULTIPLIER).toFixed(PERCENTAGE_DECIMALS),
  );
}

/**
 * Get color based on ratio variation value
 * - Positive: Green (COLOR_GREEN)
 * - Negative: Red (COLOR_RED)
 * - Zero or null: Orange (COLOR_ORANGE)
 */
export function getVariationColor(ratio: number | null): string {
  if (ratio === null || ratio === undefined) {
    return COLOR_ORANGE; // null/undefined treated as neutral/unknown
  }
  if (ratio > 0) {
    return COLOR_GREEN; // green for positive
  } else if (ratio < 0) {
    return COLOR_RED; // red for negative
  } else {
    return COLOR_ORANGE; // orange for zero
  }
}

/**
 * Calculate KPI variations data from analysis result
 * This should be called server-side to pre-compute all variation metrics
 * @param analysisResult - The analysis result containing living labs data
 * @param kpiDefinitionsMap - Map of KPI definitions by ID
 * @param livingLabsMap - Optional map of living labs by ID for geolocation data
 */
export function calculateKpiVariationsData(
  analysisResult: IGroupAnalysisResult,
  kpiDefinitionsMap: Map<number, IKpiDefinition>,
  livingLabsMap?: Map<number, ILivingLab>,
): IKpiVariationData {
  const livingLabVariations: ILivingLabVariation[] = [];
  const allKpiVariationsMap = new Map<string, IKpiVariation[]>();
  // Process each living lab
  analysisResult.living_labs_analysis.forEach((lab) => {
    const kpiVariations: IKpiVariation[] = [];

    lab.kpis.forEach((kpi) => {
      if (analysisResult.kpi_ids.includes(kpi.id) === false) return;
      const kpiDef = kpiDefinitionsMap.get(kpi.id) ?? kpi;
      const variation: IKpiVariation = {
        kpiId: kpiDef.id,
        kpiName: kpiDef.name,
        kpiParentId: kpiDef.parent_kpi_id || null,
        kpiParentName: kpiDef.parent_kpi_name || null,
        transportModeName: kpi.transport_mode_name,
        ratioVariation: kpi.ratio_variation,
        ratioVariationPercentage: ratioToPercentage(kpi.ratio_variation),
        absVariation: kpi.abs_variation,
        valueBefore: kpi.value_before,
        valueAfter: kpi.value_after,
      };
      kpiVariations.push(variation);

      // Track all variations per KPI for aggregation
      const kpiTransportKey =
        `${kpi.id}` +
        (kpi.transport_mode_id ? `_${kpi.transport_mode_id}` : "");
      if (!allKpiVariationsMap.has(kpiTransportKey)) {
        allKpiVariationsMap.set(kpiTransportKey, []);
      }
      allKpiVariationsMap.get(kpiTransportKey)!.push(variation);
    });

    // Calculate average variation for this living lab
    const validVariations = kpiVariations
      .map((k) => k.ratioVariation)
      .filter((v) => v !== null) as number[];
    const labAverage =
      validVariations.length > 0
        ? validVariations.reduce((sum, v) => sum + v, 0) /
          validVariations.length
        : null;

    // Get geolocation from living labs map if available
    const livingLabData = livingLabsMap?.get(lab.id);
    const lat = livingLabData?.lat ? parseFloat(livingLabData.lat) : null;
    const lng = livingLabData?.lng ? parseFloat(livingLabData.lng) : null;
    const radius = livingLabData?.radius ?? null;

    livingLabVariations.push({
      labId: lab.id,
      labName: lab.name,
      totalVariation: labAverage,
      totalVariationPercentage: ratioToPercentage(labAverage),
      kpis: kpiVariations,
      lat: isNaN(lat as number) ? null : lat,
      lng: isNaN(lng as number) ? null : lng,
      radius,
    });
  });

  // Calculate total variation across all labs and KPIs
  const allRatios = livingLabVariations.flatMap((lab) =>
    lab.kpis.map((k) => k.ratioVariation).filter((v) => v !== null),
  ) as number[];
  const totalVariation =
    allRatios.length > 0
      ? allRatios.reduce((sum, v) => sum + v, 0) / allRatios.length
      : null;

  // Aggregate KPI variations across all labs (average per KPI)
  const allKpiVariations: IKpiVariation[] = [];
  allKpiVariationsMap.forEach((variations, kpiId) => {
    const validRatios = variations
      .map((v) => v.ratioVariation)
      .filter((r) => r !== null) as number[];
    const avgRatio =
      validRatios.length > 0
        ? validRatios.reduce((sum, r) => sum + r, 0) / validRatios.length
        : null;

    allKpiVariations.push({
      kpiId: variations[0].kpiId,
      kpiName: variations[0].kpiName,
      kpiParentId: variations[0].kpiParentId,
      kpiParentName: variations[0].kpiParentName,
      ratioVariation: avgRatio,
      ratioVariationPercentage: ratioToPercentage(avgRatio),
      absVariation: null, // Not meaningful when aggregated
      valueBefore: null,
      valueAfter: null,
      transportModeName: variations[0].transportModeName,
    });
  });

  allKpiVariations.sort((a, b) => {
    // Sort by absolute ratio variation descending
    const aVal = a.ratioVariation !== null ? a.ratioVariation : -Infinity;
    const bVal = b.ratioVariation !== null ? b.ratioVariation : -Infinity;
    return bVal - aVal;
  });
  return {
    groupId: analysisResult.id,
    groupName: analysisResult.name,
    totalVariation,
    totalVariationPercentage: ratioToPercentage(totalVariation),
    livingLabVariations,
    allKpiVariations,
  };
}

export function aggregateVariationsByKpis(
  variationData: IKpiVariationData,
  kpiDefinitionsMap: Map<number, IKpiDefinition>,
): IKpiVariationData {
  const aggregatedByKpiId = new Map<
    number,
    {
      source: IKpiVariation;
      ratioSum: number;
      ratioCount: number;
    }
  >();

  variationData.allKpiVariations.forEach((variation) => {
    const key = variation.kpiId;
    const current = aggregatedByKpiId.get(key) ?? {
      source: variation,
      ratioSum: 0,
      ratioCount: 0,
    };

    if (
      variation.ratioVariation !== null &&
      variation.ratioVariation !== undefined
    ) {
      current.ratioSum += variation.ratioVariation;
      current.ratioCount += 1;
    }

    aggregatedByKpiId.set(key, current);
  });

  const byKpi = Array.from(aggregatedByKpiId.values()).map((item) => {
    const ratioVariation =
      item.ratioCount > 0 ? item.ratioSum / item.ratioCount : null;

    return {
      ...item.source,
      ratioVariation,
      ratioVariationPercentage: ratioToPercentage(ratioVariation),
      absVariation: null,
      valueBefore: null,
      valueAfter: null,
      transportModeName: null,
    } as IKpiVariation;
  });

  const aggregatedByParent = new Map<
    string,
    {
      source: IKpiVariation;
      ratioSum: number;
      ratioCount: number;
    }
  >();

  byKpi.forEach((variation) => {
    const kpiDef = kpiDefinitionsMap.get(variation.kpiId);
    const isModalSplitParent =
      kpiDef?.parent_kpi_number?.startsWith("15") ?? false;

    const key =
      kpiDef?.parent_kpi_id && !isModalSplitParent
        ? `parent:${kpiDef.parent_kpi_id}`
        : `kpi:${variation.kpiId}`;

    const sourceForAggregate =
      kpiDef?.parent_kpi_id && !isModalSplitParent
        ? {
            ...variation,
            kpiId: kpiDef.parent_kpi_id,
            kpiName:
              kpiDef?.parent_kpi_name ?? kpiDef?.name ?? variation.kpiName,
            kpiParentId: null,
            kpiParentName: null,
            transportModeName: null,
          }
        : variation;

    const current = aggregatedByParent.get(key) ?? {
      source: sourceForAggregate,
      ratioSum: 0,
      ratioCount: 0,
    };

    if (
      variation.ratioVariation !== null &&
      variation.ratioVariation !== undefined
    ) {
      current.ratioSum += variation.ratioVariation;
      current.ratioCount += 1;
    }

    aggregatedByParent.set(key, current);
  });

  const allKpiVariations = Array.from(aggregatedByParent.values())
    .map((item) => {
      const ratioVariation =
        item.ratioCount > 0 ? item.ratioSum / item.ratioCount : null;
      return {
        ...item.source,
        ratioVariation,
        ratioVariationPercentage: ratioToPercentage(ratioVariation),
        absVariation: null,
        valueBefore: null,
        valueAfter: null,
      } as IKpiVariation;
    })
    .sort((a, b) => {
      const aVal = a.ratioVariation !== null ? a.ratioVariation : -Infinity;
      const bVal = b.ratioVariation !== null ? b.ratioVariation : -Infinity;
      return bVal - aVal;
    });

  const validRatios = allKpiVariations
    .map((kpi) => kpi.ratioVariation)
    .filter((ratio): ratio is number => ratio !== null && ratio !== undefined);

  const totalVariation =
    validRatios.length > 0
      ? validRatios.reduce((sum, value) => sum + value, 0) / validRatios.length
      : null;

  return {
    ...variationData,
    totalVariation,
    totalVariationPercentage: ratioToPercentage(totalVariation),
    allKpiVariations,
  };
}

// ===== KPI Grouping and Sorting Helpers =====

export interface IGroupedKpi {
  isParent: boolean;
  parentId?: number;
  parentName?: string;
  childCount?: number;
  kpi: IKpiVariation;
}

/**
 * Group KPIs by parent-child relationship
 * Returns flat list with parent rows followed by children, sorted alphabetically
 * Ungrouped KPIs appear first, then grouped sections
 */
export function groupKpisByParent(kpis: IKpiVariation[]): IGroupedKpi[] {
  const parentMap = new Map<number, IKpiVariation[]>();
  const ungroupedKpis: IKpiVariation[] = [];

  // Separate ungrouped and grouped KPIs
  kpis.forEach((kpi) => {
    if (!kpi.kpiParentId) {
      ungroupedKpis.push(kpi);
    } else {
      if (!parentMap.has(kpi.kpiParentId)) {
        parentMap.set(kpi.kpiParentId, []);
      }
      parentMap.get(kpi.kpiParentId)!.push(kpi);
    }
  });

  // Sort ungrouped KPIs alphabetically
  ungroupedKpis.sort((a, b) => a.kpiName.localeCompare(b.kpiName));

  // Build result: ungrouped first, then grouped sections
  const result: IGroupedKpi[] = [];

  // Add ungrouped KPIs
  ungroupedKpis.forEach((kpi) => {
    result.push({
      isParent: false,
      kpi,
    });
  });

  // Add grouped KPIs: find parent KPIs and add them with children
  const addedParentIds = new Set<number>();

  kpis.forEach((kpi) => {
    // Check if this KPI is a parent
    if (parentMap.has(kpi.kpiId) && !addedParentIds.has(kpi.kpiId)) {
      const children = parentMap.get(kpi.kpiId)!;
      addedParentIds.add(kpi.kpiId);

      // Add parent row
      result.push({
        isParent: true,
        parentId: kpi.kpiId,
        parentName: kpi.kpiName,
        childCount: children.length,
        kpi,
      });

      // Add children (sorted by name)
      children.sort((a, b) => a.kpiName.localeCompare(b.kpiName));
      children.forEach((child) => {
        result.push({
          isParent: false,
          parentId: kpi.kpiId,
          parentName: kpi.kpiName,
          kpi: child,
        });
      });
    }
  });

  return result;
}

export type SortColumn =
  | "number"
  | "name"
  | "variation"
  | "valueBefore"
  | "valueAfter";

/**
 * Sort grouped KPIs while preserving parent-child structure
 * Groups stay together; sorting applies within and between groups
 */
export function sortKpiVariations(
  groupedKpis: IGroupedKpi[],
  column: SortColumn,
  ascending: boolean = false,
): IGroupedKpi[] {
  if (groupedKpis.length === 0) return groupedKpis;

  // Separate parent rows and their children
  const parentSections: IGroupedKpi[][] = [];
  let currentSection: IGroupedKpi[] = [];

  groupedKpis.forEach((item) => {
    if (item.isParent && currentSection.length > 0) {
      parentSections.push(currentSection);
      currentSection = [item];
    } else {
      currentSection.push(item);
    }
  });
  if (currentSection.length > 0) {
    parentSections.push(currentSection);
  }

  // Sort each section (parent + children) based on column
  const sortedSections = parentSections.map((section) => {
    const parentRow = section.find((item) => item.isParent);
    const childRows = section.filter((item) => !item.isParent);

    // Sort children
    const sortedChildren = [...childRows].sort((a, b) => {
      const aVal = getKpiSortValue(a.kpi, column);
      const bVal = getKpiSortValue(b.kpi, column);
      return ascending ? compare(aVal, bVal) : compare(bVal, aVal);
    });

    // Return parent (if exists) followed by sorted children
    return parentRow ? [parentRow, ...sortedChildren] : sortedChildren;
  });

  // Sort parent groups by their aggregate/primary KPI
  const sortedSections2 = [...sortedSections].sort((sectionA, sectionB) => {
    const kpiA = sectionA[0]?.kpi;
    const kpiB = sectionB[0]?.kpi;
    if (!kpiA || !kpiB) return 0;

    const aVal = getKpiSortValue(kpiA, column);
    const bVal = getKpiSortValue(kpiB, column);
    return ascending ? compare(aVal, bVal) : compare(bVal, aVal);
  });

  return sortedSections2.flat();
}

/**
 * Extract sortable value from KPI based on column type
 */
function getKpiSortValue(
  kpi: IKpiVariation,
  column: SortColumn,
): string | number {
  switch (column) {
    case "name":
      return kpi.kpiName.toLowerCase();
    case "variation":
      return kpi.ratioVariation ?? -Infinity;
    case "valueBefore":
      return kpi.valueBefore ?? -Infinity;
    case "valueAfter":
      return kpi.valueAfter ?? -Infinity;
    case "number":
    default:
      return 0;
  }
}

/**
 * Generic comparison function for sort values
 */
function compare(a: string | number, b: string | number): number {
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }
  const aNum = typeof a === "number" ? a : 0;
  const bNum = typeof b === "number" ? b : 0;
  return aNum - bNum;
}

/**
 * Format KPI name with transport mode for display
 */
export function formatKpiDisplayName(kpi: IKpiVariation): string {
  if (kpi.transportModeName) {
    return `${kpi.kpiName} (${kpi.transportModeName})`;
  }
  return kpi.kpiName;
}
