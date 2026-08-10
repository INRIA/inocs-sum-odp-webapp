import React from "react";
import type { CoverageMatrixData, CellState } from "../../../lib/utils/coverageMatrix";

interface CoverageMatrixProps {
  matrix: CoverageMatrixData;
}

function CellIcon({ state }: { state: CellState }) {
  if (state === "before-after")
    return <span className="text-secondary font-bold">●</span>;
  if (state === "baseline-only")
    return <span className="text-info">◑</span>;
  return <span className="text-gray-300">○</span>;
}

function cellBg(state: CellState): string {
  if (state === "before-after") return "bg-secondary/10";
  if (state === "baseline-only") return "bg-info/10";
  return "";
}

export function CoverageMatrix({ matrix }: CoverageMatrixProps) {
  const { labs, kpiGroups, cells } = matrix;

  function getCell(labId: number, groupId: string) {
    return cells.find((c) => c.labId === labId && c.kpiGroupId === groupId);
  }

  return (
    <div>
      <div className="flex gap-6 text-xs mb-4 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="text-secondary font-bold">●</span> Before &amp; after
        </span>
        <span className="flex items-center gap-1">
          <span className="text-info">◑</span> Baseline only
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-300">○</span> No data
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse min-w-max">
          <thead>
            <tr>
              <th className="text-left p-2 bg-gray-50 border border-gray-200 sticky left-0 z-10 min-w-32">
                City
              </th>
              {kpiGroups.map((g) => (
                <th
                  key={g.id}
                  className="p-2 bg-gray-50 border border-gray-200 text-center max-w-24 whitespace-nowrap overflow-hidden text-ellipsis"
                  title={g.name}
                >
                  {g.name.length > 15 ? g.name.slice(0, 14) + "…" : g.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labs.map((lab) => (
              <tr key={lab.id}>
                <td className="p-2 border border-gray-200 font-medium sticky left-0 bg-white z-10">
                  {lab.name}
                </td>
                {kpiGroups.map((g) => {
                  const cell = getCell(lab.id, g.id);
                  return (
                    <td
                      key={g.id}
                      className={`p-2 border border-gray-200 text-center ${cell ? cellBg(cell.state) : ""}`}
                      title={cell?.label ?? "—"}
                    >
                      <CellIcon state={cell?.state ?? "none"} />
                      <span className="sr-only">{cell?.label ?? "—"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
