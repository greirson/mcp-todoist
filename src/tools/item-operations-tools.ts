import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const MOVE_TASK_TOOL: Tool = {
  name: "todoist_task_move",
  description:
    "Move a task to a different project, section, or under a parent task. Uses Todoist Sync API for reliable movement operations.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to move",
      },
      task_name: {
        type: "string",
        description:
          "The name of the task to move (partial match, case-insensitive)",
      },
      project_id: {
        type: "string",
        description: "The destination project ID",
      },
      section_id: {
        type: "string",
        description: "The destination section ID",
      },
      parent_id: {
        type: "string",
        description: "The parent task ID (makes this task a subtask)",
      },
    },
    required: [],
  },
};

export const REORDER_TASK_TOOL: Tool = {
  name: "todoist_task_reorder",
  description:
    "Set the order of a task within its project/section. Lower numbers appear first.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to reorder",
      },
      task_name: {
        type: "string",
        description:
          "The name of the task to reorder (partial match, case-insensitive)",
      },
      child_order: {
        type: "number",
        description: "The new position/order for the task (0-based index)",
        minimum: 0,
      },
    },
    required: ["child_order"],
  },
};

export const BULK_REORDER_TASKS_TOOL: Tool = {
  name: "todoist_tasks_reorder_bulk",
  description:
    "Reorder multiple tasks at once by specifying their new positions. Efficient for reorganizing task lists.",
  inputSchema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Array of task IDs with their new order positions",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The task ID",
            },
            child_order: {
              type: "number",
              description: "The new position for the task",
              minimum: 0,
            },
          },
          required: ["id", "child_order"],
        },
      },
    },
    required: ["items"],
  },
};

export const CLOSE_TASK_TOOL: Tool = {
  name: "todoist_task_close",
  description:
    "Close a task. For recurring tasks, this completes the current occurrence and schedules the next one. For non-recurring tasks, this is equivalent to completing the task.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to close",
      },
      task_name: {
        type: "string",
        description:
          "The name of the task to close (partial match, case-insensitive)",
      },
    },
    required: [],
  },
};

export const UPDATE_DAY_ORDER_TOOL: Tool = {
  name: "todoist_task_day_order_update",
  description:
    "Update the day order of tasks in the Today view. Controls the order tasks appear when viewing today's tasks.",
  inputSchema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Array of task IDs with their new day order positions",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The task ID",
            },
            day_order: {
              type: "number",
              description: "The new day order position for the task",
            },
          },
          required: ["id", "day_order"],
        },
      },
    },
    required: ["items"],
  },
};

export const ITEM_OPERATIONS_TOOLS = [
  MOVE_TASK_TOOL,
  REORDER_TASK_TOOL,
  BULK_REORDER_TASKS_TOOL,
  CLOSE_TASK_TOOL,
  UPDATE_DAY_ORDER_TOOL,
];
