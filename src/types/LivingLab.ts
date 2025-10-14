import type { IIKpiResultBeforeAfter } from "./KPIs";
import type { IProject, LivingLabProjectsImplementation } from "./Project";
import type { ILivingLabTransportMode } from "./TransportMode";

export interface ILivingLab {
  id: number;
  name: string;
  country?: string | null;
  flag?: string | null;
  description?: string | null;
  area?: number | null;
  radius?: number | null;
  population?: number | null;
  country_code2?: string | null;
  lat?: string | null;
  lng?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  user_id?: number | null;
  validated_at?: Date | null;
  validated_by_user_id?: number | null;
  living_lab_projects_implementation?: LivingLabProjectsImplementation[];
}

export interface UpdateLabInput extends Partial<Omit<ILivingLab, "id">> {}

export interface ILivingLabPopulated extends ILivingLab {
  kpi_results?: IIKpiResultBeforeAfter[];
  /**
   * Measures list — may be empty
   */
  projects?: IProject[];
  /**
   * Transport modes list — may be empty
   */
  transport_modes?: ILivingLabTransportMode[];
  // allow additional unknown fields if present in future
  [key: string]: unknown;
}
