import livinglabs from "./mock-data/living_labs_data.json";
import kpis from "./mock-data/kpis.json";
import categories from "./mock-data/categories.json";
import measures from "./mock-data/measures.json";
import transportModes from "./mock-data/transport_modes.json";
import type {
  IKpi,
  IIKpiResultBeforeAfter,
  ILivingLabPopulated,
  IMeasure,
  ITransportMode,
  ILivingLabTransportMode,
  ILivingLab,
} from "../../types";
import type { ICategory } from "../../types/Category";

export default class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  constructor(baseUrl: string = "http://localhost:8080") {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // strip trailing slashes
  }

  private async get<T = any>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Request failed: ${res.status} ${res.statusText} ${
          text ? `- ${text}` : ""
        }`
      );
    }
    return (await res.json()) as T;
  }

  populateLivingLabData(lab: any) {
    const populatedKpis = lab?.kpi_results
      ?.map((kpiResult) => {
        const kpiData = kpis.find(
          (k) => k.id === (kpiResult.kpidefinition_id ?? kpiResult.id)
        ) as IKpi;
        return {
          ...kpiData,
          result_before: {
            ...kpiResult,
            value: kpiResult.value_before,
            date: "01/01/2024",
            id: Math.random(),
          },
          result_after: {
            ...kpiResult,
            value: kpiResult.value_after,
            date: "08/01/2026",
            id: Math.random(),
          },
        } as IIKpiResultBeforeAfter;
      })
      .sort((a, b) => {
        const parseKpiNumber = (num: string) =>
          num.split(".").map((n) => parseInt(n, 10));
        if (!a.kpi_number || !b.kpi_number) return 0;
        const aParts = parseKpiNumber(a.kpi_number);
        const bParts = parseKpiNumber(b.kpi_number);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aVal = aParts[i] ?? 0;
          const bVal = bParts[i] ?? 0;
          if (aVal !== bVal) return aVal - bVal;
        }
        return 0;
      });
    const populatedMeasures = lab?.measures?.map((measure) => {
      const measureData = measures.find((m) => m.id === measure.id) as IMeasure;
      return { ...measure, ...measureData };
    });

    const populatedTransportModes = lab?.transport_modes?.map((mode) => {
      const modeData = transportModes.find((m) => m.id === mode.id);
      return {
        ...mode,
        ...modeData,
        transport_mode_id: modeData?.id,
        living_lab_id: lab.id,
        id: Math.random(), // mock unique id
      } as ILivingLabTransportMode;
    });

    return {
      ...lab,
      transport_modes: populatedTransportModes ?? [],
      kpi_results: populatedKpis ?? [],
      measures: populatedMeasures ?? [],
    } as ILivingLabPopulated;
  }

  async getLivingLabs(): Promise<ILivingLab[]> {
    //return this.get(`/livinglabs`);

    return livinglabs;
  }

  async getLivingLabsAndData(): Promise<ILivingLabPopulated[]> {
    //return this.get(`/livinglabs`);

    return livinglabs?.map((lab) => this.populateLivingLabData(lab));
  }

  async getLivingLabAndData(id: number): Promise<ILivingLabPopulated> {
    //return this.get(`/livinglabs/${encodeURIComponent(id)}`);
    const lab = livinglabs.find((lab) => lab.id === id);
    return this.populateLivingLabData(lab);
  }

  async getMeasures(): Promise<IMeasure[]> {
    //return this.get(`/measures`);

    return measures;
  }

  async getKPIs(data?: { kpi_number?: string }): Promise<IKpi[]> {
    //return this.get(`/kpis`);
    const { kpi_number } = data ?? {};

    let kpisData = kpis as IKpi[];
    if (kpi_number) {
      const parentKpi = kpis.filter(
        (kpi) => kpi.kpi_number === kpi_number
      ) as IKpi[];
      const childrenKpis = kpis.filter(
        (kpi) => kpi.parent_kpi_id === parentKpi[0]?.id
      ) as IKpi[];

      kpisData = [...parentKpi, ...childrenKpis] as IKpi[];
    }

    return kpisData.sort((a, b) => {
      const parseKpiNumber = (num: string) =>
        num.split(".").map((n) => parseInt(n, 10));
      if (!a.kpi_number || !b.kpi_number) return 0;
      const aParts = parseKpiNumber(a.kpi_number);
      const bParts = parseKpiNumber(b.kpi_number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] ?? 0;
        const bVal = bParts[i] ?? 0;
        if (aVal !== bVal) return aVal - bVal;
      }
      return 0;
    });
  }

  async getCategories(
    type: "KPI_SIEF" | "ITEM" | "KPI_IMPACT"
  ): Promise<ICategory[]> {
    //return this.get(`/categories?type=${encodeURIComponent(type)}`);

    return categories.filter((cat) => cat.type === type) as ICategory[];
  }

  async getTransportModes(): Promise<ITransportMode[]> {
    //return this.get(`/transport_modes`);

    return transportModes as ITransportMode[];
  }
}
