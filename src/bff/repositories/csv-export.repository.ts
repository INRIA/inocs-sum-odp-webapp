import prisma from "../db/client";
import type {
  KpiResultCsvRow,
  ProjectCsvRow,
  KpiResultsCsvFilters,
  ProjectsCsvFilters,
} from "../../types/CsvExport";

export type {
  KpiResultCsvRow,
  ProjectCsvRow,
  KpiResultsCsvFilters,
  ProjectsCsvFilters,
};

export class CsvExportRepository {
  async findKpiResultsForCsv(filters: KpiResultsCsvFilters): Promise<KpiResultCsvRow[]> {
    // Build conditions as an AND array to avoid key conflicts.
    // When kpidefinition_id is provided, match the exact KPI *and* its children
    // (rows whose kpidefinition has parent_kpi_id = the requested id).
    const andConditions: object[] = [];

    if (filters.living_lab_id !== undefined) {
      andConditions.push({ living_lab_id: BigInt(filters.living_lab_id) });
    }

    if (filters.kpidefinition_id !== undefined) {
      andConditions.push({
        OR: [
          { kpidefinition_id: BigInt(filters.kpidefinition_id) },
          { kpidefinition: { parent_kpi_id: BigInt(filters.kpidefinition_id) } },
        ],
      });
    }

    if (filters.category_id !== undefined) {
      andConditions.push({
        kpidefinition: {
          kpidefinitions_category: {
            some: { category_id: BigInt(filters.category_id) },
          },
        },
      });
    }

    const rows = await prisma.kpiresults.findMany({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
      include: {
        living_lab: true,
        kpidefinition: {
          include: {
            kpidefinitions_category: {
              include: { category: true },
            },
            parent_kpi: true,
          },
        },
        transport_mode: true,
      },
    });

    return rows.map((row) => {
      const firstCategory = row.kpidefinition?.kpidefinitions_category?.[0]?.category;
      const parentKpi = row.kpidefinition?.parent_kpi;
      return {
        lab: row.living_lab?.name ?? "",
        kpi_number: row.kpidefinition?.kpi_number ?? "",
        kpi_name_parent: parentKpi?.name ?? row.kpidefinition?.name ?? "",
        kpi_subtitle_child: parentKpi ? (row.kpidefinition?.name ?? "") : "",
        kpi_group: firstCategory?.name ?? "",
        metric: row.kpidefinition?.metric ?? "",
        value: row.value,
        date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
        transport_mode: row.transport_mode?.name ?? "",
      };
    });
  }

  async findProjectsForCsv(filters: ProjectsCsvFilters): Promise<ProjectCsvRow[]> {
    const where: Record<string, unknown> = {};
    if (filters.living_lab_id !== undefined) {
      where.living_lab_id = BigInt(filters.living_lab_id);
    }

    const rows = await prisma.living_lab_projects_implementation.findMany({
      where,
      include: {
        lab: true,
        project: true,
      },
    });

    return rows.map((row) => ({
      lab: row.lab?.name ?? "",
      project_name: row.project?.name ?? "",
      project_type: row.project?.type ?? "",
      start_date: row.start_at instanceof Date
        ? row.start_at.toISOString().slice(0, 10)
        : "",
      description: row.description ?? "",
    }));
  }
}
