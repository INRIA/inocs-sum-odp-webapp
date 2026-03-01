import type {
  ILivingLabPopulated,
  ITransportMode,
  IProject,
  IKpi,
  IKpiResultGroup,
  IKpiResult,
} from "../../types";
import type { SplitItem } from "../../components/react/KpiCards/ModalSplitChart";
import type { MarkerData } from "../../components/react/MapViewer";
import { notNullOrUndefined } from "./format";
import { normalizeKpiResultGroup } from "../utils/kpis";

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
  kpiResults: IKpiResultGroup[],
): {
  kpiName: string;
  kpidefinition_id: number;
  entries: { label: string; data: SplitItem[] }[];
  before?: { label: string; data: SplitItem[] };
  after?: { label: string; data: SplitItem[] };
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

        return {
          kpidefinition_id: kpi.id,
          ...prepareModalSplitData(
            modalSplitKpiResults,
            allTransportModes,
            kpi,
          ),
        };
      }) || []
  );
}

function prepareModalSplitData(
  kpiResults: IKpiResultGroup[],
  allTransportModes: ITransportMode[],
  parentKpiDefinition?: IKpi,
): {
  kpiName: string;
  entries: { label: string; data: SplitItem[] }[];
  before?: { label: string; data: SplitItem[] };
  after?: { label: string; data: SplitItem[] };
} {
  if (
    kpiResults?.length === 0 ||
    !allTransportModes ||
    allTransportModes.length === 0
  ) {
    return {
      kpiName: "Modal Split",
      entries: [],
    };
  }

  const groupedByDate = new Map<
    string,
    Array<SplitItem & { itemId: number }>
  >();

  kpiResults.forEach((group) => {
    const normalized = normalizeKpiResultGroup(group);
    const transportModeId =
      normalized.transport_mode_id ?? normalized.results[0]?.transport_mode_id;

    const transportMode = allTransportModes.find(
      (tm) => tm.id === transportModeId,
    );
    if (!transportMode) {
      return;
    }

    normalized.results.forEach((result) => {
      if (!result?.date || !notNullOrUndefined(result.value)) {
        return;
      }

      if (!groupedByDate.has(result.date)) {
        groupedByDate.set(result.date, []);
      }

      groupedByDate.get(result.date)?.push({
        itemId: result.id,
        label: transportMode.name,
        value: result.value,
        color: transportMode.color || "#cccccc",
      });
    });
  });

  const entries = Array.from(groupedByDate.entries())
    .map(([date, data]) => ({
      date,
      label: `${new Date(date).getFullYear()}`,
      year: new Date(date).getFullYear(),
      data: [...data]
        .sort((a, b) => a.itemId - b.itemId)
        .map(({ itemId: _itemId, ...item }) => item),
    }))
    .filter((entry) => Number.isFinite(entry.year) && entry.data.length > 0)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const before = entries[0]
    ? { label: entries[0].label, data: entries[0].data }
    : undefined;
  const after = entries[entries.length - 1]
    ? {
        label: entries[entries.length - 1].label,
        data: entries[entries.length - 1].data,
      }
    : undefined;

  return {
    kpiName: parentKpiDefinition?.name || "Modal Split",
    entries: entries.map((entry) => ({
      label: entry.label,
      data: entry.data,
    })),
    before,
    after,
  };
}

/**
 * Modal split data for a single living lab
 */
export interface IModalSplitLabData {
  labId: number;
  labName: string;
  entries: { label: string; date: string; year: number; data: SplitItem[] }[];
  before?: { label: string; date: string; year: number; data: SplitItem[] };
  after?: { label: string; date: string; year: number; data: SplitItem[] };
}

/**
 * Modal split data for a specific KPI across all living labs
 */
export interface IModalSplitKpiData {
  kpiId: string;
  kpiNumber: string;
  kpiName: string;
  labs: IModalSplitLabData[];
}

/**
 * Prepare modal split data for the data dashboard
 * Returns data grouped by KPI (15.a, 15.b, 15.c), each containing data for all living labs
 */
