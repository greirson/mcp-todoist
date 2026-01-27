/**
 * Project and section type guards
 *
 * Type guards for project creation, update, and section operations.
 */

import {
  GetSectionsArgs,
  CreateProjectArgs,
  UpdateProjectArgs,
  ProjectNameArgs,
  GetProjectCollaboratorsArgs,
  CreateSectionArgs,
  UpdateSectionArgs,
  SectionIdentifierArgs,
  GetCollaboratorsArgs,
} from "../types/index.js";

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
