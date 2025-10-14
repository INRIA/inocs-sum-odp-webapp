import prisma from "../db/client";
import type {
  IKpiResult,
  IKpiResultInput,
  EnumKpiMetricType,
  EnumKpiType,
} from "../../types/KPIs";

/**
 * Input for updating KPI Result (all fields optional).
 */

export class KpiResultsRepository {
  /**
   * Get all KPI results (with their definition).
   */
  async findAll(): Promise<IKpiResult[]> {
    try {
      const rows = await prisma.kpiresults.findMany({
        include: {
          kpidefinitions: true, // Adjust if relation alias differs
        },
      });
      return rows.map(this.mapPrismaRowToIKpiResult);
    } catch (error) {
      console.error("Error fetching all kpiresults:", error);
      throw new Error("Failed to fetch KPI results");
    }
  }

  /**
   * Get a KPI result by id.
   */
  async findById(id: string): Promise<IKpiResult | null> {
    try {
      const row = await prisma.kpiresults.findUnique({
        where: { id },
        include: { kpidefinitions: true },
      });
      return row ? this.mapPrismaRowToIKpiResult(row) : null;
    } catch (error) {
      console.error(`Error fetching kpiresult with id ${id}:`, error);
      throw new Error("Failed to fetch KPI result");
    }
  }

  /**
   * Upsert a KPI result.
   */
  async upsert(data: IKpiResultInput): Promise<IKpiResult> {
    try {
      const { id, ...updateData } = data;
      const existingResult = data.id
        ? await prisma.kpiresults.findUnique({
            where: {
              id: BigInt(data.id),
            },
          })
        : null;

      if (existingResult) {
        // Update existing record
        const updated = await prisma.kpiresults.update({
          where: { id: BigInt(existingResult.id) },
          data: { ...updateData, date: new Date(updateData.date) },
        });
        return this.mapPrismaRowToIKpiResult(updated);
      }
      // Create new record
      const created = await prisma.kpiresults.create({
        data: { ...updateData, date: new Date(updateData.date) },
      });
      return this.mapPrismaRowToIKpiResult(created);
    } catch (error) {
      console.error(
        `Error updating kpiresult with data ${JSON.stringify(data)}:`,
        error
      );
      throw new Error("Failed to update KPI result");
    }
  }

  /**
   * Delete a KPI result by id.
   */
  async delete(
    id?: string

    //     criteria: {
    //     id?: string;
    //     kpidefinition_id?: string;
    //     living_lab_id?: string;
    //   }
  ): Promise<boolean> {
    try {
      await prisma.kpiresults.delete({ where: { id: Number(id) } });
      return true;
    } catch (error) {
      console.error(
        `Error deleting kpiresult with criteria ${JSON.stringify(criteria)}:`,
        error
      );
      throw new Error("Failed to delete KPI result");
    }
  }
  /**
   * Map raw Prisma row (result + definition) to IKpiResult.
   * Adjust property names if your Prisma schema differs.
   */
  private mapPrismaRowToIKpiResult(row: any): IKpiResult {
    const def = row.kpidefinitions || {};
    return row;
  }
}
