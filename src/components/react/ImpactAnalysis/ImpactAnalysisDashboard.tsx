import React, { useState, useMemo } from "react";
import { AnalysisConditionsFilter } from "./AnalysisConditionsFilter";
import { MeasuresImpact } from "./MeasuresImpact";
import { KpiVariations } from ".";
import { RButton, Tabs } from "../ui";
import type {
  IKpiGroup,
  IGroupAnalysisResult,
  IKpiVariationData,
  IJobRunOutputData,
} from "../../../types";
import { PageNavigation } from "../ui/PageNavigation";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv";

const MEASURES_TAB_ID = "measures-impact";
const KPI_VARIATIONS_TAB_ID = "kpi-variations";

interface ImpactAnalysisDashboardProps {
  kpiGroups: IKpiGroup[];
  jobRunOutput: IJobRunOutputData | null;
  kpiVariationsData: Record<number, IKpiVariationData>;
  variationsByKpis: Record<number, IKpiVariationData>;
}

export const ImpactAnalysisDashboard: React.FC<
  ImpactAnalysisDashboardProps
> = ({ kpiGroups, jobRunOutput, kpiVariationsData, variationsByKpis }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number>();
  const [activeTabId, setActiveTabId] = useState<string>(MEASURES_TAB_ID);

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupId(groupId);
    setActiveTabId(MEASURES_TAB_ID);
    if (typeof window !== "undefined") {
      window.location.hash = "impact-results";
    }
  };

  const resetGroupSelection = () => {
    setSelectedGroupId(undefined);
    setActiveTabId(MEASURES_TAB_ID);
  };

  const selectedGroup =
    selectedGroupId !== null
      ? kpiGroups.find((g) => g.id === selectedGroupId) || null
      : null;

  // Find matching analysis result from output_data
  const analysisResult: IGroupAnalysisResult | null = useMemo(() => {
    if (!selectedGroupId || !jobRunOutput?.success) {
      return null;
    }

    const match = jobRunOutput.success.find(
      (item) =>
        item.group_id === selectedGroupId ||
        item.results.id === selectedGroupId,
    );

    return match?.results || null;
  }, [selectedGroupId, jobRunOutput]);

  // Get variations data for selected group
  const selectedVariationsData: IKpiVariationData | null = useMemo(() => {
    if (!selectedGroupId) return null;
    return kpiVariationsData[selectedGroupId] || null;
  }, [selectedGroupId, kpiVariationsData]);

  const navigationSections = [
    { id: "how-to", label: "Information about the tool" },
    { id: "impact-results", label: "Impact analysis results" },
  ];

  const contentTabs = useMemo(
    () => [
      {
        id: MEASURES_TAB_ID,
        label: "Linked measures",
        content: (
          <MeasuresImpact
            selectedGroup={selectedGroup}
            analysisResult={analysisResult}
            kpiCount={selectedVariationsData?.allKpiVariations.length || 0}
          />
        ),
      },
      {
        id: KPI_VARIATIONS_TAB_ID,
        label: "KPI Variations",
        content: (
          <KpiVariations
            selectedGroup={selectedGroup}
            variationsData={selectedVariationsData}
          />
        ),
      },
    ],
    [selectedGroup, analysisResult, selectedVariationsData],
  );

  const filterContent = (
    <AnalysisConditionsFilter
      kpiGroups={kpiGroups}
      selectedGroupId={selectedGroupId}
      onGroupSelect={handleGroupSelect}
      kpiVariationsData={kpiVariationsData}
      variationsByKpis={variationsByKpis}
    />
  );

  return (
    <div className="space-y-6">
      {selectedGroupId === undefined && (
        <div className="w-full">{filterContent}</div>
      )}
      {/* Desktop: two-column grid — sticky sidebar + tabbed content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
        {selectedGroupId !== undefined && (
          <aside className="sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto pr-2">
            {filterContent}
            <TriggerDownloadCsv
              type="kpi-results-category"
              category_id={selectedGroupId}
              size="md"
              className="mt-3 w-full"
            />
            <TriggerDownloadCsv
              type="projects-all"
              size="md"
              className="mt-3 w-full"
            />
            <RButton
              variant="primary"
              text="Change selection"
              onClick={resetGroupSelection}
              size="md"
              className="mt-3 w-full"
            />
          </aside>
        )}
        <section className="min-w-0">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {selectedVariationsData ? (
              <Tabs
                key={activeTabId}
                tabs={contentTabs}
                defaultTabId={activeTabId}
                onChange={setActiveTabId}
              />
            ) : (
              <p className="text-gray-500">
                Please select analysis conditions to view the results.
              </p>
            )}
          </div>
        </section>
      </div>

      <PageNavigation
        sections={navigationSections}
        disclaimer="The impact levels reported by this assessment tool are algorithmic estimates derived from implemented measures and observed KPI changes. They serve as indicative values and may not exactly reflect real-world outcomes."
      />
    </div>
  );
};
