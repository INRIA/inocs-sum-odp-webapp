import { TransportModeRepository } from "../repositories/transport-mode.repository";
import type { ITransportMode } from "../../types";

export class TransportModeService {
  private transportModeRepository: TransportModeRepository;

  constructor() {
    this.transportModeRepository = new TransportModeRepository();
  }

  /**
   * Get all transport modes
   */
  async getAllTransportModes(): Promise<ITransportMode[]> {
    try {
      return await this.transportModeRepository.findAll();
    } catch (error) {
      console.error("Error in getAllProjects service:", error);
      throw new Error("Failed to retrieve projects");
    }
  }
}
