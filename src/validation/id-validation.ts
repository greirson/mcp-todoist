import { ValidationError } from "../errors.js";

export function validateProjectId(projectId?: string): void {
  if (projectId !== undefined) {
    if (typeof projectId !== "string") {
      throw new ValidationError("Project ID must be a string", "project_id");
    }

    if (projectId.trim().length === 0) {
      throw new ValidationError("Project ID cannot be empty", "project_id");
    }
  }
}

export function validateSectionId(sectionId?: string): void {
  if (sectionId !== undefined) {
    if (typeof sectionId !== "string") {
      throw new ValidationError("Section ID must be a string", "section_id");
    }

    if (sectionId.trim().length === 0) {
      throw new ValidationError("Section ID cannot be empty", "section_id");
    }
  }
}

export function validateTaskIdentifier(
  taskId?: string,
  taskName?: string
): void {
  if (!taskId && !taskName) {
    throw new ValidationError("Either task_id or task_name must be provided");
  }
}
