/**
 * API response and cache types for Todoist API interactions
 */

import type { TodoistTask } from "./task-types.js";
import type { TodoistProject, TodoistSection } from "./project-types.js";
import type { TodoistComment } from "./comment-types.js";
import type { TodoistLabel } from "./label-types.js";

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
export type ProjectsResponse =
  | TodoistProject[]
  | TodoistAPIResponse<TodoistProject>;
export type SectionsResponse =
  | TodoistSection[]
  | TodoistAPIResponse<TodoistSection>;
export type CommentsResponse =
  | TodoistComment[]
  | TodoistAPIResponse<TodoistComment>;
export type LabelsResponse = TodoistLabel[] | TodoistAPIResponse<TodoistLabel>;

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

/**
 * Sync API response interfaces
 */
export interface SyncCommand {
  type: string;
  uuid: string;
  temp_id?: string;
  args: Record<string, unknown>;
}
