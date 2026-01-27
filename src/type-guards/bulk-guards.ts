/**
 * Bulk operation type guards
 *
 * Type guards for bulk task creation, update, and filtering operations.
 */

import {
  BulkCreateTasksArgs,
  BulkUpdateTasksArgs,
  BulkTaskFilterArgs,
} from "../types/index.js";
import { isCreateTaskArgs } from "./task-guards.js";

export function isBulkCreateTasksArgs(
  args: unknown
): args is BulkCreateTasksArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "tasks" in obj &&
    Array.isArray(obj.tasks) &&
    obj.tasks.length > 0 &&
    obj.tasks.every((task) => isCreateTaskArgs(task))
  );
}

export function isBulkUpdateTasksArgs(
  args: unknown
): args is BulkUpdateTasksArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "search_criteria" in obj &&
    "updates" in obj &&
    typeof obj.search_criteria === "object" &&
    obj.search_criteria !== null &&
    typeof obj.updates === "object" &&
    obj.updates !== null
  );
}

export function isBulkTaskFilterArgs(
  args: unknown
): args is BulkTaskFilterArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;

  // The tool expects parameters at the top level, not in search_criteria
  // We need to wrap them into search_criteria for the handler
  if (
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.priority === undefined || typeof obj.priority === "number") &&
    (obj.due_before === undefined || typeof obj.due_before === "string") &&
    (obj.due_after === undefined || typeof obj.due_after === "string") &&
    (obj.content_contains === undefined ||
      typeof obj.content_contains === "string")
  ) {
    // Transform the flat structure to match BulkTaskFilterArgs
    (args as Record<string, unknown>).search_criteria = {
      project_id: obj.project_id,
      priority: obj.priority,
      due_before: obj.due_before,
      due_after: obj.due_after,
      content_contains: obj.content_contains,
    };
    return true;
  }

  // Also support the old format with search_criteria
  return (
    "search_criteria" in obj &&
    typeof obj.search_criteria === "object" &&
    obj.search_criteria !== null
  );
}
