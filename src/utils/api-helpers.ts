/**
 * Shared API utilities for handling Todoist API responses and common operations
 */

import { fromApiPriority } from "./priority-mapper.js";

/**
 * Generic interface for Todoist API responses that may return data in different formats
 */
export interface TodoistAPIResponse<T> {
  results?: T[];
  data?: T[];
}

/**
 * Extracts array data from various Todoist API response formats.
 * Handles both direct arrays and object responses with 'results' or 'data' properties.
 *
 * @param result - The API response which could be an array or an object containing arrays
 * @returns Array of items of type T, or empty array if no data found
 *
 * @example
 * ```typescript
 * const tasks = extractArrayFromResponse<TodoistTask>(apiResponse);
 * const comments = extractArrayFromResponse<TodoistComment>(commentResponse);
 * ```
 */
export function extractArrayFromResponse<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  const responseObj = result as TodoistAPIResponse<T>;
  return responseObj?.results || responseObj?.data || [];
}

/**
 * Interface for comment response data from Todoist API
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
 * Interface for comment creation data
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
 * Validates that a response object has the expected structure
 *
 * @param response - The API response to validate
 * @param expectedFields - Array of field names that should exist in the response
 * @returns boolean indicating if the response is valid
 */
export function validateApiResponse(
  response: unknown,
  expectedFields: string[]
): boolean {
  if (!response || typeof response !== "object") {
    return false;
  }

  const obj = response as Record<string, unknown>;
  return expectedFields.every((field) => field in obj);
}

/**
 * Creates a cache key from an object by serializing its properties
 *
 * @param prefix - Prefix for the cache key
 * @param params - Object containing parameters to include in the key
 * @returns Standardized cache key string
 */
export function createCacheKey(
  prefix: string,
  params: Record<string, unknown> = {}
): string {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
  return `${prefix}_${JSON.stringify(cleanParams)}`;
}

/**
 * Formats a Todoist task for display in responses
 *
 * @param task - The task object to format
 * @returns Formatted string representation of the task
 */
export function formatTaskForDisplay(task: {
  id?: string;
  content: string;
  description?: string;
  due?: { string: string } | null;
  deadline?: { date: string } | null;
  priority?: number;
  labels?: string[];
}): string {
  const displayPriority = fromApiPriority(task.priority);
  return `- ${task.content}${task.id ? ` (ID: ${task.id})` : ""}${
    task.description ? `\n  Description: ${task.description}` : ""
  }${task.due ? `\n  Due: ${task.due.string}` : ""}${
    task.deadline ? `\n  Deadline: ${task.deadline.date}` : ""
  }${displayPriority ? `\n  Priority: ${displayPriority}` : ""}${
    task.labels && task.labels.length > 0
      ? `\n  Labels: ${task.labels.join(", ")}`
      : ""
  }`;
}

/**
 * Safely extracts string value from unknown input
 *
 * @param value - The value to extract as string
 * @param defaultValue - Default value if extraction fails
 * @returns String value or default
 */
export function safeStringExtract(value: unknown, defaultValue = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (value != null) {
    return String(value);
  }
  return defaultValue;
}

/**
 * Safely extracts number value from unknown input
 *
 * @param value - The value to extract as number
 * @param defaultValue - Default value if extraction fails
 * @returns Number value or default
 */
export function safeNumberExtract(value: unknown, defaultValue = 0): number {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Resolves a project identifier to a project ID.
 * If the input is already a valid project ID, returns it as-is.
 * If the input is a project name, searches for the project and returns its ID.
 *
 * @param todoistClient - The Todoist API client
 * @param projectIdentifier - Either a project ID or project name
 * @returns The resolved project ID
 * @throws Error if project name is not found
 */
export async function resolveProjectIdentifier(
  todoistClient: { getProjects: () => Promise<unknown> },
  projectIdentifier: string
): Promise<string> {
  if (!projectIdentifier || projectIdentifier.trim().length === 0) {
    throw new Error("Project identifier cannot be empty");
  }

  // First, try to get all projects
  const result = await todoistClient.getProjects();
  const projects = extractArrayFromResponse<{ id: string; name: string }>(
    result
  );

  // Check if the identifier matches a project ID exactly
  const projectById = projects.find((p) => p.id === projectIdentifier);
  if (projectById) {
    return projectById.id;
  }

  // Try to find by name (case-insensitive)
  const projectByName = projects.find(
    (p) => p.name.toLowerCase() === projectIdentifier.toLowerCase()
  );

  if (projectByName) {
    return projectByName.id;
  }

  // If not found, throw an error
  throw new Error(`Project not found: "${projectIdentifier}"`);
}
