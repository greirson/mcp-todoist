// Subtask management tools for hierarchical task operations
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CREATE_SUBTASK_TOOL: Tool = {
  name: "todoist_subtask_create",
  description: "Create a new subtask under a parent task in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      parent_task_id: {
        type: "string",
        description:
          "ID of the parent task (optional if parent_task_name is provided)",
      },
      parent_task_name: {
        type: "string",
        description:
          "Name/content of the parent task (optional if parent_task_id is provided)",
      },
      content: {
        type: "string",
        description: "Content of the subtask",
      },
      description: {
        type: "string",
        description: "Description of the subtask (optional)",
      },
      due_string: {
        type: "string",
        description:
          "Human-readable due date string (e.g., 'tomorrow', 'next Monday')",
      },
      priority: {
        type: "number",
        description: "Priority level 1 (highest) to 4 (lowest)",
        minimum: 1,
        maximum: 4,
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to apply to the subtask",
      },
      deadline_date: {
        type: "string",
        description: "Deadline date in YYYY-MM-DD format",
      },
    },
    required: ["content"],
    anyOf: [
      { required: ["parent_task_id"] },
      { required: ["parent_task_name"] },
    ],
  },
};

export const BULK_CREATE_SUBTASKS_TOOL: Tool = {
  name: "todoist_subtasks_bulk_create",
  description:
    "Create multiple subtasks under a parent task in a single operation",
  inputSchema: {
    type: "object",
    properties: {
      parent_task_id: {
        type: "string",
        description:
          "ID of the parent task (optional if parent_task_name is provided)",
      },
      parent_task_name: {
        type: "string",
        description:
          "Name/content of the parent task (optional if parent_task_id is provided)",
      },
      subtasks: {
        type: "array",
        description: "Array of subtasks to create",
        items: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Content of the subtask",
            },
            description: {
              type: "string",
              description: "Description of the subtask (optional)",
            },
            due_string: {
              type: "string",
              description: "Human-readable due date string",
            },
            priority: {
              type: "number",
              description: "Priority level 1 (highest) to 4 (lowest)",
              minimum: 1,
              maximum: 4,
            },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "Array of label names",
            },
            deadline_date: {
              type: "string",
              description: "Deadline date in YYYY-MM-DD format",
            },
          },
          required: ["content"],
        },
      },
    },
    required: ["subtasks"],
    anyOf: [
      { required: ["parent_task_id"] },
      { required: ["parent_task_name"] },
    ],
  },
};

export const CONVERT_TO_SUBTASK_TOOL: Tool = {
  name: "todoist_task_convert_to_subtask",
  description: "Convert an existing task to a subtask of another task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "ID of the task to convert (optional if task_name is provided)",
      },
      task_name: {
        type: "string",
        description:
          "Name/content of the task to convert (optional if task_id is provided)",
      },
      parent_task_id: {
        type: "string",
        description:
          "ID of the parent task (optional if parent_task_name is provided)",
      },
      parent_task_name: {
        type: "string",
        description:
          "Name/content of the parent task (optional if parent_task_id is provided)",
      },
    },
    anyOf: [{ required: ["task_id"] }, { required: ["task_name"] }],
  },
};

export const PROMOTE_SUBTASK_TOOL: Tool = {
  name: "todoist_subtask_promote",
  description: "Promote a subtask to a main task (remove parent relationship)",
  inputSchema: {
    type: "object",
    properties: {
      subtask_id: {
        type: "string",
        description:
          "ID of the subtask to promote (optional if subtask_name is provided)",
      },
      subtask_name: {
        type: "string",
        description:
          "Name/content of the subtask to promote (optional if subtask_id is provided)",
      },
      project_id: {
        type: "string",
        description: "ID of the project to move the task to (optional)",
      },
      section_id: {
        type: "string",
        description: "ID of the section to move the task to (optional)",
      },
    },
    anyOf: [{ required: ["subtask_id"] }, { required: ["subtask_name"] }],
  },
};

export const GET_TASK_HIERARCHY_TOOL: Tool = {
  name: "todoist_task_hierarchy_get",
  description: "Get a task with all its subtasks in a hierarchical structure",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "ID of the task to get hierarchy for (optional if task_name is provided)",
      },
      task_name: {
        type: "string",
        description:
          "Name/content of the task to get hierarchy for (optional if task_id is provided)",
      },
      include_completed: {
        type: "boolean",
        description:
          "Include completed tasks in the hierarchy (default: false)",
        default: false,
      },
    },
    anyOf: [{ required: ["task_id"] }, { required: ["task_name"] }],
  },
};

export const SUBTASK_TOOLS = [
  CREATE_SUBTASK_TOOL,
  BULK_CREATE_SUBTASKS_TOOL,
  CONVERT_TO_SUBTASK_TOOL,
  PROMOTE_SUBTASK_TOOL,
  GET_TASK_HIERARCHY_TOOL,
];
