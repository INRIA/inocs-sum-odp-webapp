import React from "react";
import type { ConvergenceResult } from "../../../lib/helpers/mcda-format";

export interface PerspectiveResult {
  key: string;
  label: string;
  ranking: string[];
  alternativeLabels: Record<string, string>;
  netFlows: Record<string, number>;
  topPerformer: string;
  gaiaQuality: number | null;
}

interface MCDAComparisonViewProps {
  perspectives: PerspectiveResult[];
  convergence: ConvergenceResult;
}

function formatPhi(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}

export function MCDAComparisonView({
  perspectives,
  convergence,
}: MCDAComparisonViewProps) {
  if (perspectives.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No perspective data available for comparison.
      </div>
    );
  }

  // Build unified ranking set from all perspectives
  const allAlternativeKeys = Array.from(
    new Set(perspectives.flatMap((p) => p.ranking)),
  );

  // Use labels from first available perspective
  const labelsRef = perspectives[0]?.alternativeLabels ?? {};
  const getLabel = (key: string) => labelsRef[key] ?? key;

  // For each alternative, get its rank in each perspective
  const rankMaps = perspectives.map((p) => {
    const map = new Map(p.ranking.map((id, idx) => [id, idx + 1]));
    return map;
  });

  // Check if a given row (alternative) has disagreement across perspectives
  const rowDisagrees = (altKey: string): boolean => {
    const ranks = rankMaps.map((m) => m.get(altKey) ?? null);
    const definedRanks = ranks.filter((r) => r !== null) as number[];
    if (definedRanks.length < 2) return false;
    return Math.max(...definedRanks) - Math.min(...definedRanks) > 1;
  };

  return (
    <div className="space-y-8">
      {/* Convergence statement */}
      <div
        className={`p-5 rounded-xl border ${
          convergence.converges
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">
            {convergence.converges ? "✓" : "⚠"}
          </span>
          <div>
            <p className="font-semibold mb-1">
              {convergence.converges ? "Rankings converge" : "Rankings diverge"}
            </p>
            <p className="text-sm">{convergence.statement}</p>
          </div>
        </div>
      </div>

      {/* Ranking comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                Rank
              </th>
              {perspectives.map((p) => (
                <th
                  key={p.key}
                  className="text-left py-3 px-4 font-semibold text-gray-700"
                >
                  <a
                    href={`/tools/mcda_analysis/mcda_analysis_quantitative/${p.key}`}
                    className="text-primary hover:underline"
                  >
                    {p.label}
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(
              { length: Math.max(...perspectives.map((p) => p.ranking.length)) },
              (_, rankIdx) => {
                const altKeys = perspectives.map(
                  (p) => p.ranking[rankIdx] ?? null,
                );
                const anyDisagreement = altKeys.some(
                  (k) => k && rowDisagrees(k),
                );
                const rowBg = anyDisagreement
                  ? "bg-amber-50 border-amber-100"
                  : rankIdx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50";

                return (
                  <tr
                    key={rankIdx}
                    className={`border-b border-gray-200 ${rowBg}`}
                  >
                    <td className="py-2 px-4 font-medium text-gray-500">
                      {rankIdx + 1}
                    </td>
                    {perspectives.map((p, pIdx) => {
                      const key = altKeys[pIdx];
                      if (!key)
                        return (
                          <td key={p.key} className="py-2 px-4 text-gray-400">
                            —
                          </td>
                        );
                      const netFlow = p.netFlows[key];
                      return (
                        <td key={p.key} className="py-2 px-4">
                          <span className="font-medium text-gray-900">
                            {getLabel(key)}
                          </span>
                          {typeof netFlow === "number" && (
                            <span className="ml-2 text-xs text-gray-500">
                              φ {formatPhi(netFlow)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
        {convergence.converges === false && (
          <p className="text-xs text-amber-700 mt-2">
            Highlighted rows indicate alternatives where perspectives disagree by
            more than 1 position.
          </p>
        )}
      </div>

      {/* Per-perspective summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {perspectives.map((p) => (
          <div
            key={p.key}
            className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <h3 className="font-semibold text-dark mb-3">{p.label}</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide">
                  Top performer
                </dt>
                <dd className="font-medium text-gray-900">{p.topPerformer}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide">
                  Top φ score
                </dt>
                <dd className="font-medium text-gray-900">
                  {p.ranking[0] && typeof p.netFlows[p.ranking[0]] === "number"
                    ? formatPhi(p.netFlows[p.ranking[0]])
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide">
                  GAIA quality
                </dt>
                <dd className="font-medium text-gray-900">
                  {p.gaiaQuality !== null
                    ? `${p.gaiaQuality.toFixed(1)}%`
                    : "—"}
                </dd>
              </div>
            </dl>
            <a
              href={`/tools/mcda_analysis/mcda_analysis_quantitative/${p.key}`}
              className="mt-4 inline-block text-sm text-primary hover:underline font-medium"
            >
              View full analysis →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
