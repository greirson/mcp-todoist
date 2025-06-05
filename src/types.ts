export interface CreateTaskArgs {
  content: string;
  description?: string;
  due_string?: string;
  priority?: number;
  labels?: string[];
  deadline_date?: string;
  project_id?: string;
  section_id?: string;
}

export interface GetTasksArgs {
  project_id?: string;
  filter?: string;
  priority?: number;
  limit?: number;
}

export interface UpdateTaskArgs {
  task_name: string;
  content?: string;
  description?: string;
  due_string?: string;
  priority?: number;
  project_id?: string;
  section_id?: string;
}

export interface TaskNameArgs {
  task_name: string;
}

export interface GetSectionsArgs {
  project_id?: string;
}

export interface CreateProjectArgs {
  name: string;
  color?: string;
  is_favorite?: boolean;
}

export interface CreateSectionArgs {
  name: string;
  project_id: string;
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
}

export interface TodoistProjectData {
  name: string;
  color?: string;
  isFavorite?: boolean;
}

export interface TodoistSectionData {
  name: string;
  projectId: string;
}

// API response interfaces for backward compatibility
export interface TodoistTask {
  id: string;
  content: string;
  description?: string;
  due?: { string: string } | null;
  deadline?: { date: string } | null;
  priority?: number;
  labels?: string[];
  projectId?: string;
  sectionId?: string | null;
}

export interface TodoistProject {
  id: string;
  name: string;
  color?: string;
  isFavorite?: boolean;
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
export type ProjectsResponse = TodoistProject[] | TodoistAPIResponse<TodoistProject>;
export type SectionsResponse = TodoistSection[] | TodoistAPIResponse<TodoistSection>;
export type CommentsResponse = TodoistComment[] | TodoistAPIResponse<TodoistComment>;
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
