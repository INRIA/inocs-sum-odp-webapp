export type EvidenceLevel = "low" | "moderate" | "strong";

export interface EvidenceBadgeConfig {
  level: EvidenceLevel;
  label: string;
  colorClass: string;
  bgClass: string;
}

export const EVIDENCE_THRESHOLDS: { min: number; config: EvidenceBadgeConfig }[] = [
  { min: 0.5, config: { level: "strong", label: "Strong evidence", colorClass: "text-secondary", bgClass: "bg-secondary/10" } },
  { min: 0.2, config: { level: "moderate", label: "Moderate evidence", colorClass: "text-info", bgClass: "bg-info/10" } },
  { min: 0, config: { level: "low", label: "Limited evidence", colorClass: "text-warning", bgClass: "bg-warning/10" } },
];

export function getEvidenceBadge(normalizedRatio: number): EvidenceBadgeConfig {
  for (const threshold of EVIDENCE_THRESHOLDS) {
    if (normalizedRatio >= threshold.min) return threshold.config;
  }
  return EVIDENCE_THRESHOLDS[EVIDENCE_THRESHOLDS.length - 1].config;
}

export function computeEvidenceRatio(
  labsWithData: number,
  kpiObservations: number,
  totalLabs: number,
  totalMeasures: number,
): number {
  const denominator = totalLabs * totalMeasures;
  if (denominator === 0) return 0;
  return (labsWithData * kpiObservations) / denominator;
}
