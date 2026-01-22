// Unified task operations tools combining move, reorder, and close operations
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified task operations tool combining: move, reorder, bulk_reorder, close, day_order
 */
export const todoistTaskOpsTool: Tool = {
  name: "todoist_task_ops",
  description: `Advanced task operations for moving, reordering, and organizing tasks via Sync API.

Actions:
- move: Move a task to a different project, section, or parent task
  Example: {action: "move", task_id: "123", project_id: "456"}
  Example: {action: "move", task_id: "123", section_id: "789"}
  Example: {action: "move", task_id: "123", parent_id: "321"}
- reorder: Set the position of a single task within its current context
  Example: {action: "reorder", task_id: "123", child_order: 1}
- bulk_reorder: Reorder multiple tasks at once
  Example: {action: "bulk_reorder", items: [{"id": "123", "child_order": 1}, {"id": "456", "child_order": 2}]}
- close: Close a task without completing it (for recurring tasks, closes the instance)
  Example: {action: "close", task_id: "123"}
- day_order: Set task position in Today view
  Example: {action: "day_order", task_id: "123", day_order: 1}

These operations use the Todoist Sync API for advanced task manipulation not available in REST API.`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["move", "reorder", "bulk_reorder", "close", "day_order"],
        description: "The task operation to perform",
      },
      // Task identification
      task_id: {
        type: "string",
        description:
          "Task ID to operate on. Required for move, reorder, close, day_order actions.",
      },
      // Move parameters
      project_id: {
        type: "string",
        description: "Target project ID to move task to. For move action.",
      },
      section_id: {
        type: "string",
        description: "Target section ID to move task to. For move action.",
      },
      parent_id: {
        type: "string",
        description:
          "Target parent task ID to make this task a subtask of. For move action.",
      },
      // Reorder parameters
      child_order: {
        type: "number",
        description:
          "Position among siblings (0-based). For reorder action. Lower numbers appear first.",
        minimum: 0,
      },
      // Bulk reorder parameters
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Task ID to reorder",
            },
            child_order: {
              type: "number",
              description: "New position for this task",
              minimum: 0,
            },
          },
          required: ["id", "child_order"],
        },
        description:
          "Array of task ID and order pairs. For bulk_reorder action.",
        minItems: 1,
      },
      // Day order parameter
      day_order: {
        type: "number",
        description:
          "Position in Today view (0-based). For day_order action. Only applies to tasks due today.",
        minimum: 0,
      },
    },
    required: ["action"],
  },
};

// Export all unified task operations tools
export const UNIFIED_TASK_OPS_TOOLS = [todoistTaskOpsTool];
