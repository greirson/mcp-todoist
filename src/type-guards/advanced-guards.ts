/**
 * Advanced operation type guards
 *
 * Type guards for activity logs, duplicate detection, task/section/project
 * operations, shared labels, backups, and collaboration features.
 */

import {
  GetActivityArgs,
  GetActivityByProjectArgs,
  GetActivityByDateRangeArgs,
  ActivityObjectType,
  ActivityEventType,
  FindDuplicatesArgs,
  MergeDuplicatesArgs,
  MoveTaskArgs,
  ReorderTaskArgs,
  BulkReorderTasksArgs,
  CloseTaskArgs,
  UpdateDayOrderArgs,
  MoveSectionArgs,
  ReorderSectionsArgs,
  ArchiveSectionArgs,
  UnarchiveSectionArgs,
  ReorderProjectsArgs,
  MoveProjectToParentArgs,
  GetArchivedProjectsArgs,
  RenameSharedLabelArgs,
  RemoveSharedLabelArgs,
  DownloadBackupArgs,
  GetProjectNotesArgs,
  CreateProjectNoteArgs,
  UpdateProjectNoteArgs,
  DeleteProjectNoteArgs,
  InviteToProjectArgs,
  AcceptInvitationArgs,
  RejectInvitationArgs,
  DeleteInvitationArgs,
  GetLiveNotificationsArgs,
  MarkNotificationReadArgs,
} from "../types/index.js";

// Activity log constants
const VALID_ACTIVITY_OBJECT_TYPES: ActivityObjectType[] = [
  "item",
  "note",
  "project",
  "section",
  "label",
  "filter",
  "reminder",
];

const VALID_ACTIVITY_EVENT_TYPES: ActivityEventType[] = [
  "added",
  "updated",
  "deleted",
  "completed",
  "uncompleted",
  "archived",
  "unarchived",
  "shared",
  "left",
];

// Activity type guards

export function isGetActivityArgs(args: unknown): args is GetActivityArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.object_type === undefined ||
      (typeof obj.object_type === "string" &&
        VALID_ACTIVITY_OBJECT_TYPES.includes(
          obj.object_type as ActivityObjectType
        ))) &&
    (obj.object_id === undefined || typeof obj.object_id === "string") &&
    (obj.event_type === undefined ||
      (typeof obj.event_type === "string" &&
        VALID_ACTIVITY_EVENT_TYPES.includes(
          obj.event_type as ActivityEventType
        ))) &&
    (obj.parent_project_id === undefined ||
      typeof obj.parent_project_id === "string") &&
    (obj.parent_item_id === undefined ||
      typeof obj.parent_item_id === "string") &&
    (obj.initiator_id === undefined || typeof obj.initiator_id === "string") &&
    (obj.since === undefined || typeof obj.since === "string") &&
    (obj.until === undefined || typeof obj.until === "string") &&
    (obj.limit === undefined || typeof obj.limit === "number") &&
    (obj.offset === undefined || typeof obj.offset === "number")
  );
}

export function isGetActivityByProjectArgs(
  args: unknown
): args is GetActivityByProjectArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "project_id" in obj &&
    typeof obj.project_id === "string" &&
    (obj.event_type === undefined ||
      (typeof obj.event_type === "string" &&
        VALID_ACTIVITY_EVENT_TYPES.includes(
          obj.event_type as ActivityEventType
        ))) &&
    (obj.object_type === undefined ||
      (typeof obj.object_type === "string" &&
        VALID_ACTIVITY_OBJECT_TYPES.includes(
          obj.object_type as ActivityObjectType
        ))) &&
    (obj.since === undefined || typeof obj.since === "string") &&
    (obj.until === undefined || typeof obj.until === "string") &&
    (obj.limit === undefined || typeof obj.limit === "number") &&
    (obj.offset === undefined || typeof obj.offset === "number")
  );
}

