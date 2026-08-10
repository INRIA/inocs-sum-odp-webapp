import React from "react";
import type { MCDAGoal, McdaResults } from "../../../types";
import { GoalWeightBar } from "./GoalWeightBar";

const CONVERGENCE_TOLERANCE = 1;

interface PerspectiveData {
  key: string;
  label: string;
  results: McdaResults | null;
  goals: MCDAGoal[];
}

export interface McdaComparisonViewProps {
  analysisType: string;
  perspectives: PerspectiveData[];
}

interface RankComparison {
  alternativeKey: string;
  alternativeLabel: string;
  ranks: { perspectiveKey: string; perspectiveLabel: string; rank: number }[];
  maxDifference: number;
  converges: boolean;
}

export function compareRankings(perspectives: PerspectiveData[]): {
  comparisons: RankComparison[];
  allConverge: boolean;
  convergenceStatement: string;
} {
  const perspectiveRankings = perspectives
    .filter((p) => p.results?.ranking && p.results.ranking.length > 0)
    .map((p) => ({
      key: p.key,
      label: p.label,
      ranking: p.results!.ranking!,
      labels: p.results!.alternative_labels ?? {},
    }));

  if (perspectiveRankings.length < 2) {
    return {
      comparisons: [],
      allConverge: true,
      convergenceStatement: "Not enough perspectives with data to compare.",
    };
  }

  const allAlternatives = new Set(
    perspectiveRankings.flatMap((p) => p.ranking),
  );

  const comparisons: RankComparison[] = Array.from(allAlternatives).map(
    (altKey) => {
      const ranks = perspectiveRankings.map((p) => ({
        perspectiveKey: p.key,
        perspectiveLabel: p.label,
        rank: p.ranking.indexOf(altKey) + 1,
      }));
      const rankValues = ranks.map((r) => r.rank).filter((r) => r > 0);
      const maxDifference =
        rankValues.length > 0
          ? Math.max(...rankValues) - Math.min(...rankValues)
          : 0;

      return {
        alternativeKey: altKey,
        alternativeLabel: perspectiveRankings[0].labels[altKey] ?? altKey,
        ranks,
        maxDifference,
        converges: maxDifference <= CONVERGENCE_TOLERANCE,
      };
    },
  );

  const allConverge = comparisons.every((c) => c.converges);

  let convergenceStatement: string;
  if (allConverge) {
    const topAlternative = comparisons.find((c) =>
      c.ranks.every((r) => r.rank === 1),
    );
    if (topAlternative) {
      convergenceStatement = `All perspectives agree: "${topAlternative.alternativeLabel}" ranks first across all stakeholder viewpoints.`;
    } else {
      convergenceStatement =
        "All perspectives agree on the overall ranking within the documented tolerance.";
    }
  } else {
    const divergent = comparisons
      .filter((c) => !c.converges)
      .map(
        (c) =>
          `"${c.alternativeLabel}" (spread: ${c.maxDifference} position${c.maxDifference !== 1 ? "s" : ""})`,
      )
      .join(", ");
    convergenceStatement = `Perspectives diverge on: ${divergent}.`;
  }

  return { comparisons, allConverge, convergenceStatement };
}

export const McdaComparisonView: React.FC<McdaComparisonViewProps> = ({
  analysisType,
  perspectives,
}) => {
  const { comparisons, allConverge, convergenceStatement } =
    compareRankings(perspectives);

  const hasData = comparisons.length > 0;

  return (
    <div className="space-y-8 mx-auto px-4 py-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Compare perspectives
        </h1>
        <p className="text-gray-600">
          Rankings from all three stakeholder perspectives side by side.
        </p>
      </div>

      {/* Links back to individual perspectives */}
      <div className="flex flex-wrap gap-3">
        {perspectives.map((p) => (
          <a
            key={p.key}
            href={`/tools/mcda_analysis/${analysisType}/${p.key}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline border border-primary/20 rounded-md px-3 py-1"
          >
            {p.label} →
          </a>
        ))}
      </div>

      {!hasData && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
          No ranking data available for comparison. Please ensure at least two
          perspectives have results.
        </div>
      )}

      {hasData && (
        <>
          {/* Convergence statement */}
          <div
            className={`rounded-lg p-4 border ${
              allConverge
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                allConverge ? "text-green-800" : "text-amber-800"
              }`}
            >
              {allConverge ? "✓ " : "⚠ "}
              {convergenceStatement}
            </p>
          </div>

          {/* Ranking comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 pr-4 font-semibold text-gray-900">
                    Alternative
                  </th>
                  {perspectives.map((p) => (
                    <th
                      key={p.key}
                      className="text-center py-3 px-4 font-semibold text-gray-900"
                    >
                      <a
                        href={`/tools/mcda_analysis/${analysisType}/${p.key}`}
                        className="text-primary hover:underline"
                      >
                        {p.label}
                      </a>
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons
                  .sort((a, b) => {
                    const minRankA = Math.min(...a.ranks.map((r) => r.rank).filter(Boolean));
                    const minRankB = Math.min(...b.ranks.map((r) => r.rank).filter(Boolean));
                    return minRankA - minRankB;
                  })
                  .map((comparison) => (
                    <tr
                      key={comparison.alternativeKey}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {comparison.alternativeLabel}
                      </td>
                      {comparison.ranks.map((r) => {
                        const isDivergent = !comparison.converges;
                        return (
                          <td
                            key={r.perspectiveKey}
                            className={`text-center py-3 px-4 ${
                              isDivergent
                                ? "text-warning font-bold"
                                : "text-gray-700"
                            }`}
                          >
                            {r.rank > 0 ? (
                              <>
                                #{r.rank}
                                {isDivergent && " ⚠"}
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center py-3 px-4">
                        {comparison.converges ? (
                          <span className="text-green-600 text-xs font-medium">
                            Agrees
                          </span>
                        ) : (
                          <span className="text-amber-600 text-xs font-medium">
                            Diverges ({comparison.maxDifference} pos.)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Goal weight comparison per perspective */}
          {perspectives.some((p) => p.goals.length > 0) && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Goal weights by perspective
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {perspectives.map((p) => (
                  <div key={p.key} className="space-y-3">
                    <h3 className="font-medium text-gray-700">{p.label}</h3>
                    {p.goals.length > 0 ? (
                      p.goals.map((goal) => (
                        <GoalWeightBar
                          key={goal.name}
                          goal={goal}
                          editable={false}
                          value={goal.weight}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No goal data</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
