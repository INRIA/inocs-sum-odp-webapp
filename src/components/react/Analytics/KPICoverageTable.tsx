/**
 * KPICoverageTable Component
 *
 * SSR-only React component that displays a table of KPI definitions
 * with coverage information (how many labs have submitted results).
 *
 * @module User Story 4
 */

import type { KpiCoverageRow } from "./types";

export interface KPICoverageTableProps {
  rows: KpiCoverageRow[];
}

/**
 * A table displaying KPI definitions with type and coverage information.
 * This component is rendered server-side without hydration (no client:* directive).
 */
export function KPICoverageTable({ rows }: KPICoverageTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              KPI #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Labs with Results
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                No KPI definitions found
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.kpiId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.kpiNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.kpiName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      row.kpiType === "GLOBAL"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {row.kpiType}
                  </span>
                </td>
                <td
                  className={
                    row.labsWithResultsCount === 0
                      ? "px-6 py-4 whitespace-nowrap text-md text-center text-danger font-bold"
                      : row.labsWithResultsCount === row.totalLabs
                        ? "px-6 py-4 whitespace-nowrap text-md text-center text-success font-bold"
                        : "px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900"
                  }
                >
                  {row.labsWithResultsCount} / {row.totalLabs}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default KPICoverageTable;
