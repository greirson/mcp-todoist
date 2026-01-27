/**
 * Bulk operation type definitions
 */

import type { CreateTaskArgs, DurationUnit } from "./task-types.js";

/**
 * Arguments for bulk creating tasks
 */
export interface BulkCreateTasksArgs {
  tasks: CreateTaskArgs[];
}

/**
 * Search criteria for filtering tasks in bulk operations
 */
export interface BulkTaskSearchCriteria {
  project_id?: string;
  priority?: number;
  due_before?: string;
  due_after?: string;
  content_contains?: string;
}

/**
 * Arguments for bulk updating tasks
 */
export interface BulkUpdateTasksArgs {
  search_criteria: BulkTaskSearchCriteria;
  updates: {
    content?: string;
    description?: string;
    due_string?: string;
    priority?: number;
    project_id?: string;
    section_id?: string;
    labels?: string[];
    duration?: number;
    duration_unit?: DurationUnit;
  };
}

/**
 * Arguments for bulk task filter operations
 */
export interface BulkTaskFilterArgs {
  search_criteria: BulkTaskSearchCriteria;
}

/**
 * Arguments for bulk reordering tasks
 */
export interface BulkReorderTasksArgs {
  items: { id: string; child_order: number }[];
}
