import {
  CreateTaskArgs,
  GetTasksArgs,
  UpdateTaskArgs,
  TaskNameArgs,
  QuickAddTaskArgs,
  GetSectionsArgs,
  CreateProjectArgs,
  UpdateProjectArgs,
  ProjectNameArgs,
  GetProjectCollaboratorsArgs,
  CreateSectionArgs,
  UpdateSectionArgs,
  SectionIdentifierArgs,
  GetCollaboratorsArgs,
  BulkCreateTasksArgs,
  BulkUpdateTasksArgs,
  BulkTaskFilterArgs,
  CreateCommentArgs,
  GetCommentsArgs,
  UpdateCommentArgs,
  DeleteCommentArgs,
  CreateLabelArgs,
  UpdateLabelArgs,
  LabelNameArgs,
  CreateSubtaskArgs,
  BulkCreateSubtasksArgs,
  ConvertToSubtaskArgs,
  PromoteSubtaskArgs,
  GetTaskHierarchyArgs,
  GetRemindersArgs,
  CreateReminderArgs,
  UpdateReminderArgs,
  DeleteReminderArgs,
  GetCompletedTasksArgs,
  CreateFilterArgs,
  UpdateFilterArgs,
  FilterNameArgs,
  FindDuplicatesArgs,
  MergeDuplicatesArgs,
  GetActivityArgs,
  GetActivityByProjectArgs,
  GetActivityByDateRangeArgs,
  ActivityObjectType,
  ActivityEventType,
  MoveTaskArgs,
  ReorderTaskArgs,
  BulkReorderTasksArgs,
  CloseTaskArgs,
  UpdateDayOrderArgs,
  MoveSectionArgs,
  ReorderSectionsArgs,
  ArchiveSectionArgs,
  UnarchiveSectionArgs,
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

export function isUpdateProjectArgs(args: unknown): args is UpdateProjectArgs {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const obj = args as Record<string, unknown>;

  // Must have either project_id or project_name
  const hasProjectId =
    ("project_id" in obj && typeof obj.project_id === "string") ||
    ("projectId" in obj && typeof obj.projectId === "string");
  const hasProjectName =
    ("project_name" in obj && typeof obj.project_name === "string") ||
    ("projectName" in obj && typeof obj.projectName === "string");

  if (!hasProjectId && !hasProjectName) {
    return false;
  }

  // Check optional fields
  return (
    (obj.name === undefined || typeof obj.name === "string") &&
    (obj.color === undefined || typeof obj.color === "string") &&
    (obj.is_favorite === undefined || typeof obj.is_favorite === "boolean") &&
    (obj.description === undefined || typeof obj.description === "string") &&
    (obj.view_style === undefined || typeof obj.view_style === "string")
  );
}

export function isProjectNameArgs(args: unknown): args is ProjectNameArgs {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const obj = args as Record<string, unknown>;

  // Must have either project_id or project_name
  const hasProjectId =
    ("project_id" in obj && typeof obj.project_id === "string") ||
    ("projectId" in obj && typeof obj.projectId === "string");
  const hasProjectName =
    ("project_name" in obj && typeof obj.project_name === "string") ||
    ("projectName" in obj && typeof obj.projectName === "string");

  return hasProjectId || hasProjectName;
}

export function isArchiveProjectArgs(
  args: unknown
): args is ProjectNameArgs & { archive?: boolean } {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const obj = args as Record<string, unknown>;

  // Must have either project_id or project_name
  const hasProjectId =
    ("project_id" in obj && typeof obj.project_id === "string") ||
    ("projectId" in obj && typeof obj.projectId === "string");
  const hasProjectName =
    ("project_name" in obj && typeof obj.project_name === "string") ||
    ("projectName" in obj && typeof obj.projectName === "string");

  if (!hasProjectId && !hasProjectName) {
    return false;
  }

  return obj.archive === undefined || typeof obj.archive === "boolean";
}

export function isGetProjectCollaboratorsArgs(
  args: unknown
): args is GetProjectCollaboratorsArgs {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const obj = args as Record<string, unknown>;

  // Must have either project_id or project_name
  const hasProjectId =
    ("project_id" in obj && typeof obj.project_id === "string") ||
    ("projectId" in obj && typeof obj.projectId === "string");
  const hasProjectName =
    ("project_name" in obj && typeof obj.project_name === "string") ||
    ("projectName" in obj && typeof obj.projectName === "string");

  return hasProjectId || hasProjectName;
}

export function isCreateSectionArgs(args: unknown): args is CreateSectionArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;
  return (
    "name" in obj &&
    "project_id" in obj &&
    typeof obj.name === "string" &&
    typeof obj.project_id === "string" &&
    (obj.order === undefined || typeof obj.order === "number")
  );
}

export function isUpdateSectionArgs(args: unknown): args is UpdateSectionArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;

  // Must have either section_id or section_name
  const hasSectionId =
    obj.section_id !== undefined && typeof obj.section_id === "string";
  const hasSectionName =
    obj.section_name !== undefined && typeof obj.section_name === "string";

  if (!hasSectionId && !hasSectionName) {
    return false;
  }

  return (
    (obj.project_id === undefined || typeof obj.project_id === "string") &&
    (obj.name === undefined || typeof obj.name === "string")
  );
}

export function isSectionIdentifierArgs(
  args: unknown
): args is SectionIdentifierArgs {
  if (typeof args !== "object" || args === null) return false;

  const obj = args as Record<string, unknown>;

  // Must have either section_id or section_name
  const hasSectionId =
    obj.section_id !== undefined && typeof obj.section_id === "string";
  const hasSectionName =
    obj.section_name !== undefined && typeof obj.section_name === "string";

  if (!hasSectionId && !hasSectionName) {
    return false;
  }

  return obj.project_id === undefined || typeof obj.project_id === "string";
}

export function isGetCollaboratorsArgs(
  args: unknown
): args is GetCollaboratorsArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "project_id" in args &&
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
    (args as any).search_criteria = {
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

// Reminder type guards (Phase 10)

const VALID_REMINDER_TYPES = ["relative", "absolute", "location"];
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

// Duplicate detection type guards (Phase 13)
export function isFindDuplicatesArgs(
  args: unknown
): args is FindDuplicatesArgs {
  if (typeof args !== "object" || args === null) return true;

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

export const isCommentIdArgs = isDeleteCommentArgs;
export const isReminderIdArgs = isDeleteReminderArgs;

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

export function isGetActivityArgs(args: unknown): args is GetActivityArgs {
  if (typeof args !== "object" || args === null) return true;

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
