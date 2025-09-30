export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface UserDto {
  id: number;
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
}

export interface User
  extends Omit<UserDto, "password" | "old_password" | "password_confirmation"> {}

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
}