export function isGetActivityByDateRangeArgs(
  args: unknown
): args is GetActivityByDateRangeArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "since" in obj &&
    typeof obj.since === "string" &&
    "until" in obj &&
    typeof obj.until === "string" &&
    (obj.object_type === undefined ||
      (typeof obj.object_type === "string" &&
        VALID_ACTIVITY_OBJECT_TYPES.includes(
          obj.object_type as ActivityObjectType
        ))) &&
    (obj.event_type === undefined ||
      (typeof obj.event_type === "string" &&
        VALID_ACTIVITY_EVENT_TYPES.includes(
          obj.event_type as ActivityEventType
        ))) &&
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.limit === undefined || typeof obj.limit === "number") &&
    (obj.offset === undefined || typeof obj.offset === "number")
  );
}

// Duplicate detection type guards

export function isFindDuplicatesArgs(
  args: unknown
): args is FindDuplicatesArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.threshold === undefined || typeof obj.threshold === "number") &&
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.include_completed === undefined ||
      typeof obj.include_completed === "boolean")
  );
}

export function isMergeDuplicatesArgs(
  args: unknown
): args is MergeDuplicatesArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "keep_task_id" in obj &&
    typeof obj.keep_task_id === "string" &&
    "duplicate_task_ids" in obj &&
    Array.isArray(obj.duplicate_task_ids) &&
    obj.duplicate_task_ids.every((id: unknown) => typeof id === "string") &&
    "action" in obj &&
    (obj.action === "complete" || obj.action === "delete")
  );
}

// Task operation type guards

export function isMoveTaskArgs(args: unknown): args is MoveTaskArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  const hasTaskIdentifier =
    (obj.task_id !== undefined && typeof obj.task_id === "string") ||
    (obj.task_name !== undefined && typeof obj.task_name === "string");

  return (
    hasTaskIdentifier &&
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.section_id === undefined || typeof obj.section_id === "string") &&
    (obj.parent_id === undefined || typeof obj.parent_id === "string")
  );
}

export function isReorderTaskArgs(args: unknown): args is ReorderTaskArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  const hasTaskIdentifier =
    (obj.task_id !== undefined && typeof obj.task_id === "string") ||
    (obj.task_name !== undefined && typeof obj.task_name === "string");

  return (
    hasTaskIdentifier &&
    "child_order" in obj &&
    typeof obj.child_order === "number" &&
    obj.child_order >= 0
  );
}

export function isBulkReorderTasksArgs(
  args: unknown
): args is BulkReorderTasksArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "items" in obj &&
    Array.isArray(obj.items) &&
    obj.items.length > 0 &&
    obj.items.every(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof (item as Record<string, unknown>).id === "string" &&
        "child_order" in item &&
        typeof (item as Record<string, unknown>).child_order === "number"
    )
  );
}

export function isCloseTaskArgs(args: unknown): args is CloseTaskArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.task_id !== undefined && typeof obj.task_id === "string") ||
    (obj.task_name !== undefined && typeof obj.task_name === "string")
  );
}

export function isUpdateDayOrderArgs(
  args: unknown
): args is UpdateDayOrderArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "items" in obj &&
    Array.isArray(obj.items) &&
    obj.items.length > 0 &&
    obj.items.every(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof (item as Record<string, unknown>).id === "string" &&
        "day_order" in item &&
        typeof (item as Record<string, unknown>).day_order === "number"
    )
  );
}

// Section operation type guards

export function isMoveSectionArgs(args: unknown): args is MoveSectionArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  const hasSectionIdentifier =
    (obj.section_id !== undefined && typeof obj.section_id === "string") ||
    (obj.section_name !== undefined && typeof obj.section_name === "string");

  return (
    hasSectionIdentifier &&
    "project_id" in obj &&
    typeof obj.project_id === "string"
  );
}

