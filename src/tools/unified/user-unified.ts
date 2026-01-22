// Unified user management tools combining related operations into single tool
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified user tool combining: info, stats, settings
 */
export const todoistUserTool: Tool = {
  name: "todoist_user",
  description: `Get Todoist user information and productivity stats.

Actions:
- info: Get user profile information (name, email, timezone, avatar)
  Example: {action: "info"}
- stats: Get productivity statistics (karma, streaks, goals, completed counts)
  Example: {action: "stats"}
- settings: Get user settings and preferences (theme, date format, time format)
  Example: {action: "settings"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["info", "stats", "settings"],
        description: "The user information to retrieve",
      },
    },
    required: ["action"],
  },
};

// Export all unified user tools
export const UNIFIED_USER_TOOLS = [todoistUserTool];
