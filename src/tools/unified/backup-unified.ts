// Unified backup tools combining related operations into single tool
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified backup tool combining: list, download
 */
export const todoistBackupTool: Tool = {
  name: "todoist_backup",
  description: `Manage Todoist backups - list available backups and download backup files.

Actions:
- list: Get list of available backup versions with dates
  Example: {action: "list"}
- download: Download a specific backup version
  Example: {action: "download", version: "2024-01-15_12-00"}

Todoist automatically creates daily backups of your data.
Backups include tasks, projects, labels, comments, and other data.
Requires Todoist Pro/Business plan for backup access.`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["list", "download"],
        description: "The backup operation to perform",
      },
      version: {
        type: "string",
        description:
          "Backup version identifier to download. Required for download action. Use 'list' action to see available versions.",
      },
    },
    required: ["action"],
  },
};

// Export all unified backup tools
export const UNIFIED_BACKUP_TOOLS = [todoistBackupTool];
