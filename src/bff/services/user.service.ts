import {
  type User,
  type CreateUserInput,
  type UpdateUserInput,
  type UserDto,
  type SignupLabEditorInput,
  UserStatus,
} from "../../types";
import { UserRepository } from "../repositories";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Get labs accessible by the given user id.
   * Returns an array of minimal lab data for selection.
   */
  async getUserLabs(
    userId: string
  ): Promise<Array<{ id: string; name: string }>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      const labs = user.living_lab_user_relation?.map(
        (relation) => relation.lab
      );

      return labs?.map((l: any) => ({ id: String(l.id), name: l.name })) || [];
    } catch (error) {
      console.error("Error in getUserLabs service:", error);
      throw new Error("Failed to retrieve user labs");
    }
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

  async findUsers(filter: {
    id?: string;
    email?: string;
    status?: string;
    roleId?: string;
  }): Promise<User[]> {
    const { id, email, status, roleId } = filter;
    let user = null;
    let data = [];

    try {
      if (id) {
        user = await this.getUserById(id);
      } else if (email) {
        user = await this.getUserByEmail(email);
      }

      if (user) {
        data.push(user);
      } else if (status || roleId) {
        // Get users with optional filtering
        const options: any = {};
        if (status) options.status = status;
        if (roleId) options.roleId = parseInt(roleId, 10);

        const users = await this.getAllUsers(options);
        data.push(...users);
      }
      return data;
    } catch (error) {
      console.error("Error in findUsers service:", error);
      return [];
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      if (!id || isNaN(parseInt(id, 10))) {
        throw new Error("Invalid user ID provided");
      }

      return (await this.userRepository.findById(id, true)) as User | null;
    } catch (error) {
      console.error("Error in getUserById service:", error);
      throw new Error("Failed to retrieve user");
    }
  }

  async getUserDtoById(id: string): Promise<UserDto | null> {
    try {
      if (!id || isNaN(parseInt(id, 10))) {
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
    id: string,
    userData: UpdateUserInput
  ): Promise<User | null> {
    try {
      if (!id || isNaN(parseInt(id, 10))) {
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
  async deleteUser(id: string): Promise<boolean> {
    try {
      if (!id || isNaN(parseInt(id, 10))) {
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
   * Create a new user by calling the external admin API.
   * Uses env vars: ODP_ADMIN_APP_HOST and USER_CREATION_API_KEY.
   * Performs the same input validation as local create (no password hashing here).
   */
  async createUserLabEditor(userData: SignupLabEditorInput): Promise<any> {
    try {
      const host = process.env.ODP_ADMIN_APP_HOST;
      const apiKey = process.env.USER_CREATION_API_KEY;
      const roleId = process.env.SIGNUP_LAB_EDITOR_ROLE_ID ?? "2";
      const autoActivate = process.env.SIGNUP_AUTO_ACTIVATE === "true";
      if (!host) {
        throw new Error("ODP_ADMIN_APP_HOST is not configured");
      }

      if (!apiKey) {
        throw new Error("USER_CREATION_API_KEY is not configured");
      }

      const base = host.replace(/\/+$/, "");
      const url = `${base}/api/users`;

      const payload: any = {
        name: userData.name?.trim(),
        email: userData.email?.toLowerCase().trim(),
        password: userData.password,
        role_id: Number(roleId),
      };

      this.validateCreateUserInput(payload);

      const options: RequestInit = {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-User-Creation-Key": apiKey,
        },
        body: JSON.stringify(payload),
      };

      const res = await fetch(url, options as any);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Admin API error (${res.status}): ${text}`);
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const user = (await res.json()) as User;
        if (userData.living_lab_id) {
          await this.userRepository.setUserLivingLab(
            String(user.id),
            userData.living_lab_id
          );
        }

        if (autoActivate) {
          const updatedUser = await this.autoValidateIfNoOtherEditors(
            roleId,
            String(user.id),
            userData.living_lab_id!
          );
          if (updatedUser) {
            return updatedUser;
          }
        }
        return user;
      }

      // If not JSON, return raw text
      return await res.text();
    } catch (error) {
      console.error(
        "Error in createUserViaAdminApi service:",
        // Don't log userData.password
        error instanceof Error ? error.message : error
      );
      if (error instanceof Error) throw error;
      throw new Error("Failed to create user via admin API");
    }
  }

  private autoValidateIfNoOtherEditors = async (
    roleId: string,
    userId: string,
    labId: string
  ): Promise<User | null> => {
    const otherEditors = await this.findUserByRoleIdAndLabIdAndStatus(
      roleId,
      labId,
      UserStatus.ACTIVE
    );
    if (!otherEditors || otherEditors.length === 0) {
      return this.userRepository.update(userId, {
        status: UserStatus.ACTIVE,
      });
    }
    return null;
  };

  private findUserByRoleIdAndLabIdAndStatus = async (
    roleId: string,
    labId: string,
    status: UserStatus
  ): Promise<User[]> => {
    try {
      const users = await this.userRepository.findByRoleIdAndLabIdAndStatus(
        roleId,
        labId,
        status
      );
      return users && users?.length > 0 ? users : [];
    } catch (error) {
      console.error(
        `Error fetching users with role ID ${roleId} and lab ID ${labId}:`,
        error
      );
      throw new Error("Failed to fetch users");
    }
  };

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
