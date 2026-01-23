// Unified subtask management tool for hierarchical task operations
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const todoistSubtaskTool: Tool = {
  name: "todoist_subtask",
  description: `Manage hierarchical subtasks in Todoist.

Actions:
- create: Create a subtask under a parent task
  Example: {action: "create", parent_id: "123", content: "Subtask 1"}
- bulk_create: Create multiple subtasks under a parent
  Example: {action: "bulk_create", parent_id: "123", subtasks: [{content: "Sub 1"}, {content: "Sub 2"}]}
- convert: Convert an existing task to a subtask
  Example: {action: "convert", task_id: "456", parent_id: "123"}
- promote: Promote a subtask to a main task
  Example: {action: "promote", task_id: "456"}
- hierarchy: Get task hierarchy with completion tracking
  Example: {action: "hierarchy", task_id: "123"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "bulk_create", "convert", "promote", "hierarchy"],
        description: "The subtask operation to perform",
      },
      parent_id: {
        type: "string",
        description:
          "Parent task ID (for create, bulk_create, convert actions)",
      },
      parent_name: {
        type: "string",
        description: "Parent task name - alternative to parent_id",
      },
      task_id: {
        type: "string",
        description: "Task ID (for convert, promote, hierarchy actions)",
      },
      task_name: {
        type: "string",
        description: "Task name - alternative to task_id",
      },
      content: {
        type: "string",
        description: "Subtask content (required for create action)",
      },
      description: {
        type: "string",
        description: "Subtask description",
      },
      due_string: {
        type: "string",
        description:
          "Human-readable due date (e.g., 'tomorrow', 'next Monday')",
      },
      due_date: {
        type: "string",
        description: "Due date in YYYY-MM-DD format",
      },
      priority: {
        type: "number",
        description: "Priority level: 1 (highest) to 4 (lowest)",
        minimum: 1,
        maximum: 4,
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to apply",
      },
      deadline_date: {
        type: "string",
        description: "Deadline date in YYYY-MM-DD format",
      },
      subtasks: {
        type: "array",
        description: "Array of subtask objects (for bulk_create action)",
        items: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Subtask content",
            },
            description: {
              type: "string",
              description: "Subtask description",
            },
            due_string: {
              type: "string",
              description: "Human-readable due date",
            },
            priority: {
              type: "number",
              description: "Priority level 1-4",
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
      project_id: {
        type: "string",
        description: "Project ID to move task to (for promote action)",
      },
      section_id: {
        type: "string",
        description: "Section ID to move task to (for promote action)",
      },
      include_completed: {
        type: "boolean",
        description:
          "Include completed tasks in hierarchy (for hierarchy action, default: false)",
        default: false,
      },
    },
    required: ["action"],
  },
};
