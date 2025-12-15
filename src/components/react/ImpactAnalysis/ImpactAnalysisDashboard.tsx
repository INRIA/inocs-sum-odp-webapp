import React, { useState } from "react";
import { AnalysisConditionsFilter } from "./AnalysisConditionsFilter";
import { MeasuresImpact } from "./MeasuresImpact";
import type { IKpiGroup } from "../../../types";

interface ImpactAnalysisDashboardProps {
  kpiGroups: IKpiGroup[];
}

export const ImpactAnalysisDashboard: React.FC<
  ImpactAnalysisDashboardProps
> = ({ kpiGroups }) => {
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

  return (
    <div className="flex flex-col gap-6">
      <AnalysisConditionsFilter
        kpiGroups={kpiGroups}
        selectedGroupId={selectedGroupId}
        onGroupSelect={handleGroupSelect}
      />

      <MeasuresImpact selectedGroup={selectedGroup} />
    </div>
  );
};
