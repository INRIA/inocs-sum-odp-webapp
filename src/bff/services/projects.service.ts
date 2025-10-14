import { ProjectRepository } from "../repositories/projects.repository";
import type { IProject } from "../../types";

export class ProjectsService {
  private projectsRepository: ProjectRepository;

  constructor() {
    this.projectsRepository = new ProjectRepository();
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<IProject[]> {
    try {
      return await this.projectsRepository.findAll();
    } catch (error) {
      console.error("Error in getAllProjects service:", error);
      throw new Error("Failed to retrieve projects");
    }
  }
}
