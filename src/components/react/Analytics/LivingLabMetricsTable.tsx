/**
 * LivingLabMetricsTable Component
 *
 * SSR-only React component that displays a table of per-lab KPI metrics.
 * Used in the Analytics Dashboard for User Story 2.
 *
 * @module User Story 2
 */

import type { LivingLabMetricsRow } from "./types";

export interface LivingLabMetricsTableProps {
  rows: LivingLabMetricsRow[];
}

/**
 * A table displaying KPI metrics for each living lab.
 * This component is rendered server-side without hydration (no client:* directive).
 */
export function LivingLabMetricsTable({ rows }: LivingLabMetricsTableProps) {
  const formatDate = (isoString: string | null): string => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Living Lab
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              KPI Results
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              KPIs Covered
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Global KPIs Covered
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Local KPIs Covered
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Measures PUSH / PULL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                No living labs found
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.labId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.labName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {row.totalResultEntries}
                </td>
                <td
                  className={
                    "px-6 py-4 whitespace-nowrap text-sm text-center font-bold " +
                    (row.kpisCoveredCount / row.totalMainKpis < 0.4
                      ? "text-danger"
                      : "text-success")
                  }
                >
                  {row.kpisCoveredCount} / {row.totalMainKpis}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {row.kpisGlobalCoveredCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {row.kpisLocalCoveredCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center ">
                  {row.pushMeasuresCount} / {row.pullMeasuresCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(row.lastUpdatedAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default LivingLabMetricsTable;
