import { UserRepository } from "../repositories/user.repository";
import type { User, CreateUserInput, UpdateUserInput, UserDto } from "../types";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(options?: {
    status?: "signup" | "active" | "disabled";
    roleId?: number;
  }): Promise<User[]> {
    try {
      if (options?.status) {
        return await this.userRepository.findByStatus(options.status);
      }

      if (options?.roleId) {
        return await this.userRepository.findByRoleId(options.roleId);
      }

      return await this.userRepository.findAll();
    } catch (error) {
      console.error("Error in getAllUsers service:", error);
      throw new Error("Failed to retrieve users");
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    try {
      if (!id || id <= 0) {
        throw new Error("Invalid user ID provided");
      }

      return (await this.userRepository.findById(id, true)) as User | null;
    } catch (error) {
      console.error("Error in getUserById service:", error);
      throw new Error("Failed to retrieve user");
    }
  }

  async getUserDtoById(id: number): Promise<UserDto | null> {
    try {
      if (!id || id <= 0) {
        throw new Error("Invalid user ID provided");
      }

      return (await this.userRepository.findById(id, false)) as UserDto | null;
    } catch (error) {
      console.error("Error in getUserById service:", error);
      throw new Error("Failed to retrieve user");
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      if (!email || !this.isValidEmail(email)) {
        throw new Error("Invalid email provided");
      }

      return await this.userRepository.findByEmail(email);
    } catch (error) {
      console.error("Error in getUserByEmail service:", error);
      throw new Error("Failed to retrieve user");
    }
  }

  /**
   * Create a new user with business validation
   */
  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      // Business validation
      this.validateCreateUserInput(userData);

      // Check if user with email already exists
      const existingUser = await this.userRepository.findByEmail(
        userData.email
      );
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password (in production, you'd use bcrypt or similar)
      const hashedPassword = await this.hashPassword(userData.password);

      const userToCreate = {
        ...userData,
        password: hashedPassword,
        status: userData.status || ("signup" as const),
      };

      return await this.userRepository.create(userToCreate);
    } catch (error) {
      console.error("Error in createUser service:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create user");
    }
  }

  /**
   * Update an existing user with business validation
   */
  async updateUser(
    id: number,
    userData: UpdateUserInput
  ): Promise<User | null> {
    try {
      if (!id || id <= 0) {
        throw new Error("Invalid user ID provided");
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error("User not found");
      }

      // Business validation
      this.validateUpdateUserInput(userData);

      // If email is being updated, check for duplicates
      if (userData.email && userData.email !== existingUser.email) {
        const userWithEmail = await this.userRepository.findByEmail(
          userData.email
        );
        if (userWithEmail && userWithEmail.id !== id) {
          throw new Error("User with this email already exists");
        }
      }

      // Hash new password if provided
      if (userData.password) {
        userData.password = await this.hashPassword(userData.password);
      }

      return await this.userRepository.update(id, userData);
    } catch (error) {
      console.error("Error in updateUser service:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update user");
    }
  }

  /**
   * Delete a user (soft delete by setting status to disabled)
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      if (!id || id <= 0) {
        throw new Error("Invalid user ID provided");
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error("User not found");
      }

      // Soft delete by updating status
      await this.userRepository.update(id, { status: "disabled" });
      return true;
    } catch (error) {
      console.error("Error in deleteUser service:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to delete user");
    }
  }

  /**
   * Get active users only
   */
  async getActiveUsers(): Promise<User[]> {
    try {
      return await this.userRepository.findByStatus("active");
    } catch (error) {
      console.error("Error in getActiveUsers service:", error);
      throw new Error("Failed to retrieve active users");
    }
  }

  /**
   * Validate create user input
   */
  private validateCreateUserInput(userData: CreateUserInput): void {
    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error("Valid email is required");
    }

    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    if (!userData.password || userData.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    if (!userData.role_id || userData.role_id <= 0) {
      throw new Error("Valid role ID is required");
    }

    if (
      userData.password_confirmation &&
      userData.password !== userData.password_confirmation
    ) {
      throw new Error("Password and password confirmation do not match");
    }
  }

  /**
   * Validate update user input
   */
  private validateUpdateUserInput(userData: UpdateUserInput): void {
    if (userData.email && !this.isValidEmail(userData.email)) {
      throw new Error("Invalid email format");
    }

    if (userData.name && userData.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    if (userData.password && userData.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    if (userData.role_id && userData.role_id <= 0) {
      throw new Error("Invalid role ID");
    }

    if (
      userData.password_confirmation &&
      userData.password &&
      userData.password !== userData.password_confirmation
    ) {
      throw new Error("Password and password confirmation do not match");
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Hash password (simplified - use bcrypt in production)
   */
  private async hashPassword(password: string): Promise<string> {
    // This is a placeholder - in production, use bcrypt or similar
    // For now, just return the password (NOT SECURE)
    return password;
  }
}
