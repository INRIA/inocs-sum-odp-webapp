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
        title="Analysis Conditions"
        subtitle="Select the analysis conditions: KPI group"
        description="The KPIs have been grouped by scope of interest"
      />

      <div className="mt-6 flex flex-col items-center gap-2 lg:gap-4 content-center">
        <Tooltip
          content="The impact levels reported by this assessment tool are algorithmic estimates derived from implemented measures and observed KPI changes. They serve as indicative values and may not exactly reflect real-world outcomes"
          placement="top"
          tooltipClassName="w-full"
        >
          <h4 className="text-center">
            Available conditions for analysis
            <QuestionMarkCircleIcon className="inline-block w-6 h-6 ml-1 text-warning" />
          </h4>
        </Tooltip>

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
