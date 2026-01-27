/**
 * Filter type definitions (Sync API)
 */

import type { TodoistReminder } from "./reminder-types.js";

/**
 * Todoist filter object structure
 */
export interface TodoistFilter {
  id: string;
  name: string;
  query: string;
  color?: string;
  item_order?: number;
  is_deleted?: boolean;
  is_favorite?: boolean;
  is_frozen?: boolean;
}

/**
 * Arguments for creating a filter
 */
export interface CreateFilterArgs {
  name: string;
  query: string;
  color?: string;
  item_order?: number;
  is_favorite?: boolean;
}

/**
 * Arguments for updating a filter
 */
export interface UpdateFilterArgs {
  filter_id?: string;
  filter_name?: string;
  name?: string;
  query?: string;
  color?: string;
  item_order?: number;
  is_favorite?: boolean;
}

/**
 * Arguments for identifying a filter by name or ID
 */
export interface FilterNameArgs {
  filter_id?: string;
  filter_name?: string;
}

/**
 * Sync API response structure
 */
export interface SyncApiResponse {
  sync_token?: string;
  full_sync?: boolean;
  filters?: TodoistFilter[];
  reminders?: TodoistReminder[];
  sync_status?: Record<string, string | { error_code: number; error: string }>;
  temp_id_mapping?: Record<string, string>;
}
