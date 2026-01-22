// Unified activity log tools combining related operations into single tool
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified activity tool combining: get, by_project, by_date
 */
export const todoistActivityTool: Tool = {
  name: "todoist_activity",
  description: `Get Todoist activity logs and audit trails.

Actions:
- get: Get activity log entries with optional filters
  Example: {action: "get", limit: 50}
  Example: {action: "get", object_type: "item", event_type: "completed"}
- by_project: Get activity for a specific project
  Example: {action: "by_project", project_id: "123", limit: 20}
- by_date: Get activity within a date range
  Example: {action: "by_date", since: "2024-01-01", until: "2024-01-31"}

Activity logs track all changes including task creation, completion, updates, deletions, and more.
Requires Todoist Pro/Business plan for full activity log access.`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["get", "by_project", "by_date"],
        description: "The activity retrieval method",
      },
      // Filter parameters
      object_type: {
        type: "string",
        enum: ["item", "note", "project", "section", "label"],
        description:
          "Filter by object type: item (task), note, project, section, or label",
      },
      event_type: {
        type: "string",
        enum: ["added", "updated", "deleted", "completed", "uncompleted"],
        description:
          "Filter by event type: added, updated, deleted, completed, uncompleted",
      },
      project_id: {
        type: "string",
        description:
          "Filter to specific project ID. Required for by_project action.",
      },
      // Date range parameters
      since: {
        type: "string",
        description:
          "Start date for activity range in YYYY-MM-DD or ISO format. For by_date action.",
      },
      until: {
        type: "string",
        description:
          "End date for activity range in YYYY-MM-DD or ISO format. For by_date action.",
      },
      // Pagination
      limit: {
        type: "number",
        description:
          "Maximum number of activity entries to return. Default: 30",
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: "number",
        description: "Number of entries to skip for pagination. Default: 0",
        minimum: 0,
      },
    },
    required: ["action"],
  },
};

// Export all unified activity tools
export const UNIFIED_ACTIVITY_TOOLS = [todoistActivityTool];
