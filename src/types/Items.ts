import type { ICategory } from "./Category";
import type { IKpiDefinition } from "./ImpactAnalysis";
import type { ILivingLab } from "./LivingLab";
import type { IProject } from "./Project";

/**
 * Represents a single resource item
 */
export interface IResource {
  id: number;
  name: string;
  description: string | null;
  url: string | null;
  category_id: number;
  category: ICategory;
  item_tag?: IItemTag[];
  project?: IProject;
  living_lab?: ILivingLab;
  kpidefinition?: IKpiDefinition;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a category with its resources
 */
export interface IResourceCategory {
  id: number;
  name: string;
  resources: IResource[];
}

export interface IItemTag {
  id: number;
  item_id: number;
  tag_id: number;
  tags: ITag;
}

export interface ITag {
  id: number;
  name: string;
  color: string;
}
