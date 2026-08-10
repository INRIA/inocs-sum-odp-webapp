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
  User,
  SignupLabEditorInput,
  IJobRun,
  CreateLabInput,
  IResource,
  CustomMCDAPayload,
} from "../../types";
import type { ICategory } from "../../types/Category";
import type { IGiscoSearchResult } from "../../types/Gisco";

export default class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  private token?: string;
  private isServer: boolean;
  private originalRequest?: Request;

  constructor(request?: Request) {
    this.isServer = typeof window === "undefined";
    this.originalRequest = request;

    // --- Determine base URL ---
    if (this.isServer) {
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
    cookieHeader?: string | null,
  ): string | undefined {
    if (!cookieHeader) return undefined;

    // Assuming your auth cookie name is 'sessionToken'
    const match = cookieHeader.match(/(?:^|;\s*)sessionToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  private async request<T>(
    path: string,
    options?: RequestInit,
    throwOnError = false,
  ): Promise<T | null> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    // Always include auth header if token is present
    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string>) ?? {}),
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    // Mark internal SSR requests to prevent self-rate-limiting
    if (this.isServer) {
      headers["X-Internal-Request"] = "true";
    }

    try {
      const res = await fetch(url, { ...options, headers });

      // Handle rate limiting (429) in SSR mode
      if (!res.ok && res.status === 429 && this.isServer) {
        const retryAfter = res.headers.get("Retry-After") || "300";
        const currentPath = this.originalRequest
          ? new URL(this.originalRequest.url).pathname +
            new URL(this.originalRequest.url).search
          : "/";
        const redirectUrl = `/rate-limited?from=${encodeURIComponent(currentPath)}`;

        // Throw a redirect response - Astro will catch and return this
        const redirectResponse = new Response(null, {
          status: 302,
          headers: {
            Location: redirectUrl,
            "Retry-After": retryAfter,
          },
        });
        throw redirectResponse;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error (status=${res.status}): ${text}`);
      }

      // Auto-parse JSON if possible
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return res.json() as Promise<T>;
      }

      return null;
    } catch (error) {
      // Re-throw redirect responses (for rate limiting in SSR)
      if (error instanceof Response) {
        throw error;
      }

      console.error(
        `Error during API request to ${options?.method} ${url}:`,
        error,
      );
      if (throwOnError) {
        throw new Error(error instanceof Error ? error.message : String(error));
      }
      return null;
    }
  }

  async getLivingLabs(
    fields?: string[],
  ): Promise<(ILivingLab | ILivingLabPopulated)[] | null> {
    const defaultFields = ["projects", "kpiresults", "transport_modes"];
    const params = new URLSearchParams();
    const fieldsToUse = fields ?? defaultFields;
    if (fieldsToUse.length > 0) {
      params.set("fields", fieldsToUse.join(","));
    }
    return this.request<(ILivingLab | ILivingLabPopulated)[] | null>(
      "/labs?" + params.toString(),
    );
  }

  async createLivingLab(data: CreateLabInput): Promise<ILivingLab | null> {
    return this.request<ILivingLab | null>(
      `/labs`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    );
  }

  async getLivingLab(
    livingLabId: string,
    fields?: string[],
  ): Promise<ILivingLabPopulated | null> {
    const defaultFields = ["projects", "kpiresults", "transport_modes"];
    const params = new URLSearchParams({ id: livingLabId });
    const fieldsToUse = fields ?? defaultFields;
    if (fieldsToUse.length > 0) {
      params.set("fields", fieldsToUse.join(","));
    }
    return this.request<ILivingLabPopulated | null>(
      `/labs?${params.toString()}`,
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
      "/kpidefinitions" + (kpi_number ? `?kpi_number=${kpi_number}` : ""),
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
    data: IKpiResultInput,
  ): Promise<IKpiResultInput | null> {
    return this.request<IKpiResultInput>(`/kpiresults`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getCategories(
    type: "KPI_SIEF" | "ITEM" | "KPI_IMPACT" | "RESOURCES",
  ): Promise<ICategory[] | null> {
    return this.request<ICategory[]>(
      `/categories?type=${encodeURIComponent(type)}`,
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

  async signupLabEditor(data: SignupLabEditorInput): Promise<User | null> {
    return this.request<User | null>(`/signup-editor`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLatestJobRun(jobName: string): Promise<IJobRun | null> {
    const params = new URLSearchParams({ job_name: jobName });
    return this.request<IJobRun>(`/job-runs?${params.toString()}`);
  }

  async getJobRunById(id: string): Promise<IJobRun | null> {
    const params = new URLSearchParams({ id });
    return this.request<IJobRun>(`/job-runs?${params.toString()}`);
  }

  async getAllJobRuns(status?: string): Promise<IJobRun[] | null> {
    const params = status ? new URLSearchParams({ status }) : "";
    return this.request<IJobRun[]>(`/job-runs${params ? `?${params}` : ""}`);
  }

  async triggerFullCustomMCDA(
    payload: CustomMCDAPayload,
  ): Promise<IJobRun | null> {
    return this.request<IJobRun>(
      `/job-runs`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  }

  /**
   * Resources (items)
   */
  async getItemsByCategoryType(
    categoryType: "KPI_SIEF" | "ITEM" | "KPI_IMPACT" | "RESOURCES",
  ): Promise<IResource[] | null> {
    return this.request<IResource[] | null>(
      `/items?category_type=${encodeURIComponent(categoryType)}`,
    );
  }

  async getItemById(id: number): Promise<IResource | null> {
    return this.request<IResource | null>(`/items/${id}`);
  }

  async getResourcesForLab(labId: number): Promise<IResource[]> {
    const all = await this.getItemsByCategoryType("RESOURCES");
    if (!all) return [];
    return all.filter((r) => Number(r.living_lab?.id) === labId);
  }

  /**
   * Get users with optional status filter.
   * Used by the analytics dashboard to count active vs pending users.
   */
  async getUsers(options?: { status?: string }): Promise<User[] | null> {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    return this.request<User[]>(`/users${params.toString() ? `?${params}` : ""}`);
  }

  async searchCities(query: string): Promise<IGiscoSearchResult[]> {
    try {
      const result = await this.request<IGiscoSearchResult[]>(
        `/geocode?q=${encodeURIComponent(query)}`,
      );
      return result ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Download a CSV blob from the given path.
   * Does NOT reuse request<T>() because that method discards non-JSON bodies.
   * Throws ApiDownloadError on non-2xx responses.
   */
  async downloadCsvBlob(path: string): Promise<Blob> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiDownloadError(
        `ApiDownloadError: status=${res.status} ${text}`,
        res.status,
      );
    }

    return res.blob();
  }
}

export class ApiDownloadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiDownloadError";
  }
}
