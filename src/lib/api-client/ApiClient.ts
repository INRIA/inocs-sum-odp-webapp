import type {
  IKpi,
  ILivingLabPopulated,
  IProject,
  ITransportMode,
  ILivingLab,
  ITransportModeLivingLabEdit,
  ITransportModeLivingLabDelete,
  IKpiResultInput,
  LivingLabProjectsImplementationInput,
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

    try {
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
    } catch (error) {
      console.error(`Error during API request to ${url}:`, error);
    }

    return null;
  }

  async getLivingLabs(
    fields?: string[]
  ): Promise<(ILivingLab | ILivingLabPopulated)[] | null> {
    const defaultFields = ["projects", "kpiresults", "transport_modes"];
    const params = new URLSearchParams();
    const fieldsToUse = fields ?? defaultFields;
    if (fieldsToUse.length > 0) {
      params.set("fields", fieldsToUse.join(","));
    }
    return this.request<(ILivingLab | ILivingLabPopulated)[] | null>(
      "/labs?" + params.toString()
    );
  }

  async getLivingLab(
    livingLabId: string,
    fields?: string[]
  ): Promise<ILivingLabPopulated | null> {
    const defaultFields = ["projects", "kpiresults", "transport_modes"];
    const params = new URLSearchParams({ id: livingLabId });
    const fieldsToUse = fields ?? defaultFields;
    if (fieldsToUse.length > 0) {
      params.set("fields", fieldsToUse.join(","));
    }
    return this.request<ILivingLabPopulated | null>(
      `/labs?${params.toString()}`
    );
  }

  async updateLivingLab(data: ILivingLab): Promise<ILivingLab | null> {
    return this.request<ILivingLab | null>(`/labs`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getMeasures(): Promise<IProject[] | null> {
    return this.request<IProject[] | null>("/projects");
  }

  async updateLivingLabMeasure(data: LivingLabProjectsImplementationInput) {
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

  async getKPIs(data?: { kpi_number?: string }): Promise<IKpi[] | null> {
    const kpi_number = data?.kpi_number;
    return this.request<IKpi[]>(
      "/kpidefinitions" + (kpi_number ? `?kpi_number=${kpi_number}` : "")
    );
  }

  async upsertKpiResult(data: IKpiResultInput) {
    return this.request<IKpiResultInput>(`/kpiresults`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteKpiResult(id: string) {
    return this.request<void>(`/kpiresults/${id}`, {
      method: "DELETE",
    });
  }

  async upsertLivingLabKpiResults(
    data: IKpiResultInput
  ): Promise<IKpiResultInput | null> {
    return this.request<IKpiResultInput>(`/kpiresults`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getCategories(
    type: "KPI_SIEF" | "ITEM" | "KPI_IMPACT"
  ): Promise<ICategory[] | null> {
    return this.request<ICategory[]>(
      `/categories?type=${encodeURIComponent(type)}`
    );
  }

  async getTransportModes(): Promise<ITransportMode[] | null> {
    return this.request<ITransportMode[]>("/transport-modes");
  }

  async upsertLivingLabTransportModes(data: ITransportModeLivingLabEdit) {
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
