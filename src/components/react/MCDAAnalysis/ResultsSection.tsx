import React, { useEffect, useMemo, useState } from "react";
import type {
  IKpiGroup,
  McdaKeyInsightCard,
  McdaResults,
  OutrankingGraphData,
} from "../../../types";
import { D3McdaNetFlowsChart } from "./D3McdaNetFlowsChart";
import { D3McdaGaiaPlane } from "./D3McdaGaiaPlane";
import { D3McdaNetworkChart } from "./D3McdaNetworkChart";
import { McdaRankingAlternatives } from "./McdaRankingAlternatives";
import { McdaKeyResults } from "./McdaKeyResults";
import { Tabs } from "../ui";

interface ResultsSectionProps {
  selectedGroup: IKpiGroup | undefined;
  mcdaResults?: McdaResults | null;
  outrankingGraphData?: OutrankingGraphData;
  mcdaKeyInsights?: McdaKeyInsightCard[];
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  selectedGroup,
  mcdaResults,
  outrankingGraphData,
  mcdaKeyInsights,
}) => {
  const NET_FLOWS_TAB_ID = "net-flows";
  const NETWORK_TAB_ID = "outranking-graph";
  const GAIA_TAB_ID = "gaia-plane";

  const netFlows = mcdaResults?.net_flows || {};
  const labels = mcdaResults?.alternative_labels || {};
  const positiveFlows = mcdaResults?.positive_flows || {};
  const negativeFlows = mcdaResults?.negative_flows || {};
  const gaiaAlternatives = mcdaResults?.gaia_alternatives || [];
  const gaiaCriteria = mcdaResults?.gaia_criteria || [];
  const gaiaDecisionStick = mcdaResults?.gaia_decision_stick as
    | [number, number]
    | undefined;
  const criteriaLabels = mcdaResults?.criteria_labels || {};
  const ranking = mcdaResults?.ranking || [];
  const hasGaiaData = gaiaAlternatives.length > 0 && gaiaCriteria.length > 0;

  // Convert to sorted entries
  const flowEntries = Object.entries(netFlows).map(([key, value]) => ({
    key,
    flow: value,
    label: labels[key] || key,
  }));

  // Sort by net flow descending
  flowEntries.sort((a, b) => b.flow - a.flow);
  const hasResults = flowEntries.length > 0;

  const resolveTabIdFromHash = () => {
    if (typeof window === "undefined") return NET_FLOWS_TAB_ID;

    const hash = window.location.hash.replace("#", "");
    if (hash === NETWORK_TAB_ID) return NETWORK_TAB_ID;
    if (hash === GAIA_TAB_ID && hasGaiaData) return GAIA_TAB_ID;
    if (hash === NET_FLOWS_TAB_ID) return NET_FLOWS_TAB_ID;

    return NET_FLOWS_TAB_ID;
  };

  const [activeTabId, setActiveTabId] = useState<string>(resolveTabIdFromHash);

  useEffect(() => {
    const onHashChange = () => {
      setActiveTabId(resolveTabIdFromHash());
    };

    onHashChange();
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [hasGaiaData]);

  const handleTabChange = (id: string) => {
    setActiveTabId(id);

    if (typeof window === "undefined") return;

    const nextHash = `#${id}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${nextHash}`,
      );
    }
  };

  const chartTabs = useMemo(() => {
    const tabs = [
      {
        id: NET_FLOWS_TAB_ID,
        label: "Ranking Flow",
        content: (
          <D3McdaNetFlowsChart
            netFlows={netFlows}
            positiveFlows={positiveFlows}
            negativeFlows={negativeFlows}
            alternativeLabels={labels}
            height={Math.max(520, flowEntries.length * 56)}
          />
        ),
      },
      {
        id: NETWORK_TAB_ID,
        label: "Outranking Graph",
        content: (
          <D3McdaNetworkChart
            outrankingGraphData={outrankingGraphData}
            height={700}
          />
        ),
      },
    ];

    if (hasGaiaData) {
      tabs.push({
        id: GAIA_TAB_ID,
        label: "GAIA Plane",
        content: (
          <D3McdaGaiaPlane
            gaiaAlternatives={gaiaAlternatives}
            gaiaCriteria={gaiaCriteria}
            gaiaDecisionStick={gaiaDecisionStick}
            alternativeLabels={labels}
            criteriaLabels={criteriaLabels}
            netFlows={netFlows}
            ranking={ranking}
            height={700}
          />
        ),
      });
    }

    return tabs;
  }, [
    netFlows,
    positiveFlows,
    negativeFlows,
    outrankingGraphData,
    labels,
    flowEntries.length,
    hasGaiaData,
    gaiaAlternatives,
    gaiaCriteria,
    gaiaDecisionStick,
    criteriaLabels,
    ranking,
  ]);

  return (
    <div className="space-y-8">
      {/* Result Visualizations */}
      {hasResults ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <Tabs
                key={activeTabId}
                tabs={chartTabs}
                defaultTabId={activeTabId}
                onChange={handleTabChange}
              />
            </div>

            <div className="xl:sticky xl:top-6">
              <McdaRankingAlternatives
                ranking={ranking}
                alternativeLabels={labels}
                netFlows={netFlows}
              />
            </div>
          </div>

          <McdaKeyResults cards={mcdaKeyInsights} />
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 7.5h10.5M6.75 12h10.5m-10.5 4.5h10.5M4.5 7.5H3.75a1.5 1.5 0 00-1.5 1.5v9.75A1.5 1.5 0 003.75 21h16.5a1.5 1.5 0 001.5-1.5V9a1.5 1.5 0 00-1.5-1.5H19.5"
              ></path>
            </svg>
            <p className="text-lg font-medium mb-2">Results pending</p>
            <p className="text-sm text-gray-400">
              We couldn't find MCDA results for{" "}
              <strong>{selectedGroup?.name || "this stakeholder"}</strong> yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
