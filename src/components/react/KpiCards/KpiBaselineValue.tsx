import type { IKpiResultGroup, EnumKpiMetricType } from "../../../types/KPIs";
import { isResultValidated } from "../../../lib/utils/kpiSufficiency";
import {
  formatValue,
  formatMonthYear,
  getFormattedValueString,
} from "../../../lib/helpers";

type Props = {
  kpiResults: IKpiResultGroup;
  metricType: EnumKpiMetricType | undefined;
  /** Required — used to find the single validated result */
  labValidatedAt: Date | null | undefined;
  /** Optional label override (used in KpiMultiple context for child KPI name) */
  label?: string;
};

export function KpiBaselineValue({
  kpiResults,
  metricType,
  labValidatedAt,
  label,
}: Props) {
  // Find the single validated result — do NOT assume results[0].
  // The validated result is the one where lab.validated_at > result.updated_at.
  const result = kpiResults.results.find((r) =>
    isResultValidated(r, labValidatedAt),
  );
  if (!result) return null;

  const formattedValue = formatValue(result.value, metricType);
  const displayDate = formatMonthYear(result.date);

  return (
    <div className="flex flex-col gap-2 py-4">
      {label && <p className="text-sm text-gray-600">{label}</p>}
      <div className="flex items-end gap-3">
        <h3 className="text-4xl font-extrabold text-gray-900 leading-none">
          {getFormattedValueString(formattedValue, metricType)}
        </h3>
        <p className="text-lg text-muted mb-0.5">{displayDate}</p>
      </div>
      <span className="text-xs italic text-gray-400">
        Baseline only — no follow-up yet
      </span>
    </div>
  );
}
