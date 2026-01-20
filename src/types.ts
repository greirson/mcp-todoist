/**
 * Duration unit type for task durations
 */
export type DurationUnit = "minute" | "day";

/**
 * Task duration configuration
 */
export interface TaskDuration {
  amount: number;
  unit: DurationUnit;
}

export interface CreateTaskArgs {
  content: string;
  description?: string;
  due_string?: string;
  priority?: number;
  labels?: string[];
  deadline_date?: string;
  project_id?: string;
  section_id?: string;
  parent_id?: string;
  duration?: number;
  duration_unit?: DurationUnit;
  assignee_id?: string;
  child_order?: number;
  day_order?: number;
  is_collapsed?: boolean;
}

// Collaborator interfaces
export interface TodoistCollaborator {
  id: string;
  name: string;
  email: string;
}

export interface GetCollaboratorsArgs {
  project_id: string;
}

export interface GetTasksArgs {
  task_id?: string;
  project_id?: string;
  filter?: string;
  label_id?: string;
  priority?: number;
  limit?: number;
  due_before?: string;
  due_after?: string;
  lang?: string;
  task_name?: string;
}

export interface UpdateTaskArgs {
  task_name?: string;
  task_id?: string;
  content?: string;
  description?: string;
  due_string?: string;
  priority?: number;
  project_id?: string;
  section_id?: string;
  labels?: string[];
  duration?: number;
  duration_unit?: DurationUnit;
  assignee_id?: string;
  child_order?: number;
  day_order?: number;
  is_collapsed?: boolean;
}

export interface ReopenTaskArgs {
  task_name?: string;
  task_id?: string;
}

export interface TaskNameArgs {
  task_name?: string;
  task_id?: string;
}

export interface QuickAddTaskArgs {
  text: string;
  note?: string;
  reminder?: string;
  auto_reminder?: boolean;
}

export interface QuickAddTaskResult {
  id: string;
  content: string;
  description?: string;
  project_id?: string;
  project_name?: string;
  section_id?: string;
  parent_id?: string;
  labels?: string[];
  priority?: number;
  due?: TodoistTaskDueData | null;
  deadline?: { date: string } | null;
  assignee_id?: string;
  url?: string;
}

export interface GetSectionsArgs {
  project_id?: string;
}

export interface CreateProjectArgs {
  name: string;
  color?: string;
  is_favorite?: boolean;
  parent_id?: string;
  description?: string;
  view_style?: "list" | "board";
}

export interface UpdateProjectArgs {
  project_id?: string;
  project_name?: string;
  name?: string;
  color?: string;
  is_favorite?: boolean;
  description?: string;
  view_style?: "list" | "board";
}

export interface ProjectNameArgs {
  project_id?: string;
  project_name?: string;
}

export interface GetProjectCollaboratorsArgs {
  project_id?: string;
  project_name?: string;
}

export interface CreateSectionArgs {
  name: string;
  project_id: string;
  order?: number;
}

export interface UpdateSectionArgs {
  section_id?: string;
  section_name?: string;
  project_id?: string;
  name?: string;
}

export interface SectionIdentifierArgs {
  section_id?: string;
  section_name?: string;
  project_id?: string;
}

export interface TodoistTaskData {
  content: string;
  description?: string;
  dueString?: string;
  priority?: number;
  labels?: string[];
  deadlineDate?: string;
  projectId?: string;
  sectionId?: string;
  duration?: number;
  durationUnit?: DurationUnit;
}

export interface TodoistProjectData {
  name: string;
  color?: string;
  isFavorite?: boolean;
  parentId?: string;
  viewStyle?: "list" | "board";
}

export interface TodoistSectionData {
  name: string;
  projectId: string;
}

// API response interfaces for backward compatibility
export interface TodoistTaskDueData {
  string: string;
  date?: string | null;
  datetime?: string | null;
  timezone?: string | null;
  lang?: string | null;
  isRecurring?: boolean;
}

