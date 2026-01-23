import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_BACKUPS_TOOL: Tool = {
  name: "todoist_backups_get",
  description:
    "List all available automatic backups of your Todoist data. Todoist creates backups automatically. Returns version timestamps and download URLs.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const DOWNLOAD_BACKUP_TOOL: Tool = {
  name: "todoist_backup_download",
  description:
    "Get the download URL for a specific backup version. The URL is time-limited. Backups are ZIP files containing CSV exports of your Todoist data.",
  inputSchema: {
    type: "object",
    properties: {
      version: {
        type: "string",
        description:
          "The backup version timestamp (from todoist_backups_get). Example: 2024-01-15T10:30:00Z",
      },
    },
    required: ["version"],
  },
};

export const BACKUP_TOOLS = [GET_BACKUPS_TOOL, DOWNLOAD_BACKUP_TOOL];
