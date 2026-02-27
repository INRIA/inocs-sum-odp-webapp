import type {
  KpiResultsCsvFilters,
  ProjectsCsvFilters,
} from "../services/csv-export.service";
import { CsvExportService } from "../services/csv-export.service";

export class CsvExportController {
  private readonly service = new CsvExportService();

  async getKpiResultsCsv(filters: KpiResultsCsvFilters): Promise<string> {
    return this.service.getKpiResultsCsv(filters);
  }

  async getProjectsCsv(filters: ProjectsCsvFilters): Promise<string> {
    return this.service.getProjectsCsv(filters);
  }
}
