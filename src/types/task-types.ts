/**
 * Task-related type definitions
 */

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

/**
 * Arguments for creating a new task
 */
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

/**
 * Arguments for getting tasks
 */
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

/**
 * Arguments for updating a task
 */
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

/**
 * Arguments for reopening a completed task
 */
export interface ReopenTaskArgs {
  task_name?: string;
  task_id?: string;
}

/**
 * Arguments for identifying a task by name or ID
 */
export interface TaskNameArgs {
  task_name?: string;
  task_id?: string;
}

/**
 * Arguments for quick-adding a task with natural language
 */
export interface QuickAddTaskArgs {
  text: string;
  note?: string;
  reminder?: string;
  auto_reminder?: boolean;
}

/**
 * Result of quick-add task operation
 */
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

/**
 * Task due date data structure
 */
export interface TodoistTaskDueData {
  string: string;
  date?: string | null;
  datetime?: string | null;
  timezone?: string | null;
  lang?: string | null;
  isRecurring?: boolean;
}

/**
 * Todoist task data for API operations
 */
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

/**
 * Todoist task object structure
 */
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

/**
 * Completed task information
 */
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

/**
 * Arguments for getting completed tasks
 */
export interface GetCompletedTasksArgs {
  project_id?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
  annotate_notes?: boolean;
}

/**
 * Arguments for moving a task
 */
export interface MoveTaskArgs {
  task_id?: string;
  task_name?: string;
  project_id?: string;
  section_id?: string;
  parent_id?: string;
}

/**
 * Arguments for reordering a task
 */
export interface ReorderTaskArgs {
  task_id?: string;
  task_name?: string;
  child_order: number;
}

/**
 * Arguments for closing a task
 */
export interface CloseTaskArgs {
  task_id?: string;
  task_name?: string;
}

/**
 * Arguments for updating day order of multiple tasks
 */
export interface UpdateDayOrderArgs {
  items: { id: string; day_order: number }[];
}

/**
 * Arguments for finding duplicate tasks
 */
export interface FindDuplicatesArgs {
  threshold?: number;
  project_id?: string;
  include_completed?: boolean;
}

/**
 * Duplicate task group
 */
export interface DuplicateGroup {
  similarity: number;
  tasks: DuplicateTask[];
}

/**
 * Duplicate task information
 */
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

/**
 * Arguments for merging duplicate tasks
 */
export interface MergeDuplicatesArgs {
  keep_task_id: string;
  duplicate_task_ids: string[];
  action: "complete" | "delete";
}
