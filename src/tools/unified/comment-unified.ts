import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const todoistCommentTool: Tool = {
  name: "todoist_comment",
  description: `Manage comments on Todoist tasks and projects.

Actions:
- create: Add a comment to a task or project
  Example: {action: "create", task_id: "123", content: "Great progress!"}
  Example: {action: "create", project_id: "456", content: "Project kickoff notes"}
- get: Get comments for a task or project
  Example: {action: "get", task_id: "123"}
- update: Update comment content
  Example: {action: "update", comment_id: "789", content: "Updated comment"}
- delete: Delete a comment
  Example: {action: "delete", comment_id: "789"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["create", "get", "update", "delete"] },
      comment_id: {
        type: "string",
        description: "Comment ID (for update/delete)",
      },
      task_id: { type: "string", description: "Task ID (for create/get)" },
      task_name: { type: "string", description: "Task name (alternative)" },
      project_id: {
        type: "string",
        description: "Project ID (for create/get)",
      },
      content: { type: "string", description: "Comment content" },
      attachment: { type: "object", description: "File attachment" },
    },
    required: ["action"],
  },
};
