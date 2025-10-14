import prisma from "../db/client";
import type { IProject, UpdateProjectInput } from "../../types";

export class ProjectRepository {
  /**
   * Get all projects
   */
  async findAll(): Promise<IProject[]> {
    try {
      const projects = await prisma.projects.findMany({
        // If your schema has timestamps, you can keep this ordering.
        // orderBy: { created_at: "desc" },
      });
      return projects.map(this.mapPrismaProjectToProject);
    } catch (error) {
      console.error("Error fetching all projects:", error);
      throw new Error("Failed to fetch projects");
    }
  }

  /**
   * Get project by ID
   */
  async findById(id: number): Promise<IProject | null> {
    try {
      const project = await prisma.projects.findUnique({
        where: { id },
      });
      return project ? this.mapPrismaProjectToProject(project) : null;
    } catch (error) {
      console.error(`Error fetching project with id ${id}:`, error);
      throw new Error("Failed to fetch project");
    }
  }

  /**
   * Create a new project
   */
  async create(projectData: UpdateProjectInput): Promise<IProject> {
    try {
      const project = await prisma.projects.create({
        data: projectData,
      });
      return this.mapPrismaProjectToProject(project);
    } catch (error) {
      console.error("Error creating project:", error);
      throw new Error("Failed to create project");
    }
  }

  /**
   * Update an existing project
   */
  async update(id: number, projectData: UpdateProjectInput): Promise<IProject> {
    try {
      const project = await prisma.projects.update({
        where: { id },
        data: projectData,
      });
      return this.mapPrismaProjectToProject(project);
    } catch (error) {
      console.error(`Error updating project with id ${id}:`, error);
      throw new Error("Failed to update project");
    }
  }

  /**
   * Delete a project
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.projects.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error(`Error deleting project with id ${id}:`, error);
      throw new Error("Failed to delete project");
    }
  }

  /**
   * Map Prisma IProject to our IProject interface
   */
  private mapPrismaProjectToProject(prismaProject: any): IProject {
    // Extend this if you need to reshape or include relations.
    return prismaProject as IProject;
  }
}
