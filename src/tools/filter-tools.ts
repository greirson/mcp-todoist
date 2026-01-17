// Filter management tools (Sync API)
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_FILTERS_TOOL: Tool = {
  name: "todoist_filter_get",
  description:
    "Get all custom filters in Todoist. Filters are saved searches that help you organize and view tasks based on specific criteria. Note: Requires Todoist Pro or Business plan.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export const CREATE_FILTER_TOOL: Tool = {
  name: "todoist_filter_create",
  description:
    "Create a new custom filter in Todoist. Filters use Todoist's query syntax (e.g., 'p1', 'today', '@label', '#project'). Note: Requires Todoist Pro or Business plan.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the filter to create",
      },
      query: {
        type: "string",
        description:
          "Filter query using Todoist syntax. Examples: 'p1' for priority 1, 'today' for tasks due today, '@work' for tasks with work label, '#Project' for tasks in a project, 'p1 & today' for combined filters",
      },
      color: {
        type: "string",
        description:
          "Color of the filter icon (optional) - can be a Todoist color name like 'red', 'blue', 'green', etc.",
      },
      item_order: {
        type: "number",
        description:
          "Order position of the filter in the filter list (optional, lower values appear first)",
      },
      is_favorite: {
        type: "boolean",
        description:
          "Whether the filter should be marked as favorite (optional, favorites appear in sidebar)",
      },
    },
    required: ["name", "query"],
  },
};

export const UPDATE_FILTER_TOOL: Tool = {
  name: "todoist_filter_update",
  description:
    "Update an existing filter in Todoist. Can update name, query, color, order, or favorite status. Note: Frozen filters (from cancelled subscriptions) cannot be modified.",
  inputSchema: {
    type: "object",
    properties: {
      filter_id: {
        type: "string",
        description: "ID of the filter to update (provide this OR filter_name)",
      },
      filter_name: {
        type: "string",
        description: "Name of the filter to update (provide this OR filter_id)",
      },
      name: {
        type: "string",
        description: "New name for the filter (optional)",
      },
      query: {
        type: "string",
        description: "New query for the filter (optional)",
      },
      color: {
        type: "string",
        description: "New color for the filter (optional)",
      },
      item_order: {
        type: "number",
        description: "New order position for the filter (optional)",
      },
      is_favorite: {
        type: "boolean",
        description:
          "Whether the filter should be marked as favorite (optional)",
      },
    },
  },
};

export const DELETE_FILTER_TOOL: Tool = {
  name: "todoist_filter_delete",
  description:
    "Delete a filter from Todoist. This action cannot be undone. Note: Frozen filters (from cancelled subscriptions) cannot be deleted.",
  inputSchema: {
    type: "object",
    properties: {
      filter_id: {
        type: "string",
        description: "ID of the filter to delete (provide this OR filter_name)",
      },
      filter_name: {
        type: "string",
        description: "Name of the filter to delete (provide this OR filter_id)",
      },
    },
  },
};

export const FILTER_TOOLS = [
  GET_FILTERS_TOOL,
  CREATE_FILTER_TOOL,
  UPDATE_FILTER_TOOL,
  DELETE_FILTER_TOOL,
];
