import { EnumKpiMetricType } from "../../types";

export function formatMonthYear(dateStr?: string | null, short?: boolean) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: short ? "short" : "long",
    year: "numeric",
  });
}

export function getChange(
  before?: number | null,
  after?: number | null,
  type?: EnumKpiMetricType,
  progressionTarget?: number | null
) {
  if (
    before === undefined ||
    before === null ||
    after === undefined ||
    after === null
  )
    return "";
  if (before === 0) return "";
  const diff = after - before;
  let sign = "";
  if (progressionTarget === 1) {
    sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  } else if (progressionTarget === 0) {
    sign = diff < 0 ? "+" : diff > 0 ? "-" : "";
  }

  if (type === EnumKpiMetricType.PERCENTAGE) {
    const value = diff * 100;
    return `${sign}${Math.abs(value).toFixed(2)}%`;
  }
  if (type === EnumKpiMetricType.RATIO) {
    const value = diff;
    return `${sign}${Math.abs(value).toFixed(2)}x`;
  }
  // Default: FLAT
  const value = diff;
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

export function formatValue(value?: number | null, type?: EnumKpiMetricType) {
  if (value === undefined || value === null || Number.isNaN(value)) return 0;

  if (type === EnumKpiMetricType.PERCENTAGE) {
    return value * 100;
  }
  return value;
}

export function getFormattedValueString(
  value?: number | null,
  type?: EnumKpiMetricType
) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  if (type === EnumKpiMetricType.PERCENTAGE) {
    return `${value.toFixed(2)}%`;
  }
  if (type === EnumKpiMetricType.RATIO) {
    return `${value.toFixed(1)}x`;
  }

  return `${value.toFixed(2)}`;
}

// getRatioComparedToCar: returns an object with highlight text and whether it's less than cars (1)
export function getRatioComparedToCar(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return { highlight: "—", isLess: true };
  }
  const diffFlat = value - 1;
  const absFlat = Math.abs(diffFlat).toFixed(2);
  let sign = "";
  if (diffFlat < 0) {
    sign = "-";
  } else if (diffFlat > 0) {
    sign = "+";
  }
  // isLess means less than car (value < 1)
  return {
    highlight: `${sign}${absFlat}`,
    isLess: value < 1,
  };
}
