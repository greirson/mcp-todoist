import { v4 as uuidv4 } from "uuid";
import {
  Workspace,
  Invitation,
  LiveNotification,
  InviteToProjectArgs,
  AcceptInvitationArgs,
  RejectInvitationArgs,
  DeleteInvitationArgs,
  GetLiveNotificationsArgs,
  MarkNotificationReadArgs,
  SyncApiResponse,
} from "../types.js";
import { TodoistAPIError, ValidationError } from "../errors.js";
import { SimpleCache } from "../cache.js";
import { SYNC_API_URL } from "../utils/api-constants.js";

const workspacesCache = new SimpleCache<Workspace[]>(30000);
const invitationsCache = new SimpleCache<Invitation[]>(30000);
const notificationsCache = new SimpleCache<LiveNotification[]>(30000);

function getApiToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new TodoistAPIError(
      "TODOIST_API_TOKEN environment variable is not set"
    );
  }
  return token;
}

function isDryRunMode(): boolean {
  return process.env.DRYRUN === "true";
}

async function executeSyncCommand(
  type: string,
  args: Record<string, unknown>
): Promise<SyncApiResponse> {
  const token = getApiToken();
  const uuid = uuidv4();
  const command = { type, uuid, args };

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      commands: JSON.stringify([command]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Sync API request failed: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncApiResponse;

  if (data.sync_status) {
    const status = data.sync_status[uuid];
    if (status && typeof status === "object" && "error" in status) {
      throw new TodoistAPIError(
        `Operation failed: ${status.error} (code: ${status.error_code})`
      );
    }
    if (status !== "ok") {
      throw new TodoistAPIError(`Operation failed with status: ${status}`);
    }
  }

  return data;
}

interface SyncWorkspacesResponse extends SyncApiResponse {
  workspaces?: Workspace[];
}

export async function handleGetWorkspaces(): Promise<string> {
  const cacheKey = "workspaces:all";
  const cached = workspacesCache.get(cacheKey);

  if (cached) {
    return formatWorkspaces(cached);
  }

  const token = getApiToken();

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sync_token: "*",
      resource_types: JSON.stringify(["workspaces"]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 403) {
      return "Workspaces require a Todoist Business account. This feature is not available on your current plan.";
    }
    throw new TodoistAPIError(
      `Failed to fetch workspaces: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncWorkspacesResponse;
  const workspaces = data.workspaces || [];

  workspacesCache.set(cacheKey, workspaces);

  return formatWorkspaces(workspaces);
}

function formatWorkspaces(workspaces: Workspace[]): string {
  if (workspaces.length === 0) {
    return "No workspaces found. Workspaces are available with Todoist Business accounts.";
  }

  const workspaceList = workspaces
    .map((ws) => {
      const defaultTag = ws.is_default ? " (default)" : "";
      return `- ${ws.name}${defaultTag}\n  ID: ${ws.id}`;
    })
    .join("\n\n");

  return `Found ${workspaces.length} workspaces:\n\n${workspaceList}`;
}

interface SyncInvitationsResponse extends SyncApiResponse {
  live_notifications?: LiveNotification[];
}

export async function handleGetInvitations(): Promise<string> {
  const cacheKey = "invitations:pending";
  const cached = invitationsCache.get(cacheKey);

  if (cached) {
    return formatInvitations(cached);
  }

  const token = getApiToken();

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sync_token: "*",
      resource_types: JSON.stringify(["live_notifications"]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Failed to fetch invitations: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncInvitationsResponse;
  const notifications = data.live_notifications || [];

  const invitations: Invitation[] = notifications
    .filter((n) => n.notification_type === "share_invitation_sent")
    .map((n) => ({
      id: n.id,
      inviter_id: n.from_uid || "",
      project_id: n.project_id,
    }));

  invitationsCache.set(cacheKey, invitations);

  return formatInvitations(invitations);
}

function formatInvitations(invitations: Invitation[]): string {
  if (invitations.length === 0) {
    return "No pending invitations found.";
  }

  const invitationList = invitations
    .map((inv, index) => {
      const projectInfo = inv.project_id
        ? `\n  Project ID: ${inv.project_id}`
        : "";
      return `${index + 1}. Invitation ID: ${inv.id}\n  From User: ${inv.inviter_id}${projectInfo}`;
    })
    .join("\n\n");

  return `Found ${invitations.length} pending invitations:\n\n${invitationList}`;
}

export async function handleInviteToProject(
  args: InviteToProjectArgs
): Promise<string> {
  if (!args.project_id || !args.project_id.trim()) {
    throw new ValidationError("Project ID is required");
  }
  if (!args.email || !args.email.trim()) {
    throw new ValidationError("Email address is required");
  }

  if (isDryRunMode()) {
    console.error(
      `[DRY-RUN] Would invite ${args.email} to project ${args.project_id}`
    );
    return `[DRY-RUN] Would invite ${args.email} to project ${args.project_id}${args.message ? ` with message: "${args.message}"` : ""}`;
  }

  const commandArgs: Record<string, unknown> = {
    project_id: args.project_id,
    email: args.email,
  };

  if (args.message) {
    commandArgs.message = args.message;
  }

  await executeSyncCommand("share_project", commandArgs);

  invitationsCache.clear();

  return `Invitation sent to ${args.email} for project ${args.project_id}${args.message ? ` with message: "${args.message}"` : ""}`;
}

export async function handleAcceptInvitation(
  args: AcceptInvitationArgs
): Promise<string> {
  if (!args.invitation_id || !args.invitation_id.trim()) {
    throw new ValidationError("Invitation ID is required");
  }
  if (!args.invitation_secret || !args.invitation_secret.trim()) {
    throw new ValidationError("Invitation secret is required");
  }

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would accept invitation ${args.invitation_id}`);
    return `[DRY-RUN] Would accept invitation ${args.invitation_id}`;
  }

  await executeSyncCommand("accept_invitation", {
    invitation_id: args.invitation_id,
    invitation_secret: args.invitation_secret,
  });

  invitationsCache.clear();

  return `Invitation ${args.invitation_id} accepted successfully`;
}

