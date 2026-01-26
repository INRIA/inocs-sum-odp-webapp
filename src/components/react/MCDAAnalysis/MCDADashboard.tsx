import React from "react";
import type { IKpiGroup, MCDAGoal, McdaResults } from "../../../types";
import { ResultsSection } from "./ResultsSection";
import { GoalsSection } from "./GoalsSection";
import { AnalysisSectionDivider, CardFilter } from "../ui";
import { PageNavigation } from "../ui/PageNavigation";

interface MCDADashboardProps {
  perspectives?: { [key: string]: string };
  selectedPerspective?: string;
  goals: MCDAGoal[];
  mcdaResults?: McdaResults | null;
  // Additional MCDA-specific data can be added here as the feature develops
  [key: string]: any;
}

export const MCDADashboard: React.FC<MCDADashboardProps> = ({
  perspectives,
  selectedPerspective,
  goals,
  mcdaResults,
}) => {
  // Initialize with first group or empty
  const perspectivesGroups: IKpiGroup[] = perspectives
    ? Object.entries(perspectives).map(([key, name]) => ({
        id: key,
        name,
      }))
    : [];

  const selectedGroup = perspectivesGroups.find(
    (group) => group.id === selectedPerspective,
  );

  const onGroupSelectRedirectToPerspective = (groupId: string | number) => {
    const groupIdStr = String(groupId);
    // Redirect to the same page with the selected perspective
    const newUrl = `/tools/mcda_analysis/${groupIdStr}#perspectives`;
    window.location.href = newUrl;
  };

  const navigationSections = [
    { id: "perspectives", label: "Perspectives" },
    { id: "goals", label: "Goals" },
    { id: "results", label: "Results" },
  ];
  return (
    <div className="space-y-12">
      {/* Step 1: Perspectives - Select Stakeholder Perspective */}
      <section id="perspectives" className="space-y-6">
        <AnalysisSectionDivider
          step={1}
          title="Perspectives"
          subtitle="Select the stakeholder perspective"
          description="Choose which stakeholder's point of view you want the analysis to reflect"
        />
        <CardFilter
          groups={perspectivesGroups}
          selectedGroupId={selectedPerspective}
          onGroupSelect={onGroupSelectRedirectToPerspective}
        />
      </section>
      {/* Step 2: Goals - Define Analysis Parameters */}
      <section id="goals" className="space-y-6">
        <AnalysisSectionDivider
          step={2}
          title="Goals"
          subtitle="Observe the goals and their priorities"
          description="See the list of project goals and how important each one is for your selected perspective"
        />
        {selectedPerspective ? (
          <GoalsSection goals={goals} editable={false} />
        ) : (
          <p className="text-gray-600 mt-4">
            Please select a stakeholder perspective above to view their goals.
          </p>
        )}
      </section>

      {/* Step 3: Results (placeholder for future implementation) */}
      <section id="results" className="space-y-6">
        <AnalysisSectionDivider
          step={3}
          title="Results"
          subtitle="View analysis outcomes"
          description="Review the analysis outcomes and recommendations"
        />
        {selectedPerspective && mcdaResults && (
          <ResultsSection
            selectedGroupId={selectedPerspective}
            selectedGroup={selectedGroup}
            mcdaResults={mcdaResults}
          />
        )}
      </section>

      <PageNavigation
        sections={navigationSections}
        disclaimer="These results are based on collected data and scientific comparison methods (PROMETHEE and GAIA) to help explore and understand policy options. They are not predictions or advice and do not reflect all real-world conditions, constraints, or uncertainties. Different data or priorities may lead to different results."
      />
    </div>
  );
};
