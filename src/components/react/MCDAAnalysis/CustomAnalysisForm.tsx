import React, { useEffect, useMemo, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import type { CustomMCDAPayload, MCDAGoal } from "../../../types";
import { AnalysisSectionDivider, InfoAlert, RButton } from "../ui";
import ApiClient from "../../../lib/api-client/ApiClient";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";
import { GoalsSection } from "./GoalsSection";
import { ChipSelector } from "./ChipSelector";
import { ScoreMatrix } from "./ScoreMatrix";
import { CustomHelpToolTip } from "./CustomHelpToolTip";

interface CustomAnalysisFormProps {
  defaultGoals: string[];
  defaultActivities: string[];
  onLoadingChange?: (loading: boolean) => void;
}

const normalizeLabel = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const createGoal = (name: string): MCDAGoal => ({
  name,
  weight: 0,
  direction: "max",
});

export const CustomAnalysisForm: React.FC<CustomAnalysisFormProps> = ({
  defaultGoals,
  defaultActivities,
  onLoadingChange,
}) => {
  const api = new ApiClient();

  const [analysisNameInput, setAnalysisNameInput] = useState("");
  const [availableGoals, setAvailableGoals] = useState<string[]>(defaultGoals);
  const [availableActivities, setAvailableActivities] =
    useState<string[]>(defaultActivities);
  const [selectedGoals, setSelectedGoals] = useState<MCDAGoal[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(
    {},
  );
  const [goalMeasurementNotes, setGoalMeasurementNotes] = useState<
    Record<string, string>
  >({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [weightsError, setWeightsError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setAvailableGoals(defaultGoals);
  }, [defaultGoals]);

  useEffect(() => {
    setAvailableActivities(defaultActivities);
  }, [defaultActivities]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    setScores((previousScores) => {
      const nextScores: Record<string, Record<string, number>> = {};
      selectedActivities.forEach((activity) => {
        nextScores[activity] = {};
        selectedGoals.forEach((goal) => {
          const existingValue = previousScores[activity]?.[goal.name];
          nextScores[activity][goal.name] = Number.isFinite(existingValue)
            ? existingValue
            : Number.NaN;
        });
      });
      return nextScores;
    });
  }, [selectedActivities, selectedGoals]);

  const weightSum = useMemo(
    () => selectedGoals.reduce((sum, goal) => sum + goal.weight, 0),
    [selectedGoals],
  );

  const selectedGoalNames = useMemo(
    () => selectedGoals.map((goal) => goal.name),
    [selectedGoals],
  );
  const selectedGoalNamesKey = useMemo(
    () => selectedGoalNames.join("\u0000"),
    [selectedGoalNames],
  );

  useEffect(() => {
    setGoalMeasurementNotes((previousNotes) => {
      const nextNotes: Record<string, string> = {};

      selectedGoalNames.forEach((goalName) => {
        nextNotes[goalName] = previousNotes[goalName] ?? "";
      });

      return nextNotes;
    });
  }, [selectedGoalNames, selectedGoalNamesKey]);

  const setLoading = (nextLoading: boolean) => {
    setIsLoading(nextLoading);
  };

  const clearValidationErrors = () => {
    setError(null);
    setGoalsError(null);
    setWeightsError(null);
    setActivitiesError(null);
    setScoresError(null);
    setNameError(null);
  };

  const addCustomGoal = (goalName: string) => {
    const normalizedGoalName = normalizeLabel(goalName);
    if (!normalizedGoalName) return;

    setAvailableGoals((previous) => [...previous, normalizedGoalName]);
    setSelectedGoals((previous) => [
      ...previous,
      createGoal(normalizedGoalName),
    ]);
  };

  const addCustomActivity = (activityName: string) => {
    const normalizedActivityName = normalizeLabel(activityName);
    if (!normalizedActivityName) return;

    setAvailableActivities((previous) => [...previous, normalizedActivityName]);
    setSelectedActivities((previous) => [...previous, normalizedActivityName]);
  };

  const toggleGoal = (goalName: string) => {
    setSelectedGoals((previous) => {
      const exists = previous.some((goal) => goal.name === goalName);
      if (exists) {
        return previous.filter((goal) => goal.name !== goalName);
      }
      return [...previous, createGoal(goalName)];
    });
  };

  const toggleActivity = (activityName: string) => {
    setSelectedActivities((previous) => {
      const exists = previous.includes(activityName);
      if (exists) {
        return previous.filter((activity) => activity !== activityName);
      }
      return [...previous, activityName];
    });
  };

  const handleWeightsUpdate = (updatedGoals: MCDAGoal[]) => {
    setSelectedGoals(updatedGoals);
  };

  const handleScoreChange = (activity: string, goal: string, value: number) => {
    setScores((previous) => ({
      ...previous,
      [activity]: {
        ...previous[activity],
        [goal]: value,
      },
    }));
  };

  const handleGoalMeasurementNoteChange = (goal: string, value: string) => {
    setGoalMeasurementNotes((previous) => ({
      ...previous,
      [goal]: value,
    }));
  };

  const hasCompleteScores = (): boolean => {
    return selectedActivities.every((activity) =>
      selectedGoalNames.every((goalName) =>
        Number.isFinite(scores[activity]?.[goalName]),
      ),
    );
  };

  const resolveAnalysisName = (): string => {
    const typedName = normalizeLabel(analysisNameInput);
    if (typedName.length > 120) {
      setNameError("Analysis name must be 120 characters or less.");
      return "";
    }

    if (typedName) return typedName;

    const sortedGoals = [...selectedGoals].sort((a, b) => b.weight - a.weight);
    const highestGoal = sortedGoals[0];
    const lowestGoal = sortedGoals[sortedGoals.length - 1];
    return `High ${highestGoal.name} and low ${lowestGoal.name}`;
  };

  const buildPayload = (analysisName: string): CustomMCDAPayload => {
    const goals = selectedGoals.map((goal) => ({
      name: goal.name,
      weight: goal.weight,
      direction: goal.direction || "max",
    }));

    const alternatives = selectedActivities.map((activity) => ({
      name: activity,
      values: selectedGoalNames.reduce<Record<string, number>>(
        (acc, goalName) => {
          acc[goalName] = scores[activity][goalName];
          return acc;
        },
        {},
      ),
    }));

    return {
      name: analysisName,
      goals,
      alternatives,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    clearValidationErrors();

    if (selectedGoals.length === 0) {
      setGoalsError("Select at least one goal.");
      return;
    }

    const hasPositiveWeight = selectedGoals.some((goal) => goal.weight > 0);
    if (!hasPositiveWeight) {
      setWeightsError("At least one goal must have a non-zero weight.");
      return;
    }

    if (Math.abs(weightSum - 1) >= 0.01) {
      setWeightsError("Weights must sum to 100% before submitting.");
      return;
    }

    if (selectedActivities.length === 0) {
      setActivitiesError("Select at least one business activity.");
      return;
    }

    if (!hasCompleteScores()) {
      setScoresError("Please fill in all score values in the matrix.");
      return;
    }

    const analysisName = resolveAnalysisName();
    if (!analysisName) return;

    const payload = buildPayload(analysisName);

    setLoading(true);
    try {
      const response = await api.triggerFullCustomMCDA(payload);
      if (!response) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = `/tools/mcda_analysis/user_personalized/${response.id}#results`;
    } catch (submitError) {
      console.error("Network error in CustomAnalysisForm:", submitError);
      setError(
        "An error occurred, most likely due to rate limiting. Please wait a moment and try again.",
      );
      setLoading(false);
    }
  };

  const hasAnyError =
    Boolean(error) ||
    Boolean(goalsError) ||
    Boolean(weightsError) ||
    Boolean(activitiesError) ||
    Boolean(scoresError) ||
    Boolean(nameError);
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className="space-y-2">
        <div className="flex items-start  justify-between gap-3">
          <AnalysisSectionDivider
            step={1}
            title="Goals Selection"
            description="Select your goals or add custom goals"
          />
          <CustomHelpToolTip
            className="mt-1"
            title="Step 1 — Goals"
            variant="info"
          >
            <p className="mb-2">
              A default list of goals from the SUM project assessment is
              provided. Tick the boxes to select goals or add your own.
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Keep goals independent, to avoid overlapping criteria such as
                &ldquo;cost&rdquo; and &ldquo;budget impact&rdquo; unless both
                are truly necessary.
              </li>
              <li>
                Use consistent wording so that everyone scoring activities
                interprets each goal the same way.
              </li>
            </ul>
          </CustomHelpToolTip>
        </div>
        <ChipSelector
          availableItems={availableGoals}
          selectedItems={selectedGoalNames}
          onToggle={toggleGoal}
          onAddCustom={addCustomGoal}
          availableLabel="Available Goals"
          selectedCountBadgeColor="secondary"
          customInputPlaceholder="Add custom goal..."
          addButtonLabel="Add goal"
          disabled={isLoading}
        />
        {goalsError && (
          <p className="text-sm text-danger" role="alert">
            {goalsError}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <AnalysisSectionDivider
            step={2}
            title="Goal Weights"
            description="Assign relative importance and optimization direction"
          />
          <CustomHelpToolTip
            className="mt-1"
            title="Step 2 — Weights"
            variant="info"
          >
            <p className="mb-2">
              Use sliders to set the relative importance of each goal. Weights
              must sum to 100%, to raise one, lower another first.
            </p>
            <p className="mb-2">
              A goal with weight 0.30 influences the final ranking twice as much
              as a goal with weight 0.15.
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong>Equal weights</strong> for neutral starting point, no goal
                is prioritised.
              </li>
              <li>
                <strong>Stakeholder-driven weights</strong> for reflecting a specific
                perspective or a group consensus.
              </li>
              <li>
                <strong>Preset profiles</strong> for selecting a pre-configured set
                built from interviews with SUM project stakeholders.
              </li>
            </ul>
          </CustomHelpToolTip>
        </div>
        {selectedGoals.length === 0 ? (
          <p className="text-lg italic text-muted">
            Select goals first to assign weights.
          </p>
        ) : (
          <GoalsSection
            goals={selectedGoals}
            editable={true}
            showDirectionToggle={true}
            onWeightsUpdate={handleWeightsUpdate}
          />
        )}
        {weightsError && (
          <p className="text-sm text-danger" role="alert">
            {weightsError}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <AnalysisSectionDivider
            step={3}
            title="Business Activities"
            description="Select alternatives to compare"
          />
          <CustomHelpToolTip
            className="mt-1"
            title="Step 3 — Alternatives"
            variant="info"
          >
            <p className="mb-2">
              Define what you want to compare. A default set of business
              activities from the SUM project is provided. Choose from the list, add, or remove
              entries as needed.
            </p>
            <p>
              Alternatives should be <strong>of the same type</strong>: compare
              mobility services with other mobility services, policies with
              policies, etc. Mixing incomparable types will make scores
              meaningless.
            </p>
          </CustomHelpToolTip>
        </div>
        <ChipSelector
          availableItems={availableActivities}
          selectedItems={selectedActivities}
          onToggle={toggleActivity}
          onAddCustom={addCustomActivity}
          availableLabel="Available Activities"
          selectedCountBadgeColor="secondary"
          customInputPlaceholder="Add custom activity..."
          addButtonLabel="Add activity"
          disabled={isLoading}
        />
        {activitiesError && (
          <p className="text-sm text-danger" role="alert">
            {activitiesError}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <AnalysisSectionDivider
            step={4}
            title="Score Matrix"
            description="Provide one score for each activity-goal pair"
          />
          <CustomHelpToolTip
            className="mt-1"
            title="Step 4 — Scoring"
            variant="info"
          >
            <p className="mb-2">
              Score each alternative on every goal. All cells must be filled
              before submitting.
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Both qualitative and quantitative scales are supported (e.g. 1–5
                for acceptance, 0–500 gCO₂eq for emissions).
              </li>
              <li>
                Use the <strong>same scale for all alternatives</strong> within
                a single goal — the method compares relative performance, so
                mixing units within a goal will distort results.
              </li>
            </ul>
          </CustomHelpToolTip>
        </div>
        <ScoreMatrix
          goals={selectedGoalNames}
          alternatives={selectedActivities}
          scores={scores}
          goalMeasurementNotes={goalMeasurementNotes}
          onScoreChange={handleScoreChange}
          onGoalMeasurementNoteChange={handleGoalMeasurementNoteChange}
          disabled={isLoading}
        />
        {scoresError && (
          <p className="text-sm text-danger" role="alert">
            {scoresError}
          </p>
        )}
      </section>

      {error && <InfoAlert variant="danger">{error}</InfoAlert>}

      {isLoading && (
        <div
          data-testid="loading-indicator"
          className="flex items-center gap-2 text-sm text-primary"
          aria-live="polite"
          aria-label="Submitting analysis"
        >
          <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Submitting analysis...</span>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="analysis-name" className="block text-sm font-medium">
          Analysis Name (optional)
        </label>
        <Input
          id="analysis-name"
          type="text"
          value={analysisNameInput}
          onChange={(event) => setAnalysisNameInput(event.target.value)}
          maxLength={120}
          disabled={isLoading}
          placeholder="e.g. Balanced sustainability and cost scenario"
          aria-label="Analysis Name (optional)"
          aria-describedby="analysis-name-hint"
        />
        <small id="analysis-name-hint" className="text-muted">
          Do not include names, emails, or other identifying information.
        </small>
        {nameError && (
          <p className="text-sm text-danger" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <RButton
        variant="primary"
        type="submit"
        disabled={isLoading}
        aria-label="Run Custom Analysis"
        className="w-full"
      >
        {isLoading ? "Submitting..." : "Run Custom Analysis"}
      </RButton>
      {hasAnyError && (
        <p className="text-sm text-danger" role="alert">
          Please correct the highlighted errors above and try again.
        </p>
      )}
    </form>
  );
};
