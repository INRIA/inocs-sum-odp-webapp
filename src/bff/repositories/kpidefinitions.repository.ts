import type { IKpi, EnumKpiMetricType, EnumKpiType } from "../../types/KPIs";
import prisma from "../db/client";

export class KpiDefinitionsRepository {
  async findAll(): Promise<IKpi[]> {
    try {
      const kpis = await prisma.kpidefinitions.findMany({
        // where: {
        //   ...(filter.kpi_number && { kpi_number: filter.kpi_number }),
        // },
        orderBy: { kpi_number: "desc" },
      });
      return kpis.map(this.mapRow);
    } catch (error) {
      console.error("Error fetching all projects:", error);
      throw new Error("Failed to fetch projects");
    }
  }

  async findByKpiNumberWithChildren(
    kpi_number: string
  ): Promise<IKpi[] | null> {
    try {
      const parentKpi = await prisma.kpidefinitions.findFirstOrThrow({
        where: { kpi_number },
      });

      if (!parentKpi) {
        return null; // Parent KPI not found
      }

      const childKpis = await prisma.kpidefinitions.findMany({
        where: { parent_kpi_id: parentKpi.id },
      });

      return [parentKpi, ...childKpis].map(this.mapRow);
    } catch (error) {
      console.error("Error fetching KPI by number with children:", error);
      throw new Error("Failed to fetch KPI");
    }
  }

  private mapRow = (r: any): IKpi => r as IKpi;
}
