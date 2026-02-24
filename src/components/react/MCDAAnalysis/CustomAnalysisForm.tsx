import React, { useState } from "react";
import type { MCDAGoal } from "../../../types";
import { GoalsSection } from "./GoalsSection";
import { InfoAlert } from "../ui";

interface CustomAnalysisFormProps {
  goals: MCDAGoal[];
  onLoadingChange?: (loading: boolean) => void;
}

export const CustomAnalysisForm: React.FC<CustomAnalysisFormProps> = ({
  goals,
  onLoadingChange,
}) => {
  const [name, setName] = useState("");
  const [currentGoals, setCurrentGoals] = useState<MCDAGoal[]>(goals);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [weightsError, setWeightsError] = useState<string | null>(null);

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
    onLoadingChange?.(loading);
  };

  const handleWeightsUpdate = (updatedGoals: MCDAGoal[]) => {
    setCurrentGoals(updatedGoals);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    // Clear previous errors
    setNameError(null);
    setWeightsError(null);
    setError(null);

    // 1. Validate name
    if (!name.trim()) {
      setNameError("Analysis name is required");
      return;
    }

    // 2. Validate weights: at least one goal must have a non-zero weight
    const hasPositiveWeight = currentGoals.some((g) => g.weight > 0);
    if (!hasPositiveWeight) {
      setWeightsError("At least one goal must have a non-zero weight");
      return;
    }

    // 3. Build goals_weights map from MCDAGoal[]
    const goals_weights: Record<string, number> = {};
    currentGoals.forEach((g) => {
      goals_weights[g.name] = g.weight;
    });

    // 4. Check normalization — sum should be approximately 1
    const sum = currentGoals.reduce((acc, g) => acc + g.weight, 0);
    const isNormalized = Math.abs(sum - 1) < 0.01;
    if (!isNormalized) {
      setWeightsError(
        "Please click 'Validate' to apply your weight changes before submitting.",
      );
      return;
    }

    // 5. Submit
    setLoading(true);

    try {
      const res = await fetch("/api/v1/job-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), goals_weights }),
      });

      if (!res.ok) {
        let errMsg = "Something went wrong. Please try again.";
        try {
          const data = await res.json() as { error?: string };
          if (data.error) errMsg = data.error;
        } catch {
          // ignore parse error
        }
        setError(errMsg);
        setLoading(false);
        return;
      }

      const data = (await res.json()) as { job_id: string };
      window.location.href = `/tools/mcda_analysis/results/${data.job_id}`;
    } catch (networkErr) {
      console.error("Network error in CustomAnalysisForm:", networkErr);
      setError("A network error occurred. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Analysis Name Input */}
      <div className="space-y-2">
        <label
          htmlFor="analysis-name"
          className="block text-sm font-medium text-gray-700"
        >
          Analysis Name
        </label>
        <input
          id="analysis-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          disabled={isLoading}
          placeholder="e.g. Urban mobility priorities — Geneva pilot"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
          aria-label="Analysis Name"
          aria-describedby="analysis-name-hint"
        />
        {/* Privacy hint — always visible */}
        <p
          id="analysis-name-hint"
          className="text-xs text-gray-500"
        >
          Your analysis name is not linked to any personal identity. Do not
          include names, emails, or other identifying information.
        </p>
        {nameError && (
          <p className="text-sm text-red-600" role="alert">
            {nameError}
          </p>
        )}
      </div>

      {/* Goals Weights Section */}
      <GoalsSection
        goals={currentGoals}
        editable={true}
        onWeightsUpdate={handleWeightsUpdate}
      />
      {weightsError && (
        <p className="text-sm text-red-600" role="alert">
          {weightsError}
        </p>
      )}

      {/* Error Alert */}
      {error && (
        <InfoAlert variant="danger">
          {error}
        </InfoAlert>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div
          data-testid="loading-indicator"
          className="flex items-center gap-2 text-sm text-blue-600"
          aria-live="polite"
          aria-label="Submitting analysis"
        >
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Submitting analysis…</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        aria-label="Run Custom Analysis"
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Submitting…" : "Run Custom Analysis"}
      </button>
    </form>
  );
};
