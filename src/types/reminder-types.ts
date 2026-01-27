/**
 * Reminder type definitions (Sync API)
 */

/**
 * Reminder type enum
 */
export type ReminderType = "relative" | "absolute" | "location";

/**
 * Location trigger for location-based reminders
 */
export type LocationTrigger = "on_enter" | "on_leave";

/**
 * Reminder due date structure
 */
export interface ReminderDue {
  date: string;
  timezone?: string;
}

/**
 * Todoist reminder object structure
 */
export interface TodoistReminder {
  id: string;
  notify_uid?: string;
  item_id: string;
  type: ReminderType;
  due?: ReminderDue;
  minute_offset?: number;
  name?: string;
  loc_lat?: string;
  loc_long?: string;
  loc_trigger?: LocationTrigger;
  radius?: number;
  is_deleted?: boolean;
}

/**
 * Arguments for getting reminders
 */
export interface GetRemindersArgs {
  task_id?: string;
  task_name?: string;
}

/**
 * Arguments for creating a reminder
 */
export interface CreateReminderArgs {
  task_id?: string;
  task_name?: string;
  type: ReminderType;
  minute_offset?: number;
  due_date?: string;
  timezone?: string;
  location_name?: string;
  latitude?: string;
  longitude?: string;
  location_trigger?: LocationTrigger;
  radius?: number;
}

/**
 * Arguments for updating a reminder
 */
export interface UpdateReminderArgs {
  reminder_id: string;
  type?: ReminderType;
  minute_offset?: number;
  due_date?: string;
  timezone?: string;
  location_name?: string;
  latitude?: string;
  longitude?: string;
  location_trigger?: LocationTrigger;
  radius?: number;
}

/**
 * Arguments for deleting a reminder
 */
export interface DeleteReminderArgs {
  reminder_id: string;
}

/**
 * Sync response for reminder operations
 */
export interface SyncResponse {
  sync_status: Record<string, string>;
  temp_id_mapping?: Record<string, string>;
  reminders?: TodoistReminder[];
  full_sync?: boolean;
  sync_token?: string;
}

/**
 * Response type for reminders API
 */
export type RemindersResponse =
  | TodoistReminder[]
  | { reminders?: TodoistReminder[] };
