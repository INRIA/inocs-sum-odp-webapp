import type { ILivingLab } from "./LivingLab";

export enum ProjectType {
  PUSH = "PUSH",
  PULL = "PULL",
  OTHER = "OTHER",
}

export interface IProject {
  id: string;
  name: string;
  description?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  type: string;
  image_url?: string;
  living_lab_projects_implementation?: LivingLabProjectsImplementation[];
}

export interface UpdateProjectInput extends Partial<Omit<IProject, "id">> {}

export interface LivingLabProjectsImplementation {
  id: number;
  project_id: number;
  living_lab_id: number;
  user_id: string;
  created_at?: Date | null;
  updated_at?: Date | null;
  start_at?: Date | null;
  project?: IProject;
  lab?: ILivingLab;
}