export async function handleRejectInvitation(
  args: RejectInvitationArgs
): Promise<string> {
  if (!args.invitation_id || !args.invitation_id.trim()) {
    throw new ValidationError("Invitation ID is required");
  }
  if (!args.invitation_secret || !args.invitation_secret.trim()) {
    throw new ValidationError("Invitation secret is required");
  }

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would reject invitation ${args.invitation_id}`);
    return `[DRY-RUN] Would reject invitation ${args.invitation_id}`;
  }

  await executeSyncCommand("reject_invitation", {
    invitation_id: args.invitation_id,
    invitation_secret: args.invitation_secret,
  });

  invitationsCache.clear();

  return `Invitation ${args.invitation_id} rejected successfully`;
}

export async function handleDeleteInvitation(
  args: DeleteInvitationArgs
): Promise<string> {
  if (!args.invitation_id || !args.invitation_id.trim()) {
    throw new ValidationError("Invitation ID is required");
  }

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would delete invitation ${args.invitation_id}`);
    return `[DRY-RUN] Would delete invitation ${args.invitation_id}`;
  }

  await executeSyncCommand("delete_invitation", {
    invitation_id: args.invitation_id,
  });

  invitationsCache.clear();

  return `Invitation ${args.invitation_id} deleted successfully`;
}

export async function handleGetLiveNotifications(
  args: GetLiveNotificationsArgs
): Promise<string> {
  const limit = args.limit || 50;
  const cacheKey = `notifications:${limit}`;
  const cached = notificationsCache.get(cacheKey);

  if (cached) {
    return formatNotifications(cached);
  }

  const token = getApiToken();

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sync_token: "*",
      resource_types: JSON.stringify(["live_notifications"]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Failed to fetch notifications: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncInvitationsResponse;
  const notifications = (data.live_notifications || []).slice(0, limit);

  notificationsCache.set(cacheKey, notifications);

  return formatNotifications(notifications);
}

function formatNotifications(notifications: LiveNotification[]): string {
  if (notifications.length === 0) {
    return "No live notifications found.";
  }

  const notificationList = notifications
    .map((n, index) => {
      const date = new Date(n.created_at);
      const formattedDate = date.toLocaleString();
      const unread = n.is_unread ? " (unread)" : "";
      const from = n.from_uid ? `\n  From: ${n.from_uid}` : "";
      const project = n.project_id ? `\n  Project: ${n.project_id}` : "";
      const item = n.item_id ? `\n  Task: ${n.item_id}` : "";

      return `${index + 1}. [${n.notification_type}]${unread}\n  ID: ${n.id}\n  Date: ${formattedDate}${from}${project}${item}`;
    })
    .join("\n\n");

  return `Found ${notifications.length} notifications:\n\n${notificationList}`;
}

export async function handleMarkNotificationRead(
  args: MarkNotificationReadArgs
): Promise<string> {
  if (!args.notification_id || !args.notification_id.trim()) {
    throw new ValidationError("Notification ID is required");
  }

  if (isDryRunMode()) {
    console.error(
      `[DRY-RUN] Would mark notification ${args.notification_id} as read`
    );
    return `[DRY-RUN] Would mark notification ${args.notification_id} as read`;
  }

  await executeSyncCommand("live_notifications_mark_read", {
    id: args.notification_id,
  });

  notificationsCache.clear();

  return `Notification ${args.notification_id} marked as read`;
}

export async function handleMarkAllNotificationsRead(): Promise<string> {
  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would mark all notifications as read`);
    return `[DRY-RUN] Would mark all notifications as read`;
  }

  await executeSyncCommand("live_notifications_mark_read_all", {});

  notificationsCache.clear();

  return `All notifications marked as read`;
}

export function clearCollaborationCache(): void {
  workspacesCache.clear();
  invitationsCache.clear();
  notificationsCache.clear();
}
