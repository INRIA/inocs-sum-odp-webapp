import React from "react";
import type { ModalSplitLivingLabsCardsProps } from "./types";
import { ModalSplitLivingLabsCard } from "./ModalSplitLivingLabsCard";
import { TopStickyLegend } from "../ui/TopStickyLegend";
import { ExpansionPanel } from "../ui/ExpansionPanel";
import { Badge } from "../ui";

/**
 * ModalSplitLivingLabsCards displays all modal split KPIs in a grid layout.
 * Each KPI subtype (15.a, 15.b, 15.c) gets its own card.
 */
export const ModalSplitLivingLabsCards: React.FC<
  ModalSplitLivingLabsCardsProps
> = ({ modalSplitData, filter, transportModes }) => {
  if (modalSplitData.length === 0) {
    return null;
  }

  const header = (
    <div className="flex flex-row justify-center items-center gap-2 rounded-2xl border-info bg-info px-1 py-1">
      <h5 className="text-center">Modal Split</h5>
      <Badge
        color="light"
        size="sm"
        tooltip="Number of KPIs in this category"
        displayTooltipIcon={false}
      >
        {modalSplitData.length}
      </Badge>
    </div>
  );

  const content = (
    <>
      <TopStickyLegend
        id="modal-split-legend"
        title="Transport Modes:"
        items={transportModes.map((mode) => ({
          id: mode.id,
          label: mode.name,
          color: mode.color ?? "#999999",
        }))}
        boundaryElementId="modal-split-living-labs-cards"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 mt-4">
        {modalSplitData.map((kpiData) => (
          <ModalSplitLivingLabsCard
            key={kpiData.kpiId}
            kpiId={kpiData.kpiId}
            kpiNumber={kpiData.kpiNumber}
            kpiName={kpiData.kpiName}
            labs={kpiData.labs}
            filter={filter}
          />
        ))}
      </div>
    </>
  );

  return (
    <div className="mb-8" id="modal-split-living-labs-cards">
      <ExpansionPanel header={header} content={content} arrow open />
    </div>
  );
};
