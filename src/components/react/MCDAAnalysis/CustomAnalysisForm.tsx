import React, { useState } from "react";
import type { MCDAGoal } from "../../../types";
import { GoalsSection } from "./GoalsSection";
import { InfoAlert, RButton } from "../ui";
import ApiClient from "../../../lib/api-client/ApiClient";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";

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

  // Create API client instance inside component so it uses the mocked version in tests
  const api = new ApiClient();

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

    // 1. Validate weights: at least one goal must have a non-zero weight
    const hasPositiveWeight = currentGoals.some((g) => g.weight > 0);
    if (!hasPositiveWeight) {
      setWeightsError("At least one goal must have a non-zero weight");
      return;
    }

    // 2. Build goals_weights map from MCDAGoal[]
    const goals_weights: Record<string, number> = {};
    currentGoals.forEach((g) => {
      goals_weights[g.name] = g.weight;
    });

    // 3. Check normalization — sum should be approximately 1
    const sum = currentGoals.reduce((acc, g) => acc + g.weight, 0);
    const isNormalized = Math.abs(sum - 1) < 0.01;
    if (!isNormalized) {
      setWeightsError("Weights must sum to 100% before submitting.");
      return;
    }

    // 4. Generate name if empty
    let analysisName = name.trim();
    if (!analysisName) {
      // Find highest and lowest weighted goals
      const sortedGoals = [...currentGoals].sort((a, b) => b.weight - a.weight);
      const highestGoal = sortedGoals[0];
      const lowestGoal = sortedGoals[sortedGoals.length - 1];
      analysisName = `High ${highestGoal.name} and low ${lowestGoal.name}`;
    }

    // 5. Submit
    setLoading(true);

    try {
      const jobRunRes = await api.triggerJobRun(analysisName, goals_weights);

      if (!jobRunRes) {
        let errMsg = "Something went wrong. Please try again.";
        setError(errMsg);
        setLoading(false);
        return;
      }

      const id = jobRunRes.id;
      window.location.href = `/tools/mcda_analysis/user_personalized/${id}#results`;
    } catch (networkErr) {
      console.error("Network error in CustomAnalysisForm:", networkErr);
      setError(
        "A network error occurred. Please check your connection and try again.",
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2" noValidate>
      {/* Goals Weights Section */}
      <GoalsSection
        goals={currentGoals}
        editable={true}
        onWeightsUpdate={handleWeightsUpdate}
      />
      {weightsError && (
        <p className="text-sm text-danger" role="alert">
          {weightsError}
        </p>
      )}

      {/* Error Alert */}
      {error && <InfoAlert variant="danger">{error}</InfoAlert>}

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
      {/* Analysis Name Input */}
      <div className="space-y-0.5">
        <label htmlFor="analysis-name" className="block text-sm font-medium">
          Analysis Name (optional)
        </label>
        <Input
          id="analysis-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          disabled={isLoading}
          placeholder="e.g. Improve safety focus perspective"
          aria-label="Analysis Name (optional)"
          aria-describedby="analysis-name-hint"
        />
        {/* Privacy hint — always visible */}
        <small id="analysis-name-hint" className="text-xs text-gray-500">
          Do not include names, emails, or other identifying information.
        </small>
        {nameError && (
          <p className="text-sm text-danger" role="alert">
            {nameError}
          </p>
        )}
      </div>
      {/* Submit Button */}
      <RButton
        variant="primary"
        type="submit"
        disabled={isLoading}
        aria-label="Run Custom Analysis"
        className="w-full"
      >
        {isLoading ? "Submitting…" : "Run Custom Analysis"}
      </RButton>
    </form>
  );
};
