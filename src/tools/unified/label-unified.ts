import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified tool for managing Todoist labels.
 * Combines: create, get, update, delete, stats operations.
 */
export const todoistLabelTool: Tool = {
  name: "todoist_label",
  description: `Manage Todoist labels for task organization.

Actions:
- create: Create a new label
  Example: {action: "create", name: "urgent", color: "red"}
- get: List all labels
  Example: {action: "get"}
- update: Update a label
  Example: {action: "update", label_id: "123", name: "critical", color: "orange"}
- delete: Delete a label
  Example: {action: "delete", label_name: "old-label"}
- stats: Get label usage statistics
  Example: {action: "stats"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "get", "update", "delete", "stats"],
        description: "The action to perform on labels",
      },
      label_id: {
        type: "string",
        description: "Label ID (for update operation)",
      },
      label_name: {
        type: "string",
        description:
          "Label name (for delete operation or as alternative to label_id for update)",
      },
      name: {
        type: "string",
        description: "Label name (for create) or new name (for update)",
      },
      color: {
        type: "string",
        description:
          "Label color (e.g., 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'grey')",
      },
      order: {
        type: "number",
        description: "Label order in the list",
      },
      is_favorite: {
        type: "boolean",
        description: "Whether to mark the label as a favorite",
      },
    },
    required: ["action"],
  },
};

/**
 * Unified tool for managing shared labels in Todoist Business workspaces.
 * Combines: get, rename, remove operations.
 * Note: Requires Todoist Business plan.
 */
export const todoistSharedLabelsTool: Tool = {
  name: "todoist_shared_labels",
  description: `Manage shared labels in Todoist Business workspaces.

Actions:
- get: List all shared labels
  Example: {action: "get"}
- rename: Rename a shared label across workspace
  Example: {action: "rename", name: "old-label", new_name: "new-label"}
- remove: Remove a shared label from all items
  Example: {action: "remove", name: "deprecated-label"}

Note: Requires Todoist Business plan.`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["get", "rename", "remove"],
        description: "The action to perform on shared labels",
      },
      name: {
        type: "string",
        description: "Shared label name (for rename/remove operations)",
      },
      new_name: {
        type: "string",
        description: "New name for the shared label (for rename operation)",
      },
    },
    required: ["action"],
  },
};
