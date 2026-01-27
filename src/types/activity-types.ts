/**
 * Activity log type definitions
 */

/**
 * Activity event type enum
 */
export type ActivityEventType =
  | "added"
  | "updated"
  | "deleted"
  | "completed"
  | "uncompleted"
  | "archived"
  | "unarchived"
  | "shared"
  | "left";

/**
 * Activity object type enum
 */
export type ActivityObjectType =
  | "item"
  | "note"
  | "project"
  | "section"
  | "label"
  | "filter"
  | "reminder";

/**
 * Activity log event structure
 */
export interface ActivityLogEvent {
  id: string;
  object_type: ActivityObjectType;
  object_id: string;
  event_type: ActivityEventType;
  event_date: string;
  parent_project_id?: string;
  parent_item_id?: string;
  initiator_id?: string;
  extra_data?: Record<string, unknown>;
}

/**
 * Arguments for getting activity logs
 */
export interface GetActivityArgs {
  object_type?: ActivityObjectType;
  object_id?: string;
  event_type?: ActivityEventType;
  parent_project_id?: string;
  parent_item_id?: string;
  initiator_id?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}

/**
 * Arguments for getting activity by project
 */
export interface GetActivityByProjectArgs {
  project_id: string;
  event_type?: ActivityEventType;
  object_type?: ActivityObjectType;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}

/**
 * Arguments for getting activity by date range
 */
export interface GetActivityByDateRangeArgs {
  since: string;
  until: string;
  object_type?: ActivityObjectType;
  event_type?: ActivityEventType;
  project_id?: string;
  limit?: number;
  offset?: number;
}

/**
 * Activity response structure
 */
export interface ActivityResponse {
  events: ActivityLogEvent[];
  count: number;
}
