export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  old_password?: string | null;
  password: string;
  password_confirmation?: string | null;
  phone?: string | null;
  picture?: string | null;
  role_id: number;
  status: "signup" | "active" | "disabled";
  created_at: Date;
  role?: Role; // Populated role object
  living_lab_user_relation?: LivingLabUserRelation[];
  getSafeUser?: () => User; // Method to get safe user object without sensitive info
}

export interface LivingLabUserRelation {
  user_id: bigint;
  living_lab_id: bigint;
}

export interface User
  extends Omit<
    UserDto,
    "password" | "old_password" | "password_confirmation"
  > {}

export enum UserStatus {
  SIGNUP = "signup",
  ACTIVE = "active",
  DISABLED = "disabled",
}
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  password_confirmation?: string;
  phone?: string;
  picture?: string;
  role_id: number;
  status?: "signup" | "active" | "disabled";
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  old_password?: string;
  password?: string;
  password_confirmation?: string;
  phone?: string;
  picture?: string;
  role_id?: number;
  status?: "signup" | "active" | "disabled";
  living_lab_id?: string;
}

export interface SignupLabEditorInput {
  email: string;
  name: string;
  password: string;
  living_lab_id?: string;
}
