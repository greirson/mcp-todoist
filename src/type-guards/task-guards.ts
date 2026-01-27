/**
 * Task-related type guards
 *
 * Type guards for task creation, retrieval, update, and quick-add operations.
 */

import {
  CreateTaskArgs,
  GetTasksArgs,
  UpdateTaskArgs,
  TaskNameArgs,
  QuickAddTaskArgs,
} from "../types/index.js";

export function isCreateTaskArgs(args: unknown): args is CreateTaskArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "content" in args &&
    typeof (args as { content: string }).content === "string"
  );
}

export function isGetTasksArgs(args: unknown): args is GetTasksArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.filter === undefined || typeof obj.filter === "string") &&
    (obj.label_id === undefined || typeof obj.label_id === "string") &&
    (obj.priority === undefined || typeof obj.priority === "number") &&
    (obj.limit === undefined || typeof obj.limit === "number") &&
    (obj.due_before === undefined || typeof obj.due_before === "string") &&
    (obj.due_after === undefined || typeof obj.due_after === "string") &&
    (obj.lang === undefined || typeof obj.lang === "string") &&
    (obj.task_name === undefined || typeof obj.task_name === "string")
  );
}

export function isUpdateTaskArgs(args: unknown): args is UpdateTaskArgs {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const obj = args as Record<string, unknown>;

  // Must have either task_id/taskId or task_name/taskName
  // Check both snake_case and camelCase since MCP might transform them
  const hasTaskId =
    ("task_id" in obj && typeof obj.task_id === "string") ||
    ("taskId" in obj && typeof obj.taskId === "string");
  const hasTaskName =
    ("task_name" in obj && typeof obj.task_name === "string") ||
    ("taskName" in obj && typeof obj.taskName === "string");

  if (!hasTaskId && !hasTaskName) {
    return false;
  }

  // Check optional fields
  return (
    (obj.content === undefined || typeof obj.content === "string") &&
    (obj.description === undefined || typeof obj.description === "string") &&
    (obj.due_string === undefined || typeof obj.due_string === "string") &&
    (obj.priority === undefined || typeof obj.priority === "number") &&
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.section_id === undefined || typeof obj.section_id === "string") &&
    (obj.labels === undefined ||
      (Array.isArray(obj.labels) &&
        obj.labels.every((label) => typeof label === "string")))
  );
}

export function isTaskNameArgs(args: unknown): args is TaskNameArgs {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const obj = args as Record<string, unknown>;

  // Must have either task_id/taskId or task_name/taskName
  // Check both snake_case and camelCase since MCP might transform them
  const hasTaskId =
    ("task_id" in obj && typeof obj.task_id === "string") ||
    ("taskId" in obj && typeof obj.taskId === "string");
  const hasTaskName =
    ("task_name" in obj && typeof obj.task_name === "string") ||
    ("taskName" in obj && typeof obj.taskName === "string");

  return hasTaskId || hasTaskName;
}

export function isQuickAddTaskArgs(args: unknown): args is QuickAddTaskArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "text" in obj &&
    typeof obj.text === "string" &&
    obj.text.trim().length > 0 &&
    (obj.note === undefined || typeof obj.note === "string") &&
    (obj.reminder === undefined || typeof obj.reminder === "string") &&
    (obj.auto_reminder === undefined || typeof obj.auto_reminder === "boolean")
  );
}
