import React from "react";
import type { IKpiGroup, McdaResults } from "../../../types";
import { AlternativeCard } from "./AlternativeCard";
import { D3McdaNetFlowsChart } from "./D3McdaNetFlowsChart";
import { D3McdaGaiaPlane } from "./D3McdaGaiaPlane";

interface ResultsSectionProps {
  selectedGroupId: string | number;
  selectedGroup: IKpiGroup | undefined;
  mcdaResults?: McdaResults | null;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  selectedGroupId,
  selectedGroup,
  mcdaResults,
}) => {
  const netFlows = mcdaResults?.net_flows || {};
  const labels = mcdaResults?.alternative_labels || {};
  const positiveFlows = mcdaResults?.positive_flows || {};
  const negativeFlows = mcdaResults?.negative_flows || {};
  const gaiaAlternatives = mcdaResults?.gaia_alternatives || [];
  const gaiaCriteria = mcdaResults?.gaia_criteria || [];
  const gaiaDecisionStick = mcdaResults?.gaia_decision_stick as
    | [number, number]
    | undefined;
  const criteriaLabels = mcdaResults?.criteria_labels || {};
  const ranking = mcdaResults?.ranking || [];

  // Convert to sorted entries
  const flowEntries = Object.entries(netFlows).map(([key, value]) => ({
    key,
    flow: value,
    label: labels[key] || key,
  }));

  // Sort by net flow descending to find best alternative
  flowEntries.sort((a, b) => b.flow - a.flow);
  const top3Alternatives = flowEntries.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Top Decision Insights Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">
          Top Decision Insights
        </h2>
        <p className="text-gray-600 max-w-4xl mx-auto">
          A quick view of the leading project activities across all Living Labs,
          see which options win most often, understand the biggest trade-offs,
          and learn how stable these choices are under different priorities.
        </p>
      </div>

      {/* Top 3 Alternatives Grid */}
      {top3Alternatives.length > 0 ? (
        <>
          <div className="grid md:grid-cols-3 gap-6 content-center">
            {top3Alternatives.map((alternative, index) => (
              <AlternativeCard
                key={alternative.key}
                label={alternative.label}
                flow={alternative.flow}
                rank={index + 1}
                isTop={index === 0}
              />
            ))}
          </div>

          {/* PROMETHEE-GAIA Detailed Analysis Section */}
          <div className="mt-12">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                PROMETHEE-GAIA detailed analysis
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Business Activities - ranking
              </p>
            </div>
            <D3McdaNetFlowsChart
              netFlows={netFlows}
              positiveFlows={positiveFlows}
              negativeFlows={negativeFlows}
              alternativeLabels={labels}
              height={Math.max(400, flowEntries.length * 60)}
            />
          </div>

          {/* GAIA Plane Section */}
          {gaiaAlternatives.length > 0 && gaiaCriteria.length > 0 && (
            <div className="mt-12">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  GAIA Visual Analysis
                </h2>
                <p className="text-gray-600 max-w-3xl mx-auto">
                  Geometric representation of alternatives and goals in decision
                  space. Alternatives closer to the decision stick (π) represent
                  better compromise solutions.
                </p>
              </div>
              <D3McdaGaiaPlane
                gaiaAlternatives={gaiaAlternatives}
                gaiaCriteria={gaiaCriteria}
                gaiaDecisionStick={gaiaDecisionStick}
                alternativeLabels={labels}
                criteriaLabels={criteriaLabels}
                netFlows={netFlows}
                ranking={ranking}
                height={700}
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 7.5h10.5M6.75 12h10.5m-10.5 4.5h10.5M4.5 7.5H3.75a1.5 1.5 0 00-1.5 1.5v9.75A1.5 1.5 0 003.75 21h16.5a1.5 1.5 0 001.5-1.5V9a1.5 1.5 0 00-1.5-1.5H19.5"
              ></path>
            </svg>
            <p className="text-lg font-medium mb-2">Results pending</p>
            <p className="text-sm text-gray-400">
              We couldn't find MCDA results for{" "}
              <strong>{selectedGroup?.name || "this stakeholder"}</strong> yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
