/**
 * Label type definitions
 */

/**
 * Todoist label object structure
 */
export interface TodoistLabel {
  id: string;
  name: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
}

/**
 * Arguments for creating a label
 */
export interface CreateLabelArgs {
  name: string;
  color?: string;
  is_favorite?: boolean;
  order?: number;
}

/**
 * Arguments for updating a label
 */
export interface UpdateLabelArgs {
  label_id?: string;
  label_name?: string;
  name?: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
}

/**
 * Arguments for identifying a label by name or ID
 */
export interface LabelNameArgs {
  label_id?: string;
  label_name?: string;
}

/**
 * Label usage statistics
 */
export interface LabelStatistics {
  label: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  color?: string;
  mostRecentUse: string | null;
}

/**
 * Shared label for workspace collaboration
 */
export interface SharedLabel {
  name: string;
}

/**
 * Arguments for renaming a shared label
 */
export interface RenameSharedLabelArgs {
  name: string;
  new_name: string;
}

/**
 * Arguments for removing a shared label
 */
export interface RemoveSharedLabelArgs {
  name: string;
}
