import React, { useState, useEffect, useRef } from "react";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import type { MCDAGoal } from "../../../types";
import { GoalWeightBar } from "./GoalWeightBar";
import { DirectionToggle } from "./DirectionToggle";
import { RButton } from "../ui";

interface GoalsSectionProps {
  goals: MCDAGoal[];
  editable?: boolean;
  onWeightsUpdate?: (updatedGoals: MCDAGoal[]) => void;
  showDirectionToggle?: boolean;
}

const buildEqualWeightDistribution = (count: number): number[] => {
  if (count === 0) {
    return [];
  }

  const baseUnits = Math.floor(100 / count);
  const remainderUnits = 100 % count;

  return Array.from({ length: count }, (_, index) => {
    const units = baseUnits + (index < remainderUnits ? 1 : 0);
    return units / 100;
  });
};

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  editable = false,
  onWeightsUpdate,
  showDirectionToggle = false,
}) => {
  // Local state for edited weights
  const [editedGoals, setEditedGoals] = useState<MCDAGoal[]>(goals);
  const [hasChanges, setHasChanges] = useState(false);

  // Baseline goals for reset — updated only on external goal changes (e.g. stakeholder switch)
  const originalGoalsRef = useRef<MCDAGoal[]>(goals);
  // Flag to suppress useEffect reset when the goals prop change is our own echo-back
  const isOwnUpdateRef = useRef(false);

  // Sync with props when goals change
  useEffect(() => {
    if (isOwnUpdateRef.current) {
      // This update is the parent echoing back our own onWeightsUpdate call — ignore it
      isOwnUpdateRef.current = false;
      return;
    }
    // Genuinely external change (e.g. stakeholder switch) — reset to new baseline
    originalGoalsRef.current = goals;
    setEditedGoals(goals);
    setHasChanges(false);
  }, [goals]);

  // Notify parent of initial weights on mount
  useEffect(() => {
    if (editable && onWeightsUpdate) {
      onWeightsUpdate(goals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run only on mount

  const handleWeightChange = (index: number, newWeight: number) => {
    const updatedGoals = [...editedGoals];
    updatedGoals[index] = { ...updatedGoals[index], weight: newWeight };

    // Calculate the new sum
    const newSum = updatedGoals.reduce((acc, goal) => acc + goal.weight, 0);

    // Block if exceeds 100%
    if (newSum > 1) {
      return;
    }

    isOwnUpdateRef.current = true;
    setEditedGoals(updatedGoals);
    setHasChanges(true);
    onWeightsUpdate?.(updatedGoals);
  };

  const handleReset = () => {
    isOwnUpdateRef.current = true;
    setEditedGoals(originalGoalsRef.current);
    setHasChanges(false);
    onWeightsUpdate?.(originalGoalsRef.current);
  };

  const handleEqualWeights = () => {
    const equalWeights = buildEqualWeightDistribution(editedGoals.length);
    const updatedGoals = editedGoals.map((goal, index) => ({
      ...goal,
      weight: equalWeights[index],
    }));

    isOwnUpdateRef.current = true;
    setEditedGoals(updatedGoals);
    setHasChanges(true);
    onWeightsUpdate?.(updatedGoals);
  };

  const handleDirectionChange = (index: number, direction: "max" | "min") => {
    const updatedGoals = [...editedGoals];
    updatedGoals[index] = { ...updatedGoals[index], direction };
    isOwnUpdateRef.current = true;
    setEditedGoals(updatedGoals);
    setHasChanges(true);
    onWeightsUpdate?.(updatedGoals);
  };

  const currentSum = editedGoals.reduce((acc, goal) => acc + goal.weight, 0);
  const sumPercentage = Math.round(currentSum * 100);
  const isNormalized = Math.abs(currentSum - 1) < 0.01;

  const displayGoals = editable ? editedGoals : goals;

  const renderDirectionControl = (goal: MCDAGoal, index: number) => {
    if (!showDirectionToggle) {
      return undefined;
    }

    const direction = goal.direction || "max";

    if (editable) {
      return (
        <DirectionToggle
          direction={direction}
          onChange={(nextDirection) =>
            handleDirectionChange(index, nextDirection)
          }
        />
      );
    }

    return (
      <span
        className={`inline-flex items-center rounded-md border border-light px-2 py-1 text-xs font-medium whitespace-nowrap ${
          direction === "max"
            ? "bg-info/30 text-primary"
            : "bg-warning/20 text-warning"
        }`}
        aria-label={`Goal direction: ${
          direction === "max" ? "to maximize" : "to minimize"
        }`}
      >
        {direction === "max" ? "To maximize" : "To minimize"}
      </span>
    );
  };

  if (!displayGoals || displayGoals.length === 0) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 text-center">
        <p className="text-dark">No goals available for this perspective.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Goals List */}
      <div>
        {/* Edit Mode Controls */}
        {editable && (
          <div className="mt-3 pt-2 border-t border-light">
            <div className="flex flex-col items-end justify-between gap-4">
              {/* Sum Display */}
              <div className="flex items-center gap-3">
                <RButton
                  variant="link"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  text="Reset"
                ></RButton>
                <RButton
                  variant="link"
                  onClick={handleEqualWeights}
                  text="Equal weights"
                ></RButton>
                <p>Total :</p>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    isNormalized ? "text-secondary" : "text-warning"
                  }`}
                >
                  {sumPercentage}%
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {displayGoals.map((goal, index) => (
            <div key={`${goal.name}-${index}`} className="space-y-2">
              <GoalWeightBar
                goal={goal}
                editable={editable}
                value={goal.weight}
                onChange={(newValue) => handleWeightChange(index, newValue)}
                directionControl={renderDirectionControl(goal, index)}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Read-only info */}
      {!editable && (
        <div className="text-sm text-dark bg-light/40 border border-light rounded-lg p-4">
          <div className="flex gap-2">
            <InformationCircleIcon
              className="w-5 h-5 text-dark shrink-0"
              aria-hidden="true"
            />
            <p>
              These weights
              {showDirectionToggle ? " and optimization directions" : ""}{" "}
              represent the relative importance of each goal from the selected
              stakeholder's perspective. Total:{" "}
              <strong>{sumPercentage}%</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
