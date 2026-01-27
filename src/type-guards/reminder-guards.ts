/**
 * Reminder type guards
 *
 * Type guards for reminder creation, retrieval, update, and deletion.
 * Includes validation constants for reminder types and location triggers.
 */

import {
  GetRemindersArgs,
  CreateReminderArgs,
  UpdateReminderArgs,
  DeleteReminderArgs,
} from "../types/index.js";

// Valid reminder type values
const VALID_REMINDER_TYPES = ["relative", "absolute", "location"];

// Valid location trigger values
const VALID_LOCATION_TRIGGERS = ["on_enter", "on_leave"];

export function isGetRemindersArgs(args: unknown): args is GetRemindersArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.task_id === undefined || typeof obj.task_id === "string") &&
    (obj.task_name === undefined || typeof obj.task_name === "string")
  );
}

export function isCreateReminderArgs(
  args: unknown
): args is CreateReminderArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;

  // Must have type
  if (!("type" in obj) || typeof obj.type !== "string") {
    return false;
  }

  // Validate type is one of the allowed values
  if (!VALID_REMINDER_TYPES.includes(obj.type)) {
    return false;
  }

  // Validate optional fields
  return (
    (obj.task_id === undefined || typeof obj.task_id === "string") &&
    (obj.task_name === undefined || typeof obj.task_name === "string") &&
    (obj.minute_offset === undefined ||
      typeof obj.minute_offset === "number") &&
    (obj.due_date === undefined || typeof obj.due_date === "string") &&
    (obj.timezone === undefined || typeof obj.timezone === "string") &&
    (obj.location_name === undefined ||
      typeof obj.location_name === "string") &&
    (obj.latitude === undefined || typeof obj.latitude === "string") &&
    (obj.longitude === undefined || typeof obj.longitude === "string") &&
    (obj.location_trigger === undefined ||
      (typeof obj.location_trigger === "string" &&
        VALID_LOCATION_TRIGGERS.includes(obj.location_trigger))) &&
    (obj.radius === undefined || typeof obj.radius === "number")
  );
}

export function isUpdateReminderArgs(
  args: unknown
): args is UpdateReminderArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;

  // Must have reminder_id
  if (!("reminder_id" in obj) || typeof obj.reminder_id !== "string") {
    return false;
  }

  // Validate optional fields
  return (
    (obj.type === undefined ||
      (typeof obj.type === "string" &&
        VALID_REMINDER_TYPES.includes(obj.type))) &&
    (obj.minute_offset === undefined ||
      typeof obj.minute_offset === "number") &&
    (obj.due_date === undefined || typeof obj.due_date === "string") &&
    (obj.timezone === undefined || typeof obj.timezone === "string") &&
    (obj.location_name === undefined ||
      typeof obj.location_name === "string") &&
    (obj.latitude === undefined || typeof obj.latitude === "string") &&
    (obj.longitude === undefined || typeof obj.longitude === "string") &&
    (obj.location_trigger === undefined ||
      (typeof obj.location_trigger === "string" &&
        VALID_LOCATION_TRIGGERS.includes(obj.location_trigger))) &&
    (obj.radius === undefined || typeof obj.radius === "number")
  );
}

export function isDeleteReminderArgs(
  args: unknown
): args is DeleteReminderArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;

  // Must have reminder_id
  return "reminder_id" in obj && typeof obj.reminder_id === "string";
}

// Alias for backwards compatibility
export const isReminderIdArgs = isDeleteReminderArgs;
