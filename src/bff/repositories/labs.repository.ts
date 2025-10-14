import prisma from "../db/client";
import type {
  ILivingLab,
  ILivingLabPopulated,
  UpdateLabInput,
} from "../../types";

export class LabRepository {
  /**
   * Get all labs
   */
  async findAll({ projects }: { projects?: boolean }): Promise<ILivingLab[]> {
    try {
      const labs = await prisma.labs.findMany({
        orderBy: { name: "desc" },
        include: {
          living_lab_projects_implementation: projects === true,
        },
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
    { projects }: { projects?: boolean }
  ): Promise<ILivingLab | null> {
    try {
      const lab = await prisma.labs.findUnique({
        where: { id: BigInt(id) },
        include: {
          //   living_lab_projects_implementation: projects === true,
          living_lab_projects_implementation: projects === true && {
            include: {
              project: true,
            },
          },
        },
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
    return {
      ...prismaLab,
      projects:
        prismaLab.living_lab_projects_implementation
          ?.filter((impl) => impl.project)
          ?.map((impl) => impl.project) || [],
    };
  }

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
          living_lab_id: BigInt(labId),
          project_id: BigInt(projectId),
          //   ...updateData,
        },
        create: {
          living_lab_id: BigInt(labId),
          project_id: BigInt(projectId),
          //   ...updateData,
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
}
