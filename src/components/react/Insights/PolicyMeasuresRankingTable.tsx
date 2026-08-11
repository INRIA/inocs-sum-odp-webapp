import React from "react";
import { Badge } from "../ui/Badge";
import { Tooltip } from "../ui/Tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiGroupCoefficient {
  groupId: number | string;
  groupName: string;
  coefficient: number;
  /** Rank within this KPI group (1 = highest coefficient) */
  rank: number;
  totalInGroup: number;
}

interface PerspectiveRank {
  perspectiveKey: string;
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
  /** Number of cities that implement this measure */
  cityCount: number;
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
              Implemented by
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

              <td className="py-3 px-2 text-sm text-dark/70">
                {row.cityCount > 0 ? `${row.cityCount} ${row.cityCount === 1 ? "city" : "cities"}` : "—"}
              </td>

              <td className="py-3 px-2 text-sm text-dark">
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const kpiTop3Groups = row.kpiGroups.filter((kg) => kg.rank <= 3);
                    const perspTop3Count = row.perspectives.filter((pr) => pr.rank <= 3).length;
                    if (kpiTop3Groups.length === 0 && perspTop3Count === 0) return null;
                    return (
                      <>
                        {kpiTop3Groups.length > 0 && (
                          <Tooltip
                            placement="bottom"
                            tooltipClassName="w-72"
                            content={
                              <ul className="list-none p-0 m-0 space-y-1">
                                {kpiTop3Groups.map((kg) => (
                                  <li key={kg.groupId}>
                                    <a
                                      href={`/tools/impact_analysis?groupId=${kg.groupId}#impact-results`}
                                      className="text-secondary underline hover:text-primary"
                                    >
                                      {kg.groupName}
                                    </a>
                                    <span className="text-dark/60 ml-1">
                                      (rank {kg.rank}/{kg.totalInGroup})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            }
                          >
                            <Badge color="secondary" size="sm">
                              Top ranked in {kpiTop3Groups.length} KPI group{kpiTop3Groups.length !== 1 ? "s" : ""}
                            </Badge>
                          </Tooltip>
                        )}
                        {(() => {
                          const perspTop3Groups = row.perspectives.filter((pr) => pr.rank <= 3);
                          if (perspTop3Groups.length === 0) return null;
                          return (
                            <Tooltip
                              placement="bottom"
                              tooltipClassName="w-72"
                              content={
                                <ul className="list-none p-0 m-0 space-y-1">
                                  {perspTop3Groups.map((pr) => (
                                    <li key={pr.perspectiveKey}>
                                      <a
                                        href={`/tools/mcda_analysis/mcda_analysis_quantitative/${pr.perspectiveKey}`}
                                        className="text-secondary underline hover:text-primary"
                                      >
                                        {pr.perspectiveLabel}
                                      </a>
                                      <span className="text-dark/60 ml-1">
                                        (rank {pr.rank}/{pr.totalInPerspective})
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              }
                            >
                              <Badge color="info" size="sm">
                                Top ranked in {perspTop3Groups.length} perspective{perspTop3Groups.length !== 1 ? "s" : ""}
                              </Badge>
                            </Tooltip>
                          );
                        })()}
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
