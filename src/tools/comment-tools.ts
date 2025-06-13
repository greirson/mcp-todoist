// Comment management tools
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CREATE_COMMENT_TOOL: Tool = {
  name: "todoist_comment_create",
  description: "Add a comment to a task in Todoist by task ID or task name",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "ID of the task to comment on (optional if task_name is provided)",
      },
      task_name: {
        type: "string",
        description:
          "Name/content of the task to comment on (optional if task_id is provided)",
      },
      content: {
        type: "string",
        description: "Content of the comment",
      },
      attachment: {
        type: "object",
        description: "Optional file attachment (optional)",
        properties: {
          file_name: {
            type: "string",
            description: "Name of the attached file",
          },
          file_url: {
            type: "string",
            description: "URL of the attached file",
          },
          file_type: {
            type: "string",
            description: "MIME type of the attached file",
          },
        },
        required: ["file_name", "file_url", "file_type"],
      },
    },
    required: ["content"],
    anyOf: [{ required: ["task_id"] }, { required: ["task_name"] }],
  },
};

export const GET_COMMENTS_TOOL: Tool = {
  name: "todoist_comment_get",
  description: "Get comments for a task or project in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "ID of the task to get comments for (optional)",
      },
      task_name: {
        type: "string",
        description: "Name/content of the task to get comments for (optional)",
      },
      project_id: {
        type: "string",
        description: "ID of the project to get comments for (optional)",
      },
    },
  },
};

export const COMMENT_TOOLS = [CREATE_COMMENT_TOOL, GET_COMMENTS_TOOL];
