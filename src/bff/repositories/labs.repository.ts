import prisma from "../db/client";
import type {
  ILivingLab,
  ILivingLabPopulated,
  ITransportModeLivingLabImplementation,
  UpdateLabInput,
} from "../../types";

export class LabRepository {
  /**
   * Get all labs
   */
  async findAll(include?: Record<string, any>): Promise<ILivingLab[]> {
    try {
      const labs = await prisma.labs.findMany({
        orderBy: { name: "desc" },
        include: include ?? {},
      });
      return labs.map(this.mapPrismaLabToLab);
    } catch (error) {
      console.error("Error fetching all labs:", error);
      throw new Error("Failed to fetch labs");
    }
  }

  /**
   * Get lab by ID
   */
  async findById(
    id: string,
    include?: Record<string, any>
  ): Promise<ILivingLab | null> {
    try {
      const lab = await prisma.labs.findUnique({
        where: { id: BigInt(id) },
        include,
      });
      return lab ? this.mapPrismaLabToLab(lab) : null;
    } catch (error) {
      console.error(`Error fetching lab with id ${id}:`, error);
      throw new Error("Failed to fetch lab");
    }
  }

  /**
   * Create a new lab
   */
  async create(labData: UpdateLabInput): Promise<ILivingLab> {
    try {
      const lab = await prisma.labs.create({
        data: labData,
      });
      return this.mapPrismaLabToLab(lab);
    } catch (error) {
      console.error("Error creating lab:", error);
      throw new Error("Failed to create lab");
    }
  }

  /**
   * Update an existing lab
   */
  async update(id: number, labData: UpdateLabInput): Promise<ILivingLab> {
    try {
      const lab = await prisma.labs.update({
        where: { id },
        data: labData,
      });
      return this.mapPrismaLabToLab(lab);
    } catch (error) {
      console.error(`Error updating lab with id ${id}:`, error);
      throw new Error("Failed to update lab");
    }
  }

  /**
   * Map Prisma ILivingLab to our ILivingLab interface
   */
  private mapPrismaLabToLab(prismaLab: ILivingLab): ILivingLabPopulated {
    const sortedKpiResults = prismaLab.kpiresults?.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const distinctUniqueKeys = new Map<
      string,
      { kpidefinition_id: string; transport_mode_id: string | null }
    >();
    sortedKpiResults?.forEach((kr) => {
      const key = `${kr.kpidefinition_id}-${kr.transport_mode_id ?? "none"}`;
      if (!distinctUniqueKeys.has(key)) {
        distinctUniqueKeys.set(key, {
          kpidefinition_id: kr.kpidefinition_id,
          transport_mode_id: kr.transport_mode_id ?? null,
        });
      }
    });

    const kpi_results = Array.from(distinctUniqueKeys.values()).map(
      ({ kpidefinition_id, transport_mode_id }) => {
        const groupedResults =
          sortedKpiResults?.filter(
            (kr) =>
              kr.kpidefinition_id === kpidefinition_id &&
              (transport_mode_id
                ? kr.transport_mode_id === transport_mode_id
                : !kr.transport_mode_id)
          ) || [];
        const minKpiResult = groupedResults?.[0];
        const maxKpiResult =
          groupedResults.length > 1
            ? groupedResults[groupedResults.length - 1]
            : null;
        return {
          living_lab_id: prismaLab?.id || null,
          kpidefinition_id: minKpiResult?.kpidefinition_id || null,
          transport_mode_id: minKpiResult?.transport_mode_id || null,
          result_before: minKpiResult ?? null,
          result_after: maxKpiResult ?? null,
        };
      }
    );

    return {
      ...prismaLab,
      projects:
        prismaLab.living_lab_projects_implementation
          ?.filter((impl) => impl.project)
          ?.map((impl) => impl.project) || [],
      transport_modes:
        prismaLab?.transport_mode_living_lab_implementation
          ?.filter((impl) => impl.transport_mode)
          ?.map((impl) => impl.transport_mode) || [],
      kpi_results,
    };
  }

  /**
   * RELATION TABLE METHODS
   */
  /**
   * Upsert a project implementation for a lab
   */
  async upsertProjectImplementation(
    labId: string,
    projectId: string,
    updateData: Record<string, any>
  ): Promise<void> {
    try {
      return prisma.living_lab_projects_implementation.upsert({
        where: {
          living_lab_id_project_id: {
            living_lab_id: BigInt(labId),
            project_id: BigInt(projectId),
          },
        },
        update: {
          ...updateData,
          living_lab_id: BigInt(labId),
          project_id: BigInt(projectId),
        },
        create: {
          ...updateData,
          living_lab_id: BigInt(labId),
          project_id: BigInt(projectId),
        },
      });
    } catch (error) {
      console.error(
        `Error upserting project implementation for lab ${labId} and project ${projectId}:`,
        error
      );
      throw new Error("Failed to upsert project implementation");
    }
  }

  /**
   * Delete a project implementation from a lab
   */
  async deleteProjectImplementation(
    labId: string,
    projectId: string
  ): Promise<void> {
    try {
      await prisma.living_lab_projects_implementation.deleteMany({
        where: {
          living_lab_id: BigInt(labId),
          project_id: BigInt(projectId),
        },
      });
    } catch (error) {
      console.error(
        `Error deleting project implementation for lab ${labId} and project ${projectId}:`,
        error
      );
      throw new Error("Failed to delete project implementation");
    }
  }

  /**
   * Upsert transport modes implementations for a lab
   */

  async upsertTransportModesImplementation(
    labId: string,
    transportModeId: string,
    updateData: Record<string, any>
  ): Promise<ITransportModeLivingLabImplementation> {
    try {
      // First, delete existing implementations for the lab
      return prisma.transport_mode_living_lab_implementation.upsert({
        where: {
          transport_mode_id_living_lab_id: {
            living_lab_id: BigInt(labId),
            transport_mode_id: BigInt(transportModeId),
          },
        },
        update: {
          living_lab_id: BigInt(labId),
          transport_mode_id: BigInt(transportModeId),
          ...updateData,
        },
        create: {
          living_lab_id: BigInt(labId),
          transport_mode_id: BigInt(transportModeId),
          ...updateData,
        },
      });
    } catch (error) {
      console.error(
        `Error upserting transport mode implementation for lab ${labId} and transport mode ${transportModeId}:`,
        error
      );
      throw new Error("Failed to upsert transport mode implementation");
    }
  }

  /**
   * Delete a transport mode implementation from a lab
   */
  async deleteTransportModesImplementation(
    labId: string,
    transportModeId: string
  ): Promise<void> {
    try {
      await prisma.transport_mode_living_lab_implementation.deleteMany({
        where: {
          living_lab_id: BigInt(labId),
          transport_mode_id: BigInt(transportModeId),
        },
      });
    } catch (error) {
      console.error(
        `Error deleting transport mode implementation for lab ${labId} and transport mode ${transportModeId}:`,
        error
      );
      throw new Error("Failed to delete transport mode implementation");
    }
  }
}
