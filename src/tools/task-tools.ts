// Task management tools for basic CRUD operations
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CREATE_TASK_TOOL: Tool = {
  name: "todoist_task_create",
  description:
    "Create a new task in Todoist with optional description, due date, priority, labels, deadline, project, section, and duration for time blocking",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content/title of the task",
      },
      description: {
        type: "string",
        description: "Detailed description of the task (optional)",
      },
      due_string: {
        type: "string",
        description:
          "Natural language due date like 'tomorrow', 'next Monday', 'Jan 23' (optional)",
      },
      priority: {
        type: "number",
        description: "Task priority from 1 (highest) to 4 (lowest) (optional)",
        enum: [1, 2, 3, 4],
      },
      labels: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of label names to assign to the task (optional)",
      },
      deadline_date: {
        type: "string",
        description:
          "Task deadline in YYYY-MM-DD format (when user mentions 'deadline') (optional)",
      },
      project_id: {
        type: "string",
        description: "Project ID to assign the task to (optional)",
      },
      section_id: {
        type: "string",
        description:
          "Section ID within the project to assign the task to (optional)",
      },
      duration: {
        type: "number",
        description:
          "Task duration amount for time blocking (e.g., 30 for 30 minutes, 2 for 2 days) (optional)",
      },
      duration_unit: {
        type: "string",
        description:
          "Duration unit: 'minute' or 'day'. Defaults to 'minute' if duration is provided (optional)",
        enum: ["minute", "day"],
      },
      child_order: {
        type: "number",
        description:
          "Position of the task among its siblings (for ordering within parent or project) (optional)",
      },
      day_order: {
        type: "number",
        description:
          "Position of the task in Today view (only works for tasks due today) (optional)",
      },
      is_collapsed: {
        type: "boolean",
        description:
          "Whether the task's subtasks should be collapsed/hidden in the UI (optional)",
      },
    },
    required: ["content"],
  },
};

export const GET_TASKS_TOOL: Tool = {
  name: "todoist_task_get",
  description:
    "Retrieve tasks from Todoist. Use 'filter' for Todoist filter syntax (e.g., 'today', 'p1') or 'task_name' for simple text search in task content",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "Get a specific task by its ID (optional, takes precedence over filtering)",
      },
      project_id: {
        type: "string",
        description: "Filter tasks by project ID (optional)",
      },
      label_id: {
        type: "string",
        description: "Filter tasks by label ID (optional)",
      },
      priority: {
        type: "number",
        description:
          "Filter tasks by priority level 1 (highest) to 4 (lowest) (optional)",
        enum: [1, 2, 3, 4],
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (optional)",
        minimum: 1,
      },
      due_before: {
        type: "string",
        description:
          "Return only tasks due strictly before this date (YYYY-MM-DD, optional)",
      },
      due_after: {
        type: "string",
        description:
          "Return only tasks due strictly after this date (YYYY-MM-DD, optional)",
      },
      filter: {
        type: "string",
        description:
          "Todoist filter string like 'today', 'overdue', 'p1' (optional)",
      },
      lang: {
        type: "string",
        description: "Language for filter parsing, defaults to 'en' (optional)",
      },
      task_name: {
        type: "string",
        description:
          "Filter tasks by name/content using partial text matching (case-insensitive, optional)",
      },
    },
    required: [],
  },
};

export const UPDATE_TASK_TOOL: Tool = {
  name: "todoist_task_update",
  description:
    "Update an existing task found by ID or partial name search. Supports updating content, description, due date, priority, labels, deadline, project, section, and duration",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "Task ID to update (optional, takes precedence over task_name)",
      },
      task_name: {
        type: "string",
        description:
          "Partial task name to search for (case-insensitive, used if task_id not provided)",
      },
      content: {
        type: "string",
        description: "New content/title for the task (optional)",
      },
      description: {
        type: "string",
        description: "New description for the task (optional)",
      },
      due_string: {
        type: "string",
        description:
          "New due date in natural language like 'tomorrow', 'next Monday' (optional)",
      },
      priority: {
        type: "number",
        description: "New priority from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4],
      },
      labels: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of label names to assign to the task (optional)",
      },
      deadline_date: {
        type: "string",
        description: "New deadline in YYYY-MM-DD format (optional)",
      },
      project_id: {
        type: "string",
        description: "Move task to this project ID (optional)",
      },
      section_id: {
        type: "string",
        description: "Move task to this section ID (optional)",
      },
      duration: {
        type: "number",
        description:
          "New task duration amount for time blocking (e.g., 30 for 30 minutes) (optional)",
      },
      duration_unit: {
        type: "string",
        description:
          "Duration unit: 'minute' or 'day'. Defaults to 'minute' if duration is provided (optional)",
        enum: ["minute", "day"],
      },
      child_order: {
        type: "number",
        description: "New position of the task among its siblings (optional)",
      },
      day_order: {
        type: "number",
        description: "New position of the task in Today view (optional)",
      },
      is_collapsed: {
        type: "boolean",
        description: "Whether to collapse/hide the task's subtasks (optional)",
      },
    },
    required: [],
  },
};

