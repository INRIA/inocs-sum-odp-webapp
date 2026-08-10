import React from "react";
import { Badge } from "../ui/Badge";

interface PerspectiveResult {
  key: string;
  label: string;
  ranking: string[];
  netFlows: Record<string, number>;
  alternativeLabels: Record<string, string>;
}

interface Props {
  perspectives: PerspectiveResult[];
}

export function BusinessActivityRankingTable({ perspectives }: Props) {
  const validPerspectives = perspectives.filter(
    (p) => p.ranking.length > 0,
  );

  if (validPerspectives.length === 0) {
    return (
      <div className="rounded-lg border border-light bg-light/50 p-6 text-dark text-center">
        No ranking data available yet. Run the quantitative MCDA analysis to see
        results here.
      </div>
    );
  }

  // Collect all unique alternatives across perspectives
  const allAlternativeKeys = Array.from(
    new Set(validPerspectives.flatMap((p) => p.ranking)),
  );

  // Build label map from any perspective that has labels
  const labelMap: Record<string, string> = {};
  for (const p of validPerspectives) {
    for (const [k, v] of Object.entries(p.alternativeLabels)) {
      if (!labelMap[k]) labelMap[k] = v;
    }
  }

  // Compute best (lowest) rank across all perspectives for sorting
  const rows = allAlternativeKeys.map((altKey) => {
    const perspectiveRanks = validPerspectives.map((p) => {
      const rank = p.ranking.indexOf(altKey) + 1; // 0 if not found
      const score = p.netFlows[altKey];
      return { perspectiveKey: p.key, perspectiveLabel: p.label, rank, score };
    });

    const validRanks = perspectiveRanks
      .map((r) => r.rank)
      .filter((r) => r > 0);
    const bestRank =
      validRanks.length > 0 ? Math.min(...validRanks) : Infinity;

    return {
      altKey,
      label: labelMap[altKey] ?? altKey,
      perspectiveRanks,
      bestRank,
    };
  });

  // Sort by best rank across perspectives
  rows.sort((a, b) => a.bestRank - b.bestRank);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-primary/20">
            <th className="text-left py-3 pr-4 font-semibold text-primary w-12">
              #
            </th>
            <th className="text-left py-3 pr-4 font-semibold text-primary">
              Business activity
            </th>
            {validPerspectives.map((p) => (
              <th
                key={p.key}
                className="text-center py-3 px-2 font-semibold text-primary"
              >
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.altKey}
              className="border-b border-light hover:bg-light/30"
            >
              <td className="py-3 pr-4 font-bold text-primary">{idx + 1}</td>
              <td className="py-3 pr-4 font-medium text-dark">{row.label}</td>
              {row.perspectiveRanks.map((pr) => {
                if (pr.rank === 0) {
                  return (
                    <td
                      key={pr.perspectiveKey}
                      className="text-center py-3 px-2 text-dark/40"
                    >
                      —
                    </td>
                  );
                }

                const isTop3 = pr.rank <= 3;

                return (
                  <td key={pr.perspectiveKey} className="text-center py-3 px-2">
                    <Badge
                      color={isTop3 ? "secondary" : "light"}
                      size="sm"
                    >
                      #{pr.rank}
                    </Badge>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