export interface TodoistTask {
  id: string;
  content: string;
  description?: string;
  due?: TodoistTaskDueData | null;
  deadline?: { date: string } | null;
  priority?: number;
  labels?: string[];
  projectId?: string;
  sectionId?: string | null;
  parentId?: string | null;
  isCompleted?: boolean;
  duration?: TaskDuration | null;
}

export interface TodoistProject {
  id: string;
  name: string;
  color?: string;
  isFavorite?: boolean;
  parentId?: string | null;
  description?: string;
  viewStyle?: string;
  isArchived?: boolean;
  isShared?: boolean;
}

export interface TodoistCollaborator {
  id: string;
  name: string;
  email: string;
}

export interface TodoistSection {
  id: string;
  name: string;
  projectId: string;
}

// Bulk operation interfaces
export interface BulkCreateTasksArgs {
  tasks: CreateTaskArgs[];
}

export interface BulkUpdateTasksArgs {
  search_criteria: {
    project_id?: string;
    priority?: number;
    due_before?: string;
    due_after?: string;
    content_contains?: string;
  };
  updates: {
    content?: string;
    description?: string;
    due_string?: string;
    priority?: number;
    project_id?: string;
    section_id?: string;
    labels?: string[];
    duration?: number;
    duration_unit?: DurationUnit;
  };
}

export interface BulkTaskFilterArgs {
  search_criteria: {
    project_id?: string;
    priority?: number;
    due_before?: string;
    due_after?: string;
    content_contains?: string;
  };
}

// Comment operation interfaces
export interface CreateCommentArgs {
  task_id?: string;
  task_name?: string;
  project_id?: string;
  content: string;
  attachment?: {
    file_name: string;
    file_url: string;
    file_type: string;
  };
}

export interface GetCommentsArgs {
  task_id?: string;
  task_name?: string;
  project_id?: string;
}

export interface UpdateCommentArgs {
  comment_id: string;
  content: string;
}

export interface DeleteCommentArgs {
  comment_id: string;
}

export interface TodoistCommentData {
  content: string;
  taskId?: string;
  projectId?: string;
  attachment?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
}

// API response interfaces for comments (using flexible typing for API compatibility)
export interface TodoistComment {
  id?: string;
  content?: string;
  taskId?: string;
  projectId?: string;
  postedAt?: string;
  attachment?: {
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
  };
}

// Label operation interfaces
export interface TodoistLabel {
  id: string;
  name: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
}

export interface CreateLabelArgs {
  name: string;
  color?: string;
  is_favorite?: boolean;
  order?: number;
}

export interface UpdateLabelArgs {
  label_id?: string;
  label_name?: string;
  name?: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
}

export interface LabelNameArgs {
  label_id?: string;
  label_name?: string;
}

export interface LabelStatistics {
  label: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  color?: string;
  mostRecentUse: string | null;
}

// Proper API response interfaces to replace unknown types

/**
 * Generic interface for Todoist API responses that may return data in different formats
 */
export interface TodoistAPIResponse<T> {
  results?: T[];
  data?: T[];
}

/**
 * Specific API response types for each entity
 */
export type TasksResponse = TodoistTask[] | TodoistAPIResponse<TodoistTask>;
export type ProjectsResponse =
  | TodoistProject[]
  | TodoistAPIResponse<TodoistProject>;
export type SectionsResponse =
  | TodoistSection[]
  | TodoistAPIResponse<TodoistSection>;
export type CommentsResponse =
  | TodoistComment[]
  | TodoistAPIResponse<TodoistComment>;
export type LabelsResponse = TodoistLabel[] | TodoistAPIResponse<TodoistLabel>;

/**
 * Enhanced comment response interface for API compatibility
 */
export interface CommentResponse {
  content: string;
  attachment?: {
    fileName: string;
    fileType: string;
  };
  postedAt?: string;
  taskId?: string;
  projectId?: string;
}

/**
 * Enhanced comment creation data interface
 */
export interface CommentCreationData {
  content: string;
  taskId: string;
  attachment?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
}

/**
 * API error response interface for structured error handling
 */
