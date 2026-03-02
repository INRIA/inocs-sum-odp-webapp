import React from "react";
import type { IKpiDefinition, IKpiVariationData } from "../../../types";
import { KpiCard } from "../KpiCards";
import { getUniqueParentKpis } from "../../../lib/helpers";
import { InfoCard } from "./InfoCard";

// Helper function to get icon based on group name
function getGroupIcon(groupName: string): string {
  const name = groupName.toLowerCase();
  if (name.includes("mobility") || name.includes("accessibility")) return "🚏";
  if (name.includes("economic") || name.includes("revenue")) return "💶";
  if (name.includes("provider") || name.includes("kpi provider")) return "📊";
  if (
    name.includes("environment") ||
    name.includes("emission") ||
    name.includes("sustainabl")
  )
    return "♻️";
  if (name.includes("maas") || name.includes("service")) return "☁️";
  if (name.includes("data")) return "💾";
  if (
    name.includes("operator") ||
    name.includes("pt") ||
    name.includes("transport")
  )
    return "🚇";
  if (
    name.includes("user") ||
    name.includes("citizen") ||
    name.includes("customer")
  )
    return "👤";
  if (name.includes("traffic") || name.includes("congestion")) return "🚦";
  if (name.includes("safety") || name.includes("security")) return "🛡️";
  return "📊";
}

function variationColorClass(value: number | null): string {
  if (value === null || value === 0) return "text-warning";
  return value > 0 ? "text-success" : "text-danger";
}

function variationArrow(value: number | null): string {
  if (value === null || value === 0) return "";
  return value > 0 ? "↑ " : "↓ ";
}

interface CardFilterProps {
  groups: { id: number; name: string; kpis: IKpiDefinition[] }[];
  selectedGroupId?: number;
  onGroupSelect: (groupId: number) => void;
  variant?: "small" | "detailed";
  kpiVariationsData?: Record<number, IKpiVariationData>;
  variationsByKpis?: Record<number, IKpiVariationData>;
  detailedDescription?: string;
}

const SmallCardFilter: React.FC<
  Pick<CardFilterProps, "groups" | "selectedGroupId" | "onGroupSelect">
> = ({ groups, selectedGroupId, onGroupSelect }) => {
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const uniqueKpis = getUniqueParentKpis(selectedGroup?.kpis || []);
  return (
    <div className="flex flex-col">
      <div className="gap-2 flex justify-start flex-row flex-wrap">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className={`w-full p-2 md:p-3 rounded-lg border-2 font-medium transition-all duration-200 text-start ${
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
          <InfoCard
            title={"KPIs considered for group " + selectedGroup.name}
            textAlign="left"
            variant="light"
            showIcon={false}
          >
            <div className="grid grid-cols-1 mt-2">
              {uniqueKpis.map((kpi) => (
                <KpiCard kpi={kpi} key={kpi.id} />
              ))}
              <i>
                Our platform has collected living lab&apos;s data from these
                KPIs, which are in the scope of the selected group. The impact
                analysis results are based on the variations observed in these
                KPIs and the measures implemented in the living labs.
              </i>
            </div>
          </InfoCard>
        </div>
      )}
    </div>
  );
};

const DetailedCardFilter: React.FC<
  Required<
    Pick<CardFilterProps, "groups" | "onGroupSelect" | "kpiVariationsData">
  > &
    Pick<
      CardFilterProps,
      "selectedGroupId" | "detailedDescription" | "variationsByKpis"
    >
> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
  kpiVariationsData,
  variationsByKpis,
  detailedDescription = "The analysis will focus on measured variations from the following KPIs",
}) => {
  const styleLargeScreen = "grid md:grid-cols-2 lg:grid-cols-3 items-start gap-2 lg:gap-4";
  const styleSmallScreen = "flex flex-col items-start gap-2";

  const displayLargeScreen = kpiVariationsData && !selectedGroupId;
  return (
    <div
      className={`flex flex-col gap-3 w-full ${displayLargeScreen ? styleLargeScreen : styleSmallScreen}`}
    >
      {groups.map((group) => {
        const variationData =
          variationsByKpis?.[group.id] ?? kpiVariationsData[group.id];
        const totalVariation = variationData?.totalVariation ?? null;
        const totalPct = variationData?.totalVariationPercentage ?? "—";
        const kpiVariations = variationData?.allKpiVariations ?? [];
        const isSelected = selectedGroupId === group.id;
        return (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className={`w-full text-start rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 overflow-hidden ${
              isSelected
                ? "border-warning shadow-md"
                : "border-gray-200 hover:border-warning/50 hover:shadow-md"
            }`}
          >
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <h5 className="font-semibold text-gray-800 text-sm leading-snug">
                  {getGroupIcon(group.name)} {group.name}
                </h5>
                {variationData && (
                  <span
                    className={`shrink-0 text-sm font-bold py-0.5 rounded-full bg-gray-50 ${variationColorClass(totalVariation)}`}
                  >
                    {variationArrow(totalVariation)}
                    {totalPct}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 text-left">
                {detailedDescription}
              </p>
            </div>
            {kpiVariations.length > 0 && (
              <>
                <div className="mx-5 border-t border-gray-100" />
                <ul className="px-5 py-3 flex flex-col gap-1.5">
                  {kpiVariations.map((kpiVar) => (
                    <li
                      key={kpiVar.kpiId}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-gray-700 truncate">
                        {kpiVar.kpiName}
                      </span>
                      <span
                        className={`shrink-0 text-xs font-semibold ${variationColorClass(kpiVar.ratioVariation)}`}
                      >
                        {variationArrow(kpiVar.ratioVariation)}
                        {kpiVar.ratioVariationPercentage}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};

export const CardFilter: React.FC<CardFilterProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
  variant = "small",
  kpiVariationsData,
  variationsByKpis,
  detailedDescription,
}) => {
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  if (variant === "detailed" && kpiVariationsData) {
    return (
      <DetailedCardFilter
        groups={selectedGroup ? [selectedGroup] : groups}
        selectedGroupId={selectedGroupId}
        onGroupSelect={onGroupSelect}
        kpiVariationsData={kpiVariationsData}
        variationsByKpis={variationsByKpis}
        detailedDescription={detailedDescription}
      />
    );
  }
  return (
    <SmallCardFilter
      groups={groups}
      selectedGroupId={selectedGroupId}
      onGroupSelect={onGroupSelect}
    />
  );
};
