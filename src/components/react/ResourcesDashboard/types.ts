/**
 * Types for the Resources Dashboard components
 */

import type { IResource, IResourceCategory } from "../../../types";

/**
 * Props for the ResourcesDashboard component (parent)
 */
export interface ResourcesDashboardProps {
  resources?: IResource[];
  categories: IResourceCategory[];
}

/**
 * Props for the ResourcesMetrics component
 */
export interface ResourcesMetricsProps {
  categories: IResourceCategory[];
}

/**
 * Props for the ResourcesFilter component
 */
export interface ResourcesFilterProps {
  categories: IResourceCategory[];
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

/**
 * Props for the ResourcesCategoryGroup component
 */
export interface ResourcesCategoryGroupProps {
  categoryName: string;
  resources: IResource[];
}

/**
 * Props for the ResourceCard component
 */
export interface ResourceCardProps {
  resource: IResource;
}
