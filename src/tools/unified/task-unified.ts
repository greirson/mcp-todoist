// Unified task management tools combining related operations into single tools
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified task tool combining: create, get, update, delete, complete, reopen, quick_add
 */
export const todoistTaskTool: Tool = {
  name: "todoist_task",
  description: `Manage Todoist tasks - create, read, update, delete, complete, reopen, or quick add using natural language.

Actions:
- create: Create a new task with full attribute support
  Example: {action: "create", content: "Buy groceries", due_string: "tomorrow", priority: 1}
- get: Retrieve tasks with optional filters (by project, label, priority, due date, or Todoist filter syntax)
  Example: {action: "get", filter: "today", priority: 1}
- update: Update an existing task by ID or name search
  Example: {action: "update", task_id: "123", content: "Updated title", priority: 2}
- delete: Delete a task by ID or name search
  Example: {action: "delete", task_name: "old task"}
- complete: Mark a task as complete by ID or name search
  Example: {action: "complete", task_id: "123"}
- reopen: Reopen a previously completed task by ID or name search
  Example: {action: "reopen", task_id: "123"}
- quick_add: Create a task using natural language parsing (like Todoist app)
  Example: {action: "quick_add", text: "Meeting tomorrow at 2pm #Work @urgent p1 {deadline Friday}"}

Task identification: Use task_id for direct lookup (preferred) or task_name for case-insensitive partial matching.
Due dates vs deadlines: due_string/due_date sets when task appears in "Today", deadline_date sets actual deadline.`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "create",
          "get",
          "update",
          "delete",
          "complete",
          "reopen",
          "quick_add",
        ],
        description: "The operation to perform",
      },
      // Task identification (for update/delete/complete/reopen/get single task)
      task_id: {
        type: "string",
        description:
          "Task ID for direct lookup (takes precedence over task_name). Used in: get (single), update, delete, complete, reopen",
      },
      task_name: {
        type: "string",
        description:
          "Partial task name for case-insensitive search (alternative to task_id). Used in: get, update, delete, complete, reopen",
      },
      // Task content (for create/update)
      content: {
        type: "string",
        description:
          "Task title/content. Required for create, optional for update",
      },
      description: {
        type: "string",
        description: "Detailed task description (optional)",
      },
      // Due dates and deadlines
      due_string: {
        type: "string",
        description:
          "Due date in natural language like 'tomorrow', 'next Monday', 'Jan 23' (optional)",
      },
      due_date: {
        type: "string",
        description: "Due date in YYYY-MM-DD format (optional)",
      },
      deadline_date: {
        type: "string",
        description:
          "Actual deadline in YYYY-MM-DD format - when task must be completed (optional)",
      },
      // Priority and organization
      priority: {
        type: "number",
        description: "Priority: 1=P1 (urgent), 2=P2, 3=P3, 4=P4 (normal)",
        enum: [1, 2, 3, 4],
      },
      project_id: {
        type: "string",
        description: "Project ID to assign task to (optional)",
      },
      section_id: {
        type: "string",
        description: "Section ID within project (optional)",
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to assign (optional)",
      },
      // Assignment (for shared projects)
      assignee_id: {
        type: "string",
        description:
          "User ID to assign task to (only works in shared projects)",
      },
      // Duration for time blocking - REQUIRES due_string with a time
      duration: {
        type: "number",
        description:
          "Task duration amount for time blocking (e.g., 30 for 30 minutes, 2 for 2 days). REQUIRES due_string with a time (e.g., 'tomorrow at 2pm')",
      },
      duration_unit: {
        type: "string",
        enum: ["minute", "day"],
        description:
          "Duration unit: 'minute' (default) or 'day'. Duration requires due_string with a time",
      },
      // Task ordering
      child_order: {
        type: "number",
        description:
          "Position among siblings (for ordering within parent or project)",
      },
      day_order: {
        type: "number",
        description: "Position in Today view (only for tasks due today)",
      },
      is_collapsed: {
        type: "boolean",
        description: "Whether to collapse/hide subtasks in UI",
      },
      // Filter parameters (for get action)
      filter: {
        type: "string",
        description:
          "Todoist filter query like 'today', 'overdue', 'p1', '#ProjectName' (for get action)",
      },
      label_id: {
        type: "string",
        description: "Filter by label ID (for get action)",
      },
      due_before: {
        type: "string",
        description:
          "Filter tasks due before this date YYYY-MM-DD (for get action)",
      },
      due_after: {
        type: "string",
        description:
          "Filter tasks due after this date YYYY-MM-DD (for get action)",
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (for get action)",
        minimum: 1,
      },
      lang: {
        type: "string",
        description:
          "Language for filter parsing, defaults to 'en' (for get action)",
      },
      // Quick add parameters
      text: {
        type: "string",
        description:
          "Natural language text for quick_add. Supports: dates (tomorrow), #project, @label, +assignee, p1-p4, {deadline}, //description",
      },
      note: {
        type: "string",
        description: "Additional note for task (for quick_add action)",
      },
      reminder: {
        type: "string",
        description:
          "Reminder in free form text like 'tomorrow at 9am' (for quick_add action)",
      },
      auto_reminder: {
        type: "boolean",
        description:
          "Add default reminder if task has due date with time (for quick_add action, default: false)",
      },
    },
    required: ["action"],
  },
};

