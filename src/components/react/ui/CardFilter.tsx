import React from "react";
import type { IKpiDefinition } from "../../../types";
import { KpiCard } from "../KpiCards";
import { getUniqueParentKpis } from "../../../lib/helpers";
import { InfoAlert } from "./InfoAlert";

interface CardFilterProps {
  groups: { id: string | number; name: string; kpis: IKpiDefinition[] }[];
  selectedGroupId?: string | number;
  onGroupSelect: (groupId: string | number) => void;
}

export const CardFilter: React.FC<CardFilterProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
}) => {
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const uniqueKpis = getUniqueParentKpis(selectedGroup?.kpis || []);
  return (
    <div className="flex flex-col">
      <div className="gap-0 md:gap-2 flex justify-start mt-4 flex-row flex-wrap">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className={`w-full px-1 py-3 md:px-4 rounded-lg border-2 font-medium transition-all duration-200 text-start ${
              selectedGroupId === group.id
                ? "border-warning bg-warning/10 text-dark"
                : "border-gray-200 bg-white text-gray-700 hover:border-warning/50 hover:bg-warning/5"
            }`}
          >
            <span>
              {getGroupIcon(group.name)} {group.name}
            </span>
          </button>
        ))}
      </div>
      <section id="kpis-in-group"></section>
      {selectedGroup && uniqueKpis.length > 0 && (
        <div className="mt-10">
          <InfoAlert
            variant="neutral"
            title={"KPIs considered for group " + selectedGroup.name}
          >
            <i>
              We have collected data from the living labs from the following
              KPIs in this group:{" "}
            </i>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {uniqueKpis.map((kpi) => (
                <KpiCard kpi={kpi} key={kpi.id} />
              ))}
            </div>
          </InfoAlert>
        </div>
      )}
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
