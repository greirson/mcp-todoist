import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_SHARED_LABELS_TOOL: Tool = {
  name: "todoist_shared_labels_get",
  description:
    "Get all shared labels in the workspace. Shared labels are available in Todoist Business accounts for team collaboration.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const RENAME_SHARED_LABEL_TOOL: Tool = {
  name: "todoist_shared_label_rename",
  description:
    "Rename a shared label across all items in the workspace. Updates the label name for all team members. Requires Todoist Business account.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The current name of the shared label",
      },
      new_name: {
        type: "string",
        description: "The new name for the shared label",
      },
    },
    required: ["name", "new_name"],
  },
};

export const REMOVE_SHARED_LABEL_TOOL: Tool = {
  name: "todoist_shared_label_remove",
  description:
    "Remove a shared label from all items in the workspace. This removes the label from all tasks but does not delete the tasks. Requires Todoist Business account.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the shared label to remove",
      },
    },
    required: ["name"],
  },
};

export const SHARED_LABEL_TOOLS = [
  GET_SHARED_LABELS_TOOL,
  RENAME_SHARED_LABEL_TOOL,
  REMOVE_SHARED_LABEL_TOOL,
];
