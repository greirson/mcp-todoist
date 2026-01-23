import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const todoistCollaborationTool: Tool = {
  name: "todoist_collaboration",
  description: `Manage Todoist collaboration, invitations, and notifications.

Actions:
- workspaces: List workspaces (Business accounts)
  Example: {action: "workspaces"}
- invitations: List pending invitations
  Example: {action: "invitations"}
- invite: Invite user to a project
  Example: {action: "invite", project_id: "123", email: "user@example.com"}
- accept: Accept an invitation
  Example: {action: "accept", invitation_id: "456", secret: "abc123"}
- reject: Reject an invitation
  Example: {action: "reject", invitation_id: "456", secret: "abc123"}
- delete_invite: Delete/revoke a sent invitation
  Example: {action: "delete_invite", invitation_id: "456"}
- notifications: Get live notifications
  Example: {action: "notifications", limit: 10}
- mark_read: Mark a notification as read
  Example: {action: "mark_read", notification_id: "789"}
- mark_all_read: Mark all notifications as read
  Example: {action: "mark_all_read"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "workspaces",
          "invitations",
          "invite",
          "accept",
          "reject",
          "delete_invite",
          "notifications",
          "mark_read",
          "mark_all_read",
        ],
      },
      project_id: { type: "string" },
      email: { type: "string" },
      message: { type: "string" },
      invitation_id: { type: "string" },
      secret: { type: "string" },
      notification_id: { type: "string" },
      limit: { type: "number" },
    },
    required: ["action"],
  },
};
