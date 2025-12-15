import React from "react";
import type { IKpiGroup } from "../../../types";
import { InfoAlert, InfoCard, Tooltip } from "../ui";
import { AnalysisSectionDivider } from "../AnalysisSectionDivider";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

interface AnalysisConditionsFilterProps {
  kpiGroups: IKpiGroup[];
  selectedGroupId: string | number | null;
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

        <div className="gap-2 lg:gap-4 flex justify-center mt-4">
          {kpiGroups.map((group) => {
            const isSelected =
              selectedGroupId !== null &&
              String(group.id) === String(selectedGroupId);

            return (
              <button
                key={group.id}
                onClick={() => onGroupSelect(group.id)}
                className={`
              flex flex-col items-center justify-start p-2 md:p-4 rounded-lg border-2 transition-all w-1/2 md:w-1/3 lg:w-1/4 min-h-28
              ${
                isSelected
                  ? "bg-warning border-warning text-white shadow-lg"
                  : "bg-white border-gray-300 text-gray-700 hover:border-warning hover:bg-orange-50"
              }
            `}
              >
                <div className="text-3xl mb-2">{getGroupIcon(group.name)}</div>
                <span className="text-xs font-medium text-center">
                  {group.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to get icon based on group name
function getGroupIcon(groupName: string): string {
  const name = groupName.toLowerCase();

  if (name.includes("mobility") || name.includes("accessibility")) {
    return "🚏";
  }
  if (name.includes("economic") || name.includes("revenue")) {
    return "💶";
  }
  if (name.includes("provider") || name.includes("kpi provider")) {
    return "📊";
  }
  if (name.includes("environment")) {
    return "♻️";
  }
  if (name.includes("maaS") || name.includes("service")) {
    return "☁️";
  }
  if (name.includes("data") || name.includes("provider")) {
    return "💾";
  }
  if (
    name.includes("operator") ||
    name.includes("pt") ||
    name.includes("transport")
  ) {
    return "🚇";
  }
  if (
    name.includes("user") ||
    name.includes("citizen") ||
    name.includes("customer")
  ) {
    return "👤";
  }
  if (name.includes("traffic") || name.includes("congestion")) {
    return "🚦";
  }
  if (name.includes("safety") || name.includes("security")) {
    return "🛡️";
  }

  return "📊";
}
