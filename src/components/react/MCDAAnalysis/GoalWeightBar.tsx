import React, { useState } from "react";
import type { MCDAGoal } from "../../../types";

interface GoalWeightBarProps {
  goal: MCDAGoal;
  editable: boolean;
  value: number; // 0-1 range
  onChange?: (value: number) => void;
}

export const GoalWeightBar: React.FC<GoalWeightBarProps> = ({
  goal,
  editable,
  value,
  onChange,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const percentage = Math.round(value * 100);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange?.(newValue);
  };

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="w-full flex items-center justify-between">
        {/* Goal Name */}
        <span className="font-medium text-gray-900 text-left capitalize">{goal.name}</span>
        {/* Percentage Label */}
        <span className="text-sm font-semibold text-gray-700 tabular-nums">
          {percentage}%
        </span>
      </div>

      {/* Weight Bar / Slider */}
      <div className="flex-1 relative">
        {editable ? (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={value}
              onChange={handleSliderChange}
              className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider"
              aria-label={`Weight for ${goal.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
              aria-valuetext={`${percentage}%`}
              style={{
                background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`,
              }}
            />
            {/* Tooltip showing exact value */}
            {showTooltip && (
              <div
                className="absolute left-1/2 -translate-x-1/2 -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10"
                role="tooltip"
              >
                {percentage}% ({value.toFixed(2)})
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="relative h-4 bg-gray-200 rounded-lg overflow-hidden"
            role="progressbar"
            aria-label={`Weight for ${goal.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-valuetext={`${percentage}%`}
          >
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};
