// Comment management tools
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CREATE_COMMENT_TOOL: Tool = {
  name: "todoist_comment_create",
  description:
    "Add a comment to a task or project in Todoist. For task comments, provide task_id or task_name. For project comments, provide project_id.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description:
          "ID of the task to comment on (provide this OR task_name for task comments)",
      },
      task_name: {
        type: "string",
        description:
          "Name/content of the task to comment on (provide this OR task_id for task comments)",
      },
      project_id: {
        type: "string",
        description:
          "ID of the project to comment on (use this for project-level comments instead of task_id/task_name)",
      },
      content: {
        type: "string",
        description: "Content of the comment (supports markdown)",
      },
      attachment: {
        type: "object",
        description: "Optional file attachment",
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

export const UPDATE_COMMENT_TOOL: Tool = {
  name: "todoist_comment_update",
  description: "Update an existing comment's content by comment ID",
  inputSchema: {
    type: "object",
    properties: {
      comment_id: {
        type: "string",
        description: "ID of the comment to update (required)",
      },
      content: {
        type: "string",
        description: "New content for the comment (supports markdown)",
      },
    },
    required: ["comment_id", "content"],
  },
};

export const DELETE_COMMENT_TOOL: Tool = {
  name: "todoist_comment_delete",
  description: "Delete a comment by its ID",
  inputSchema: {
    type: "object",
    properties: {
      comment_id: {
        type: "string",
        description: "ID of the comment to delete (required)",
      },
    },
    required: ["comment_id"],
  },
};

export const COMMENT_TOOLS = [
  CREATE_COMMENT_TOOL,
  GET_COMMENTS_TOOL,
  UPDATE_COMMENT_TOOL,
  DELETE_COMMENT_TOOL,
];
