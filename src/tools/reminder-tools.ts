// Reminder management tools (Phase 10)
// These tools use the Todoist Sync API for reminder CRUD operations
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_REMINDERS_TOOL: Tool = {
  name: "todoist_reminder_get",
  description:
    "Get all reminders, optionally filtered by task. Reminders require Todoist Pro or Business plan.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "Filter reminders by task ID (optional - provide this OR task_name)",
      },
      task_name: {
        type: "string",
        description:
          "Filter reminders by task name (optional - provide this OR task_id)",
      },
    },
  },
};

export const CREATE_REMINDER_TOOL: Tool = {
  name: "todoist_reminder_create",
  description:
    "Create a new reminder for a task. Supports three reminder types: relative (minutes before due), absolute (specific date/time), and location-based. Requires Todoist Pro or Business plan.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "ID of the task to add reminder to (provide this OR task_name)",
      },
      task_name: {
        type: "string",
        description:
          "Name of the task to add reminder to (provide this OR task_id)",
      },
      type: {
        type: "string",
        enum: ["relative", "absolute", "location"],
        description:
          "Type of reminder: 'relative' (minutes before due date), 'absolute' (specific date/time), or 'location' (geofenced)",
      },
      minute_offset: {
        type: "number",
        description:
          "For relative reminders: minutes before the task due date to trigger (e.g., 30 for 30 minutes before)",
      },
      due_date: {
        type: "string",
        description:
          "For absolute reminders: the date/time in ISO 8601 format (e.g., '2024-10-15T09:00:00Z')",
      },
      timezone: {
        type: "string",
        description:
          "Timezone for absolute reminders (e.g., 'America/New_York')",
      },
      location_name: {
        type: "string",
        description: "For location reminders: alias name for the location",
      },
      latitude: {
        type: "string",
        description: "For location reminders: latitude coordinate",
      },
      longitude: {
        type: "string",
        description: "For location reminders: longitude coordinate",
      },
      location_trigger: {
        type: "string",
        enum: ["on_enter", "on_leave"],
        description:
          "For location reminders: when to trigger - 'on_enter' or 'on_leave'",
      },
      radius: {
        type: "number",
        description:
          "For location reminders: radius around location in meters (default: 100)",
      },
    },
    required: ["type"],
  },
};

export const UPDATE_REMINDER_TOOL: Tool = {
  name: "todoist_reminder_update",
  description:
    "Update an existing reminder. Can change the type, timing, or location settings. Requires Todoist Pro or Business plan.",
  inputSchema: {
    type: "object",
    properties: {
      reminder_id: {
        type: "string",
        description: "ID of the reminder to update",
      },
      type: {
        type: "string",
        enum: ["relative", "absolute", "location"],
        description: "New type of reminder (optional)",
      },
      minute_offset: {
        type: "number",
        description:
          "For relative reminders: new minutes before the task due date",
      },
      due_date: {
        type: "string",
        description: "For absolute reminders: new date/time in ISO 8601 format",
      },
      timezone: {
        type: "string",
        description: "New timezone for absolute reminders",
      },
      location_name: {
        type: "string",
        description: "For location reminders: new alias name",
      },
      latitude: {
        type: "string",
        description: "For location reminders: new latitude",
      },
      longitude: {
        type: "string",
        description: "For location reminders: new longitude",
      },
      location_trigger: {
        type: "string",
        enum: ["on_enter", "on_leave"],
        description: "For location reminders: new trigger condition",
      },
      radius: {
        type: "number",
        description: "For location reminders: new radius in meters",
      },
    },
    required: ["reminder_id"],
  },
};

export const DELETE_REMINDER_TOOL: Tool = {
  name: "todoist_reminder_delete",
  description: "Delete a reminder. Requires Todoist Pro or Business plan.",
  inputSchema: {
    type: "object",
    properties: {
      reminder_id: {
        type: "string",
        description: "ID of the reminder to delete",
      },
    },
    required: ["reminder_id"],
  },
};

export const REMINDER_TOOLS = [
  GET_REMINDERS_TOOL,
  CREATE_REMINDER_TOOL,
  UPDATE_REMINDER_TOOL,
  DELETE_REMINDER_TOOL,
];
