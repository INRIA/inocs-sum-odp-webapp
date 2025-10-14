import prisma from "../db/client";
import type { ITransportMode } from "../../types";

export class TransportModeRepository {
  /**
   * Get all transport modes
   */
  async findAll(): Promise<ITransportMode[]> {
    try {
      const transportModes = await prisma.transport_mode.findMany({
        // If your schema has timestamps, you can keep this ordering.
        // orderBy: { created_at: "desc" },
      });
      return transportModes.map(this.mapPrismaTransportMode);
    } catch (error) {
      console.error("Error fetching all transport modes:", error);
      throw new Error("Failed to fetch transport modes");
    }
  }

  /**
   * Get transport mode by ID
   */
  async findById(id: number): Promise<ITransportMode | null> {
    try {
      const transportMode = await prisma.transport_mode.findUnique({
        where: { id },
      });
      return transportMode ? this.mapPrismaTransportMode(transportMode) : null;
    } catch (error) {
      console.error(`Error fetching transport mode with id ${id}:`, error);
      throw new Error("Failed to fetch transport mode");
    }
  }

  /**
   * Create a new transport mode
   */
  async create(data: Omit<ITransportMode, "id">): Promise<ITransportMode> {
    try {
      const transportMode = await prisma.transport_mode.create({
        data: data,
      });
      return this.mapPrismaTransportMode(transportMode);
    } catch (error) {
      console.error("Error creating transport mode:", error);
      throw new Error("Failed to create transport mode");
    }
  }

  /**
   * Update an existing transport mode
   */
  async update(
    id: number,
    data: Omit<ITransportMode, "id">
  ): Promise<ITransportMode> {
    try {
      const transportMode = await prisma.transport_mode.update({
        where: { id },
        data: data,
      });
      return this.mapPrismaTransportMode(transportMode);
    } catch (error) {
      console.error(`Error updating transport mode with id ${id}:`, error);
      throw new Error("Failed to update transport mode");
    }
  }

  /**
   * Delete a transport mode
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.transport_mode.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error(`Error deleting transport mode with id ${id}:`, error);
      throw new Error("Failed to delete transport mode");
    }
  }

  /**
   * Map Prisma ITransportMode to our ITransportMode interface
   */
  private mapPrismaTransportMode(prismaTransportMode: any): ITransportMode {
    // Extend this if you need to reshape or include relations.
    return prismaTransportMode as ITransportMode;
  }
}
