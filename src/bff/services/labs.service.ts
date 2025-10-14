import { LabRepository } from "../repositories/labs.repository";
import type {
  ILivingLab,
  ITransportModeLivingLabEdit,
  ITransportModeLivingLabImplementation,
  UpdateLabInput,
} from "../../types";

export class LabService {
  private labRepository: LabRepository;

  constructor() {
    this.labRepository = new LabRepository();
  }

  /**
   * Get all labs
   */
  async getAllLabs(include?: {
    projects?: boolean;
    transportModes?: boolean;
  }): Promise<ILivingLab[]> {
    try {
      return await this.labRepository.findAll({
        projects: include?.projects === true,
        transportModes: include?.transportModes === true,
      });
    } catch (error) {
      console.error("Error in getAllLabs service:", error);
      throw new Error("Failed to retrieve labs");
    }
  }

  /**
   * Get lab by ID
   */
  async getLabById(
    id: string,
    include?: { projects?: boolean; transportModes?: boolean }
  ): Promise<ILivingLab | null> {
    try {
      if (!id || isNaN(Number(id)) || Number(id) <= 0) {
        throw new Error("Invalid lab ID provided");
      }
      return await this.labRepository.findById(id, {
        projects: include?.projects === true,
        transportModes: include?.transportModes === true,
      });
    } catch (error) {
      console.error("Error in getLabById service:", error);
      throw new Error("Failed to retrieve lab");
    }
  }

  /**
   * Create a new lab with validation
   */
  async createLab(labData: UpdateLabInput): Promise<ILivingLab> {
    try {
      this.validateCreateLabInput(labData);
      return await this.labRepository.create(labData);
    } catch (error) {
      console.error("Error in createLab service:", error);
      if (error instanceof Error) throw error;
      throw new Error("Failed to create lab");
    }
  }

  /**
   * Update an existing lab with validation
   */
  async updateLab(id: number, labData: UpdateLabInput): Promise<ILivingLab> {
    try {
      if (!id || id <= 0) {
        throw new Error("Invalid lab ID provided");
      }

      const existing = await this.labRepository.findById(id);
      if (!existing) {
        throw new Error("ILivingLab not found");
      }

      this.validateUpdateLabInput(labData);
      return await this.labRepository.update(id, labData);
    } catch (error) {
      console.error("Error in updateLab service:", error);
      if (error instanceof Error) throw error;
      throw new Error("Failed to update lab");
    }
  }

  /**
   * Validation for creating labs
   */
  private validateCreateLabInput(labData: UpdateLabInput): void {
    if (!labData.name || labData.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }
    this.validateCommonFields(labData);
  }

  /**
   * Validation for updating labs
   */
  private validateUpdateLabInput(labData: UpdateLabInput): void {
    if (labData.name && labData.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }
    this.validateCommonFields(labData);
  }

  /**
   * Common optional field validations
   */
  private validateCommonFields(labData: UpdateLabInput): void {
    if (labData.country_code2 && labData.country_code2.length !== 2) {
      throw new Error("country_code2 must be 2 characters");
    }
    if (labData.area && labData.area < 0) {
      throw new Error("area cannot be negative");
    }
    if (labData.radius && labData.radius < 0) {
      throw new Error("radius cannot be negative");
    }
    if (labData.population && labData.population < 0) {
      throw new Error("population cannot be negative");
    }
  }

  /**
   * RELATIONS IMPLEMENTATIONS
   */

  /**
   * Upsert a LabProjectImplementation for a given lab and project
   */
  async upsertLabProjectImplementation(
    labId: string,
    projectId: string,
    implementationData: any
  ): Promise<any> {
    try {
      if (!labId || isNaN(Number(labId)) || Number(labId) <= 0)
        throw new Error("Invalid lab ID");
      if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)
        throw new Error("Invalid project ID");
      // You may want to validate implementationData here

      return await this.labRepository.upsertProjectImplementation(
        labId,
        projectId,
        implementationData
      );
    } catch (error) {
      console.error("Error in upsertLabProjectImplementation service:", error);
      throw new Error("Failed to upsert LabProjectImplementation");
    }
  }

  /**
   * Delete a LabProjectImplementation for a given lab and project
   */
  async deleteLabProjectImplementation(
    labId: string,
    projectId: string
  ): Promise<void> {
    try {
      if (!labId || isNaN(Number(labId)) || Number(labId) <= 0)
        throw new Error("Invalid lab ID");
      if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)
        throw new Error("Invalid project ID");

      await this.labRepository.deleteProjectImplementation(labId, projectId);
    } catch (error) {
      console.error("Error in deleteLabProjectImplementation service:", error);
      throw new Error("Failed to delete LabProjectImplementation");
    }
  }

  /**
   * Upsert a LabTransportModeImplementation for a given lab and transport mode
   */
  async upsertLabTransportModeImplementation(
    data: ITransportModeLivingLabEdit
  ): Promise<ITransportModeLivingLabImplementation> {
    try {
      const { living_lab_id, transport_mode_id } = data;
      if (
        !living_lab_id ||
        isNaN(Number(living_lab_id)) ||
        Number(living_lab_id) <= 0
      )
        throw new Error("Invalid lab ID");
      if (
        !transport_mode_id ||
        isNaN(Number(transport_mode_id)) ||
        Number(transport_mode_id) <= 0
      )
        throw new Error("Invalid transport mode ID");
      // You may want to validate implementationData here

      return await this.labRepository.upsertTransportModesImplementation(
        living_lab_id,
        transport_mode_id,
        data
      );
    } catch (error) {
      console.error(
        "Error in upsertLabTransportModeImplementation service:",
        error
      );
      throw new Error("Failed to upsert LabTransportModeImplementation");
    }
  }

  /**
   * Delete a LabTransportModeImplementation for a given lab and transport mode
   */
  async deleteLabTransportModeImplementation(
    labId: string,
    transportModeId: string
  ): Promise<void> {
    try {
      if (!labId || isNaN(Number(labId)) || Number(labId) <= 0)
        throw new Error("Invalid lab ID");
      if (
        !transportModeId ||
        isNaN(Number(transportModeId)) ||
        Number(transportModeId) <= 0
      )
        throw new Error("Invalid transport mode ID");

      await this.labRepository.deleteTransportModesImplementation(
        labId,
        transportModeId
      );
    } catch (error) {
      console.error(
        "Error in deleteLabTransportModeImplementation service:",
        error
      );
      throw new Error("Failed to delete LabTransportModeImplementation");
    }
  }
}
