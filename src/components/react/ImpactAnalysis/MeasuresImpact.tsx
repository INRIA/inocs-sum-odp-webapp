import React from "react";
import type { IKpiGroup, IGroupAnalysisResult } from "../../../types";
import { AnalysisSectionDivider } from "../ui/AnalysisSectionDivider";
import { MeasureImpactCard } from "./MeasureImpactCard";
import { D3HorizontalBarChart } from "./D3HorizontalBarChart";
import {
  getTopMeasures,
  getBottomMeasures,
  sortMeasuresByCoefficient,
  formatCoefficient,
  calculateStatistics,
} from "../../../lib/helpers/impact-analysis-format";
import { InfoAlert } from "../ui";

interface MeasuresImpactProps {
  selectedGroup: IKpiGroup | null;
  analysisResult: IGroupAnalysisResult | null;
  kpiCount: number;
}

export const MeasuresImpact: React.FC<MeasuresImpactProps> = ({
  selectedGroup,
  analysisResult,
  kpiCount,
}) => {
  const divider = (
    <AnalysisSectionDivider
      step={2}
      title="Measures Impact"
      // subtitle="Analyse how implemented measures contributed to the KPIs variations"
      description={
        "Estimation of the level of contribution for each measure to KPIs in the scope " +
        selectedGroup?.name +
        "."
      }
    />
  );

  // No group selected
  if (!selectedGroup) {
    return (
      <div>
        {divider}
        <p className="text-gray-600 mt-4">
          Please select a KPI group above to view the analysis.
        </p>
      </div>
    );
  }

  // Group selected but no analysis data
  if (
    !analysisResult ||
    !analysisResult.measure_coefficients ||
    analysisResult.measure_coefficients.length === 0
  ) {
    return (
      <div>
        {divider}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No analysis data available for this KPI group
          </h3>
          <p className="text-gray-600">
            Analysis results for{" "}
            <span className="font-semibold">{selectedGroup.name}</span> was not
            possible due to insufficient data.
          </p>
        </div>
      </div>
    );
  }

  const measures = analysisResult.measure_coefficients;
  const livingLabsAnalysis = analysisResult.living_labs_analysis || [];
  const topMeasures = getTopMeasures(measures, 3);
  const bottomMeasures = getBottomMeasures(measures, 3);
  const sortedMeasures = sortMeasuresByCoefficient(measures);
  const stats = calculateStatistics(measures);

  return (
    <div>
      {divider}

      {/* Statistics Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Measures</div>
          <div className="text-2xl font-bold text-gray-900">
            {measures.length}
          </div>
        </div>
        <div className="bg-secondary/10 border border-secondary/40 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">
            Measures with positive Impact
          </div>
          <div className="text-2xl font-bold text-secondary">
            {stats.positiveCount}
          </div>
        </div>
        <div className="bg-danger/10 border border-danger/40 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">
            Measures with negative Impact
          </div>
          <div className="text-2xl font-bold text-danger">
            {stats.negativeCount}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">
            Total Living labs compared
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analysisResult.living_labs_analysis.length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">
            Total KPIs metrics compared
          </div>
          <div className="text-2xl font-bold text-gray-900">{kpiCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Model Quality (MSQE)</div>
          <div className="text-2xl font-bold text-gray-900">
            {analysisResult.msqe.toExponential(2)}
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="mt-12">
        <p className="text-dark mb-6">
          Comprehensive view of all {measures.length} measures ranked by their
          contribution coefficient. Hover over bars to see detailed information
          and implementing cities.
        </p>
        <D3HorizontalBarChart
          measures={sortedMeasures}
          livingLabsAnalysis={livingLabsAnalysis}
          height={Math.max(600, measures.length * 50)}
        />
      </div>

      {/* Additional Info */}
      <InfoAlert
        variant="info"
        title="Understanding the Results"
        className="mt-12"
      >
        <ul className="list-disc list-inside space-y-1">
          <li>
            Coefficients represent the estimated contribution of each measure to
            KPI changes
          </li>
          <li>
            Positive levels indicate the policy measures that most likely
            contributed to the improvement of KPI values
          </li>
          <li>
            Negative levels may indicate measures needing refinement or
            context-specific challenges
          </li>
          <li>
            Level of contribution from external conditions (out from policy
            measures analysed):{" "}
            <span className="font-mono font-semibold">
              {formatCoefficient(analysisResult.variation_under_no_measures)}
            </span>
          </li>
        </ul>
      </InfoAlert>

      {/* Top Impactful Measures */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-8 h-8 text-secondary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
              clipRule="evenodd"
            />
          </svg>
          <h3>
            High contribution measures to <strong>{selectedGroup.name}</strong>{" "}
            KPIs
          </h3>
        </div>
        <p className="text-dark mb-4">
          Top {topMeasures.length} measures estimated to have contributed the
          most positively to KPI improvements
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topMeasures.map((measure, index) => (
            <MeasureImpactCard
              key={measure.id}
              measure={measure}
              rank={index + 1}
              size="small"
            />
          ))}
        </div>
      </div>

      {/* Bottom Impactful Measures */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-8 h-8 text-danger"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
              clipRule="evenodd"
            />
          </svg>
          <h3>
            Low contribution measures to <strong>{selectedGroup.name}</strong>{" "}
            KPIs
          </h3>
        </div>
        <p className="text-dark mb-4">
          Bottom {bottomMeasures.length} policy measures estimated to have
          contributed negatively or had adverse effects
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bottomMeasures.map((measure, index) => (
            <MeasureImpactCard
              key={measure.id}
              measure={measure}
              rank={measures.length - bottomMeasures.length + index + 1}
              size="small"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
