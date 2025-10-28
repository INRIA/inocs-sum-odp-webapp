import React from "react";
import { Tooltip } from "./Tooltip";

export type BadgeColor =
  | "primary"
  | "info"
  | "secondary"
  | "warning"
  | "dark"
  | "light"
  | "transparent"
  | "success";
export type BadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface BadgeProps {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  size?: BadgeSize;
  color?: BadgeColor;
  className?: string;
  role?: string;
  "aria-label"?: string;
  tooltip?: string;
  displayTooltipIcon?: boolean;
  inline?: boolean;
  onClick?: () => void;
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  primary: "bg-primary text-light border-primary-ligh",
  info: "bg-primary-light text-primary border-primary",
  secondary: "bg-secondary text-primary border-primary",
  warning: "bg-warning text-primary border-primary",
  dark: "bg-dark text-light border-primary",
  light: "bg-light text-primary border-primary",
  transparent: "bg-transparent text-primary border-transparent",
  success: "bg-success text-primary border-primary",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: "p-0.5 text-[0.5rem]",
  sm: "p-0.5 text-xs",
  md: "p-1 text-sm",
  lg: "p-1.5 text-base",
  xl: "p-2 text-lg",
};

const ICON_WRAPPER: Record<BadgeSize, string> = {
  xs: "h-1 w-1",
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-7 w-7",
  xl: "h-10 w-10",
};

export function Badge({
  icon,
  children,
  size = "md",
  color = "secondary",
  className = "",
  role,
  tooltip,
  displayTooltipIcon = true,
  "aria-label": ariaLabel,
  inline = true,
  onClick,
}: BadgeProps) {
  const colorClass = COLOR_CLASSES[color] ?? COLOR_CLASSES.secondary;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const iconClass = ICON_WRAPPER[size] ?? ICON_WRAPPER.md;
  const displayStyle = inline ? "inline-flex" : "";

  const [displayTooltip, setDisplayTooltip] = React.useState(false);
  return (
    <button
      className={onClick !== undefined ? "cursor-pointer" : ""}
      onClick={onClick}
    >
      <span
        className={`items-center gap-2 rounded-full font-medium ${colorClass} ${sizeClass} ${className} ${displayStyle} border`}
        role={role}
        aria-label={ariaLabel}
        onMouseEnter={() => setDisplayTooltip(true)}
        onMouseLeave={() => setDisplayTooltip(false)}
      >
        {icon ? (
          <span className={iconClass} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {children}
        {displayTooltipIcon && !!tooltip?.length ? (
          <Tooltip content={tooltip} open={displayTooltip} />
        ) : null}
      </span>
    </button>
  );
}
