import prisma from "../db/client";
import type { User, CreateUserInput, UpdateUserInput, UserDto } from "../types";

export class UserRepository {
  /**
   * Get all users with their roles populated
   */
  async findAll(): Promise<User[]> {
    try {
      const users = await prisma.users.findMany({
        include: {
          role: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return users.map(this.mapPrismaUserToUser);
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  /**
   * Get user by ID with role populated
   */
  async findById(id: number, safe?: boolean): Promise<User | UserDto | null> {
    try {
      const _safe = safe !== undefined ? safe : true;
      const user = await prisma.users.findUnique({
        where: { id },
        include: {
          role: true,
        },
      });

      return user
        ? _safe
          ? (this.mapPrismaUserToUser(user) as User)
          : (user as UserDto)
        : null;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      throw new Error("Failed to fetch user");
    }
  }

  /**
   * Get user by email with role populated
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { email },
        include: {
          role: true,
        },
      });

      return user ? this.mapPrismaUserToUser(user) : null;
    } catch (error) {
      console.error(`Error fetching user with email ${email}:`, error);
      throw new Error("Failed to fetch user");
    }
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserInput): Promise<User> {
    try {
      const user = await prisma.users.create({
        data: {
          ...userData,
          status: userData.status || "signup",
        },
        include: {
          role: true,
        },
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  /**
   * Update an existing user
   */
  async update(id: number, userData: UpdateUserInput): Promise<User | null> {
    try {
      const user = await prisma.users.update({
        where: { id },
        data: userData,
        include: {
          role: true,
        },
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      throw new Error("Failed to update user");
    }
  }

  /**
   * Delete a user
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.users.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error(`Error deleting user with id ${id}:`, error);
      throw new Error("Failed to delete user");
    }
  }

  /**
   * Get users by status
   */
  async findByStatus(
    status: "signup" | "active" | "disabled"
  ): Promise<User[]> {
    try {
      const users = await prisma.users.findMany({
        where: { status },
        include: {
          role: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return users.map(this.mapPrismaUserToUser);
    } catch (error) {
      console.error(`Error fetching users with status ${status}:`, error);
      throw new Error("Failed to fetch users by status");
    }
  }

  /**
   * Get users by role ID
   */
  async findByRoleId(roleId: number): Promise<User[]> {
    try {
      const users = await prisma.users.findMany({
        where: { role_id: roleId },
        include: {
          role: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return users.map(this.mapPrismaUserToUser);
    } catch (error) {
      console.error(`Error fetching users with role_id ${roleId}:`, error);
      throw new Error("Failed to fetch users by role");
    }
  }

  /**
   * Map Prisma User with Role to our User interface
   */
  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      picture: prismaUser.picture,
      status: prismaUser.status,
      created_at: prismaUser.created_at,
      role_id: prismaUser.role_id,
      role: prismaUser.role
        ? {
            id: prismaUser.role.id,
            name: prismaUser.role.name,
            description: prismaUser.role.description,
          }
        : undefined,
    };
  }
}
