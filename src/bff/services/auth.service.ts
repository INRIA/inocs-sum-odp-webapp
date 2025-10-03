import { UserRepository } from "../repositories/user.repository";
import type { User, UserDto } from "../types";
import PasswordUtils from "../../lib/utils/PasswordUtils";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export class AuthService {
  private _userRepository?: UserRepository;

  constructor() {}

  /**
   * Lazy-load UserRepository to avoid Prisma initialization during middleware startup
   */
  private get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const { email, password } = credentials;

      // Find user by email (get unsafe version with password)
      const userData = (await this.userRepository.findByEmail(
        email,
        false
      )) as UserDto;

      if (!userData) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        userData.password
      );
      if (!isPasswordValid) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      console.error("Error in AuthService.login:", error);
      return {
        success: false,
        error: "Authentication failed",
      };
    }
  }
}
