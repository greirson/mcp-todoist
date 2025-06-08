// Label management tools
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_LABELS_TOOL: Tool = {
  name: "todoist_label_get",
  description: "Get all labels in Todoist",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export const CREATE_LABEL_TOOL: Tool = {
  name: "todoist_label_create",
  description: "Create a new label in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the label to create",
      },
      color: {
        type: "string",
        description:
          "Color of the label (optional) - can be a Todoist color name or hex code",
      },
      is_favorite: {
        type: "boolean",
        description:
          "Whether the label should be marked as favorite (optional)",
      },
      order: {
        type: "number",
        description: "Order position of the label (optional)",
      },
    },
    required: ["name"],
  },
};

export const UPDATE_LABEL_TOOL: Tool = {
  name: "todoist_label_update",
  description: "Update an existing label in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      label_id: {
        type: "string",
        description:
          "ID of the label to update (optional if label_name is provided)",
      },
      label_name: {
        type: "string",
        description:
          "Name of the label to update (optional if label_id is provided)",
      },
      name: {
        type: "string",
        description: "New name for the label (optional)",
      },
      color: {
        type: "string",
        description: "New color for the label (optional)",
      },
      order: {
        type: "number",
        description: "New order position for the label (optional)",
      },
      is_favorite: {
        type: "boolean",
        description:
          "Whether the label should be marked as favorite (optional)",
      },
    },
    anyOf: [{ required: ["label_id"] }, { required: ["label_name"] }],
  },
};

export const DELETE_LABEL_TOOL: Tool = {
  name: "todoist_label_delete",
  description: "Delete a label from Todoist",
  inputSchema: {
    type: "object",
    properties: {
      label_id: {
        type: "string",
        description:
          "ID of the label to delete (optional if label_name is provided)",
      },
      label_name: {
        type: "string",
        description:
          "Name of the label to delete (optional if label_id is provided)",
      },
    },
    anyOf: [{ required: ["label_id"] }, { required: ["label_name"] }],
  },
};

export const GET_LABEL_STATS_TOOL: Tool = {
  name: "todoist_label_stats",
  description: "Get usage statistics for all labels in Todoist",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export const LABEL_TOOLS = [
  GET_LABELS_TOOL,
  CREATE_LABEL_TOOL,
  UPDATE_LABEL_TOOL,
  DELETE_LABEL_TOOL,
  GET_LABEL_STATS_TOOL,
];
