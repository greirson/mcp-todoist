# Todoist MCP Tools Reference

Complete reference for all 19 MCP tools provided by the Todoist MCP Server v1.0.

## Table of Contents

- [Core Tools](#core-tools)
  - [todoist_task](#todoist_task)
  - [todoist_task_bulk](#todoist_task_bulk)
  - [todoist_subtask](#todoist_subtask)
  - [todoist_project](#todoist_project)
  - [todoist_section](#todoist_section)
  - [todoist_label](#todoist_label)
  - [todoist_comment](#todoist_comment)
  - [todoist_reminder](#todoist_reminder)
  - [todoist_filter](#todoist_filter)
  - [todoist_collaboration](#todoist_collaboration)
  - [todoist_user](#todoist_user)
  - [todoist_utility](#todoist_utility)
- [Advanced Tools](#advanced-tools)
  - [todoist_task_ops](#todoist_task_ops)
  - [todoist_project_ops](#todoist_project_ops)
  - [todoist_completed](#todoist_completed)
  - [todoist_activity](#todoist_activity)
  - [todoist_backup](#todoist_backup)
  - [todoist_notes](#todoist_notes)
  - [todoist_shared_labels](#todoist_shared_labels)

---

## Core Tools

### todoist_task

Manage Todoist tasks - create, read, update, delete, complete, reopen, or quick add using natural language.

**Actions:**

| Action      | Description                                   | Required Parameters      |
| ----------- | --------------------------------------------- | ------------------------ |
| `create`    | Create a new task with full attribute support | `content`                |
| `get`       | Retrieve tasks with optional filters          | None                     |
| `update`    | Update an existing task                       | `task_id` or `task_name` |
| `delete`    | Delete a task                                 | `task_id` or `task_name` |
| `complete`  | Mark a task as complete                       | `task_id` or `task_name` |
| `reopen`    | Reopen a completed task                       | `task_id` or `task_name` |
| `quick_add` | Create task using natural language            | `text`                   |

**Parameters:**

| Parameter       | Type   | Description                                                                    |
| --------------- | ------ | ------------------------------------------------------------------------------ |
| `action`        | string | **Required.** One of: create, get, update, delete, complete, reopen, quick_add |
| `task_id`       | string | Task ID for direct lookup (preferred)                                          |
| `task_name`     | string | Partial task name for case-insensitive search                                  |
| `content`       | string | Task title/content                                                             |
| `description`   | string | Detailed task description                                                      |
| `due_string`    | string | Due date in natural language (e.g., 'tomorrow', 'next Monday')                 |
| `due_date`      | string | Due date in YYYY-MM-DD format                                                  |
| `deadline_date` | string | Actual deadline in YYYY-MM-DD format                                           |
| `priority`      | number | Priority: 1=P1 (urgent), 2=P2, 3=P3, 4=P4 (normal)                             |
| `project_id`    | string | Project ID to assign task to                                                   |
| `section_id`    | string | Section ID within project                                                      |
| `labels`        | array  | Array of label names to assign                                                 |
| `assignee_id`   | string | User ID to assign task to (shared projects only)                               |
| `duration`      | number | Task duration for time blocking                                                |
| `duration_unit` | string | 'minute' (default) or 'day'                                                    |
| `filter`        | string | Todoist filter query (for get action)                                          |
| `text`          | string | Natural language text for quick_add                                            |

**Examples:**

```json
{"action": "create", "content": "Buy groceries", "due_string": "tomorrow", "priority": 1}
{"action": "get", "filter": "today", "priority": 1}
{"action": "update", "task_id": "123", "content": "Updated title", "priority": 2}
{"action": "complete", "task_name": "groceries"}
{"action": "quick_add", "text": "Meeting tomorrow at 2pm #Work @urgent p1"}
```

---

### todoist_task_bulk

Perform bulk operations on Todoist tasks - create, update, delete, or complete multiple tasks at once.

**Actions:**

| Action          | Description                               | Required Parameters           |
| --------------- | ----------------------------------------- | ----------------------------- |
| `bulk_create`   | Create multiple tasks at once             | `tasks` array                 |
| `bulk_update`   | Update multiple tasks matching criteria   | `search_criteria`, `updates`  |
| `bulk_delete`   | Delete multiple tasks matching criteria   | At least one search criterion |
| `bulk_complete` | Complete multiple tasks matching criteria | At least one search criterion |

**Parameters:**

| Parameter          | Type   | Description                                                                |
| ------------------ | ------ | -------------------------------------------------------------------------- |
| `action`           | string | **Required.** One of: bulk_create, bulk_update, bulk_delete, bulk_complete |
| `tasks`            | array  | Array of task objects to create (for bulk_create)                          |
| `search_criteria`  | object | Criteria to find tasks (for bulk_update)                                   |
| `project_id`       | string | Filter by project ID                                                       |
| `priority`         | number | Filter by priority: 1=P1 (urgent), 2=P2, 3=P3, 4=P4 (normal)              |
| `due_before`       | string | Filter tasks due before date (YYYY-MM-DD)                                  |
| `due_after`        | string | Filter tasks due after date (YYYY-MM-DD)                                   |
| `content_contains` | string | Filter tasks containing text                                               |
| `updates`          | object | Updates to apply to matching tasks                                         |

**Examples:**

```json
{"action": "bulk_create", "tasks": [
  {"content": "Task 1", "priority": 1},
  {"content": "Task 2", "due_string": "tomorrow"}
]}

{"action": "bulk_update",
 "search_criteria": {"project_id": "123", "priority": 4},
 "updates": {"priority": 2}}

{"action": "bulk_complete", "due_before": "2024-01-01", "project_id": "123"}
```

---

### todoist_subtask

Manage hierarchical subtasks in Todoist.

**Actions:**

| Action        | Description                                 | Required Parameters                      |
| ------------- | ------------------------------------------- | ---------------------------------------- |
| `create`      | Create a subtask under a parent             | `parent_id` or `parent_name`, `content`  |
| `bulk_create` | Create multiple subtasks under a parent     | `parent_id` or `parent_name`, `subtasks` |
| `convert`     | Convert an existing task to a subtask       | `task_id`, `parent_id`                   |
| `promote`     | Promote a subtask to a main task            | `task_id`                                |
| `hierarchy`   | Get task hierarchy with completion tracking | `task_id`                                |

**Examples:**

```json
{"action": "create", "parent_id": "123", "content": "Subtask 1"}
{"action": "bulk_create", "parent_id": "123", "subtasks": [
  {"content": "Sub 1"}, {"content": "Sub 2"}
]}
{"action": "hierarchy", "task_id": "123"}
```

---

### todoist_project

Manage Todoist projects - create, read, update, delete, archive, or get collaborators.

**Actions:**

| Action          | Description                            | Required Parameters            |
| --------------- | -------------------------------------- | ------------------------------ |
| `create`        | Create a new project                   | `name`                         |
| `get`           | List all projects                      | None                           |
| `update`        | Update project properties              | `project_id` or `project_name` |
| `delete`        | Delete a project and all its tasks     | `project_id` or `project_name` |
| `archive`       | Archive or unarchive a project         | `project_id` or `project_name` |
| `collaborators` | Get collaborators for a shared project | `project_id` or `project_name` |

**Parameters:**

| Parameter      | Type    | Description                                                               |
| -------------- | ------- | ------------------------------------------------------------------------- |
| `action`       | string  | **Required.** One of: create, get, update, delete, archive, collaborators |
| `project_id`   | string  | Project ID (takes precedence over project_name)                           |
| `project_name` | string  | Project name for search                                                   |
| `name`         | string  | Project name (for create/update)                                          |
| `color`        | string  | Project color (e.g., 'red', 'blue', 'green')                              |
| `description`  | string  | Project description                                                       |
| `view_style`   | string  | 'list' or 'board'                                                         |
| `is_favorite`  | boolean | Favorite status                                                           |
| `parent_id`    | string  | Parent project ID (for sub-projects)                                      |
| `archived`     | boolean | true to archive, false to unarchive                                       |

**Examples:**

```json
{"action": "create", "name": "Work Tasks", "color": "blue", "view_style": "board"}
{"action": "archive", "project_name": "Old Project", "archived": true}
{"action": "collaborators", "project_id": "123"}
```

---

### todoist_section

Manage Todoist sections within projects.

**Actions:**

| Action      | Description                       | Required Parameters                          |
| ----------- | --------------------------------- | -------------------------------------------- |
| `create`    | Create a new section              | `project_id`, `name`                         |
| `get`       | List sections                     | None (all) or `project_id`                   |
| `update`    | Rename a section                  | `section_id` or `section_name`, `name`       |
| `delete`    | Delete a section and its tasks    | `section_id` or `section_name`               |
| `move`      | Move section to another project   | `section_id` or `section_name`, `project_id` |
| `reorder`   | Reorder sections within a project | `project_id`, `sections` array               |
| `archive`   | Archive a section                 | `section_id` or `section_name`               |
| `unarchive` | Restore an archived section       | `section_id` or `section_name`               |

**Examples:**

```json
{"action": "create", "project_id": "123", "name": "In Progress"}
{"action": "reorder", "project_id": "123", "sections": [
  {"id": "1", "section_order": 1}, {"id": "2", "section_order": 2}
]}
```

---

### todoist_label

Manage Todoist labels for task organization.

**Actions:**

| Action   | Description                | Required Parameters        |
| -------- | -------------------------- | -------------------------- |
| `create` | Create a new label         | `name`                     |
| `get`    | List all labels            | None                       |
| `update` | Update a label             | `label_id` or `label_name` |
| `delete` | Delete a label             | `label_id` or `label_name` |
| `stats`  | Get label usage statistics | None                       |

**Examples:**

```json
{"action": "create", "name": "urgent", "color": "red"}
{"action": "stats"}
```

---

### todoist_comment

Manage comments on Todoist tasks and projects.

**Actions:**

| Action   | Description            | Required Parameters                  |
| -------- | ---------------------- | ------------------------------------ |
| `create` | Add a comment          | `task_id` or `project_id`, `content` |
| `get`    | Get comments           | `task_id` or `project_id`            |
| `update` | Update comment content | `comment_id`, `content`              |
| `delete` | Delete a comment       | `comment_id`                         |

**Examples:**

```json
{"action": "create", "task_id": "123", "content": "Great progress!"}
{"action": "get", "task_id": "123"}
```

---

### todoist_reminder

Manage task reminders in Todoist (requires Pro/Business plan).

**Actions:**

| Action   | Description            | Required Parameters     |
| -------- | ---------------------- | ----------------------- |
| `create` | Create a reminder      | `task_id`, `type`       |
| `get`    | List reminders         | None (all) or `task_id` |
| `update` | Update reminder timing | `reminder_id`           |
| `delete` | Delete a reminder      | `reminder_id`           |

**Parameters:**

| Parameter       | Type   | Description                            |
| --------------- | ------ | -------------------------------------- |
| `type`          | string | 'relative', 'absolute', or 'location'  |
| `minute_offset` | number | Minutes before due time (for relative) |
| `due_date`      | string | ISO datetime (for absolute)            |

**Examples:**

```json
{"action": "create", "task_id": "123", "type": "relative", "minute_offset": 30}
{"action": "create", "task_id": "123", "type": "absolute", "due_date": "2024-12-25T09:00:00Z"}
```

---

### todoist_filter

Manage custom filters in Todoist (requires Pro/Business plan).

**Actions:**

| Action   | Description            | Required Parameters          |
| -------- | ---------------------- | ---------------------------- |
| `create` | Create a custom filter | `name`, `query`              |
| `get`    | List all filters       | None                         |
| `update` | Update a filter        | `filter_id` or `filter_name` |
| `delete` | Delete a filter        | `filter_id` or `filter_name` |

**Examples:**

```json
{"action": "create", "name": "Urgent Today", "query": "today & p1"}
{"action": "update", "filter_id": "123", "query": "p1 | p2"}
```

---

### todoist_collaboration

Manage Todoist collaboration, invitations, and notifications.

**Actions:**

| Action          | Description                     | Required Parameters       |
| --------------- | ------------------------------- | ------------------------- |
| `workspaces`    | List workspaces (Business)      | None                      |
| `invitations`   | List pending invitations        | None                      |
| `invite`        | Invite user to a project        | `project_id`, `email`     |
| `accept`        | Accept an invitation            | `invitation_id`, `secret` |
| `reject`        | Reject an invitation            | `invitation_id`, `secret` |
| `delete_invite` | Delete/revoke a sent invitation | `invitation_id`           |
| `notifications` | Get live notifications          | None                      |
| `mark_read`     | Mark notification as read       | `notification_id`         |
| `mark_all_read` | Mark all notifications as read  | None                      |

**Examples:**

```json
{"action": "invite", "project_id": "123", "email": "user@example.com"}
{"action": "notifications", "limit": 10}
```

---

### todoist_user

Get Todoist user information and productivity stats.

**Actions:**

| Action     | Description                                  |
| ---------- | -------------------------------------------- |
| `info`     | Get user profile (name, email, timezone)     |
| `stats`    | Get productivity statistics (karma, streaks) |
| `settings` | Get user settings (theme, date format)       |

**Examples:**

```json
{"action": "info"}
{"action": "stats"}
```

---

### todoist_utility

Utility operations for testing and duplicate detection.

**Actions:**

| Action             | Description           | Key Parameters                       |
| ------------------ | --------------------- | ------------------------------------ |
| `test_connection`  | Validate API token    | None                                 |
| `test_features`    | Run feature tests     | `mode`: 'basic' or 'enhanced'        |
| `test_performance` | Benchmark API         | `iterations`                         |
| `find_duplicates`  | Find similar tasks    | `threshold` (0-100%)                 |
| `merge_duplicates` | Merge duplicate tasks | `keep_task_id`, `duplicate_task_ids` |

**Examples:**

```json
{"action": "test_connection"}
{"action": "find_duplicates", "threshold": 80, "project_id": "123"}
{"action": "merge_duplicates", "keep_task_id": "123", "duplicate_task_ids": ["456", "789"], "merge_action": "complete"}
```

---

## Advanced Tools

### todoist_task_ops

Advanced task operations via Sync API.

**Actions:**

| Action         | Description                         | Required Parameters      |
| -------------- | ----------------------------------- | ------------------------ |
| `move`         | Move task to project/section/parent | `task_id`, destination   |
| `reorder`      | Set task position                   | `task_id`, `child_order` |
| `bulk_reorder` | Reorder multiple tasks              | `items` array            |
| `close`        | Close task (for recurring)          | `task_id`                |
| `day_order`    | Set position in Today view          | `task_id`, `day_order`   |

**Examples:**

```json
{"action": "move", "task_id": "123", "project_id": "456"}
{"action": "bulk_reorder", "items": [{"id": "123", "child_order": 1}, {"id": "456", "child_order": 2}]}
```

---

### todoist_project_ops

Advanced project operations.

**Actions:**

| Action           | Description                 | Required Parameters       |
| ---------------- | --------------------------- | ------------------------- |
| `reorder`        | Reorder projects in sidebar | `projects` array          |
| `move_to_parent` | Move project under another  | `project_id`, `parent_id` |
| `get_archived`   | List archived projects      | None                      |

**Examples:**

```json
{"action": "reorder", "projects": [{"id": "123", "child_order": 0}, {"id": "456", "child_order": 1}]}
{"action": "move_to_parent", "project_id": "123", "parent_id": "456"}
```

---

### todoist_completed

Get completed tasks history.

**Actions:**

| Action | Description                           |
| ------ | ------------------------------------- |
| `get`  | Retrieve completed tasks with filters |

**Parameters:**

| Parameter    | Type   | Description                       |
| ------------ | ------ | --------------------------------- |
| `project_id` | string | Filter to specific project        |
| `since`      | string | Start date (YYYY-MM-DD)           |
| `until`      | string | End date (YYYY-MM-DD)             |
| `limit`      | number | Max tasks to return (default: 30) |

**Examples:**

```json
{"action": "get", "project_id": "123", "limit": 50}
{"action": "get", "since": "2024-01-01", "until": "2024-01-31"}
```

---

### todoist_activity

Get activity logs and audit trails (requires Pro/Business).

**Actions:**

| Action       | Description                | Key Parameters              |
| ------------ | -------------------------- | --------------------------- |
| `get`        | Get activity entries       | `object_type`, `event_type` |
| `by_project` | Activity for a project     | `project_id`                |
| `by_date`    | Activity within date range | `since`, `until`            |

**Examples:**

```json
{"action": "get", "object_type": "item", "event_type": "completed"}
{"action": "by_project", "project_id": "123", "limit": 20}
```

---

### todoist_backup

Manage Todoist backups (requires Pro/Business).

**Actions:**

| Action     | Description                   | Required Parameters |
| ---------- | ----------------------------- | ------------------- |
| `list`     | Get available backup versions | None                |
| `download` | Download a specific backup    | `version`           |

**Examples:**

```json
{"action": "list"}
{"action": "download", "version": "2024-01-15_12-00"}
```

---

### todoist_notes

Manage project notes (different from task comments).

**Actions:**

| Action   | Description             | Required Parameters     |
| -------- | ----------------------- | ----------------------- |
| `create` | Create a project note   | `project_id`, `content` |
| `get`    | Get notes for a project | `project_id`            |
| `update` | Update note content     | `note_id`, `content`    |
| `delete` | Delete a note           | `note_id`               |

**Examples:**

```json
{"action": "create", "project_id": "123", "content": "Project kickoff notes..."}
{"action": "get", "project_id": "123"}
```

---

### todoist_shared_labels

Manage shared labels in Todoist Business workspaces.

**Actions:**

| Action   | Description            | Required Parameters |
| -------- | ---------------------- | ------------------- |
| `get`    | List all shared labels | None                |
| `rename` | Rename a shared label  | `name`, `new_name`  |
| `remove` | Remove a shared label  | `name`              |

**Examples:**

```json
{"action": "get"}
{"action": "rename", "name": "old-label", "new_name": "new-label"}
```
