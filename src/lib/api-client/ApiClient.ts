import kpis from "./mock-data/kpis.json";
import categories from "./mock-data/categories.json";
import type {
  IKpi,
  ILivingLabPopulated,
  IProject,
  ITransportMode,
  ILivingLab,
  ITransportModeLivingLabEdit,
  ITransportModeLivingLabDelete,
} from "../../types";
import type { ICategory } from "../../types/Category";

export default class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  private token?: string;

  constructor(request?: Request) {
    const isServer = typeof window === "undefined";

    // --- Determine base URL ---
    if (isServer) {
      // SSR (Node)
      this.baseUrl = "http://localhost:4321/api/v1";

      // In production, derive from the incoming request
      if (request) {
        const url = new URL(request.url);
        this.baseUrl = `${url.origin}/api/v1`;

        // Try extracting auth token from cookies (SSR)
        const cookieHeader = request.headers.get("cookie");
        this.token = this.extractTokenFromCookies(cookieHeader);
      }
    } else {
      // Browser
      this.baseUrl = `${window.location.origin}/api/v1`;

      // Extract token from browser cookies
      this.token = this.extractTokenFromCookies(document.cookie);
    }
  }

  // Extract JWT or session token from cookie string
  private extractTokenFromCookies(
    cookieHeader?: string | null
  ): string | undefined {
    if (!cookieHeader) return undefined;

    // Assuming your auth cookie name is 'sessionToken'
    const match = cookieHeader.match(/(?:^|;\s*)sessionToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T | null> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    // Always include auth header if token is present
    const headers: HeadersInit = {
      ...(options?.headers ?? {}),
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error (${res.status}): ${text}`);
    }

    // Auto-parse JSON if possible
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return res.json() as Promise<T>;
    }

    return null;
  }

  async getLivingLabs(
    fields?: string[]
  ): Promise<(ILivingLab | ILivingLabPopulated)[] | null> {
    const defaultFields = ["projects", "kpiresults", "transport_modes"];

    return this.request<(ILivingLab | ILivingLabPopulated)[] | null>(
      "/labs" +
        (fields
          ? `?fields=${fields?.join(",")}`
          : `?fields=${defaultFields.join(",")}`)
    );
  }

  async getLivingLab(
    livingLabId: string,
    fields?: string[]
  ): Promise<ILivingLabPopulated | null> {
    const defaultFields = ["projects", "kpiresults", "transport_modes"];

    return this.request<ILivingLabPopulated | null>(
      "/labs?id=" +
        encodeURIComponent(livingLabId) +
        (fields
          ? `&fields=${fields.join(",")}`
          : `&fields=${defaultFields.join(",")}`)
    );
  }

  async getMeasures(): Promise<IProject[] | null> {
    return this.request<IProject[] | null>("/projects");
  }

  async updateLivingLabMeasure(data: { labId: string; projectId: string }) {
    return this.request<IProject>(`/labs-projects`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteLivingLabMeasure(data: { labId: string; projectId: string }) {
    return this.request<void>(`/labs-projects`, {
      method: "DELETE",
      body: JSON.stringify(data),
    });
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

  async getTransportModes(): Promise<ITransportMode[] | null> {
    return this.request<ITransportMode[]>("/transport-modes");
  }

  async updateLivingLabTransportModes(data: ITransportModeLivingLabEdit) {
    return this.request<IProject>(`/labs-transport-modes`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteLivingLabTransportModes(data: ITransportModeLivingLabDelete) {
    return this.request<void>(`/labs-transport-modes`, {
      method: "DELETE",
      body: JSON.stringify(data),
    });
  }
}