export interface TodoistAPIErrorResponse {
  error?: string;
  error_description?: string;
  error_code?: number;
  message?: string;
}

/**
 * Cache entry interface for typed cache storage
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache statistics interface for monitoring
 */
export interface CacheStats {
  totalKeys: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalMemoryUsage: number;
}

// Subtask operation interfaces
export interface CreateSubtaskArgs {
  parent_task_id?: string;
  parent_task_name?: string;
  content: string;
  description?: string;
  due_string?: string;
  priority?: number;
  labels?: string[];
  deadline_date?: string;
}

export interface BulkCreateSubtasksArgs {
  parent_task_id?: string;
  parent_task_name?: string;
  subtasks: {
    content: string;
    description?: string;
    due_string?: string;
    priority?: number;
    labels?: string[];
    deadline_date?: string;
  }[];
}

export interface ConvertToSubtaskArgs {
  task_id?: string;
  task_name?: string;
  parent_task_id?: string;
  parent_task_name?: string;
}

export interface PromoteSubtaskArgs {
  subtask_id?: string;
  subtask_name?: string;
  project_id?: string;
  section_id?: string;
}

export interface GetTaskHierarchyArgs {
  task_id?: string;
  task_name?: string;
  include_completed?: boolean;
}

export interface TaskNode {
  task: TodoistTask;
  children: TaskNode[];
  depth: number;
  completionPercentage: number;
  isOriginalTask?: boolean;
}

export interface TaskHierarchy {
  root: TaskNode;
  totalTasks: number;
  completedTasks: number;
  overallCompletion: number;
  originalTaskId?: string;
}

// Reminder operation interfaces (Phase 10: Reminder Management)
// Based on Todoist Sync API v1

export type ReminderType = "relative" | "absolute" | "location";

export type LocationTrigger = "on_enter" | "on_leave";

export interface ReminderDue {
  date: string;
  timezone?: string;
}

export interface TodoistReminder {
  id: string;
  notify_uid?: string;
  item_id: string;
  type: ReminderType;
  due?: ReminderDue;
  minute_offset?: number;
  name?: string;
  loc_lat?: string;
  loc_long?: string;
  loc_trigger?: LocationTrigger;
  radius?: number;
  is_deleted?: boolean;
}

export interface GetRemindersArgs {
  task_id?: string;
  task_name?: string;
}

export interface CreateReminderArgs {
  task_id?: string;
  task_name?: string;
  type: ReminderType;
  minute_offset?: number;
  due_date?: string;
  timezone?: string;
  location_name?: string;
  latitude?: string;
  longitude?: string;
  location_trigger?: LocationTrigger;
  radius?: number;
}

export interface UpdateReminderArgs {
  reminder_id: string;
  type?: ReminderType;
  minute_offset?: number;
  due_date?: string;
  timezone?: string;
  location_name?: string;
  latitude?: string;
  longitude?: string;
  location_trigger?: LocationTrigger;
  radius?: number;
}

export interface DeleteReminderArgs {
  reminder_id: string;
}

// Filter operation interfaces (Sync API)
export interface TodoistFilter {
  id: string;
  name: string;
  query: string;
  color?: string;
  item_order?: number;
  is_deleted?: boolean;
  is_favorite?: boolean;
  is_frozen?: boolean;
}

export interface CreateFilterArgs {
  name: string;
  query: string;
  color?: string;
  item_order?: number;
  is_favorite?: boolean;
}

export interface UpdateFilterArgs {
  filter_id?: string;
  filter_name?: string;
  name?: string;
  query?: string;
  color?: string;
  item_order?: number;
  is_favorite?: boolean;
}

export interface FilterNameArgs {
  filter_id?: string;
  filter_name?: string;
}

// Sync API response interfaces
export interface SyncApiResponse {
  sync_token?: string;
  full_sync?: boolean;
  filters?: TodoistFilter[];
  sync_status?: Record<string, string | { error_code: number; error: string }>;
  temp_id_mapping?: Record<string, string>;
}

