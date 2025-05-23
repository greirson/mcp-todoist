import {
  CreateTaskArgs,
  GetTasksArgs,
  UpdateTaskArgs,
  TaskNameArgs,
  GetSectionsArgs,
  CreateProjectArgs,
  CreateSectionArgs,
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

export function isGetProjectsArgs(args: unknown): args is Record<string, never> {
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