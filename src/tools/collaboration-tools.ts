import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_WORKSPACES_TOOL: Tool = {
  name: "todoist_workspaces_get",
  description:
    "Get all workspaces for the current user. Workspaces are available with Todoist Business accounts for team organization.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const GET_INVITATIONS_TOOL: Tool = {
  name: "todoist_invitations_get",
  description:
    "Get all pending project sharing invitations received by the current user.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const INVITE_TO_PROJECT_TOOL: Tool = {
  name: "todoist_project_invite",
  description:
    "Invite a user to collaborate on a project by email. The invitee will receive an email notification.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The ID of the project to share",
      },
      email: {
        type: "string",
        description: "The email address of the person to invite",
      },
      message: {
        type: "string",
        description: "Optional personal message to include in the invitation",
      },
    },
    required: ["project_id", "email"],
  },
};

export const ACCEPT_INVITATION_TOOL: Tool = {
  name: "todoist_invitation_accept",
  description:
    "Accept a project sharing invitation. Requires both the invitation ID and secret from the invitation email.",
  inputSchema: {
    type: "object",
    properties: {
      invitation_id: {
        type: "string",
        description: "The ID of the invitation",
      },
      invitation_secret: {
        type: "string",
        description: "The secret token from the invitation",
      },
    },
    required: ["invitation_id", "invitation_secret"],
  },
};

export const REJECT_INVITATION_TOOL: Tool = {
  name: "todoist_invitation_reject",
  description:
    "Reject a project sharing invitation. Requires both the invitation ID and secret.",
  inputSchema: {
    type: "object",
    properties: {
      invitation_id: {
        type: "string",
        description: "The ID of the invitation",
      },
      invitation_secret: {
        type: "string",
        description: "The secret token from the invitation",
      },
    },
    required: ["invitation_id", "invitation_secret"],
  },
};

export const DELETE_INVITATION_TOOL: Tool = {
  name: "todoist_invitation_delete",
  description:
    "Delete/revoke a pending invitation that you sent. Use this to cancel an invitation before it is accepted.",
  inputSchema: {
    type: "object",
    properties: {
      invitation_id: {
        type: "string",
        description: "The ID of the invitation to delete",
      },
    },
    required: ["invitation_id"],
  },
};

export const GET_LIVE_NOTIFICATIONS_TOOL: Tool = {
  name: "todoist_notifications_get",
  description:
    "Get live notifications including comments, assignments, sharing invitations, and other collaboration events.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of notifications to return (default: 50)",
      },
    },
    required: [],
  },
};

export const MARK_NOTIFICATION_READ_TOOL: Tool = {
  name: "todoist_notification_mark_read",
  description: "Mark a specific notification as read.",
  inputSchema: {
    type: "object",
    properties: {
      notification_id: {
        type: "string",
        description: "The ID of the notification to mark as read",
      },
    },
    required: ["notification_id"],
  },
};

export const MARK_ALL_NOTIFICATIONS_READ_TOOL: Tool = {
  name: "todoist_notifications_mark_all_read",
  description: "Mark all notifications as read.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const COLLABORATION_TOOLS = [
  GET_WORKSPACES_TOOL,
  GET_INVITATIONS_TOOL,
  INVITE_TO_PROJECT_TOOL,
  ACCEPT_INVITATION_TOOL,
  REJECT_INVITATION_TOOL,
  DELETE_INVITATION_TOOL,
  GET_LIVE_NOTIFICATIONS_TOOL,
  MARK_NOTIFICATION_READ_TOOL,
  MARK_ALL_NOTIFICATIONS_READ_TOOL,
];
