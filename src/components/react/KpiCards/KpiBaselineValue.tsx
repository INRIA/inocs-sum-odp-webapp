import type { IKpiResultGroup, EnumKpiMetricType } from "../../../types/KPIs";
import { isResultValidated } from "../../../lib/utils/kpiSufficiency";
import {
  formatValue,
  formatMonthYear,
  getFormattedValueString,
} from "../../../lib/helpers";
import { getKpiReading, formatDirection } from "../../../config/kpiReadings";

type Props = {
  kpiResults: IKpiResultGroup;
  metricType: EnumKpiMetricType | undefined;
  /** Required — used to find the single validated result */
  labValidatedAt: Date | null | undefined;
  /** Optional label override (used in KpiMultiple context for child KPI name) */
  label?: string;
  /** Optional KPI definition id for reading lookup */
  kpiDefinitionId?: number;
};

export function KpiBaselineValue({
  kpiResults,
  metricType,
  labValidatedAt,
  label,
  kpiDefinitionId,
}: Props) {
  // Find the single validated result — do NOT assume results[0].
  // The validated result is the one where lab.validated_at > result.updated_at.
  const result = kpiResults.results.find((r) =>
    isResultValidated(r, labValidatedAt),
  );
  if (!result) return null;

  const formattedValue = formatValue(result.value, metricType);
  const displayDate = formatMonthYear(result.date);

  // Attempt reading lookup using kpiDefinitionId or kpiResults.kpidefinition_id
  const lookupId = kpiDefinitionId ?? kpiResults.kpidefinition_id;
  const reading = lookupId != null ? getKpiReading(lookupId) : null;

  // Metadata: last updated
  const lastUpdatedDate = result.updated_at
    ? formatMonthYear(String(result.updated_at))
    : null;

  return (
    <div className="flex flex-col gap-2 py-4">
      {label && <p className="text-sm text-gray-600">{label}</p>}
      {reading && (
        <div className="text-xs text-gray-500 space-y-0.5 mb-1">
          {reading.reading !== "PLACEHOLDER — awaiting WP1 content" && (
            <p className="italic">{reading.reading}</p>
          )}
          <p>
            {reading.unit !== "?" && (
              <span className="font-medium">{reading.unit}</span>
            )}{" "}
            &middot; {formatDirection(reading.direction)}
          </p>
        </div>
      )}
      <div className="flex items-end gap-3">
        <h3 className="text-4xl font-extrabold text-gray-900 leading-none">
          {getFormattedValueString(formattedValue, metricType)}
        </h3>
        <p className="text-lg text-muted mb-0.5">{displayDate}</p>
      </div>
      <span className="text-xs italic text-gray-400">
        Baseline only — no follow-up yet
      </span>
      {lastUpdatedDate && (
        <span className="text-xs text-gray-400">
          Last updated: <span className="font-medium text-gray-600">{lastUpdatedDate}</span>
        </span>
      )}
    </div>
  );
}