export function isReorderSectionsArgs(
  args: unknown
): args is ReorderSectionsArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "project_id" in obj &&
    typeof obj.project_id === "string" &&
    "sections" in obj &&
    Array.isArray(obj.sections) &&
    obj.sections.length > 0 &&
    obj.sections.every(
      (section: unknown) =>
        typeof section === "object" &&
        section !== null &&
        "id" in section &&
        typeof (section as Record<string, unknown>).id === "string" &&
        "section_order" in section &&
        typeof (section as Record<string, unknown>).section_order === "number"
    )
  );
}

export function isArchiveSectionArgs(
  args: unknown
): args is ArchiveSectionArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.section_id !== undefined && typeof obj.section_id === "string") ||
    (obj.section_name !== undefined && typeof obj.section_name === "string")
  );
}

export function isUnarchiveSectionArgs(
  args: unknown
): args is UnarchiveSectionArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.section_id !== undefined && typeof obj.section_id === "string") ||
    (obj.section_name !== undefined && typeof obj.section_name === "string")
  );
}

// Project operation type guards

export function isReorderProjectsArgs(
  args: unknown
): args is ReorderProjectsArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "projects" in obj &&
    Array.isArray(obj.projects) &&
    obj.projects.length > 0 &&
    obj.projects.every(
      (project: unknown) =>
        typeof project === "object" &&
        project !== null &&
        "id" in project &&
        typeof (project as Record<string, unknown>).id === "string" &&
        "child_order" in project &&
        typeof (project as Record<string, unknown>).child_order === "number"
    )
  );
}

export function isMoveProjectToParentArgs(
  args: unknown
): args is MoveProjectToParentArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.project_id !== undefined && typeof obj.project_id === "string") ||
    (obj.project_name !== undefined && typeof obj.project_name === "string")
  );
}

export function isGetArchivedProjectsArgs(
  args: unknown
): args is GetArchivedProjectsArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    (obj.limit === undefined || typeof obj.limit === "number") &&
    (obj.offset === undefined || typeof obj.offset === "number")
  );
}

// Shared label type guards

export function isRenameSharedLabelArgs(
  args: unknown
): args is RenameSharedLabelArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.name === "string" && typeof obj.new_name === "string";
}

export function isRemoveSharedLabelArgs(
  args: unknown
): args is RemoveSharedLabelArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.name === "string";
}

// Backup type guards

export function isDownloadBackupArgs(
  args: unknown
): args is DownloadBackupArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.version === "string";
}

// Project notes type guards

export function isGetProjectNotesArgs(
  args: unknown
): args is GetProjectNotesArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.project_id === "string";
}

export function isCreateProjectNoteArgs(
  args: unknown
): args is CreateProjectNoteArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.project_id === "string" && typeof obj.content === "string";
}

export function isUpdateProjectNoteArgs(
  args: unknown
): args is UpdateProjectNoteArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.note_id === "string" && typeof obj.content === "string";
}

export function isDeleteProjectNoteArgs(
  args: unknown
): args is DeleteProjectNoteArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.note_id === "string";
}

// Collaboration type guards

export function isInviteToProjectArgs(
  args: unknown
): args is InviteToProjectArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.project_id === "string" && typeof obj.email === "string";
}

export function isAcceptInvitationArgs(
  args: unknown
): args is AcceptInvitationArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    typeof obj.invitation_id === "string" &&
    typeof obj.invitation_secret === "string"
  );
}

export function isRejectInvitationArgs(
  args: unknown
): args is RejectInvitationArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    typeof obj.invitation_id === "string" &&
    typeof obj.invitation_secret === "string"
  );
}

export function isDeleteInvitationArgs(
  args: unknown
): args is DeleteInvitationArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.invitation_id === "string";
}

export function isGetLiveNotificationsArgs(
  args: unknown
): args is GetLiveNotificationsArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return obj.limit === undefined || typeof obj.limit === "number";
}

export function isMarkNotificationReadArgs(
  args: unknown
): args is MarkNotificationReadArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return typeof obj.notification_id === "string";
}
