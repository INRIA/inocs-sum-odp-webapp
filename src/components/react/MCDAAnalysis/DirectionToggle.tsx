import React from "react";

type Direction = "max" | "min";

interface DirectionToggleProps {
  direction: Direction;
  onChange: (direction: Direction) => void;
  disabled?: boolean;
}

export const DirectionToggle: React.FC<DirectionToggleProps> = ({
  direction,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      className="inline-flex items-center rounded-md border border-light bg-white p-0.5"
      role="group"
      aria-label="Goal optimization direction"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("max")}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          direction === "max"
            ? "bg-info/30 text-primary"
            : "text-dark hover:bg-light/60"
        }`}
        aria-label="Set goal to maximize"
      >
        To maximize
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("min")}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          direction === "min"
            ? "bg-warning/20 text-warning"
            : "text-dark hover:bg-light/60"
        }`}
        aria-label="Set goal to minimize"
      >
        To minimize
      </button>
    </div>
  );
};