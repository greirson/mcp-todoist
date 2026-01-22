import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const todoistReminderTool: Tool = {
  name: "todoist_reminder",
  description: `Manage task reminders in Todoist (requires Pro/Business plan).

Actions:
- create: Create a reminder for a task
  Example (relative): {action: "create", task_id: "123", type: "relative", minute_offset: 30}
  Example (absolute): {action: "create", task_id: "123", type: "absolute", due_date: "2024-12-25T09:00:00Z"}
- get: List reminders (all or by task)
  Example: {action: "get"}
  Example: {action: "get", task_id: "123"}
- update: Update reminder timing
  Example: {action: "update", reminder_id: "456", minute_offset: 60}
- delete: Delete a reminder
  Example: {action: "delete", reminder_id: "456"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "get", "update", "delete"],
        description: "The reminder operation to perform",
      },
      reminder_id: {
        type: "string",
        description: "Reminder ID (required for update/delete)",
      },
      task_id: {
        type: "string",
        description: "Task ID (required for create, optional for get)",
      },
      type: {
        type: "string",
        enum: ["relative", "absolute", "location"],
        description: "Reminder type (required for create)",
      },
      minute_offset: {
        type: "number",
        description: "Minutes before due time (for relative reminders)",
      },
      due_date: {
        type: "string",
        description: "ISO datetime string (for absolute reminders)",
      },
    },
    required: ["action"],
  },
};
