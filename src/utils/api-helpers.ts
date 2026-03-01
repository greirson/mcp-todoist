/**
 * Shared API utilities for handling Todoist API responses and common operations
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { TodoistTask, TodoistTaskDueData } from "../types.js";
import { formatDueDetails } from "./datetime-utils.js";
import { fromApiPriority } from "./priority-mapper.js";
import { AuthenticationError } from "../errors.js";

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
 * Generic paginated response shape used by Todoist API v1 endpoints.
 */
interface PaginatedResponse<T> {
  results: T[];
  nextCursor: string | null;
}

/**
 * Fetches all pages from a paginated Todoist API v1 endpoint.
 *
 * @param fetchPage - Function that takes a cursor and returns a paginated response
 * @returns All items collected across all pages
 */
export async function fetchAllPaginated<T>(
  fetchPage: (cursor?: string | null) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  const allItems: T[] = [];
  let cursor: string | null | undefined = undefined;
  let pageCount = 0;
  const maxPages = 50;

  do {
    pageCount++;
    if (pageCount > maxPages) {
      console.error(
        `[fetchAllPaginated] Safety limit reached (${maxPages} pages, ${allItems.length} items). Stopping.`
      );
      break;
    }
    const response = await fetchPage(cursor);
    allItems.push(...response.results);
    cursor = response.nextCursor || null;
  } while (cursor);

  return allItems;
}

/**
 * Optional filter parameters for getTasks() (excluding pagination params).
 */
interface GetTasksFilterParams {
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  label?: string;
  ids?: string[];
}

/**
 * Fetches ALL tasks across all pages from the Todoist API using cursor-based pagination.
 *
 * @param todoistClient - The Todoist API client
 * @param params - Optional filter parameters (projectId, label, etc.)
 * @returns All tasks matching the filter criteria, merged across all pages
 */
export async function fetchAllTasks(
  todoistClient: TodoistApi,
  params?: GetTasksFilterParams
): Promise<TodoistTask[]> {
  return fetchAllPaginated<TodoistTask>(
    (cursor) =>
      todoistClient.getTasks({
        ...params,
        cursor,
        limit: 200,
      }) as Promise<PaginatedResponse<TodoistTask>>
  );
}

/**
 * Fetches ALL tasks matching a filter query across all pages.
 *
 * @param todoistClient - The Todoist API client
 * @param query - The Todoist filter query string
 * @param lang - Optional language for filter interpretation
 * @returns All tasks matching the filter, merged across all pages
 */
export async function fetchAllTasksByFilter(
  todoistClient: TodoistApi,
  query: string,
  lang?: string
): Promise<TodoistTask[]> {
  return fetchAllPaginated<TodoistTask>(
    (cursor) =>
      todoistClient.getTasksByFilter({
        query,
        lang,
        cursor,
        limit: 200,
      }) as Promise<PaginatedResponse<TodoistTask>>
  );
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
  assigneeId?: string | null;
  assignedByUid?: string | null;
  responsibleUid?: string | null;
}): string {
  const displayPriority = fromApiPriority(task.priority);
  const dueDetails = formatDueDetails(
    task.due as TodoistTaskDueData | null | undefined
  );
  // Show assignment info (responsibleUid is the Todoist API field for assigned user)
  const assigneeDisplay = task.responsibleUid || task.assigneeId;
  const assignedByDisplay = task.assignedByUid;
  return `- ${task.content}${task.id ? ` (ID: ${task.id})` : ""}${
    task.description ? `\n  Description: ${task.description}` : ""
  }${dueDetails ? `\n  Due: ${dueDetails}` : ""}${
    task.deadline ? `\n  Deadline: ${task.deadline.date}` : ""
  }${displayPriority ? `\n  Priority: ${displayPriority}` : ""}${
    task.labels && task.labels.length > 0
      ? `\n  Labels: ${task.labels.join(", ")}`
      : ""
  }${assigneeDisplay ? `\n  Assigned To (User ID): ${assigneeDisplay}` : ""}${
    assignedByDisplay ? `\n  Assigned By (User ID): ${assignedByDisplay}` : ""
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
  todoistClient: {
    getProjects: (args?: {
      cursor?: string | null;
      limit?: number;
    }) => Promise<{
      results: { id: string; name: string }[];
      nextCursor: string | null;
    }>;
  },
  projectIdentifier: string
): Promise<string> {
  if (!projectIdentifier || projectIdentifier.trim().length === 0) {
    throw new Error("Project identifier cannot be empty");
  }

  // Fetch all pages of projects using cursor-based pagination with a high limit per page
  const projects = await fetchAllPaginated<{ id: string; name: string }>(
    (cursor) => todoistClient.getProjects({ cursor, limit: 200 })
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

/**
 * Extracts the API token from a TodoistApi client instance.
 * This is needed for direct API calls (e.g., Sync API) that bypass the SDK.
 *
 * Note: This relies on internal implementation details of the TodoistApi client.
 * If the library's internal structure changes, this may need to be updated.
 *
 * @param client - The TodoistApi client instance
 * @returns The API token string
 * @throws AuthenticationError if token cannot be extracted
 */
export function extractApiToken(client: TodoistApi): string {
  // Try multiple possible property names for compatibility
  // Cast through unknown first to satisfy TypeScript strict mode
  const clientObj = client as unknown as Record<string, unknown>;
  const apiToken: string | undefined =
    (clientObj.authToken as string | undefined) ??
    (clientObj.token as string | undefined) ??
    (clientObj.apiToken as string | undefined);

  if (!apiToken) {
    throw new AuthenticationError();
  }

  return apiToken;
}
