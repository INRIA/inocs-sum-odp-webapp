import React, { useState, useMemo } from "react";
import { AnalysisConditionsFilter } from "./AnalysisConditionsFilter";
import { MeasuresImpact } from "./MeasuresImpact";
import { KpiVariations } from ".";
import { PageNavigation } from "../ui/PageNavigation";
import type {
  IKpiGroup,
  IGroupAnalysisResult,
  IKpiVariationData,
  IJobRunOutputData,
} from "../../../types";

interface ImpactAnalysisDashboardProps {
  kpiGroups: IKpiGroup[];
  jobRunOutput: IJobRunOutputData | null;
  kpiVariationsData: Record<string, IKpiVariationData>;
}

export const ImpactAnalysisDashboard: React.FC<
  ImpactAnalysisDashboardProps
> = ({ kpiGroups, jobRunOutput, kpiVariationsData }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | number>();

  const handleGroupSelect = (groupId: string | number) => {
    setSelectedGroupId(groupId);
    const element = document.getElementById("kpis-in-group");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const selectedGroup =
    selectedGroupId !== null
      ? kpiGroups.find((g) => String(g.id) === String(selectedGroupId)) || null
      : null;

  // Find matching analysis result from output_data
  const analysisResult: IGroupAnalysisResult | null = useMemo(() => {
    if (!selectedGroupId || !jobRunOutput?.success) {
      return null;
    }

    const match = jobRunOutput.success.find(
      (item) =>
        String(item.group_id) === String(selectedGroupId) ||
        String(item.results.id) === String(selectedGroupId),
    );

    return match?.results || null;
  }, [selectedGroupId, jobRunOutput]);

  // Get variations data for selected group
  const selectedVariationsData: IKpiVariationData | null = useMemo(() => {
    if (!selectedGroupId) return null;
    return kpiVariationsData[String(selectedGroupId)] || null;
  }, [selectedGroupId, kpiVariationsData]);

  // Navigation sections configuration
  const navigationSections = [
    { id: "analysis-conditions-filter", label: "Conditions" },
    { id: "measures-impact", label: "Measures" },
    { id: "kpi-variations", label: "KPI Variations" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section id="analysis-conditions-filter"></section>
      <AnalysisConditionsFilter
        kpiGroups={kpiGroups}
        selectedGroupId={selectedGroupId}
        onGroupSelect={handleGroupSelect}
      />

      <section id="measures-impact"></section>
      <MeasuresImpact
        selectedGroup={selectedGroup}
        analysisResult={analysisResult}
        kpiCount={selectedVariationsData?.allKpiVariations.length || 0}
      />

      <section id="kpi-variations"></section>
      <KpiVariations
        selectedGroup={selectedGroup}
        variationsData={selectedVariationsData}
      />

      <PageNavigation
        sections={navigationSections}
        disclaimer="Analysis results are based on the selected KPI group and living lab conditions"
      />
    </div>
  );
};
