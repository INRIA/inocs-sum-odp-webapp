import React, { useState, useEffect } from "react";
import type { MCDAGoal } from "../../../types";
import { GoalWeightBar } from "./GoalWeightBar";

interface GoalsSectionProps {
  goals: MCDAGoal[];
  editable?: boolean;
  onWeightsUpdate?: (updatedGoals: MCDAGoal[]) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  editable = false,
  onWeightsUpdate,
}) => {
  // Local state for edited weights
  const [editedGoals, setEditedGoals] = useState<MCDAGoal[]>(goals);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with props when goals change
  useEffect(() => {
    setEditedGoals(goals);
    setHasChanges(false);
  }, [goals]);

  const handleWeightChange = (index: number, newWeight: number) => {
    const updatedGoals = [...editedGoals];
    updatedGoals[index] = { ...updatedGoals[index], weight: newWeight };
    setEditedGoals(updatedGoals);
    setHasChanges(true);
  };

  const normalizeWeights = (goalsToNormalize: MCDAGoal[]): MCDAGoal[] => {
    const sum = goalsToNormalize.reduce((acc, goal) => acc + goal.weight, 0);

    // If sum is 0, distribute equally
    if (sum === 0) {
      const equalWeight = 1 / goalsToNormalize.length;
      return goalsToNormalize.map((goal) => ({
        ...goal,
        weight: equalWeight,
      }));
    }

    // Normalize to sum to 1
    return goalsToNormalize.map((goal) => ({
      ...goal,
      weight: goal.weight / sum,
    }));
  };

  const handleValidate = () => {
    const normalizedGoals = normalizeWeights(editedGoals);
    setEditedGoals(normalizedGoals);
    setHasChanges(false);
    onWeightsUpdate?.(normalizedGoals);
  };

  const handleReset = () => {
    setEditedGoals(goals);
    setHasChanges(false);
  };

  const currentSum = editedGoals.reduce((acc, goal) => acc + goal.weight, 0);
  const sumPercentage = Math.round(currentSum * 100);
  const isNormalized = Math.abs(currentSum - 1) < 0.01;

  const displayGoals = editable ? editedGoals : goals;

  if (!displayGoals || displayGoals.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-gray-700">
          No goals available for this perspective.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Goals List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          {displayGoals.map((goal, index) => (
            <GoalWeightBar
              key={`${goal.name}-${index}`}
              goal={goal}
              editable={editable}
              value={goal.weight}
              onChange={(newValue) => handleWeightChange(index, newValue)}
            />
          ))}
        </div>

        {/* Edit Mode Controls */}
        {editable && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Sum Display */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">
                  Total weight:
                </span>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    isNormalized ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {sumPercentage}%
                </span>
                {!isNormalized && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Will be normalized to 100%
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Reset weights to original values"
                >
                  Reset
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!hasChanges}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary border border-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  aria-label="Validate and normalize weights"
                >
                  Validate
                </button>
              </div>
            </div>

            {/* Info message */}
            {hasChanges && (
              <div className="mt-4 flex gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>
                  Click <strong>Validate</strong> to apply changes. Weights will
                  be automatically normalized to sum to 100%.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Read-only info */}
      {!editable && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex gap-2">
            <svg
              className="w-5 h-5 text-gray-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>
              These weights represent the relative importance of each goal from
              the selected stakeholder's perspective. Total:{" "}
              <strong>{sumPercentage}%</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
