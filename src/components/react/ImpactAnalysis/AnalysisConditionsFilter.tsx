import React from "react";
import type { IKpiGroup } from "../../../types";
import { CardFilter, Tooltip } from "../ui";
import { AnalysisSectionDivider } from "../ui/AnalysisSectionDivider";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

interface AnalysisConditionsFilterProps {
  kpiGroups: IKpiGroup[];
  selectedGroupId?: string | number;
  onGroupSelect: (groupId: string | number) => void;
}

export const AnalysisConditionsFilter: React.FC<
  AnalysisConditionsFilterProps
> = ({ kpiGroups, selectedGroupId, onGroupSelect }) => {
  if (!kpiGroups || kpiGroups.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-gray-600">No KPI groups available for analysis.</p>
      </div>
    );
  }

  return (
    <div>
      <AnalysisSectionDivider
        step={1}
        title="Interest Domain for Analysis"
        // subtitle="Select the analysis conditions: KPI group"
        description="The KPIs have been grouped by scope of interest"
      />

      <div className="mt-6 flex flex-col items-center gap-2 lg:gap-4 content-center">
        <CardFilter
          groups={kpiGroups.map((group) => ({
            id: group.id,
            name: group.name,
            kpis: group.kpis ?? [],
          }))}
          selectedGroupId={selectedGroupId}
          onGroupSelect={onGroupSelect}
        />
      </div>
    </div>
  );
};
