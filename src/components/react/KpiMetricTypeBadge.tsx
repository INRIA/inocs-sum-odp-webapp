import { EnumKpiMetricType } from "../../types";
import { Badge, type BadgeColor, type BadgeSize } from "./ui/Badge";

export interface KpiMetricTypeBadgeProps {
  //aligns with EnumKpiMetricType
  type?:
    | EnumKpiMetricType.PERCENTAGE
    | EnumKpiMetricType.RATIO
    | EnumKpiMetricType.ABSOLUTE
    | EnumKpiMetricType.CUSTOM_UNIT
    | EnumKpiMetricType.SCORE
    | EnumKpiMetricType.NONE;
  description?: string;
  size?: BadgeSize;
}

const colorsByType: Record<EnumKpiMetricType, BadgeColor> = {
  [EnumKpiMetricType.PERCENTAGE]: "primary",
  [EnumKpiMetricType.RATIO]: "secondary",
  [EnumKpiMetricType.ABSOLUTE]: "warning",
  [EnumKpiMetricType.CUSTOM_UNIT]: "light",
  [EnumKpiMetricType.SCORE]: "info",
  [EnumKpiMetricType.NONE]: "dark",
};

export function KpiMetricTypeBadge({
  type = EnumKpiMetricType.PERCENTAGE,
  description,
  size = "sm",
}: KpiMetricTypeBadgeProps) {
  return (
    <Badge
      size={size}
      color={colorsByType[type]}
      className={""}
      aria-label={`${type} KPI badge`}
    >
      {type} {!!description?.length && <span>: {description}</span>}
    </Badge>
  );
}
