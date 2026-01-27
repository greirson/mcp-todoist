/**
 * Comment and label type guards
 *
 * Type guards for comment creation, retrieval, update, delete
 * and label CRUD operations.
 */

import {
  CreateCommentArgs,
  GetCommentsArgs,
  UpdateCommentArgs,
  DeleteCommentArgs,
  CreateLabelArgs,
  UpdateLabelArgs,
  LabelNameArgs,
} from "../types/index.js";

// Comment type guards

export function isCreateCommentArgs(args: unknown): args is CreateCommentArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  // Must have content and at least one of: task_id, task_name, or project_id
  return (
    "content" in obj &&
    typeof obj.content === "string" &&
    (obj.task_id === undefined || typeof obj.task_id === "string") &&
    (obj.task_name === undefined || typeof obj.task_name === "string") &&
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.task_id !== undefined ||
      obj.task_name !== undefined ||
      obj.project_id !== undefined)
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

export function isUpdateCommentArgs(args: unknown): args is UpdateCommentArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "comment_id" in obj &&
    typeof obj.comment_id === "string" &&
    "content" in obj &&
    typeof obj.content === "string"
  );
}

export function isDeleteCommentArgs(args: unknown): args is DeleteCommentArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return "comment_id" in obj && typeof obj.comment_id === "string";
}

// Alias for backwards compatibility
export const isCommentIdArgs = isDeleteCommentArgs;

// Label type guards

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

export function isGetLabelsArgs(args: unknown): args is Record<string, never> {
  return typeof args === "object" && args !== null;
}

export function isGetLabelStatsArgs(
  args: unknown
): args is Record<string, never> {
  return typeof args === "object" && args !== null;
}
