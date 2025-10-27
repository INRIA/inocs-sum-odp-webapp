import { Badge, type BadgeSize } from "./ui/Badge";

export type KpiScopes = "GLOBAL" | "LOCAL";

export interface KpiScopeBadgeProps {
  type?: KpiScopes;
  size?: BadgeSize;
}

export function KpiTypeBadge({
  type = "GLOBAL",
  size = "xs",
}: KpiScopeBadgeProps) {
  return (
    <Badge
      size={size}
      color={type === "GLOBAL" ? "light" : "dark"}
      className={""}
      aria-label={`${type} KPI badge`}
      inline={false}
    >
      {type}
    </Badge>
  );
}
