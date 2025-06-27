// Task management tools for basic CRUD operations
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CREATE_TASK_TOOL: Tool = {
  name: "todoist_task_create",
  description:
    "Create a new task in Todoist with optional description, due date, priority, labels, deadline, project, and section",
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
        description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
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
    },
    required: ["content"],
  },
};

export const GET_TASKS_TOOL: Tool = {
  name: "todoist_task_get",
  description:
    "Retrieve tasks from Todoist with optional filtering or get a specific task by ID",
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
        description: "Filter tasks by priority level 1-4 (optional)",
        enum: [1, 2, 3, 4],
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (optional)",
        minimum: 1,
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
    },
    required: [],
  },
};

export const UPDATE_TASK_TOOL: Tool = {
  name: "todoist_task_update",
  description:
    "Update an existing task found by ID or partial name search. Supports updating content, description, due date, priority, labels, deadline, project, and section",
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

export const BULK_CREATE_TASKS_TOOL: Tool = {
  name: "todoist_tasks_bulk_create",
  description:
    "Create multiple tasks at once for improved efficiency. Each task can have full attributes like individual task creation.",
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
                "Task priority from 1 (normal) to 4 (urgent) (optional)",
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
    "Update multiple tasks at once based on search criteria. Very efficient for updating many tasks with the same changes.",
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
            description: "Filter tasks by priority level 1-4 (optional)",
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
              "New priority from 1 (normal) to 4 (urgent) (optional)",
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
        description: "Delete tasks with this priority level 1-4 (optional)",
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
        description: "Complete tasks with this priority level 1-4 (optional)",
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

export const TASK_TOOLS = [
  CREATE_TASK_TOOL,
  GET_TASKS_TOOL,
  UPDATE_TASK_TOOL,
  DELETE_TASK_TOOL,
  COMPLETE_TASK_TOOL,
  BULK_CREATE_TASKS_TOOL,
  BULK_UPDATE_TASKS_TOOL,
  BULK_DELETE_TASKS_TOOL,
  BULK_COMPLETE_TASKS_TOOL,
];