/**
 * Unified bulk task tool combining: bulk_create, bulk_update, bulk_delete, bulk_complete
 */
export const todoistTaskBulkTool: Tool = {
  name: "todoist_task_bulk",
  description: `Perform bulk operations on Todoist tasks - create, update, delete, or complete multiple tasks at once.

Actions:
- bulk_create: Create multiple tasks at once
  Example: {action: "bulk_create", tasks: [{content: "Task 1", priority: 1}, {content: "Task 2", due_string: "tomorrow"}]}
- bulk_update: Update multiple tasks matching search criteria
  Example: {action: "bulk_update", search_criteria: {project_id: "123", priority: 4}, updates: {priority: 2}}
- bulk_delete: Delete multiple tasks matching search criteria (CAUTION: permanent)
  Example: {action: "bulk_delete", project_id: "123", content_contains: "old"}
- bulk_complete: Complete multiple tasks matching search criteria
  Example: {action: "bulk_complete", due_before: "2024-01-01", project_id: "123"}

Search criteria: Use project_id, priority, due_before, due_after, and/or content_contains to filter tasks.
Safety: Empty content_contains matches NO tasks (not all tasks). At least one valid criterion required.`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["bulk_create", "bulk_update", "bulk_delete", "bulk_complete"],
        description: "The bulk operation to perform",
      },
      // For bulk_create: array of task objects
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Task title/content (required)",
            },
            description: {
              type: "string",
              description: "Task description (optional)",
            },
            due_string: {
              type: "string",
              description: "Due date in natural language (optional)",
            },
            due_date: {
              type: "string",
              description: "Due date in YYYY-MM-DD format (optional)",
            },
            deadline_date: {
              type: "string",
              description: "Deadline in YYYY-MM-DD format (optional)",
            },
            priority: {
              type: "number",
              description: "Priority 1-4 (optional)",
              enum: [1, 2, 3, 4],
            },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "Label names (optional)",
            },
            project_id: {
              type: "string",
              description: "Project ID (optional)",
            },
            section_id: {
              type: "string",
              description: "Section ID (optional)",
            },
            duration: {
              type: "number",
              description:
                "Duration amount for time blocking. REQUIRES due_string with a time (optional)",
            },
            duration_unit: {
              type: "string",
              enum: ["minute", "day"],
              description:
                "Duration unit. Duration requires due_string with a time (optional)",
            },
            assignee_id: {
              type: "string",
              description:
                "User ID for assignment in shared projects (optional)",
            },
          },
          required: ["content"],
        },
        description: "Array of task objects to create (for bulk_create action)",
        minItems: 1,
      },
      // Search criteria (for bulk_update/bulk_delete/bulk_complete)
      search_criteria: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
            description: "Filter by project ID",
          },
          priority: {
            type: "number",
            description: "Filter by priority 1-4",
            enum: [1, 2, 3, 4],
          },
          due_before: {
            type: "string",
            description: "Filter tasks due before date (YYYY-MM-DD)",
          },
          due_after: {
            type: "string",
            description: "Filter tasks due after date (YYYY-MM-DD)",
          },
          content_contains: {
            type: "string",
            description: "Filter tasks containing text (case-insensitive)",
          },
        },
        description: "Criteria to find tasks for bulk_update action",
      },
      // Flat search criteria (for bulk_delete/bulk_complete)
      project_id: {
        type: "string",
        description: "Filter by project ID (for bulk_delete/bulk_complete)",
      },
      priority: {
        type: "number",
        description: "Filter by priority 1-4 (for bulk_delete/bulk_complete)",
        enum: [1, 2, 3, 4],
      },
      due_before: {
        type: "string",
        description:
          "Filter tasks due before date YYYY-MM-DD (for bulk_delete/bulk_complete)",
      },
      due_after: {
        type: "string",
        description:
          "Filter tasks due after date YYYY-MM-DD (for bulk_delete/bulk_complete)",
      },
      content_contains: {
        type: "string",
        description:
          "Filter tasks containing text (for bulk_delete/bulk_complete)",
      },
      // Updates to apply (for bulk_update)
      updates: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "New content/title for matching tasks",
          },
          description: {
            type: "string",
            description: "New description for matching tasks",
          },
          due_string: {
            type: "string",
            description: "New due date in natural language",
          },
          priority: {
            type: "number",
            description: "New priority 1-4",
            enum: [1, 2, 3, 4],
          },
          labels: {
            type: "array",
            items: { type: "string" },
            description: "New label names",
          },
          project_id: {
            type: "string",
            description: "Move to project ID or name",
          },
          section_id: {
            type: "string",
            description: "Move to section ID",
          },
          duration: {
            type: "number",
            description: "New duration amount. REQUIRES due_string with a time",
          },
          duration_unit: {
            type: "string",
            enum: ["minute", "day"],
            description:
              "New duration unit. Duration requires due_string with a time",
          },
        },
        description:
          "Updates to apply to matching tasks (for bulk_update action)",
      },
    },
    required: ["action"],
  },
};

// Export all unified task tools
export const UNIFIED_TASK_TOOLS = [todoistTaskTool, todoistTaskBulkTool];