export const DELETE_TASK_TOOL: Tool = {
  name: "todoist_task_delete",
  description:
    "Delete a task found by ID or partial name search (case-insensitive)",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "Task ID to delete (optional, takes precedence over task_name)",
      },
      task_name: {
        type: "string",
        description:
          "Partial task name to search for deletion (used if task_id not provided)",
      },
    },
    required: [],
  },
};

export const COMPLETE_TASK_TOOL: Tool = {
  name: "todoist_task_complete",
  description:
    "Mark a task as complete found by ID or partial name search (case-insensitive)",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "Task ID to complete (optional, takes precedence over task_name)",
      },
      task_name: {
        type: "string",
        description:
          "Partial task name to search for completion (used if task_id not provided)",
      },
    },
    required: [],
  },
};

export const REOPEN_TASK_TOOL: Tool = {
  name: "todoist_task_reopen",
  description:
    "Reopen a previously completed task found by ID or partial name search (case-insensitive). Use this to restore a task that was marked as complete.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "Task ID to reopen (optional, takes precedence over task_name)",
      },
      task_name: {
        type: "string",
        description:
          "Partial task name to search for reopening (used if task_id not provided)",
      },
    },
    required: [],
  },
};

export const BULK_CREATE_TASKS_TOOL: Tool = {
  name: "todoist_tasks_bulk_create",
  description:
    "Create multiple tasks at once for improved efficiency. Each task can have full attributes including duration for time blocking.",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The content/title of the task",
            },
            description: {
              type: "string",
              description: "Detailed description of the task (optional)",
            },
            due_string: {
              type: "string",
              description:
                "Natural language due date like 'tomorrow', 'next Monday' (optional)",
            },
            priority: {
              type: "number",
              description:
                "Task priority from 1 (highest) to 4 (lowest) (optional)",
              enum: [1, 2, 3, 4],
            },
            labels: {
              type: "array",
              items: {
                type: "string",
              },
              description:
                "Array of label names to assign to the task (optional)",
            },
            deadline_date: {
              type: "string",
              description: "Task deadline in YYYY-MM-DD format (optional)",
            },
            project_id: {
              type: "string",
              description: "Project ID to assign the task to (optional)",
            },
            section_id: {
              type: "string",
              description: "Section ID to assign the task to (optional)",
            },
            duration: {
              type: "number",
              description:
                "Task duration amount for time blocking (e.g., 30 for 30 minutes) (optional)",
            },
            duration_unit: {
              type: "string",
              description:
                "Duration unit: 'minute' or 'day'. Defaults to 'minute' (optional)",
              enum: ["minute", "day"],
            },
          },
          required: ["content"],
        },
        description: "Array of task objects to create",
        minItems: 1,
      },
    },
    required: ["tasks"],
  },
};

export const BULK_UPDATE_TASKS_TOOL: Tool = {
  name: "todoist_tasks_bulk_update",
  description:
    "Update multiple tasks at once based on search criteria. Supports updating content, priority, due dates, labels, project, section, and duration.",
  inputSchema: {
    type: "object",
    properties: {
      search_criteria: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
            description:
              "Filter tasks by project ID (optional, does not support names)",
          },
          priority: {
            type: "number",
            description:
              "Filter tasks by priority level 1 (highest) to 4 (lowest) (optional)",
            enum: [1, 2, 3, 4],
          },
          due_before: {
            type: "string",
            description:
              "Filter tasks due before this date (YYYY-MM-DD) (optional)",
          },
          due_after: {
            type: "string",
            description:
              "Filter tasks due after this date (YYYY-MM-DD) (optional)",
          },
          content_contains: {
            type: "string",
            description:
              "Filter tasks containing this text in content (optional)",
          },
        },
        description: "Criteria to find tasks to update",
      },
      updates: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "New content/title for matching tasks (optional)",
          },
          description: {
            type: "string",
            description: "New description for matching tasks (optional)",
          },
          due_string: {
            type: "string",
            description: "New due date in natural language (optional)",
          },
          priority: {
            type: "number",
            description:
              "New priority from 1 (highest) to 4 (lowest) (optional)",
            enum: [1, 2, 3, 4],
          },
          labels: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Array of label names to assign (optional)",
          },
          project_id: {
            type: "string",
            description:
              "Move matching tasks to this project ID or name (optional)",
          },
          section_id: {
            type: "string",
            description: "Move matching tasks to this section (optional)",
          },
          duration: {
            type: "number",
            description:
              "New task duration amount for time blocking (optional)",
          },
          duration_unit: {
            type: "string",
            description:
              "Duration unit: 'minute' or 'day'. Defaults to 'minute' (optional)",
            enum: ["minute", "day"],
          },
        },
        description: "Updates to apply to matching tasks",
      },
    },
    required: ["search_criteria", "updates"],
  },
};

