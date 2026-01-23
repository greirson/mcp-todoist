import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const todoistFilterTool: Tool = {
  name: "todoist_filter",
  description: `Manage custom filters in Todoist (requires Pro/Business plan).

Actions:
- create: Create a custom filter
  Example: {action: "create", name: "Urgent Today", query: "today & p1"}
- get: List all filters
  Example: {action: "get"}
- update: Update a filter
  Example: {action: "update", filter_id: "123", name: "Priority Tasks", query: "p1 | p2"}
- delete: Delete a filter
  Example: {action: "delete", filter_name: "Old Filter"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["create", "get", "update", "delete"] },
      filter_id: {
        type: "string",
        description: "Filter ID (for update/delete)",
      },
      filter_name: { type: "string", description: "Filter name (alternative)" },
      name: { type: "string", description: "Filter name (for create/update)" },
      query: { type: "string", description: "Todoist filter query" },
      color: { type: "string", description: "Filter color" },
      is_favorite: { type: "boolean", description: "Favorite status" },
    },
    required: ["action"],
  },
};
