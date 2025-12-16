import React, { useState, useMemo } from "react";
import { AnalysisConditionsFilter } from "./AnalysisConditionsFilter";
import { MeasuresImpact } from "./MeasuresImpact";
import type { IKpiGroup, IJobRun, IGroupAnalysisResult } from "../../../types";

interface ImpactAnalysisDashboardProps {
  kpiGroups: IKpiGroup[];
  jobRun: IJobRun | null;
}

export const ImpactAnalysisDashboard: React.FC<
  ImpactAnalysisDashboardProps
> = ({ kpiGroups, jobRun }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<
    string | number | null
  >(null);

  const handleGroupSelect = (groupId: string | number) => {
    setSelectedGroupId(groupId);
  };

  const selectedGroup =
    selectedGroupId !== null
      ? kpiGroups.find((g) => String(g.id) === String(selectedGroupId)) || null
      : null;

  // Find matching analysis result from output_data
  const analysisResult: IGroupAnalysisResult | null = useMemo(() => {
    if (!selectedGroupId || !jobRun?.output_data?.success) {
      return null;
    }

    const match = jobRun.output_data.success.find(
      (item) =>
        String(item.group_id) === String(selectedGroupId) ||
        String(item.results.id) === String(selectedGroupId)
    );

    return match?.results || null;
  }, [selectedGroupId, jobRun]);

  return (
    <div className="flex flex-col gap-6">
      <AnalysisConditionsFilter
        kpiGroups={kpiGroups}
        selectedGroupId={selectedGroupId}
        onGroupSelect={handleGroupSelect}
      />

      <MeasuresImpact
        selectedGroup={selectedGroup}
        analysisResult={analysisResult}
      />
    </div>
  );
};