export const BULK_DELETE_TASKS_TOOL: Tool = {
  name: "todoist_tasks_bulk_delete",
  description:
    "Delete multiple tasks at once based on search criteria. Use with caution - this will permanently delete matching tasks.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Delete tasks from this project ID (optional)",
      },
      priority: {
        type: "number",
        description:
          "Delete tasks with this priority level 1 (highest) to 4 (lowest) (optional)",
        enum: [1, 2, 3, 4],
      },
      due_before: {
        type: "string",
        description:
          "Delete tasks due before this date (YYYY-MM-DD) (optional)",
      },
      due_after: {
        type: "string",
        description: "Delete tasks due after this date (YYYY-MM-DD) (optional)",
      },
      content_contains: {
        type: "string",
        description: "Delete tasks containing this text in content (optional)",
      },
    },
    required: [],
  },
};

export const BULK_COMPLETE_TASKS_TOOL: Tool = {
  name: "todoist_tasks_bulk_complete",
  description:
    "Complete multiple tasks at once based on search criteria. Efficiently mark many tasks as done.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Complete tasks from this project ID (optional)",
      },
      priority: {
        type: "number",
        description:
          "Complete tasks with this priority level 1 (highest) to 4 (lowest) (optional)",
        enum: [1, 2, 3, 4],
      },
      due_before: {
        type: "string",
        description:
          "Complete tasks due before this date (YYYY-MM-DD) (optional)",
      },
      due_after: {
        type: "string",
        description:
          "Complete tasks due after this date (YYYY-MM-DD) (optional)",
      },
      content_contains: {
        type: "string",
        description:
          "Complete tasks containing this text in content (optional)",
      },
    },
    required: [],
  },
};

export const GET_COMPLETED_TASKS_TOOL: Tool = {
  name: "todoist_completed_tasks_get",
  description:
    "Retrieve completed tasks from Todoist. Uses the Sync API to fetch tasks that have been marked as complete. Supports filtering by project, date range, and pagination.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Filter completed tasks by project ID (optional)",
      },
      since: {
        type: "string",
        description:
          "Return tasks completed after this date/time. ISO 8601 format, e.g., '2024-01-01T00:00:00' (optional)",
      },
      until: {
        type: "string",
        description:
          "Return tasks completed before or on this date/time. ISO 8601 format, e.g., '2024-01-31T23:59:59' (optional)",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of completed tasks to return (default: 30, max: 200)",
        minimum: 1,
        maximum: 200,
      },
      offset: {
        type: "number",
        description: "Number of tasks to skip for pagination (optional)",
        minimum: 0,
      },
      annotate_notes: {
        type: "boolean",
        description: "Include notes/comments with completed tasks (optional)",
      },
    },
    required: [],
  },
};

export const QUICK_ADD_TASK_TOOL: Tool = {
  name: "todoist_task_quick_add",
  description:
    "Create a task using natural language parsing like the Todoist app. " +
    "The text is parsed to extract due dates, projects (#), labels (@), " +
    "assignees (+), priorities (p1-p4), deadlines ({in 3 days}), and descriptions (//). " +
    'Example: "Buy groceries tomorrow #Shopping @errands p1 {deadline Friday} //Don\'t forget milk"',
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description:
          "The task text with natural language. Can include: " +
          "due dates (tomorrow, next Monday), " +
          "project name starting with # (without spaces), " +
          "label starting with @, " +
          "assignee starting with +, " +
          "priority (p1 = urgent, p2, p3, p4 = lowest), " +
          "deadline between {} (e.g., {in 3 days}), " +
          "description starting from // until end of text",
      },
      note: {
        type: "string",
        description: "Additional note to add to the task (optional)",
      },
      reminder: {
        type: "string",
        description:
          "Reminder date in free form text like 'tomorrow at 9am' (optional)",
      },
      auto_reminder: {
        type: "boolean",
        description:
          "When true, a default reminder is added if the task has a due date with time (optional, default: false)",
      },
    },
    required: ["text"],
  },
};

export const TASK_TOOLS = [
  CREATE_TASK_TOOL,
  GET_TASKS_TOOL,
  UPDATE_TASK_TOOL,
  DELETE_TASK_TOOL,
  COMPLETE_TASK_TOOL,
  REOPEN_TASK_TOOL,
  BULK_CREATE_TASKS_TOOL,
  BULK_UPDATE_TASKS_TOOL,
  BULK_DELETE_TASKS_TOOL,
  BULK_COMPLETE_TASKS_TOOL,
  GET_COMPLETED_TASKS_TOOL,
  QUICK_ADD_TASK_TOOL,
];
