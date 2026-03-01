/**
 * Project, section, and collaborator type definitions
 */

import type { CompletedTask } from "./task-types.js";

/**
 * Todoist project object structure
 */
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

/**
 * Todoist section object structure
 */
export interface TodoistSection {
  id: string;
  name: string;
  projectId: string;
}

/**
 * Todoist collaborator information
 */
export interface TodoistCollaborator {
  id: string;
  name: string;
  email: string;
}

/**
 * Arguments for getting collaborators
 */
export interface GetCollaboratorsArgs {
  project_id: string;
}

/**
 * Arguments for getting sections
 */
export interface GetSectionsArgs {
  project_id?: string;
}

/**
 * Arguments for creating a project
 */
export interface CreateProjectArgs {
  name: string;
  color?: string;
  is_favorite?: boolean;
  parent_id?: string;
  description?: string;
  view_style?: "list" | "board";
}

/**
 * Arguments for updating a project
 */
export interface UpdateProjectArgs {
  project_id?: string;
  project_name?: string;
  name?: string;
  color?: string;
  is_favorite?: boolean;
  description?: string;
  view_style?: "list" | "board";
}

/**
 * Arguments for identifying a project by name or ID
 */
export interface ProjectNameArgs {
  project_id?: string;
  project_name?: string;
}

/**
 * Arguments for getting project collaborators
 */
export interface GetProjectCollaboratorsArgs {
  project_id?: string;
  project_name?: string;
}

/**
 * Arguments for creating a section
 */
export interface CreateSectionArgs {
  name: string;
  project_id: string;
  order?: number;
}

/**
 * Arguments for updating a section
 */
export interface UpdateSectionArgs {
  section_id?: string;
  section_name?: string;
  project_id?: string;
  name?: string;
}

/**
 * Arguments for identifying a section
 */
export interface SectionIdentifierArgs {
  section_id?: string;
  section_name?: string;
  project_id?: string;
}

/**
 * Project data for API operations
 */
export interface TodoistProjectData {
  name: string;
  color?: string;
  isFavorite?: boolean;
  parentId?: string;
  viewStyle?: "list" | "board";
}

/**
 * Section data for API operations
 */
export interface TodoistSectionData {
  name: string;
  projectId: string;
}

/**
 * Response for completed tasks from API v1 (cursor-based pagination)
 */
export interface CompletedTasksResponse {
  items: CompletedTask[];
  next_cursor: string | null;
}

/**
 * Arguments for moving a section
 */
export interface MoveSectionArgs {
  section_id?: string;
  section_name?: string;
  project_id: string;
}

/**
 * Arguments for reordering sections
 */
export interface ReorderSectionsArgs {
  project_id: string;
  sections: { id: string; section_order: number }[];
}

/**
 * Arguments for archiving a section
 */
export interface ArchiveSectionArgs {
  section_id?: string;
  section_name?: string;
  project_id?: string;
}

/**
 * Arguments for unarchiving a section
 */
export interface UnarchiveSectionArgs {
  section_id?: string;
  section_name?: string;
  project_id?: string;
}

/**
 * Arguments for reordering projects
 */
export interface ReorderProjectsArgs {
  projects: { id: string; child_order: number }[];
}

/**
 * Arguments for moving a project to a parent
 */
export interface MoveProjectToParentArgs {
  project_id?: string;
  project_name?: string;
  parent_id?: string;
}

/**
 * Arguments for getting archived projects
 */
export interface GetArchivedProjectsArgs {
  limit?: number;
  offset?: number;
}
