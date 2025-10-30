import type {
  ILivingLabPopulated,
  ITransportMode,
  IProject,
  IKpi,
  IIKpiResultBeforeAfter,
} from "../../types";
import type { SplitItem } from "../../components/react/KpiCards/ModalSplitChart";
import type { MarkerData } from "../../components/react/MapViewer";

/**
 * Filter transport modes that are of type "NSM" (New Mobility Service)
 */
export function getNSMTransportModes(
  livingLab: ILivingLabPopulated,
  allTransportModes: ITransportMode[]
): ITransportMode[] {
  if (!livingLab.transport_modes || !allTransportModes) return [];
  // Get the transport mode IDs from the living lab
  const labTransportModeIds = livingLab.transport_modes.map((tm) => tm.id);

  // Filter transport modes that are in the living lab and are NSM type
  return allTransportModes.filter(
    (mode) => mode.type === "NSM" && labTransportModeIds.includes(mode.id)
  );
}

/**
 * Separate measures into push and pull categories
 */
export function separateMeasures(measures: IProject[]): {
  pushMeasures: IProject[];
  pullMeasures: IProject[];
} {
  if (!measures) return { pushMeasures: [], pullMeasures: [] };

  return {
    pushMeasures: measures.filter((m) => m.type === "PUSH"),
    pullMeasures: measures.filter((m) => m.type === "PULL"),
  };
}

/**
 * Prepare modal split chart data from KPI results
 * KPI 15.a represents modal split per transport mode
 */
export function getModalSplitKpiResults(
  kpiDefinitions: IKpi[],
  allTransportModes: ITransportMode[],
  kpiResults: IIKpiResultBeforeAfter[]
): {
  kpiName: string;
  before: { label: string; data: SplitItem[] };
  after: { label: string; data: SplitItem[] };
}[] {
  if (!kpiDefinitions || !allTransportModes || !kpiResults.length) {
    return [];
  }
  return (
    kpiDefinitions
      ?.filter((kpi) => ["15.a", "15.b", "15.c"].includes(kpi.kpi_number))
      .map((kpi) => {
        const modalSplitKpiResults = kpiResults.filter(
          (result) => result.kpidefinition_id === kpi.id
        );

        return prepareModalSplitData(
          modalSplitKpiResults,
          allTransportModes,
          kpi
        );
      }) || []
  );
}

function prepareModalSplitData(
  kpiResults: IIKpiResultBeforeAfter[],
  allTransportModes: ITransportMode[],
  parentKpiDefinition?: IKpi
): {
  kpiName: string;
  before: { label: string; data: SplitItem[] };
  after: { label: string; data: SplitItem[] };
} {
  if (
    kpiResults?.length === 0 ||
    !allTransportModes ||
    allTransportModes.length === 0
  ) {
    return {
      kpiName: "Modal Split",
      before: { label: "Before", data: [] },
      after: { label: "After", data: [] },
    };
  }

  const beforeData: SplitItem[] = [];
  const afterData: SplitItem[] = [];
  const beforeLabelWithMinYear = kpiResults[0].result_before?.date
    ? `Before (${new Date(kpiResults[0].result_before.date).getFullYear()})`
    : "Before";
  const afterLabelWithMinYear = kpiResults[0].result_after?.date
    ? `After (${new Date(kpiResults[0].result_after.date).getFullYear()})`
    : "After";

  kpiResults.forEach((kpi) => {
    // Find the transport mode for this KPI result
    const transportMode = allTransportModes.find(
      (tm) => tm.id === kpi.result_before?.transport_mode_id
    );

    if (transportMode) {
      if (kpi.result_before?.value) {
        beforeData.push({
          label: transportMode.name,
          value: kpi.result_before.value,
          color: transportMode.color || "#cccccc",
        });
      }

      if (kpi.result_after?.value) {
        afterData.push({
          label: transportMode.name,
          value: kpi.result_after.value,
          color: transportMode.color || "#cccccc",
        });
      }
    }
  });

  return {
    kpiName: parentKpiDefinition?.name || "Modal Split",
    before: { label: beforeLabelWithMinYear, data: beforeData },
    after: { label: afterLabelWithMinYear, data: afterData },
  };
}

/**
 * Create map marker data from living lab
 */
export function createMapMarker(livingLab: ILivingLabPopulated): MarkerData {
  return {
    id: String(livingLab.id),
    name: livingLab.name,
    coordinates: {
      lat: parseFloat(livingLab.lat || "0"),
      lng: parseFloat(livingLab.lng || "0"),
    },
    radius: livingLab.radius ? livingLab.radius * 1000 : undefined, // Convert km to meters
  };
}
