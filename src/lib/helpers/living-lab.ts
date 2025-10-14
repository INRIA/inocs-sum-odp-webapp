import type {
  ILivingLabPopulated,
  ITransportMode,
  IProject,
  IKpi,
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
export function prepareModalSplitData(
  livingLab: ILivingLabPopulated,
  allTransportModes: ITransportMode[],
  kpidefinitions: IKpi[]
): {
  before: { label: string; data: SplitItem[] };
  after: { label: string; data: SplitItem[] };
} {
  if (
    !livingLab.kpi_results ||
    !allTransportModes ||
    allTransportModes.length === 0
  ) {
    return {
      before: { label: "Before", data: [] },
      after: { label: "After", data: [] },
    };
  }

  // Find KPI 15.a results (modal split)
  const modalSplitKpis = livingLab.kpi_results?.filter(
    (kpi) =>
      kpidefinitions?.find((def) => def.id === kpi.kpidefinition_id)
        ?.kpi_number === "15.a"
  );

  if (modalSplitKpis.length === 0) {
    return {
      before: { label: "Before", data: [] },
      after: { label: "After", data: [] },
    };
  }

  const beforeData: SplitItem[] = [];
  const afterData: SplitItem[] = [];
  const beforeLabelWithMinYear = modalSplitKpis[0].result_before?.date
    ? `Before (${new Date(modalSplitKpis[0].result_before.date).getFullYear()})`
    : "Before";
  const afterLabelWithMinYear = modalSplitKpis[0].result_after?.date
    ? `After (${new Date(modalSplitKpis[0].result_after.date).getFullYear()})`
    : "After";

  modalSplitKpis.forEach((kpi) => {
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