export function getModalSplitDataForDashboard(
  kpiDefinitions: IKpi[],
  allTransportModes: ITransportMode[],
  livingLabs: {
    id: number;
    name: string;
    kpiResults: IKpiResultGroup[];
  }[],
): IModalSplitKpiData[] {
  if (!kpiDefinitions || !allTransportModes || livingLabs.length === 0) {
    return [];
  }

  // Filter to modal split KPIs only (15.a, 15.b, 15.c)
  const modalSplitKpis = kpiDefinitions.filter((kpi) =>
    ["15.a", "15.b", "15.c"].includes(kpi.kpi_number),
  );

  return modalSplitKpis.map((kpi) => {
    // Process each living lab's data for this KPI
    const labsData = livingLabs
      .map((lab) => {
        const labKpiResults = lab.kpiResults.filter(
          (result) => result.kpidefinition_id === kpi.id,
        );

        if (labKpiResults.length === 0) {
          return null;
        }

        const groupedByDate = new Map<
          string,
          Array<SplitItem & { itemId: number }>
        >();

        labKpiResults.forEach((group) => {
          const normalized = normalizeKpiResultGroup(group);
          const transportModeId =
            normalized.transport_mode_id ??
            normalized.results[0]?.transport_mode_id;
          const transportMode = allTransportModes.find(
            (tm) => tm.id === transportModeId,
          );

          if (!transportMode) {
            return;
          }

          normalized.results.forEach((result) => {
            if (!result?.date || !notNullOrUndefined(result.value)) {
              return;
            }

            if (!groupedByDate.has(result.date)) {
              groupedByDate.set(result.date, []);
            }

            groupedByDate.get(result.date)?.push({
              itemId: result.id,
              label: transportMode.name,
              value: result.value,
              color: transportMode.color || "#cccccc",
            });
          });
        });

        const entries = Array.from(groupedByDate.entries())
          .map(([date, data]) => ({
            date,
            label: `${new Date(date).getFullYear()}`,
            year: new Date(date).getFullYear(),
            data: [...data]
              .sort((a, b) => a.itemId - b.itemId)
              .map(({ itemId: _itemId, ...item }) => item),
          }))
          .filter(
            (entry) => Number.isFinite(entry.year) && entry.data.length > 0,
          )
          .sort((a, b) => {
            const byDate = Date.parse(a.date) - Date.parse(b.date);
            if (byDate !== 0) {
              return byDate;
            }
            return 0;
          });

        if (entries.length === 0) {
          return null;
        }

        const before = entries[0];
        const after = entries[entries.length - 1];

        return {
          labId: lab.id,
          labName: lab.name,
          entries,
          before,
          after,
        };
      })
      .filter((lab): lab is Exclude<typeof lab, null> => lab !== null);

    return {
      kpiId: String(kpi.id),
      kpiNumber: kpi.kpi_number,
      kpiName: kpi.name,
      labs: labsData,
    };
  });
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
  const completedKpiIds = uniqueCompletedKpis.filter(
    (id): id is number => typeof id === "number",
  );

  if (kpis.length === 0) return { value: 0, progress: 0, details: [] };
  return {
    value: completedKpiIds.length,
    progress: Math.round(
      (completedKpiIds.length /
        (uniqueGlobalIds.length + uniqueLocalIds.length)) *
        100,
    ),
    details: [
      {
        label: "Global KPIs",
        value: `${
          completedKpiIds.filter((id) => uniqueGlobalIds.includes(id)).length
        } / ${uniqueGlobalIds.length}`,
      },
      {
        label: "Local KPIs",
        value: `${
          completedKpiIds.filter((id) => uniqueLocalIds.includes(id)).length
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
  const totalByKpi = new Map<number, number>();
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

function formatPercentage(value: number): string {
  return Number.isInteger(value) ? `${value}` : `${value.toFixed(2)}`;
}

export function getModalSplitCardMetrics(
  modalSplitResultGroups: IKpiResultGroup[],
  transportModes: ITransportMode[],
): {
  value: string;
  details: { label: string; value: string }[];
} {
  const totalResults = modalSplitResultGroups.reduce(
    (acc, group) => acc + (group.results?.length ?? 0),
    0,
  );

  const years = modalSplitResultGroups
    .flatMap((group) => group.results ?? [])
    .map((result) => new Date(result.date).getFullYear())
    .filter((year) => !Number.isNaN(year));
  const minYear = years.length > 0 ? Math.min(...years) : null;
  const maxYear = years.length > 0 ? Math.max(...years) : null;
  const valueLabel =
    minYear !== null && maxYear !== null
      ? `${totalResults} values from ${minYear} to ${maxYear}`
      : `${totalResults} values`;

  if (modalSplitResultGroups.length === 0) {
    return {
      value: valueLabel,
      details: [],
    };
  }

  const transportModeTypeById = new Map(
    transportModes.map((mode) => [mode.id, mode.type]),
  );

  const totalsByModeType = new Map<string, { first: number; last: number }>();

  modalSplitResultGroups.forEach((group) => {
    const results = [...(group.results ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (results.length === 0) return;

    const firstResult = results[0];
    const lastResult = results[results.length - 1];

    if (!notNullOrUndefined(firstResult?.value)) return;
    if (!notNullOrUndefined(lastResult?.value)) return;

    const transportModeId =
      group.transport_mode_id ?? firstResult.transport_mode_id;
    if (!transportModeId) return;

    const transportModeType = transportModeTypeById.get(transportModeId);
    if (!transportModeType) return;

    const current = totalsByModeType.get(transportModeType) ?? {
      first: 0,
      last: 0,
    };
    totalsByModeType.set(transportModeType, {
      first: current.first + firstResult.value,
      last: current.last + lastResult.value,
    });
  });

  const modeTypeLabels: Record<string, string> = {
    NSM: "NSM modes",
    PUBLIC_TRANSPORT: "PT modes",
    PRIVATE: "PRIVATE mode",
  };
  const orderedModeTypes = ["NSM", "PUBLIC_TRANSPORT", "PRIVATE"];

  const details = orderedModeTypes
    .map((modeType) => {
      const totals = totalsByModeType.get(modeType);
      if (!totals) return null;

      const delta = totals.last - totals.first;
      const variation = totals.first === 0 ? 0 : (delta / totals.first) * 100;
      const absVariation = Math.abs(variation);
      const sign = variation > 0 ? "+" : variation < 0 ? "-" : "";
      const direction =
        variation > 0 ? "Increase" : variation < 0 ? "Decrease" : "Change";

      return {
        label: `${direction} in ${modeTypeLabels[modeType]} use`,
        value: `${sign}${formatPercentage(absVariation)}%`,
      };
    })
    .filter(
      (detail): detail is { label: string; value: string } => detail !== null,
    );
  return {
    value: valueLabel,
    details,
  };
}

export function getKpiResultsCardMetrics(
  allKpis: IKpi[],
  kpiResultGroups: IKpiResultGroup[],
): {
  value: string;
  details: { label: string; value: string }[];
} {
  const kpiById = new Map(allKpis.map((kpi) => [kpi.id, kpi]));
  const nonModalSplitKpis = allKpis.filter(
    (kpi) => !kpi.kpi_number.startsWith("15"),
  );
  const nonModalSplitParentKpiIds = new Set(
    nonModalSplitKpis.map((kpi) => kpi.parent_kpi_id ?? kpi.id),
  );

  const getParentKpiId = (kpiDefinitionId: number): number | null => {
    const definition = kpiById.get(kpiDefinitionId);
    if (!definition) return null;
    return definition.parent_kpi_id ?? definition.id;
  };

  const filteredGroups = kpiResultGroups.filter((group) =>
    nonModalSplitParentKpiIds.has(getParentKpiId(group.kpidefinition_id) ?? -1),
  );

  const allResults = filteredGroups.flatMap((group) => group.results ?? []);
  const totalResults = allResults.length;

  const valuesByYear = new Map<number, number>();
  allResults.forEach((result) => {
    const year = new Date(result.date).getFullYear();
    if (Number.isNaN(year)) return;
    valuesByYear.set(year, (valuesByYear.get(year) ?? 0) + 1);
  });

  const kpisWithRecordedData = new Set(
    filteredGroups
      .filter((group) => (group.results?.length ?? 0) > 0)
      .map((group) => getParentKpiId(group.kpidefinition_id))
      .filter(
        (id): id is number => id !== null && nonModalSplitParentKpiIds.has(id),
      ),
  );

  const kpisWithRecordedDataCount = kpisWithRecordedData.size;
  const missingKpisCount = Math.max(
    nonModalSplitParentKpiIds.size - kpisWithRecordedDataCount,
    0,
  );

  const yearDetails = Array.from(valuesByYear.entries())
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, count]) => ({
      label: `Values recorded for ${year}`,
      value: `${count}`,
    }));

  const minYear = Math.min(...valuesByYear.keys());
  const maxYear = Math.max(...valuesByYear.keys());

  return {
    value: `${totalResults} values from ${minYear} to ${maxYear}`,
    details: [
      ...yearDetails,
      {
        label: `Recorded KPIs`,
        value: `${kpisWithRecordedDataCount}/${nonModalSplitParentKpiIds.size}`,
      },
      {
        label: `Missing KPIs`,
        value: `${missingKpisCount}/${nonModalSplitParentKpiIds.size}`,
      },
    ],
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
        label: "Push measures",
        value: `${measures?.filter((m) => m.type === "PUSH").length}`,
      },
      {
        label: "Pull measures",
        value: `${measures?.filter((m) => m.type === "PULL").length}`,
      },
    ],
  };
}
