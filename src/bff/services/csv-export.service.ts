import { CsvExportRepository } from "../repositories/csv-export.repository";
import type {
  KpiResultCsvRow,
  ProjectCsvRow,
  KpiResultsCsvFilters,
  ProjectsCsvFilters,
  CsvHeaderDef,
} from "../../types/CsvExport";
import { CsvSerializer, EmptyCsvError } from "../../lib/utils/CsvSerializer";

// Re-export so existing consumers (controller, routes, tests) don't need changes
export type {
  KpiResultCsvRow,
  ProjectCsvRow,
  KpiResultsCsvFilters,
  ProjectsCsvFilters,
  CsvHeaderDef,
};
export { CsvSerializer, EmptyCsvError };

// ── KPI Results headers ───────────────────────────────────────────────────────

export const KPI_RESULTS_CSV_HEADERS: CsvHeaderDef[] = [
  { key: "lab", label: "Lab" },
  { key: "kpi_number", label: "KPI Number" },
  { key: "kpi_name", label: "KPI Name" },
  { key: "kpi_group", label: "KPI Group" },
  { key: "metric", label: "Metric" },
  { key: "value", label: "Value" },
  { key: "date", label: "Date" },
  { key: "transport_mode", label: "Transport Mode" },
];

// ── Projects headers ──────────────────────────────────────────────────────────

export const PROJECTS_CSV_HEADERS: CsvHeaderDef[] = [
  { key: "lab", label: "Lab" },
  { key: "project_name", label: "Project Name" },
  { key: "project_type", label: "Project Type" },
  { key: "start_date", label: "Start Date" },
  { key: "description", label: "Description" },
];

// ── Service ──────────────────────────────────────────────────────────────────

export class CsvExportService {
  constructor(private readonly repo = new CsvExportRepository()) {}

  async getKpiResultsCsv(filters: KpiResultsCsvFilters): Promise<string> {
    const rows = await this.repo.findKpiResultsForCsv(filters);
    return CsvSerializer.serialize(rows as unknown as Record<string, unknown>[], KPI_RESULTS_CSV_HEADERS);
  }

  async getProjectsCsv(filters: ProjectsCsvFilters): Promise<string> {
    const rows = await this.repo.findProjectsForCsv(filters);
    return CsvSerializer.serialize(rows as unknown as Record<string, unknown>[], PROJECTS_CSV_HEADERS);
  }
}
