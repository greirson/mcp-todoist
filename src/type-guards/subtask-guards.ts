/**
 * Subtask type guards
 *
 * Type guards for subtask creation, conversion, promotion, and hierarchy operations.
 */

import {
  CreateSubtaskArgs,
  BulkCreateSubtasksArgs,
  ConvertToSubtaskArgs,
  PromoteSubtaskArgs,
  GetTaskHierarchyArgs,
} from "../types/index.js";

export function isCreateSubtaskArgs(args: unknown): args is CreateSubtaskArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "content" in obj &&
    typeof obj.content === "string" &&
    (obj.parent_task_id === undefined ||
      typeof obj.parent_task_id === "string") &&
    (obj.parent_task_name === undefined ||
      typeof obj.parent_task_name === "string") &&
    (obj.parent_task_id !== undefined || obj.parent_task_name !== undefined)
  );
}

export function isBulkCreateSubtasksArgs(
  args: unknown
): args is BulkCreateSubtasksArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "subtasks" in obj &&
    Array.isArray(obj.subtasks) &&
    obj.subtasks.length > 0 &&
    obj.subtasks.every(
      (subtask) =>
        typeof subtask === "object" &&
        subtask !== null &&
        "content" in subtask &&
        typeof (subtask as { content: string }).content === "string"
    ) &&
    (obj.parent_task_id === undefined ||
      typeof obj.parent_task_id === "string") &&
    (obj.parent_task_name === undefined ||
      typeof obj.parent_task_name === "string") &&
    (obj.parent_task_id !== undefined || obj.parent_task_name !== undefined)
  );
}

export function isConvertToSubtaskArgs(
  args: unknown
): args is ConvertToSubtaskArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.task_id === undefined || typeof obj.task_id === "string") &&
    (obj.task_name === undefined || typeof obj.task_name === "string") &&
    (obj.task_id !== undefined || obj.task_name !== undefined) &&
    (obj.parent_task_id === undefined ||
      typeof obj.parent_task_id === "string") &&
    (obj.parent_task_name === undefined ||
      typeof obj.parent_task_name === "string") &&
    (obj.parent_task_id !== undefined || obj.parent_task_name !== undefined)
  );
}

export function isPromoteSubtaskArgs(
  args: unknown
): args is PromoteSubtaskArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.subtask_id === undefined || typeof obj.subtask_id === "string") &&
    (obj.subtask_name === undefined || typeof obj.subtask_name === "string") &&
    (obj.subtask_id !== undefined || obj.subtask_name !== undefined) &&
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.section_id === undefined || typeof obj.section_id === "string")
  );
}

export function isGetTaskHierarchyArgs(
  args: unknown
): args is GetTaskHierarchyArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.task_id === undefined || typeof obj.task_id === "string") &&
    (obj.task_name === undefined || typeof obj.task_name === "string") &&
    (obj.task_id !== undefined || obj.task_name !== undefined) &&
    (obj.include_completed === undefined ||
      typeof obj.include_completed === "boolean")
  );
}
