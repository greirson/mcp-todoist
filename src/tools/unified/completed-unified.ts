// Unified completed tasks tools combining related operations into single tool
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified completed tasks tool for retrieving completed task history
 */
export const todoistCompletedTool: Tool = {
  name: "todoist_completed",
  description: `Get completed tasks history from Todoist.

Actions:
- get: Retrieve completed tasks with optional filters
  Example: {action: "get"}
  Example: {action: "get", project_id: "123", limit: 50}
  Example: {action: "get", since: "2024-01-01", until: "2024-01-31"}

Completed tasks are archived by Todoist and can be retrieved for reporting and analytics.
Requires Todoist Pro/Business plan for full completed tasks history access.`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["get"],
        description: "The completed tasks operation to perform",
      },
      // Filter parameters
      project_id: {
        type: "string",
        description: "Filter completed tasks to a specific project ID",
      },
      // Date range parameters
      since: {
        type: "string",
        description:
          "Start date for completed tasks range in YYYY-MM-DD or ISO format",
      },
      until: {
        type: "string",
        description:
          "End date for completed tasks range in YYYY-MM-DD or ISO format",
      },
      // Pagination
      limit: {
        type: "number",
        description: "Maximum number of completed tasks to return. Default: 30",
        minimum: 1,
        maximum: 200,
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

// Export all unified completed tools
export const UNIFIED_COMPLETED_TOOLS = [todoistCompletedTool];
