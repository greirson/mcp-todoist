import { ValidationError } from "./errors.js";

export function validateTaskContent(content: string): void {
  if (!content || typeof content !== "string") {
    throw new ValidationError("Content is required and must be a string", "content");
  }
  
  if (content.trim().length === 0) {
    throw new ValidationError("Content cannot be empty", "content");
  }
  
  if (content.length > 500) {
    throw new ValidationError("Content must be 500 characters or less", "content");
  }
}

export function validatePriority(priority?: number): void {
  if (priority !== undefined) {
    if (!Number.isInteger(priority) || priority < 1 || priority > 4) {
      throw new ValidationError("Priority must be an integer between 1 and 4", "priority");
    }
  }
}

export function validateDateString(dateString?: string, fieldName = "date"): void {
  if (dateString !== undefined) {
    if (typeof dateString !== "string") {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }
    
    // Basic validation for YYYY-MM-DD format
    if (fieldName === "deadline" && dateString) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        throw new ValidationError("Deadline must be in YYYY-MM-DD format", fieldName);
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new ValidationError("Invalid date format", fieldName);
      }
    }
  }
}

export function validateLabels(labels?: string[]): void {
  if (labels !== undefined) {
    if (!Array.isArray(labels)) {
      throw new ValidationError("Labels must be an array", "labels");
    }
    
    for (const label of labels) {
      if (typeof label !== "string") {
        throw new ValidationError("All labels must be strings", "labels");
      }
      
      if (label.trim().length === 0) {
        throw new ValidationError("Labels cannot be empty", "labels");
      }
      
      if (label.length > 100) {
        throw new ValidationError("Each label must be 100 characters or less", "labels");
      }
    }
    
    if (labels.length > 10) {
      throw new ValidationError("Maximum 10 labels allowed", "labels");
    }
  }
}

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

export function validateTaskName(taskName: string): void {
  if (!taskName || typeof taskName !== "string") {
    throw new ValidationError("Task name is required and must be a string", "task_name");
  }
  
  if (taskName.trim().length === 0) {
    throw new ValidationError("Task name cannot be empty", "task_name");
  }
  
  if (taskName.length > 200) {
    throw new ValidationError("Task name must be 200 characters or less", "task_name");
  }
}

export function validateProjectName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Project name is required and must be a string", "name");
  }
  
  if (name.trim().length === 0) {
    throw new ValidationError("Project name cannot be empty", "name");
  }
  
  if (name.length > 120) {
    throw new ValidationError("Project name must be 120 characters or less", "name");
  }
}

export function validateSectionName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Section name is required and must be a string", "name");
  }
  
  if (name.trim().length === 0) {
    throw new ValidationError("Section name cannot be empty", "name");
  }
  
  if (name.length > 120) {
    throw new ValidationError("Section name must be 120 characters or less", "name");
  }
}

export function validateLimit(limit?: number): void {
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ValidationError("Limit must be an integer between 1 and 100", "limit");
    }
  }
}

export function validateLabelName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Label name is required and must be a string", "name");
  }
  
  if (name.trim().length === 0) {
    throw new ValidationError("Label name cannot be empty", "name");
  }
  
  if (name.length > 100) {
    throw new ValidationError("Label name must be 100 characters or less", "name");
  }
}

export function validateLabelColor(color?: string): void {
  if (color !== undefined) {
    if (typeof color !== "string") {
      throw new ValidationError("Label color must be a string", "color");
    }
    
    // Todoist supports specific color names or hex codes
    const validColors = [
      "berry_red", "red", "orange", "yellow", "olive_green",
      "lime_green", "green", "mint_green", "teal", "sky_blue",
      "light_blue", "blue", "grape", "violet", "lavender",
      "magenta", "salmon", "charcoal", "grey", "taupe"
    ];
    
    if (!validColors.includes(color) && !color.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new ValidationError(
        "Label color must be a valid Todoist color name or hex code",
        "color"
      );
    }
  }
}

export function validateLabelOrder(order?: number): void {
  if (order !== undefined) {
    if (!Number.isInteger(order) || order < 0) {
      throw new ValidationError("Label order must be a non-negative integer", "order");
    }
  }
}

import type { CreateLabelArgs, UpdateLabelArgs } from "./types.js";

export function validateLabelData(data: CreateLabelArgs): CreateLabelArgs {
  validateLabelName(data.name);
  validateLabelColor(data.color);
  validateLabelOrder(data.order);
  
  return {
    name: data.name.trim(),
    color: data.color,
    is_favorite: data.is_favorite,
    order: data.order,
  };
}

export function validateLabelUpdate(data: UpdateLabelArgs): UpdateLabelArgs {
  const updates: UpdateLabelArgs = {};
  
  if (data.name !== undefined) {
    validateLabelName(data.name);
    updates.name = data.name.trim();
  }
  
  if (data.color !== undefined) {
    validateLabelColor(data.color);
    updates.color = data.color;
  }
  
  if (data.order !== undefined) {
    validateLabelOrder(data.order);
    updates.order = data.order;
  }
  
  if (data.is_favorite !== undefined) {
    updates.is_favorite = data.is_favorite;
  }
  
  return updates;
}