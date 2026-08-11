import { CsvExportRepository } from "../repositories/csv-export.repository";
import type {
  KpiResultCsvRow,
  ProjectCsvRow,
  KpiResultsCsvFilters,
  ProjectsCsvFilters,
  CsvHeaderDef,
} from "../../types/CsvExport";
import { CsvSerializer } from "../../lib/utils/CsvSerializer";

// Re-export so existing consumers (controller, routes, tests) don't need changes
export type {
  KpiResultCsvRow,
  ProjectCsvRow,
  KpiResultsCsvFilters,
  ProjectsCsvFilters,
  CsvHeaderDef,
};
export { CsvSerializer };

// ── KPI Results headers ───────────────────────────────────────────────────────

export const KPI_RESULTS_CSV_HEADERS: CsvHeaderDef[] = [
  { key: "kpi_group", label: "KPI Group" },
  { key: "kpi_number", label: "KPI Number" },
  { key: "kpi_name_parent", label: "KPI Name (parent)" },
  { key: "kpi_subtitle_child", label: "KPI subtitle (child)" },
  { key: "transport_mode", label: "Transport Mode (modal split)" },
  { key: "metric", label: "Metric(unit)" },
  { key: "lab", label: "Living Lab" },
  { key: "value", label: "KPI result Value" },
  { key: "date", label: "KPI result Date" },
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
