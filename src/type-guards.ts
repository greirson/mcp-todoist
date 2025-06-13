import {
  CreateTaskArgs,
  GetTasksArgs,
  UpdateTaskArgs,
  TaskNameArgs,
  GetSectionsArgs,
  CreateProjectArgs,
  CreateSectionArgs,
  BulkCreateTasksArgs,
  BulkUpdateTasksArgs,
  BulkTaskFilterArgs,
  CreateCommentArgs,
  GetCommentsArgs,
  CreateLabelArgs,
  UpdateLabelArgs,
  LabelNameArgs,
  CreateSubtaskArgs,
  BulkCreateSubtasksArgs,
  ConvertToSubtaskArgs,
  PromoteSubtaskArgs,
  GetTaskHierarchyArgs,
} from "./types.js";

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
    (obj.priority === undefined || typeof obj.priority === "number") &&
    (obj.limit === undefined || typeof obj.limit === "number")
  );
}

export function isUpdateTaskArgs(args: unknown): args is UpdateTaskArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

export function isTaskNameArgs(args: unknown): args is TaskNameArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

export function isGetProjectsArgs(
  args: unknown
): args is Record<string, never> {
  return typeof args === "object" && args !== null;
}

export function isGetSectionsArgs(args: unknown): args is GetSectionsArgs {
  return typeof args === "object" && args !== null;
}

export function isCreateProjectArgs(args: unknown): args is CreateProjectArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string"
  );
}

export function isCreateSectionArgs(args: unknown): args is CreateSectionArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    "project_id" in args &&
    typeof (args as { name: string }).name === "string" &&
    typeof (args as { project_id: string }).project_id === "string"
  );
}

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
  return (
    "search_criteria" in obj &&
    typeof obj.search_criteria === "object" &&
    obj.search_criteria !== null
  );
}

export function isCreateCommentArgs(args: unknown): args is CreateCommentArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "content" in obj &&
    typeof obj.content === "string" &&
    (obj.task_id === undefined || typeof obj.task_id === "string") &&
    (obj.task_name === undefined || typeof obj.task_name === "string") &&
    (obj.task_id !== undefined || obj.task_name !== undefined)
  );
}

export function isGetCommentsArgs(args: unknown): args is GetCommentsArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.task_id === undefined || typeof obj.task_id === "string") &&
    (obj.task_name === undefined || typeof obj.task_name === "string") &&
    (obj.project_id === undefined || typeof obj.project_id === "string")
  );
}

export function isCreateLabelArgs(args: unknown): args is CreateLabelArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string"
  );
}

export function isUpdateLabelArgs(args: unknown): args is UpdateLabelArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.label_id === undefined || typeof obj.label_id === "string") &&
    (obj.label_name === undefined || typeof obj.label_name === "string") &&
    (obj.label_id !== undefined || obj.label_name !== undefined)
  );
}

export function isLabelNameArgs(args: unknown): args is LabelNameArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.label_id === undefined || typeof obj.label_id === "string") &&
    (obj.label_name === undefined || typeof obj.label_name === "string") &&
    (obj.label_id !== undefined || obj.label_name !== undefined)
  );
}

export function isGetLabelsArgs(
  args: unknown
): args is Record<string, never> {
  return typeof args === "object" && args !== null;
}

export function isGetLabelStatsArgs(
  args: unknown
): args is Record<string, never> {
  return typeof args === "object" && args !== null;
}

export function isCreateSubtaskArgs(args: unknown): args is CreateSubtaskArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "content" in obj &&
    typeof obj.content === "string" &&
    (obj.parent_task_id === undefined || typeof obj.parent_task_id === "string") &&
    (obj.parent_task_name === undefined || typeof obj.parent_task_name === "string") &&
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
    obj.subtasks.every((subtask) => 
      typeof subtask === "object" &&
      subtask !== null &&
      "content" in subtask &&
      typeof (subtask as { content: string }).content === "string"
    ) &&
    (obj.parent_task_id === undefined || typeof obj.parent_task_id === "string") &&
    (obj.parent_task_name === undefined || typeof obj.parent_task_name === "string") &&
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
    (obj.parent_task_id === undefined || typeof obj.parent_task_id === "string") &&
    (obj.parent_task_name === undefined || typeof obj.parent_task_name === "string") &&
    (obj.parent_task_id !== undefined || obj.parent_task_name !== undefined)
  );
}

export function isPromoteSubtaskArgs(args: unknown): args is PromoteSubtaskArgs {
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
    (obj.include_completed === undefined || typeof obj.include_completed === "boolean")
  );
}
