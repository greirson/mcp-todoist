import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_USER_TOOL: Tool = {
  name: "todoist_user_get",
  description:
    "Get information about the current Todoist user including name, email, timezone, karma, and account settings.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const GET_PRODUCTIVITY_STATS_TOOL: Tool = {
  name: "todoist_productivity_stats_get",
  description:
    "Get detailed productivity statistics including karma, task completion history, daily/weekly streaks, and goals progress.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const GET_USER_SETTINGS_TOOL: Tool = {
  name: "todoist_user_settings_get",
  description:
    "Get user settings including reminder preferences, notification settings, sounds, and theme configuration.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const USER_TOOLS = [
  GET_USER_TOOL,
  GET_PRODUCTIVITY_STATS_TOOL,
  GET_USER_SETTINGS_TOOL,
];
