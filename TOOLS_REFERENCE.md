# Todoist MCP Tools Reference

Complete reference for all 86 MCP tools provided by the Todoist MCP Server.

## Table of Contents

- [Task Management (12 tools)](#task-management-12-tools)
- [Subtask Management (5 tools)](#subtask-management-5-tools)
- [Project Management (11 tools)](#project-management-11-tools)
- [Comment Management (4 tools)](#comment-management-4-tools)
- [Label Management (5 tools)](#label-management-5-tools)
- [Filter Management (4 tools)](#filter-management-4-tools)
- [Reminder Management (4 tools)](#reminder-management-4-tools)
- [Duplicate Detection (2 tools)](#duplicate-detection-2-tools)
- [Collaboration (9 tools)](#collaboration-9-tools)
- [Activity Log (3 tools)](#activity-log-3-tools)
- [Backup (2 tools)](#backup-2-tools)
- [User (3 tools)](#user-3-tools)
- [Project Notes (4 tools)](#project-notes-4-tools)
- [Shared Labels (3 tools)](#shared-labels-3-tools)
- [Item Operations (5 tools)](#item-operations-5-tools)
- [Section Operations (4 tools)](#section-operations-4-tools)
- [Project Operations (3 tools)](#project-operations-3-tools)
- [Testing (3 tools)](#testing-3-tools)

---

## Task Management (12 tools)

| Tool Name                     | Description                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `todoist_task_create`         | Create a new task in Todoist with optional description, due date, priority, labels, deadline, project, section, and duration for time blocking                                                                           |
| `todoist_task_get`            | Retrieve tasks from Todoist. Use 'filter' for Todoist filter syntax (e.g., 'today', 'p1') or 'task_name' for simple text search in task content                                                                          |
| `todoist_task_update`         | Update an existing task found by ID or partial name search. Supports updating content, description, due date, priority, labels, deadline, project, section, and duration                                                 |
| `todoist_task_delete`         | Delete a task found by ID or partial name search (case-insensitive)                                                                                                                                                      |
| `todoist_task_complete`       | Mark a task as complete found by ID or partial name search (case-insensitive)                                                                                                                                            |
| `todoist_task_reopen`         | Reopen a previously completed task found by ID or partial name search (case-insensitive). Use this to restore a task that was marked as complete.                                                                        |
| `todoist_tasks_bulk_create`   | Create multiple tasks at once for improved efficiency. Each task can have full attributes including duration for time blocking.                                                                                          |
| `todoist_tasks_bulk_update`   | Update multiple tasks at once based on search criteria. Supports updating content, priority, due dates, labels, project, section, and duration.                                                                          |
| `todoist_tasks_bulk_delete`   | Delete multiple tasks at once based on search criteria. Use with caution - this will permanently delete matching tasks.                                                                                                  |
| `todoist_tasks_bulk_complete` | Complete multiple tasks at once based on search criteria. Efficiently mark many tasks as done.                                                                                                                           |
| `todoist_completed_tasks_get` | Retrieve completed tasks from Todoist. Uses the Sync API to fetch tasks that have been marked as complete. Supports filtering by project, date range, and pagination.                                                    |
| `todoist_task_quick_add`      | Create a task using natural language parsing like the Todoist app. The text is parsed to extract due dates, projects (#), labels (@), assignees (+), priorities (p1-p4), deadlines ({in 3 days}), and descriptions (//). |

---

## Subtask Management (5 tools)

| Tool Name                         | Description                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `todoist_subtask_create`          | Create a new subtask under a parent task in Todoist                |
| `todoist_subtasks_bulk_create`    | Create multiple subtasks under a parent task in a single operation |
| `todoist_task_convert_to_subtask` | Convert an existing task to a subtask of another task              |
| `todoist_subtask_promote`         | Promote a subtask to a main task (remove parent relationship)      |
| `todoist_task_hierarchy_get`      | Get a task with all its subtasks in a hierarchical structure       |

---

## Project Management (11 tools)

| Tool Name                           | Description                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `todoist_project_get`               | Get a list of all projects from Todoist with their IDs, names, descriptions, and hierarchy information                                       |
| `todoist_project_create`            | Create a new project in Todoist with optional sub-project hierarchy, description, and view style                                             |
| `todoist_project_update`            | Update an existing project in Todoist. Can modify name, color, favorite status, description, or view style.                                  |
| `todoist_project_delete`            | Delete a project from Todoist. This will also delete all tasks and sub-projects within the project.                                          |
| `todoist_project_archive`           | Archive or unarchive a project in Todoist. Archived projects are hidden from the main view but can be restored.                              |
| `todoist_project_collaborators_get` | Get a list of collaborators for a shared project in Todoist. Returns collaborator names and emails.                                          |
| `todoist_section_get`               | Get a list of sections within a project from Todoist with their IDs and names                                                                |
| `todoist_section_create`            | Create a new section within a project in Todoist                                                                                             |
| `todoist_section_update`            | Update an existing section in Todoist. Can update name by section ID or section name search.                                                 |
| `todoist_section_delete`            | Delete a section and all its tasks from Todoist. Can delete by section ID or section name search.                                            |
| `todoist_collaborators_get`         | Get a list of collaborators for a shared project. Returns user IDs, names, and emails that can be used for task assignment with assignee_id. |

---

## Comment Management (4 tools)

| Tool Name                | Description                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `todoist_comment_create` | Add a comment to a task or project in Todoist. For task comments, provide task_id or task_name. For project comments, provide project_id. |
| `todoist_comment_get`    | Get comments for a task or project in Todoist                                                                                             |
| `todoist_comment_update` | Update an existing comment's content by comment ID                                                                                        |
| `todoist_comment_delete` | Delete a comment by its ID                                                                                                                |

---

## Label Management (5 tools)

| Tool Name              | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `todoist_label_get`    | Get all labels in Todoist                      |
| `todoist_label_create` | Create a new label in Todoist                  |
| `todoist_label_update` | Update an existing label in Todoist            |
| `todoist_label_delete` | Delete a label from Todoist                    |
| `todoist_label_stats`  | Get usage statistics for all labels in Todoist |

---

## Filter Management (4 tools)

| Tool Name               | Description                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `todoist_filter_get`    | Get all custom filters in Todoist. Filters are saved searches that help you organize and view tasks based on specific criteria. Note: Requires Todoist Pro or Business plan. |
| `todoist_filter_create` | Create a new custom filter in Todoist. Filters use Todoist's query syntax (e.g., 'p1', 'today', '@label', '#project'). Note: Requires Todoist Pro or Business plan.          |
| `todoist_filter_update` | Update an existing filter in Todoist. Can update name, query, color, order, or favorite status. Note: Frozen filters (from cancelled subscriptions) cannot be modified.      |
| `todoist_filter_delete` | Delete a filter from Todoist. This action cannot be undone. Note: Frozen filters (from cancelled subscriptions) cannot be deleted.                                           |

---

## Reminder Management (4 tools)

| Tool Name                 | Description                                                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `todoist_reminder_get`    | Get all reminders, optionally filtered by task. Reminders require Todoist Pro or Business plan.                                                                                           |
| `todoist_reminder_create` | Create a new reminder for a task. Supports three reminder types: relative (minutes before due), absolute (specific date/time), and location-based. Requires Todoist Pro or Business plan. |
| `todoist_reminder_update` | Update an existing reminder. Can change the type, timing, or location settings. Requires Todoist Pro or Business plan.                                                                    |
| `todoist_reminder_delete` | Delete a reminder. Requires Todoist Pro or Business plan.                                                                                                                                 |

---

## Duplicate Detection (2 tools)

| Tool Name                  | Description                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `todoist_duplicates_find`  | Find duplicate or similar tasks using content similarity analysis. Returns grouped tasks that have similar titles, sorted by similarity percentage. |
| `todoist_duplicates_merge` | Merge duplicate tasks by keeping one task and completing or deleting the others. Use after todoist_duplicates_find to clean up duplicates.          |

---

## Collaboration (9 tools)

| Tool Name                             | Description                                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `todoist_workspaces_get`              | Get all workspaces for the current user. Workspaces are available with Todoist Business accounts for team organization. |
| `todoist_invitations_get`             | Get all pending project sharing invitations received by the current user.                                               |
| `todoist_project_invite`              | Invite a user to collaborate on a project by email. The invitee will receive an email notification.                     |
| `todoist_invitation_accept`           | Accept a project sharing invitation. Requires both the invitation ID and secret from the invitation email.              |
| `todoist_invitation_reject`           | Reject a project sharing invitation. Requires both the invitation ID and secret.                                        |
| `todoist_invitation_delete`           | Delete/revoke a pending invitation that you sent. Use this to cancel an invitation before it is accepted.               |
| `todoist_notifications_get`           | Get live notifications including comments, assignments, sharing invitations, and other collaboration events.            |
| `todoist_notification_mark_read`      | Mark a specific notification as read.                                                                                   |
| `todoist_notifications_mark_all_read` | Mark all notifications as read.                                                                                         |

---

## Activity Log (3 tools)

| Tool Name                        | Description                                                                                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `todoist_activity_get`           | Get Todoist activity log with optional filters. Returns events for items, notes, projects, sections, labels, filters, and reminders. Useful for auditing changes, tracking productivity, and understanding workspace history. |
| `todoist_activity_by_project`    | Get Todoist activity log for a specific project. Returns all events (tasks added/completed/deleted, comments, etc.) related to the project. Useful for project auditing and tracking project-specific changes.                |
| `todoist_activity_by_date_range` | Get Todoist activity log within a specific date range. Returns all events that occurred between the specified dates. Useful for generating activity reports and reviewing changes over time periods.                          |

---

## Backup (2 tools)

| Tool Name                 | Description                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `todoist_backups_get`     | List all available automatic backups of your Todoist data. Todoist creates backups automatically. Returns version timestamps and download URLs. |
| `todoist_backup_download` | Get the download URL for a specific backup version. The URL is time-limited. Backups are ZIP files containing CSV exports of your Todoist data. |

---

## User (3 tools)

| Tool Name                        | Description                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `todoist_user_get`               | Get information about the current Todoist user including name, email, timezone, karma, and account settings.             |
| `todoist_productivity_stats_get` | Get detailed productivity statistics including karma, task completion history, daily/weekly streaks, and goals progress. |
| `todoist_user_settings_get`      | Get user settings including reminder preferences, notification settings, sounds, and theme configuration.                |

---

## Project Notes (4 tools)

| Tool Name                     | Description                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `todoist_project_notes_get`   | Get all notes for a specific project. Project notes are shared with all project collaborators. |
| `todoist_project_note_create` | Create a new note for a project. Project notes are visible to all project collaborators.       |
| `todoist_project_note_update` | Update an existing project note's content.                                                     |
| `todoist_project_note_delete` | Delete a project note by ID.                                                                   |

---

## Shared Labels (3 tools)

| Tool Name                     | Description                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `todoist_shared_labels_get`   | Get all shared labels in the workspace. Shared labels are available in Todoist Business accounts for team collaboration.                                       |
| `todoist_shared_label_rename` | Rename a shared label across all items in the workspace. Updates the label name for all team members. Requires Todoist Business account.                       |
| `todoist_shared_label_remove` | Remove a shared label from all items in the workspace. This removes the label from all tasks but does not delete the tasks. Requires Todoist Business account. |

---

## Item Operations (5 tools)

| Tool Name                       | Description                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `todoist_task_move`             | Move a task to a different project, section, or under a parent task. Uses Todoist Sync API for reliable movement operations.                                             |
| `todoist_task_reorder`          | Set the order of a task within its project/section. Lower numbers appear first.                                                                                          |
| `todoist_tasks_reorder_bulk`    | Reorder multiple tasks at once by specifying their new positions. Efficient for reorganizing task lists.                                                                 |
| `todoist_task_close`            | Close a task. For recurring tasks, this completes the current occurrence and schedules the next one. For non-recurring tasks, this is equivalent to completing the task. |
| `todoist_task_day_order_update` | Update the day order of tasks in the Today view. Controls the order tasks appear when viewing today's tasks.                                                             |

---

## Section Operations (4 tools)

| Tool Name                   | Description                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `todoist_section_move`      | Move a section to a different project. All tasks in the section will move with it.                       |
| `todoist_sections_reorder`  | Reorder sections within a project by specifying their new positions.                                     |
| `todoist_section_archive`   | Archive a section. Archived sections are hidden but not deleted. Tasks in the section are also archived. |
| `todoist_section_unarchive` | Unarchive a previously archived section. Restores the section and its tasks to active status.            |

---

## Project Operations (3 tools)

| Tool Name                        | Description                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `todoist_projects_reorder`       | Reorder projects by specifying their new positions. Controls project ordering in the sidebar.                               |
| `todoist_project_move_to_parent` | Move a project under another project (making it a sub-project) or to root level. Useful for organizing project hierarchies. |
| `todoist_archived_projects_get`  | Get a list of all archived projects. Useful for reviewing or restoring archived projects.                                   |

---

## Testing (3 tools)

| Tool Name                   | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `todoist_test_connection`   | Test the connection to Todoist API and verify API token validity            |
| `todoist_test_all_features` | Run comprehensive tests on all Todoist MCP features to verify functionality |
| `todoist_test_performance`  | Measure performance and response times of Todoist API operations            |
