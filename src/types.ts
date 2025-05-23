export interface CreateTaskArgs {
  content: string;
  description?: string;
  due_string?: string;
  priority?: number;
  labels?: string[];
  deadline?: string;
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
  deadline?: string;
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

// Union types to handle any API response format
export type TasksResponse = unknown;
export type ProjectsResponse = unknown;
export type SectionsResponse = unknown;
export type CommentsResponse = unknown;
