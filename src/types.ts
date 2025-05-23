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