export interface SyncCommand {
  type: string;
  uuid: string;
  temp_id?: string;
  args: Record<string, unknown>;
}

export interface SyncResponse {
  sync_status: Record<string, string>;
  temp_id_mapping?: Record<string, string>;
  reminders?: TodoistReminder[];
  full_sync?: boolean;
  sync_token?: string;
}

export type RemindersResponse =
  | TodoistReminder[]
  | { reminders?: TodoistReminder[] };

export interface GetCompletedTasksArgs {
  project_id?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
  annotate_notes?: boolean;
}

export interface CompletedTask {
  id: string;
  task_id: string;
  content: string;
  completed_at: string;
  project_id: string;
  section_id?: string | null;
  note_count: number;
  user_id: string;
}

export interface CompletedTasksResponse {
  items: CompletedTask[];
  projects: Record<string, TodoistProject>;
  sections: Record<string, TodoistSection>;
}

export interface FindDuplicatesArgs {
  threshold?: number;
  project_id?: string;
  include_completed?: boolean;
}

export interface DuplicateGroup {
  similarity: number;
  tasks: DuplicateTask[];
}

export interface DuplicateTask {
  id: string;
  content: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  due?: string;
  priority?: number;
  labels?: string[];
  isCompleted?: boolean;
}

export interface MergeDuplicatesArgs {
  keep_task_id: string;
  duplicate_task_ids: string[];
  action: "complete" | "delete";
}

// Activity log interfaces (Phase 1: Activity Logs)
// Based on Todoist Sync API activity/get endpoint

export type ActivityEventType =
  | "added"
  | "updated"
  | "deleted"
  | "completed"
  | "uncompleted"
  | "archived"
  | "unarchived"
  | "shared"
  | "left";

export type ActivityObjectType =
  | "item"
  | "note"
  | "project"
  | "section"
  | "label"
  | "filter"
  | "reminder";

export interface ActivityLogEvent {
  id: string;
  object_type: ActivityObjectType;
  object_id: string;
  event_type: ActivityEventType;
  event_date: string;
  parent_project_id?: string;
  parent_item_id?: string;
  initiator_id?: string;
  extra_data?: Record<string, unknown>;
}

export interface GetActivityArgs {
  object_type?: ActivityObjectType;
  object_id?: string;
  event_type?: ActivityEventType;
  parent_project_id?: string;
  parent_item_id?: string;
  initiator_id?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}

export interface GetActivityByProjectArgs {
  project_id: string;
  event_type?: ActivityEventType;
  object_type?: ActivityObjectType;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}

export interface GetActivityByDateRangeArgs {
  since: string;
  until: string;
  object_type?: ActivityObjectType;
  event_type?: ActivityEventType;
  project_id?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityResponse {
  events: ActivityLogEvent[];
  count: number;
}

export interface MoveTaskArgs {
  task_id?: string;
  task_name?: string;
  project_id?: string;
  section_id?: string;
  parent_id?: string;
}

export interface ReorderTaskArgs {
  task_id?: string;
  task_name?: string;
  child_order: number;
}

export interface BulkReorderTasksArgs {
  items: { id: string; child_order: number }[];
}

export interface CloseTaskArgs {
  task_id?: string;
  task_name?: string;
}

export interface UpdateDayOrderArgs {
  items: { id: string; day_order: number }[];
}

export interface MoveSectionArgs {
  section_id?: string;
  section_name?: string;
  project_id: string;
}

export interface ReorderSectionsArgs {
  project_id: string;
  sections: { id: string; section_order: number }[];
}

export interface ArchiveSectionArgs {
  section_id?: string;
  section_name?: string;
  project_id?: string;
}

export interface UnarchiveSectionArgs {
  section_id?: string;
  section_name?: string;
  project_id?: string;
}

export interface ReorderProjectsArgs {
  projects: { id: string; child_order: number }[];
}

export interface MoveProjectToParentArgs {
  project_id?: string;
  project_name?: string;
  parent_id?: string;
}

export interface GetArchivedProjectsArgs {
  limit?: number;
  offset?: number;
}
