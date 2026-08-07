/**
 * KPI definition IDs for implementation indicators.
 *
 * These KPIs describe process completion, not outcome trends.
 * They render in the Implementation Record table, not in the chart grid.
 *
 * !! TO BE CONFIRMED BY WP1 LEADER before this feature goes live !!
 * Replace the placeholder -1 with the confirmed database IDs for:
 *   - Level of completion of SUMP measures
 *   - Community involvement
 *   - Balance of planned/implemented pull–push measures
 *   - Number of NSM integrated in the system
 */
export const IMPLEMENTATION_KPI_IDS: number[] = [
  -1, // placeholder — causes zero matches until confirmed IDs are inserted
];

export function isImplementationKpi(kpiId: number): boolean {
  return IMPLEMENTATION_KPI_IDS.includes(kpiId);
}
