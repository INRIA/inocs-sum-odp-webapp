import React from "react";
import { getVariationColor } from "../../../lib/helpers/impact-analysis-format";
import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  EqualsIcon,
} from "@heroicons/react/24/outline";

interface KpiVariationCardProps {
  title: string;
  subtitle?: string;
  value: string; // Formatted percentage string
  description?: string;
  size?: "small" | "medium";
  ratioValue?: number | null; // Raw ratio for color determination
}

export const KpiVariationCard: React.FC<KpiVariationCardProps> = ({
  title,
  subtitle,
  value,
  description,
  size = "medium",
  ratioValue,
}) => {
  const numericValue = Number.parseFloat(value.replace("%", "").trim());
  const hasNumericValue = Number.isFinite(numericValue);
  const isNeutral =
    ratioValue === 0 || (!ratioValue && hasNumericValue && numericValue === 0);
  const color = getVariationColor(ratioValue ?? null);
  const isPositive =
    ratioValue !== null && ratioValue !== undefined && ratioValue > 0;
  const isNegative =
    ratioValue !== null && ratioValue !== undefined && ratioValue < 0;

  // Gradient backgrounds
  const gradientClass = isNeutral
    ? "from-warning/10 to-warning/60"
    : isPositive
      ? "from-success/10 to-success/60"
      : isNegative
        ? "from-danger/10 to-danger/60"
        : "from-dark/10 to-dark/60";

  const borderClass = isNeutral
    ? "border-warning/40"
    : isPositive
      ? "border-success/40"
      : isNegative
        ? "border-danger/40"
        : "border-dark/40";

  const valueTextClass = isNeutral
    ? "text-warning"
    : isPositive
      ? "text-success"
      : isNegative
        ? "text-danger"
        : "text-dark";

  if (size === "small") {
    return (
      <div
        className={`bg-linear-to-br ${gradientClass} rounded-lg p-4 border-2 ${borderClass} shadow-sm hover:shadow-md transition-shadow`}
      >
        <div className="flex flex-col gap-1">
          <p className=" truncate whitespace-pre-wrap">{title}</p>
          {subtitle && (
            <small className="truncate whitespace-pre-wrap">{subtitle}</small>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${valueTextClass}`}
              style={{ color }}
            >
              {value}
            </span>
            {isPositive && (
              <ArrowUpCircleIcon className="w-5 h-5 text-success" />
            )}
            {isNegative && (
              <ArrowDownCircleIcon className="w-5 h-5 text-danger" />
            )}
            {isNeutral && <EqualsIcon className="w-5 h-5 text-warning" />}
          </div>
        </div>
      </div>
    );
  }

  // Medium size
  return (
    <div
      className={`bg-linear-to-br ${gradientClass} rounded-xl p-6 border-2 ${borderClass} shadow-md hover:shadow-lg transition-shadow`}
    >
      <div className="flex flex-col gap-3">
        <h5 className="whitespace-pre-wrap">{title}</h5>
        {subtitle && <h6 className="whitespace-pre-wrap">{subtitle}</h6>}
        <div className="flex items-center gap-3">
          <h3 className={valueTextClass} style={{ color }}>
            {value}
          </h3>
          {isPositive && <ArrowUpCircleIcon className="w-8 h-8 text-success" />}
          {isNegative && (
            <ArrowDownCircleIcon className="w-8 h-8 text-danger" />
          )}
          {isNeutral && <EqualsIcon className="w-8 h-8 text-warning" />}
        </div>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
};
