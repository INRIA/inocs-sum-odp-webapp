import type {
  ILivingLabPopulated,
  ITransportMode,
  IProject,
  IKpi,
  IIKpiResultBeforeAfter,
  IKpiResult,
} from "../../types";
import type { SplitItem } from "../../components/react/KpiCards/ModalSplitChart";
import type { MarkerData } from "../../components/react/MapViewer";

/**
 * Filter transport modes that are of type "NSM" (New Mobility Service)
 */
export function getNSMTransportModes(
  livingLab: ILivingLabPopulated,
  allTransportModes: ITransportMode[],
): ITransportMode[] {
  if (!livingLab.transport_modes || !allTransportModes) return [];
  // Get the transport mode IDs from the living lab
  const labTransportModeIds = livingLab.transport_modes.map((tm) => tm.id);

  // Filter transport modes that are in the living lab and are NSM type
  return allTransportModes.filter(
    (mode) => mode.type === "NSM" && labTransportModeIds.includes(mode.id),
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
  kpiResults: IIKpiResultBeforeAfter[],
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
          (result) => result.kpidefinition_id === kpi.id,
        );

        return prepareModalSplitData(
          modalSplitKpiResults,
          allTransportModes,
          kpi,
        );
      }) || []
  );
}

function prepareModalSplitData(
  kpiResults: IIKpiResultBeforeAfter[],
  allTransportModes: ITransportMode[],
  parentKpiDefinition?: IKpi,
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
      (tm) => tm.id === kpi.result_before?.transport_mode_id,
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

export function getLivingLabInfoProgress(
  livingLab?: ILivingLabPopulated | null,
): {
  value: number;
  progress: number;
  details: { label: string; value: string }[];
} {
  if (!livingLab) return { value: 0, progress: 0, details: [] };
  const itemsToCheck = [
    livingLab.name,
    livingLab.area,
    livingLab.radius,
    livingLab.population,
    livingLab.lat,
    livingLab.lng,
  ];
  const itemsLabels = [
    "Name",
    "Area",
    "Radius",
    "Population",
    "Latitude",
    "Longitude",
  ];

  const missingFields = itemsToCheck
    .map((item, i) => {
      if (item === null || item === undefined || item === "" || item === 0)
        return itemsLabels[i];
      return "";
    })
    .filter((label) => label !== "");
  const missingItems = missingFields.length;
  const filledItems = itemsToCheck.length - missingItems;

  const details =
    missingItems > 0
      ? [
          { label: "Missing information", value: `${missingItems}` },
          {
            label: "Missing fields",
            value: missingFields.join(", "),
          },
        ]
      : [];

  return {
    value: filledItems,
    progress: Math.round((filledItems / itemsToCheck.length) * 100 * 100) / 100,
    details,
  };
}

export function getKpiResultsProgress(
  kpis: IKpi[],
  kpiResults: IKpiResult[],
): {
  value: number;
  progress: number;
  details: { label: string; value: string }[];
} {
  const globalKpiIds = kpis
    .filter((kpi) => kpi.type === "GLOBAL")
    .map((kpi) => kpi.parent_kpi_id ?? kpi.id);
  const uniqueGlobalIds = Array.from(new Set(globalKpiIds));
  const localKpiIds = kpis
    .filter((kpi) => kpi.type === "LOCAL")
    .map((kpi) => kpi.parent_kpi_id ?? kpi.id);
  const uniqueLocalIds = Array.from(new Set(localKpiIds));

  const uniqueIds = kpiResults?.map((kpiresult) => {
    const kpiDefinition = kpis?.find(
      (pk) => pk.id === kpiresult.kpidefinition_id,
    );
    return kpiDefinition?.parent_kpi_id ?? kpiDefinition?.id;
  });

  const uniqueCompletedKpis = Array.from(new Set(uniqueIds));

  if (kpis.length === 0) return { value: 0, progress: 0, details: [] };
  return {
    value: uniqueCompletedKpis.length,
    progress: Math.round(
      (uniqueCompletedKpis.length /
        (uniqueGlobalIds.length + uniqueLocalIds.length)) *
        100,
    ),
    details: [
      {
        label: "Global KPIs",
        value: `${
          uniqueCompletedKpis.filter((id) => uniqueGlobalIds.includes(id || ""))
            .length
        } / ${uniqueGlobalIds.length}`,
      },
      {
        label: "Local KPIs",
        value: `${
          uniqueCompletedKpis.filter((id) => uniqueLocalIds.includes(id || ""))
            .length
        } / ${uniqueLocalIds.length}`,
      },
    ],
  };
}

export function getKpiResultsModalSplitProgress(
  kpis: IKpi[],
  kpiResults: IKpiResult[],
): {
  value: string;
  progress: number;
  details: { label: string; value: string }[];
} {
  const totalByKpi = new Map<string, number>();
  let valueTotal = 0;

  kpiResults.forEach((kpiResult) => {
    if (kpiResult.value) {
      const currentTotal = totalByKpi.get(kpiResult.kpidefinition_id) || 0;
      totalByKpi.set(
        kpiResult.kpidefinition_id,
        currentTotal + kpiResult.value,
      );
      valueTotal += kpiResult.value;
    }
  });
  if (valueTotal === 0) return { value: "0", progress: 0, details: [] };

  valueTotal = Math.round(valueTotal / totalByKpi.size) * 100;
  return {
    value: `${totalByKpi.size} KPIs`,
    progress: valueTotal,
    details: Array.from(totalByKpi.entries()).map(([kpiId, total]) => {
      const kpiDef = kpis.find((kpi) => kpi.id === kpiId);
      return {
        label: kpiDef ? kpiDef.name : "Unknown KPI",
        value: `${Math.round(total) * 100}%`,
      };
    }),
  };
}

export function getMeasuresProgress(measures: IProject[]): {
  value: string;
  progress?: number;
  details: { label: string; value: string }[];
} {
  if (measures.length === 0) return { value: "0", progress: 0, details: [] };

  return {
    value: `${measures.length} Measures`,
    progress: 100,
    details: [
      {
        label: "Push meaasures",
        value: `${measures?.filter((m) => m.type === "PUSH").length}`,
      },
      {
        label: "Pull measures",
        value: `${measures?.filter((m) => m.type === "PULL").length}`,
      },
    ],
  };
}
