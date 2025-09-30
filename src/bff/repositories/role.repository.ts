import prisma from '../db/client';
import type { Role } from '../types';

export class RoleRepository {
  /**
   * Get all roles
   */
  async findAll(): Promise<Role[]> {
    try {
      return await prisma.role.findMany({
        orderBy: {
          name: 'asc'
        }
      });
    } catch (error) {
      console.error('Error fetching all roles:', error);
      throw new Error('Failed to fetch roles');
    }
  }

  /**
   * Get role by ID
   */
  async findById(id: number): Promise<Role | null> {
    try {
      return await prisma.role.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error(`Error fetching role with id ${id}:`, error);
      throw new Error('Failed to fetch role');
    }
  }

  /**
   * Get role by name
   */
  async findByName(name: string): Promise<Role | null> {
    try {
      return await prisma.role.findFirst({
        where: { name }
      });
    } catch (error) {
      console.error(`Error fetching role with name ${name}:`, error);
      throw new Error('Failed to fetch role');
    }
  }
}