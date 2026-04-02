import React, { useState } from "react";
import type {
  IKpiDefinition,
  MCDAGoal,
  McdaKeyInsightCard,
  McdaResults,
  OutrankingGraphData,
} from "../../../types";
import { ResultsSection } from "./ResultsSection";
import { GoalsSection } from "./GoalsSection";
import { AnalysisSectionDivider, CardFilter } from "../ui";
import { PageNavigation } from "../ui/PageNavigation";

interface MCDADashboardProps {
  analysisType: string;
  perspectives?: { [key: string]: string };
  selectedPerspective?: string;
  goals: MCDAGoal[];
  mcdaResults?: McdaResults | null;
  outrankingGraphData?: OutrankingGraphData;
  mcdaKeyInsights?: McdaKeyInsightCard[];
  enableCustomAnalysis?: boolean;
  // Additional MCDA-specific data can be added here as the feature develops
  [key: string]: any;
}

type PerspectiveGroup = {
  id: number;
  slug: string;
  name: string;
  kpis: IKpiDefinition[];
};

export const MCDADashboard: React.FC<MCDADashboardProps> = ({
  analysisType,
  perspectives,
  selectedPerspective,
  goals,
  mcdaResults,
  outrankingGraphData,
  mcdaKeyInsights,
}) => {
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const navigationSections = [
    { id: "how-to", label: "Information about the tool" },
    { id: "mcda-results", label: "MCDA results and insights" },
  ];
  // Initialize with first group or empty
  const perspectivesGroups: PerspectiveGroup[] = perspectives
    ? Object.entries(perspectives).map(([key, name], index) => ({
        id: index + 1,
        slug: key,
        name,
        kpis: [],
      }))
    : [];
  const selectedPerspectiveId = perspectivesGroups.find(
    (group) => group.slug === selectedPerspective,
  )?.id;

  const selectedGroup = perspectivesGroups.find(
    (group) => group.id === selectedPerspectiveId,
  );

  const onGroupSelectRedirectToPerspective = (groupId: number) => {
    const selectedPerspectiveGroup = perspectivesGroups.find(
      (group) => group.id === groupId,
    );
    if (!selectedPerspectiveGroup) return;

    // Redirect to the same page with the selected perspective
    const newUrl = `/tools/mcda_analysis/${analysisType}/${selectedPerspectiveGroup.slug}#results`;
    window.location.href = newUrl;
  };

  const configurationContent = (
    <div className="space-y-4">
      <section id="perspectives" className="space-y-1">
        <AnalysisSectionDivider
          step={1}
          title="Perspectives"
          // subtitle="Select the stakeholder perspective"
          description="Choose which stakeholder's point of view you want the analysis to reflect"
        />
        <CardFilter
          groups={perspectivesGroups}
          selectedGroupId={selectedPerspectiveId}
          onGroupSelect={onGroupSelectRedirectToPerspective}
        />
      </section>

      <section id="goals" className="space-y-1">
        <AnalysisSectionDivider
          step={2}
          title="Goals"
          // subtitle="Observe the goals and their priorities"
          description="How important each goal is for your selected perspective"
        />
        {selectedPerspective ? (
          <GoalsSection goals={goals} editable={false} />
        ) : (
          <p className="text-gray-600 mt-4">
            Please select a stakeholder perspective above to view their goals.
          </p>
        )}
      </section>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsConfigDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <span>⚙️</span>
          <span>Open Configuration</span>
        </button>
      </div>

      {isConfigDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close configuration drawer"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsConfigDrawerOpen(false)}
          />

          <aside className="relative h-full w-[92%] max-w-md overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Configuration
              </h3>
              <button
                type="button"
                aria-label="Close configuration drawer panel"
                onClick={() => setIsConfigDrawerOpen(false)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {configurationContent}
          </aside>
        </div>
      )}

      <div
        id="mcda-results"
        className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_minmax(0,1fr)]"
      >
        <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto pr-2">
          {configurationContent}
        </aside>

        <section className="space-y-6 min-w-0">
          <AnalysisSectionDivider
            step={3}
            title="Results"
            // subtitle="View analysis outcomes"
            description="Review the analysis outcomes and recommendations"
          />
          {selectedPerspective && mcdaResults ? (
            <ResultsSection
              selectedGroup={selectedGroup}
              mcdaResults={mcdaResults}
              outrankingGraphData={outrankingGraphData}
              mcdaKeyInsights={mcdaKeyInsights}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
              Please select a stakeholder perspective to view results.
            </div>
          )}
        </section>
      </div>

      <PageNavigation
        sections={navigationSections}
        disclaimer="The rankings and recommendations shown are derived from rigorous methodology and expert data, but they do not guarantee actual performance in your city or region. Factors such as local regulations, infrastructure, culture, and stakeholder engagement can all impact real-world results. Please use this information in conjunction with local expertise and detailed feasibility assessment."
      />
    </div>
  );
};
