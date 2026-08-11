import React from "react";
import { Badge } from "../ui/Badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiGroupCoefficient {
  groupName: string;
  coefficient: number;
  /** Rank within this KPI group (1 = highest coefficient) */
  rank: number;
  totalInGroup: number;
}

interface PerspectiveRank {
  perspectiveLabel: string;
  rank: number;
  totalInPerspective: number;
}

/** Pre-computed on the server (Astro frontmatter) and passed as serialisable JSON. */
export interface PolicyMeasureRow {
  measureId: number;
  name: string;
  /** One entry per KPI group the measure appears in */
  kpiGroups: KpiGroupCoefficient[];
  /** One entry per MCDA perspective the measure appears in */
  perspectives: PerspectiveRank[];
  /** Best (lowest) rank across all KPI groups — used for overall sort */
  bestKpiRank: number;
}

interface Props {
  rows: PolicyMeasureRow[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PolicyMeasuresRankingTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-light bg-light/50 p-6 text-dark text-center">
        No impact analysis data available yet. Run the KPI impact analysis to
        see results here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-primary/20">
            <th className="text-left py-3 pr-4 font-semibold text-primary w-12">
              #
            </th>
            <th className="text-left py-3 pr-4 font-semibold text-primary">
              Policy measure
            </th>
            <th className="text-left py-3 px-2 font-semibold text-primary">
              Data analysis ranking results
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.measureId}
              className="border-b border-light hover:bg-light/30 align-top"
            >
              <td className="py-3 pr-4 font-bold text-primary">{idx + 1}</td>
              <td className="py-3 pr-4 font-medium text-dark">{row.name}</td>

              <td className="py-3 px-2 text-sm text-dark">
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const kpiTop3 = row.kpiGroups.filter((kg) => kg.rank <= 3).length;
                    const perspTop3 = row.perspectives.filter((pr) => pr.rank <= 3).length;
                    if (kpiTop3 === 0 && perspTop3 === 0) return null;
                    return (
                      <>
                        {kpiTop3 > 0 && (
                          <Badge color="secondary" size="sm">
                            Top ranked in {kpiTop3} KPI group{kpiTop3 !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {perspTop3 > 0 && (
                          <Badge color="info" size="sm">
                            Top ranked in {perspTop3} perspective{perspTop3 !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
