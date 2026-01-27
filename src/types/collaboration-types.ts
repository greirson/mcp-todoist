/**
 * User, workspace, notification, and collaboration type definitions
 */

/**
 * User information structure
 */
export interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  inbox_project_id: string;
  team_inbox_id?: string;
  avatar_medium?: string;
  avatar_big?: string;
  avatar_s640?: string;
  is_premium: boolean;
  premium_until?: string;
  business_account_id?: string;
  date_format: number;
  time_format: number;
  start_day: number;
  start_page: string;
  next_week: number;
  timezone: string;
  lang: string;
  joined_at: string;
  sort_order: number;
  days_off: number[];
  default_reminder?: string;
  auto_reminder?: number;
  karma: number;
  karma_trend: string;
  completed_count: number;
  completed_today: number;
}

/**
 * Productivity statistics structure
 */
export interface ProductivityStats {
  karma_last_update: number;
  karma_trend: string;
  days_items: { date: string; total_completed: number }[];
  completed_count: number;
  karma_update_reasons: {
    positive_karma_reasons: number[];
    negative_karma_reasons: number[];
  };
  karma: number;
  week_items: { date: string; total_completed: number }[];
  goals: {
    karma_disabled: number;
    user_id: string;
    max_weekly_streak: { count: number; start: string; end: string };
    ignore_days: number[];
    vacation_mode: number;
    current_weekly_streak: { count: number; start: string; end: string };
    current_daily_streak: { count: number; start: string; end: string };
    weekly_goal: number;
    max_daily_streak: { count: number; start: string; end: string };
    daily_goal: number;
  };
}

/**
 * Workspace structure
 */
export interface Workspace {
  id: string;
  name: string;
  is_default: boolean;
}

/**
 * Invitation structure
 */
export interface Invitation {
  id: string;
  inviter_id: string;
  project_id?: string;
  message?: string;
}

/**
 * Arguments for inviting to a project
 */
export interface InviteToProjectArgs {
  project_id: string;
  email: string;
  message?: string;
}

/**
 * Arguments for accepting an invitation
 */
export interface AcceptInvitationArgs {
  invitation_id: string;
  invitation_secret: string;
}

/**
 * Arguments for rejecting an invitation
 */
export interface RejectInvitationArgs {
  invitation_id: string;
  invitation_secret: string;
}

/**
 * Arguments for deleting an invitation
 */
export interface DeleteInvitationArgs {
  invitation_id: string;
}

/**
 * Live notification structure
 */
export interface LiveNotification {
  id: string;
  created_at: string;
  notification_type: string;
  is_unread: boolean;
  from_uid?: string;
  project_id?: string;
  item_id?: string;
}

/**
 * Arguments for getting live notifications
 */
export interface GetLiveNotificationsArgs {
  limit?: number;
}

/**
 * Arguments for marking a notification as read
 */
export interface MarkNotificationReadArgs {
  notification_id: string;
}

/**
 * Arguments for marking all notifications as read
 */
export interface MarkAllNotificationsReadArgs {}

/**
 * Todoist backup structure
 */
export interface TodoistBackup {
  version: string;
  url: string;
}

/**
 * Arguments for getting backups
 */
export interface GetBackupsArgs {}

/**
 * Arguments for downloading a backup
 */
export interface DownloadBackupArgs {
  version: string;
}

/**
 * Project note structure
 */
export interface ProjectNote {
  id: string;
  project_id: string;
  content: string;
  posted_at: string;
  posted_uid: string;
  is_deleted: boolean;
  file_attachment?: {
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
    upload_state: string;
  };
}

/**
 * Arguments for getting project notes
 */
export interface GetProjectNotesArgs {
  project_id: string;
}

/**
 * Arguments for creating a project note
 */
export interface CreateProjectNoteArgs {
  project_id: string;
  content: string;
}

/**
 * Arguments for updating a project note
 */
export interface UpdateProjectNoteArgs {
  note_id: string;
  content: string;
}

/**
 * Arguments for deleting a project note
 */
export interface DeleteProjectNoteArgs {
  note_id: string;
}
