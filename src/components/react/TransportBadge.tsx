import React from "react";
import { Badge } from "./ui/Badge";
import { getUrl } from "../../lib/helpers";

export type TransportType =
  | "bus"
  | "bike"
  | "car"
  | "e-car"
  | "e-bus"
  | "metro"
  | "scooter"
  | "e-scooter"
  | "walking"
  | "car-sharing";

export interface TransportBadgeProps {
  name?: string; // transport mode name
  type?: TransportType; // selects the badge (default "bus")
  title?: React.ReactNode; // fallback to capitalized type
  icon?: React.ReactNode; // react node icon (preferred)
  iconSrc?: string; // string path fallback
  size?: "sm" | "md" | "lg" | "xl"; // controls padding/text/icon size
  className?: string;
  color?:
    | "primary-light"
    | "secondary"
    | "warning"
    | "dark"
    | "light"
    | "transparent";
}

const DEFAULT_ICONS: Record<string, string> = {
  bus: "/icons/bus.svg",
  bike: "/icons/cycling.svg",
  car: "/icons/car.svg",
  "car-sharing": "/icons/car.svg",
  "e-car": "/icons/e-car.svg",
  "e-bus": "/icons/e-bus.svg",
  metro: "/icons/metro.svg",
  scooter: "/icons/scooter.svg",
  "e-scooter": "/icons/e-scooter.svg",
  walking: "/icons/pedestrian.svg",
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function TransportBadge({
  name,
  type = "bus",
  title,
  icon,
  iconSrc,
  size = "md",
  className = "",
  color = "secondary",
}: TransportBadgeProps) {
  const resolvedTitle = title ?? capitalize(String(type));

  // prefer React node icon; fall back to iconSrc prop; finally fallback to DEFAULT_ICONS[type]
  const iconNode =
    icon ??
    (iconSrc ? (
      <img
        src={iconSrc}
        alt={`${String(type)} icon`}
        className="h-full w-full"
      />
    ) : DEFAULT_ICONS[type] ? (
      <img
        src={getUrl(DEFAULT_ICONS[type])}
        alt={`${String(type)} icon`}
        className="h-full w-full"
      />
    ) : null);

  const transportByName = name
    ? transportModes.find(
        (mode) => mode.name.toLowerCase() === name?.toLowerCase()
      )
    : null;

  if (transportByName) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Badge
          icon={
            <img
              src={getUrl(DEFAULT_ICONS[transportByName.icon])}
              alt={`${transportByName.name} icon`}
              className="h-full w-full"
            />
          }
          size={size}
          color={transportByName.color}
          className={className}
          aria-label={`${transportByName.name} transport badge`}
        ></Badge>
        <small> {transportByName.name}</small>
      </div>
    );
  }

  return (
    <Badge
      icon={iconNode}
      size={size}
      color={color}
      className={className}
      aria-label={`${resolvedTitle} transport badge`}
    >
      {resolvedTitle}
    </Badge>
  );
}

const transportModes = [
  {
    name: "Private Car",
    color: "#004494",
    icon: "car",
  },
  {
    name: "Motorcycle / Scooter",
    color: "#FF632F",
    icon: "scooter",
  },
  {
    name: "Carsharing",
    color: "#6FAE24",
    icon: "car-sharing",
  },
  {
    name: "Bicycle",
    color: "#81BF2D",
    icon: "bike",
  },
  {
    name: "E-scooter",
    color: "#98C33A",
    icon: "e-scooter",
  },
  {
    name: "Walking",
    color: "#DADADA",
    icon: "walking",
  },
  {
    name: "Micromobility",
    color: "#B4D952",
    icon: "bike",
  },
  {
    name: "Ride hailing",
    color: "#D0F06A",
    icon: "car-sharing",
  },
  {
    name: "Taxi",
    color: "#55910b",
    icon: "car-sharing",
  },
  {
    name: "Train",
    color: "#f97448",
    icon: "metro",
  },
  {
    name: "Bus",
    color: "#4797d8",
    icon: "bus",
  },
  {
    name: "Metro / Subway",
    color: "#75BDFB",
    icon: "metro",
  },
  {
    name: "Other",
    color: "#606060",
    icon: "walking",
  },
];
