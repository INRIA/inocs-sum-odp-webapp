// Shared types for the CSV export feature.
// Consumed by: csv-export.repository.ts, csv-export.service.ts

export interface KpiResultCsvRow {
  lab: string;
  kpi_number: string;
  kpi_name: string;
  kpi_group: string;
  metric: string;
  value: number;
  date: string; // YYYY-MM-DD
  transport_mode: string; // empty string when none
}

export interface ProjectCsvRow {
  lab: string;
  project_name: string;
  project_type: string;
  start_date: string; // YYYY-MM-DD or empty string
  description: string; // empty string when null
}

export interface KpiResultsCsvFilters {
  living_lab_id?: number;
  category_id?: number;
  kpidefinition_id?: number;
}

export interface ProjectsCsvFilters {
  living_lab_id?: number;
}

export interface CsvHeaderDef {
  key: string;
  label: string;
}
