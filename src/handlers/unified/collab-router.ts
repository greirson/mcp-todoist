/**
 * Collaboration Router - Routes todoist_collaboration actions to existing handlers
 */

import { ValidationError } from "../../errors.js";
import {
  handleGetWorkspaces,
  handleGetInvitations,
  handleInviteToProject,
  handleAcceptInvitation,
  handleRejectInvitation,
  handleDeleteInvitation,
  handleGetLiveNotifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
} from "../collaboration-handlers.js";
import {
  InviteToProjectArgs,
  AcceptInvitationArgs,
  RejectInvitationArgs,
  DeleteInvitationArgs,
  GetLiveNotificationsArgs,
  MarkNotificationReadArgs,
} from "../../types.js";

export async function handleCollaborationAction(
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get_workspaces":
      return handleGetWorkspaces();
    case "get_invitations":
      return handleGetInvitations();
    case "invite":
      return handleInviteToProject(args as unknown as InviteToProjectArgs);
    case "accept_invitation":
      return handleAcceptInvitation(args as unknown as AcceptInvitationArgs);
    case "reject_invitation":
      return handleRejectInvitation(args as unknown as RejectInvitationArgs);
    case "delete_invitation":
      return handleDeleteInvitation(args as unknown as DeleteInvitationArgs);
    case "get_notifications":
      return handleGetLiveNotifications(
        args as unknown as GetLiveNotificationsArgs
      );
    case "mark_notification_read":
      return handleMarkNotificationRead(
        args as unknown as MarkNotificationReadArgs
      );
    case "mark_all_notifications_read":
      return handleMarkAllNotificationsRead();
    default:
      throw new ValidationError(`Unknown collaboration action: ${action}`);
  }
}
