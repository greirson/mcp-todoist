/**
 * Filter type guards
 *
 * Type guards for filter creation, update, retrieval, and deletion.
 * Also includes completed tasks retrieval guard.
 */

import {
  GetCompletedTasksArgs,
  CreateFilterArgs,
  UpdateFilterArgs,
  FilterNameArgs,
} from "../types/index.js";

// Completed tasks type guard
export function isGetCompletedTasksArgs(
  args: unknown
): args is GetCompletedTasksArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.since === undefined || typeof obj.since === "string") &&
    (obj.until === undefined || typeof obj.until === "string") &&
    (obj.limit === undefined || typeof obj.limit === "number") &&
    (obj.offset === undefined || typeof obj.offset === "number") &&
    (obj.annotate_notes === undefined ||
      typeof obj.annotate_notes === "boolean")
  );
}

// Filter operation type guards
export function isGetFiltersArgs(args: unknown): args is Record<string, never> {
  return typeof args === "object" && args !== null;
}

export function isCreateFilterArgs(args: unknown): args is CreateFilterArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "name" in obj &&
    typeof obj.name === "string" &&
    "query" in obj &&
    typeof obj.query === "string" &&
    (obj.color === undefined || typeof obj.color === "string") &&
    (obj.item_order === undefined || typeof obj.item_order === "number") &&
    (obj.is_favorite === undefined || typeof obj.is_favorite === "boolean")
  );
}

export function isUpdateFilterArgs(args: unknown): args is UpdateFilterArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;

  // Must have either filter_id or filter_name to identify the filter
  const hasFilterId = "filter_id" in obj && typeof obj.filter_id === "string";
  const hasFilterName =
    "filter_name" in obj && typeof obj.filter_name === "string";

  if (!hasFilterId && !hasFilterName) {
    return false;
  }

  // Validate optional update fields
  return (
    (obj.name === undefined || typeof obj.name === "string") &&
    (obj.query === undefined || typeof obj.query === "string") &&
    (obj.color === undefined || typeof obj.color === "string") &&
    (obj.item_order === undefined || typeof obj.item_order === "number") &&
    (obj.is_favorite === undefined || typeof obj.is_favorite === "boolean")
  );
}

export function isFilterNameArgs(args: unknown): args is FilterNameArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;

  // Must have either filter_id or filter_name
  const hasFilterId = "filter_id" in obj && typeof obj.filter_id === "string";
  const hasFilterName =
    "filter_name" in obj && typeof obj.filter_name === "string";

  return hasFilterId || hasFilterName;
}
