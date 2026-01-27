/**
 * Unified Router - handles routing for 19 consolidated Todoist MCP tools
 * This router is used when TODOIST_UNIFIED_TOOLS=true
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleTaskAction,
  handleTaskBulkAction,
  handleCompletedAction,
  handleProjectAction,
  handleProjectOpsAction,
  handleSectionAction,
  handleSubtaskAction,
  handleLabelAction,
  handleSharedLabelsAction,
  handleCommentAction,
  handleReminderAction,
  handleFilterAction,
  handleCollaborationAction,
  handleUserAction,
  handleUtilityAction,
  handleActivityAction,
  handleTaskOpsAction,
  handleBackupAction,
  handleNotesAction,
} from "../handlers/unified/index.js";

/**
 * Handles routing for unified consolidated tools (19 tools)
 * Returns the result string on success, or null if the tool name is not recognized
 */
export async function handleUnifiedToolCall(
  toolName: string,
  args: unknown,
  client: TodoistApi,
  apiToken: string
): Promise<string | null> {
  const typedArgs = args as Record<string, unknown>;

  switch (toolName) {
    case "todoist_task":
      return await handleTaskAction(client, typedArgs);

    case "todoist_task_bulk":
      return await handleTaskBulkAction(client, typedArgs);

    case "todoist_completed":
      return await handleCompletedAction(client, typedArgs);

    case "todoist_project":
      return await handleProjectAction(client, typedArgs);

    case "todoist_project_ops":
      return await handleProjectOpsAction(client, typedArgs);

    case "todoist_section":
      return await handleSectionAction(client, typedArgs);

    case "todoist_subtask":
      return await handleSubtaskAction(client, typedArgs);

    case "todoist_label":
      return await handleLabelAction(client, typedArgs);

    case "todoist_shared_labels":
      return await handleSharedLabelsAction(typedArgs);

    case "todoist_comment":
      return await handleCommentAction(client, typedArgs);

    case "todoist_reminder":
      return await handleReminderAction(client, typedArgs);

    case "todoist_filter":
      return await handleFilterAction(typedArgs);

    case "todoist_collaboration":
      return await handleCollaborationAction(typedArgs);

    case "todoist_user":
      return await handleUserAction(typedArgs);

    case "todoist_utility":
      return await handleUtilityAction(client, typedArgs, apiToken);

    case "todoist_activity":
      return await handleActivityAction(typedArgs);

    case "todoist_task_ops":
      return await handleTaskOpsAction(client, typedArgs);

    case "todoist_backup":
      return await handleBackupAction(typedArgs);

    case "todoist_project_notes":
      return await handleNotesAction(typedArgs);

    default:
      // Return null to indicate this router doesn't handle this tool
      return null;
  }
}
