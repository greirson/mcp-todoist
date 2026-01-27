/**
 * Subtask and hierarchy type definitions
 */

import type { TodoistTask } from "./task-types.js";

/**
 * Arguments for creating a subtask
 */
export interface CreateSubtaskArgs {
  parent_task_id?: string;
  parent_task_name?: string;
  content: string;
  description?: string;
  due_string?: string;
  priority?: number;
  labels?: string[];
  deadline_date?: string;
}

/**
 * Arguments for bulk creating subtasks
 */
export interface BulkCreateSubtasksArgs {
  parent_task_id?: string;
  parent_task_name?: string;
  subtasks: {
    content: string;
    description?: string;
    due_string?: string;
    priority?: number;
    labels?: string[];
    deadline_date?: string;
  }[];
}

/**
 * Arguments for converting a task to a subtask
 */
export interface ConvertToSubtaskArgs {
  task_id?: string;
  task_name?: string;
  parent_task_id?: string;
  parent_task_name?: string;
}

/**
 * Arguments for promoting a subtask to a main task
 */
export interface PromoteSubtaskArgs {
  subtask_id?: string;
  subtask_name?: string;
  project_id?: string;
  section_id?: string;
}

/**
 * Arguments for getting task hierarchy
 */
export interface GetTaskHierarchyArgs {
  task_id?: string;
  task_name?: string;
  include_completed?: boolean;
}

/**
 * Task node in a hierarchy tree
 */
export interface TaskNode {
  task: TodoistTask;
  children: TaskNode[];
  depth: number;
  completionPercentage: number;
  isOriginalTask?: boolean;
}

/**
 * Complete task hierarchy structure
 */
export interface TaskHierarchy {
  root: TaskNode;
  totalTasks: number;
  completedTasks: number;
  overallCompletion: number;
  originalTaskId?: string;
}
