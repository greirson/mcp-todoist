import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool: Get activity log with optional filters
 */
export const GET_ACTIVITY_TOOL: Tool = {
  name: "todoist_activity_get",
  description:
    "Get Todoist activity log with optional filters. Returns events for items, notes, projects, sections, labels, filters, and reminders. Useful for auditing changes, tracking productivity, and understanding workspace history.",
  inputSchema: {
    type: "object",
    properties: {
      object_type: {
        type: "string",
        description:
          "Filter by object type: 'item' (tasks), 'note' (comments), 'project', 'section', 'label', 'filter', or 'reminder'",
        enum: [
          "item",
          "note",
          "project",
          "section",
          "label",
          "filter",
          "reminder",
        ],
      },
      object_id: {
        type: "string",
        description: "Filter by specific object ID",
      },
      event_type: {
        type: "string",
        description:
          "Filter by event type: 'added', 'updated', 'deleted', 'completed', 'uncompleted', 'archived', 'unarchived', 'shared', or 'left'",
        enum: [
          "added",
          "updated",
          "deleted",
          "completed",
          "uncompleted",
          "archived",
          "unarchived",
          "shared",
          "left",
        ],
      },
      parent_project_id: {
        type: "string",
        description: "Filter by parent project ID",
      },
      parent_item_id: {
        type: "string",
        description: "Filter by parent item/task ID (for subtask events)",
      },
      initiator_id: {
        type: "string",
        description: "Filter by user ID who initiated the action",
      },
      since: {
        type: "string",
        description:
          "Return events after this date/time (ISO 8601 format, e.g., 2024-01-01T00:00:00Z)",
      },
      until: {
        type: "string",
        description:
          "Return events before this date/time (ISO 8601 format, e.g., 2024-12-31T23:59:59Z)",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of events to return (default: 30, max: 100)",
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: "number",
        description: "Number of events to skip for pagination",
        minimum: 0,
      },
    },
    required: [],
  },
};

/**
 * Tool: Get activity log for a specific project
 */
export const GET_ACTIVITY_BY_PROJECT_TOOL: Tool = {
  name: "todoist_activity_by_project",
  description:
    "Get Todoist activity log for a specific project. Returns all events (tasks added/completed/deleted, comments, etc.) related to the project. Useful for project auditing and tracking project-specific changes.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to get activity for (required)",
      },
      event_type: {
        type: "string",
        description: "Filter by event type",
        enum: [
          "added",
          "updated",
          "deleted",
          "completed",
          "uncompleted",
          "archived",
          "unarchived",
          "shared",
          "left",
        ],
      },
      object_type: {
        type: "string",
        description: "Filter by object type within the project",
        enum: [
          "item",
          "note",
          "project",
          "section",
          "label",
          "filter",
          "reminder",
        ],
      },
      since: {
        type: "string",
        description: "Return events after this date/time (ISO 8601 format)",
      },
      until: {
        type: "string",
        description: "Return events before this date/time (ISO 8601 format)",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of events to return (default: 30, max: 100)",
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: "number",
        description: "Number of events to skip for pagination",
        minimum: 0,
      },
    },
    required: ["project_id"],
  },
};

/**
 * Tool: Get activity log within a date range
 */
export const GET_ACTIVITY_BY_DATE_RANGE_TOOL: Tool = {
  name: "todoist_activity_by_date_range",
  description:
    "Get Todoist activity log within a specific date range. Returns all events that occurred between the specified dates. Useful for generating activity reports and reviewing changes over time periods.",
  inputSchema: {
    type: "object",
    properties: {
      since: {
        type: "string",
        description:
          "Start of date range (ISO 8601 format, e.g., 2024-01-01T00:00:00Z) - required",
      },
      until: {
        type: "string",
        description:
          "End of date range (ISO 8601 format, e.g., 2024-01-31T23:59:59Z) - required",
      },
      object_type: {
        type: "string",
        description: "Filter by object type",
        enum: [
          "item",
          "note",
          "project",
          "section",
          "label",
          "filter",
          "reminder",
        ],
      },
      event_type: {
        type: "string",
        description: "Filter by event type",
        enum: [
          "added",
          "updated",
          "deleted",
          "completed",
          "uncompleted",
          "archived",
          "unarchived",
          "shared",
          "left",
        ],
      },
      project_id: {
        type: "string",
        description: "Filter by project ID",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of events to return (default: 30, max: 100)",
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: "number",
        description: "Number of events to skip for pagination",
        minimum: 0,
      },
    },
    required: ["since", "until"],
  },
};

// Export all activity tools as an array
export const ACTIVITY_TOOLS = [
  GET_ACTIVITY_TOOL,
  GET_ACTIVITY_BY_PROJECT_TOOL,
  GET_ACTIVITY_BY_DATE_RANGE_TOOL,
];
