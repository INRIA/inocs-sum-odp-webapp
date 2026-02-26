import React from "react";
import { Badge, type BadgeColor, type BadgeSize } from "./ui/Badge";
import { EnumTransportModeType } from "../../types";

type TransportModeType = keyof typeof EnumTransportModeType;
export interface TransportTypeBadgeProps {
  type?: TransportModeType;
  size?: BadgeSize;
}

export function TransportTypeBadge({
  type = "PUBLIC_TRANSPORT",
  size = "sm",
}: TransportTypeBadgeProps) {
  const config: Record<EnumTransportModeType, { color: BadgeColor; shortLabel: string; description: string }> = {
    [EnumTransportModeType.NSM]: {
      color: "success",
      shortLabel: "NSM",
      description: "New Mobility Service",
    },
    [EnumTransportModeType.PUBLIC_TRANSPORT]: {
      color: "info",
      shortLabel: "PT",
      description: "Public Transport",
    },
    [EnumTransportModeType.PRIVATE]: {
      color: "warning",
      shortLabel: "Private",
      description: "Private Transport (eg. car, bike)",
    },
  };
  return (
    <Badge
      size={size}
      color={config[type].color}
      className=""
      aria-label={`${type} KPI badge`}
      // tooltip={config[type].description}
    >
      {config[type].shortLabel}
    </Badge>
  );
}
