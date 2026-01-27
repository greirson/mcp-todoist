/**
 * Legacy Router - handles routing for 60+ individual Todoist MCP tools
 * This router is used when TODOIST_UNIFIED_TOOLS is not set or set to "false"
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  isCreateTaskArgs,
  isGetTasksArgs,
  isUpdateTaskArgs,
  isTaskNameArgs as isDeleteTaskArgs,
  isTaskNameArgs as isCompleteTaskArgs,
  isQuickAddTaskArgs,
  isTaskNameArgs as isReopenTaskArgs,
  isGetProjectsArgs,
  isGetSectionsArgs,
  isCreateProjectArgs,
  isUpdateProjectArgs,
  isProjectNameArgs,
  isArchiveProjectArgs,
  isGetProjectCollaboratorsArgs,
  isCreateSectionArgs,
  isUpdateSectionArgs,
  isSectionIdentifierArgs,
  isGetCollaboratorsArgs,
  isBulkCreateTasksArgs,
  isBulkUpdateTasksArgs,
  isBulkTaskFilterArgs,
  isCreateCommentArgs,
  isGetCommentsArgs,
  isUpdateCommentArgs,
  isCommentIdArgs,
  isGetLabelsArgs,
  isCreateLabelArgs,
  isUpdateLabelArgs,
  isLabelNameArgs,
  isGetLabelStatsArgs,
  isCreateSubtaskArgs,
  isBulkCreateSubtasksArgs,
  isConvertToSubtaskArgs,
  isPromoteSubtaskArgs,
  isGetTaskHierarchyArgs,
  isGetFiltersArgs,
  isCreateFilterArgs,
  isUpdateFilterArgs,
  isFilterNameArgs,
  isGetRemindersArgs,
  isCreateReminderArgs,
  isUpdateReminderArgs,
  isReminderIdArgs,
  isFindDuplicatesArgs,
  isMergeDuplicatesArgs,
  isGetActivityArgs,
  isGetActivityByProjectArgs,
  isGetActivityByDateRangeArgs,
  isMoveTaskArgs,
  isReorderTaskArgs,
  isBulkReorderTasksArgs,
  isCloseTaskArgs,
  isUpdateDayOrderArgs,
  isMoveSectionArgs,
  isReorderSectionsArgs,
  isArchiveSectionArgs,
  isUnarchiveSectionArgs,
  isReorderProjectsArgs,
  isMoveProjectToParentArgs,
  isGetArchivedProjectsArgs,
  isRenameSharedLabelArgs,
  isRemoveSharedLabelArgs,
  isDownloadBackupArgs,
  isGetProjectNotesArgs,
  isCreateProjectNoteArgs,
  isUpdateProjectNoteArgs,
  isDeleteProjectNoteArgs,
  isInviteToProjectArgs,
  isAcceptInvitationArgs,
  isRejectInvitationArgs,
  isDeleteInvitationArgs,
  isGetLiveNotificationsArgs,
  isMarkNotificationReadArgs,
} from "../type-guards.js";
import {
  handleCreateTask,
  handleGetTasks,
  handleUpdateTask,
  handleDeleteTask,
  handleCompleteTask,
  handleReopenTask,
  handleBulkCreateTasks,
  handleBulkUpdateTasks,
  handleBulkDeleteTasks,
  handleBulkCompleteTasks,
  handleQuickAddTask,
} from "../handlers/task-handlers.js";
import {
  handleGetProjects,
  handleGetSections,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
  handleArchiveProject,
  handleGetProjectCollaborators,
  handleCreateSection,
  handleUpdateSection,
  handleDeleteSection,
  handleGetCollaborators,
} from "../handlers/project-handlers.js";
import {
  handleCreateComment,
  handleGetComments,
  handleUpdateComment,
  handleDeleteComment,
} from "../handlers/comment-handlers.js";
import {
  handleTestConnection,
  handleTestAllFeatures,
  handleTestPerformance,
} from "../handlers/test-handlers.js";
import {
  handleGetLabels,
  handleCreateLabel,
  handleUpdateLabel,
  handleDeleteLabel,
  handleGetLabelStats,
} from "../handlers/label-handlers.js";
import {
  handleCreateSubtask,
  handleBulkCreateSubtasks,
  handleConvertToSubtask,
  handlePromoteSubtask,
  handleGetTaskHierarchy,
} from "../handlers/subtask-handlers.js";
import {
  handleGetFilters,
  handleCreateFilter,
  handleUpdateFilter,
  handleDeleteFilter,
} from "../handlers/filter-handlers.js";
import {
  handleGetReminders,
  handleCreateReminder,
  handleUpdateReminder,
  handleDeleteReminder,
} from "../handlers/reminder-handlers.js";
import {
  handleFindDuplicates,
  handleMergeDuplicates,
} from "../handlers/duplicate-handlers.js";
import {
  handleGetActivity,
  handleGetActivityByProject,
  handleGetActivityByDateRange,
} from "../handlers/activity-handlers.js";
import {
  handleMoveTask,
  handleReorderTask,
  handleBulkReorderTasks,
  handleCloseTask,
  handleUpdateDayOrders,
} from "../handlers/item-operations-handlers.js";
import {
  handleMoveSection,
  handleReorderSections,
  handleArchiveSection,
  handleUnarchiveSection,
} from "../handlers/section-operations-handlers.js";
import {
  handleReorderProjects,
  handleMoveProjectToParent,
  handleGetArchivedProjects,
} from "../handlers/project-operations-handlers.js";
import {
  handleGetUser,
  handleGetProductivityStats,
  handleGetUserSettings,
} from "../handlers/user-handlers.js";
import {
  handleGetSharedLabels,
  handleRenameSharedLabel,
  handleRemoveSharedLabel,
} from "../handlers/shared-label-handlers.js";
import {
  handleGetBackups,
  handleDownloadBackup,
} from "../handlers/backup-handlers.js";
import {
  handleGetProjectNotes,
  handleCreateProjectNote,
  handleUpdateProjectNote,
  handleDeleteProjectNote,
} from "../handlers/project-notes-handlers.js";
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
} from "../handlers/collaboration-handlers.js";
import { formatTaskHierarchy } from "../utils/formatters.js";

export interface CallToolResult {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
}

/**
 * Handles routing for legacy individual tools (60+ tools)
 * Returns the result string on success, or null if the tool name is not recognized
 */
export async function handleLegacyToolCall(
  toolName: string,
  args: unknown,
  client: TodoistApi,
  apiToken: string
): Promise<string | null> {
  switch (toolName) {
    case "todoist_task_create":
      if (!isCreateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_create");
      }
      return await handleCreateTask(client, args);

    case "todoist_task_get":
      if (!isGetTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_get");
      }
      return await handleGetTasks(client, args);

    case "todoist_task_update":
      if (!isUpdateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_update");
      }
      return await handleUpdateTask(client, args);

    case "todoist_task_delete":
      if (!isDeleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_delete");
      }
      return await handleDeleteTask(client, args);

    case "todoist_task_complete":
      if (!isCompleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_complete");
      }
      return await handleCompleteTask(client, args);

    case "todoist_task_quick_add":
      if (!isQuickAddTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_quick_add");
      }
      return await handleQuickAddTask(apiToken, args);

    case "todoist_task_reopen":
      if (!isReopenTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_reopen");
      }
      return await handleReopenTask(client, args);

    case "todoist_project_get":
      if (!isGetProjectsArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_get");
      }
      return await handleGetProjects(client);

    case "todoist_section_get":
      if (!isGetSectionsArgs(args)) {
        throw new Error("Invalid arguments for todoist_section_get");
      }
      return await handleGetSections(client, args);

    case "todoist_project_create":
      if (!isCreateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_create");
      }
      return await handleCreateProject(client, args);

    case "todoist_project_update":
      if (!isUpdateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_update");
      }
      return await handleUpdateProject(client, args);

    case "todoist_project_delete":
      if (!isProjectNameArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_delete");
      }
      return await handleDeleteProject(client, args);

    case "todoist_project_archive":
      if (!isArchiveProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_archive");
      }
      return await handleArchiveProject(client, args);

    case "todoist_project_collaborators_get":
      if (!isGetProjectCollaboratorsArgs(args)) {
        throw new Error(
          "Invalid arguments for todoist_project_collaborators_get"
        );
      }
      return await handleGetProjectCollaborators(client, args);

    case "todoist_section_create":
      if (!isCreateSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_section_create");
      }
      return await handleCreateSection(client, args);

    case "todoist_section_update":
      if (!isUpdateSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_section_update");
      }
      return await handleUpdateSection(client, args);

    case "todoist_section_delete":
      if (!isSectionIdentifierArgs(args)) {
        throw new Error("Invalid arguments for todoist_section_delete");
      }
      return await handleDeleteSection(client, args);

    case "todoist_collaborators_get":
      if (!isGetCollaboratorsArgs(args)) {
        throw new Error("Invalid arguments for todoist_collaborators_get");
      }
      return await handleGetCollaborators(client, args);

    case "todoist_tasks_bulk_create":
      if (!isBulkCreateTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_tasks_bulk_create");
      }
      return await handleBulkCreateTasks(client, args);

    case "todoist_tasks_bulk_update":
      if (!isBulkUpdateTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_tasks_bulk_update");
      }
      return await handleBulkUpdateTasks(client, args);

    case "todoist_tasks_bulk_delete":
      if (!isBulkTaskFilterArgs(args)) {
        throw new Error("Invalid arguments for todoist_tasks_bulk_delete");
      }
      return await handleBulkDeleteTasks(client, args);

    case "todoist_tasks_bulk_complete":
      if (!isBulkTaskFilterArgs(args)) {
        throw new Error("Invalid arguments for todoist_tasks_bulk_complete");
      }
      return await handleBulkCompleteTasks(client, args);

    case "todoist_comment_create":
      if (!isCreateCommentArgs(args)) {
        throw new Error("Invalid arguments for todoist_comment_create");
      }
      return await handleCreateComment(client, args);

    case "todoist_comment_get":
      if (!isGetCommentsArgs(args)) {
        throw new Error("Invalid arguments for todoist_comment_get");
      }
      return await handleGetComments(client, args);

    case "todoist_comment_update":
      if (!isUpdateCommentArgs(args)) {
        throw new Error("Invalid arguments for todoist_comment_update");
      }
      return await handleUpdateComment(client, args);

    case "todoist_comment_delete":
      if (!isCommentIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_comment_delete");
      }
      return await handleDeleteComment(client, args);

    case "todoist_label_get":
      if (!isGetLabelsArgs(args)) {
        throw new Error("Invalid arguments for todoist_label_get");
      }
      return await handleGetLabels(client);

    case "todoist_label_create":
      if (!isCreateLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_label_create");
      }
      return await handleCreateLabel(client, args);

    case "todoist_label_update":
      if (!isUpdateLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_label_update");
      }
      return await handleUpdateLabel(client, args);

    case "todoist_label_delete":
      if (!isLabelNameArgs(args)) {
        throw new Error("Invalid arguments for todoist_label_delete");
      }
      return await handleDeleteLabel(client, args);

    case "todoist_label_stats":
      if (!isGetLabelStatsArgs(args)) {
        throw new Error("Invalid arguments for todoist_label_stats");
      }
      return await handleGetLabelStats(client);

    case "todoist_subtask_create": {
      if (!isCreateSubtaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_subtask_create");
      }
      const subtaskResult = await handleCreateSubtask(client, args);
      return `Created subtask "${subtaskResult.subtask.content}" (ID: ${subtaskResult.subtask.id}) under parent task "${subtaskResult.parent.content}" (ID: ${subtaskResult.parent.id})`;
    }

    case "todoist_subtasks_bulk_create": {
      if (!isBulkCreateSubtasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_subtasks_bulk_create");
      }
      const bulkSubtaskResult = await handleBulkCreateSubtasks(client, args);
      let bulkSubtaskResponse =
        `Created ${bulkSubtaskResult.created.length} subtasks under parent "${bulkSubtaskResult.parent.content}" (ID: ${bulkSubtaskResult.parent.id})\n` +
        `Failed: ${bulkSubtaskResult.failed.length}`;
      if (bulkSubtaskResult.created.length > 0) {
        bulkSubtaskResponse +=
          "\nCreated subtasks:\n" +
          bulkSubtaskResult.created
            .map((t) => `- ${t.content} (ID: ${t.id})`)
            .join("\n");
      }
      if (bulkSubtaskResult.failed.length > 0) {
        bulkSubtaskResponse +=
          "\nFailed subtasks:\n" +
          bulkSubtaskResult.failed
            .map((f) => `- ${f.task.content}: ${f.error}`)
            .join("\n");
      }
      return bulkSubtaskResponse;
    }

    case "todoist_task_convert_to_subtask": {
      if (!isConvertToSubtaskArgs(args)) {
        throw new Error(
          "Invalid arguments for todoist_task_convert_to_subtask"
        );
      }
      const convertResult = await handleConvertToSubtask(client, args);
      return `Converted task "${convertResult.task.content}" (ID: ${convertResult.task.id}) to subtask of "${convertResult.parent.content}" (ID: ${convertResult.parent.id})`;
    }

    case "todoist_subtask_promote": {
      if (!isPromoteSubtaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_subtask_promote");
      }
      const promotedTask = await handlePromoteSubtask(client, args);
      return `Promoted subtask "${promotedTask.content}" (ID: ${promotedTask.id}) to main task`;
    }

    case "todoist_task_hierarchy_get": {
      if (!isGetTaskHierarchyArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_hierarchy_get");
      }
      const hierarchy = await handleGetTaskHierarchy(client, args);
      return formatTaskHierarchy(hierarchy);
    }

    case "todoist_filter_get":
      if (!isGetFiltersArgs(args)) {
        throw new Error("Invalid arguments for todoist_filter_get");
      }
      return await handleGetFilters();

    case "todoist_filter_create":
      if (!isCreateFilterArgs(args)) {
        throw new Error("Invalid arguments for todoist_filter_create");
      }
      return await handleCreateFilter(args);

    case "todoist_filter_update":
      if (!isUpdateFilterArgs(args)) {
        throw new Error("Invalid arguments for todoist_filter_update");
      }
      return await handleUpdateFilter(args);

    case "todoist_filter_delete":
      if (!isFilterNameArgs(args)) {
        throw new Error("Invalid arguments for todoist_filter_delete");
      }
      return await handleDeleteFilter(args);

    case "todoist_reminder_get":
      if (!isGetRemindersArgs(args)) {
        throw new Error("Invalid arguments for todoist_reminder_get");
      }
      return await handleGetReminders(client, args);

    case "todoist_reminder_create":
      if (!isCreateReminderArgs(args)) {
        throw new Error("Invalid arguments for todoist_reminder_create");
      }
      return await handleCreateReminder(client, args);

    case "todoist_reminder_update":
      if (!isUpdateReminderArgs(args)) {
        throw new Error("Invalid arguments for todoist_reminder_update");
      }
      return await handleUpdateReminder(args);

    case "todoist_reminder_delete":
      if (!isReminderIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_reminder_delete");
      }
      return await handleDeleteReminder(args);

    case "todoist_duplicates_find":
      if (!isFindDuplicatesArgs(args)) {
        throw new Error("Invalid arguments for todoist_duplicates_find");
      }
      return await handleFindDuplicates(client, args);

    case "todoist_duplicates_merge":
      if (!isMergeDuplicatesArgs(args)) {
        throw new Error("Invalid arguments for todoist_duplicates_merge");
      }
      return await handleMergeDuplicates(client, args);

    case "todoist_activity_get":
      if (!isGetActivityArgs(args)) {
        throw new Error("Invalid arguments for todoist_activity_get");
      }
      return await handleGetActivity(args);

    case "todoist_activity_by_project":
      if (!isGetActivityByProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_activity_by_project");
      }
      return await handleGetActivityByProject(args);

    case "todoist_activity_by_date_range":
      if (!isGetActivityByDateRangeArgs(args)) {
        throw new Error("Invalid arguments for todoist_activity_by_date_range");
      }
      return await handleGetActivityByDateRange(args);

    case "todoist_task_move":
      if (!isMoveTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_move");
      }
      return await handleMoveTask(client, args);

    case "todoist_task_reorder":
      if (!isReorderTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_reorder");
      }
      return await handleReorderTask(client, args);

    case "todoist_tasks_reorder_bulk":
      if (!isBulkReorderTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_tasks_reorder_bulk");
      }
      return await handleBulkReorderTasks(args);

    case "todoist_task_close":
      if (!isCloseTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_close");
      }
      return await handleCloseTask(client, args);

    case "todoist_task_day_order_update":
      if (!isUpdateDayOrderArgs(args)) {
        throw new Error("Invalid arguments for todoist_task_day_order_update");
      }
      return await handleUpdateDayOrders(args);

    case "todoist_section_move":
      if (!isMoveSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_section_move");
      }
      return await handleMoveSection(client, args);

    case "todoist_sections_reorder":
      if (!isReorderSectionsArgs(args)) {
        throw new Error("Invalid arguments for todoist_sections_reorder");
      }
      return await handleReorderSections(args);

    case "todoist_section_archive":
      if (!isArchiveSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_section_archive");
      }
      return await handleArchiveSection(client, args);

    case "todoist_section_unarchive":
      if (!isUnarchiveSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_section_unarchive");
      }
      return await handleUnarchiveSection(client, args);

    case "todoist_projects_reorder":
      if (!isReorderProjectsArgs(args)) {
        throw new Error("Invalid arguments for todoist_projects_reorder");
      }
      return await handleReorderProjects(args);

    case "todoist_project_move_to_parent":
      if (!isMoveProjectToParentArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_move_to_parent");
      }
      return await handleMoveProjectToParent(client, args);

    case "todoist_archived_projects_get":
      if (!isGetArchivedProjectsArgs(args)) {
        throw new Error("Invalid arguments for todoist_archived_projects_get");
      }
      return await handleGetArchivedProjects(args);

    case "todoist_user_get":
      return await handleGetUser();

    case "todoist_productivity_stats_get":
      return await handleGetProductivityStats();

    case "todoist_user_settings_get":
      return await handleGetUserSettings();

    case "todoist_shared_labels_get":
      return await handleGetSharedLabels();

    case "todoist_shared_label_rename":
      if (!isRenameSharedLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_shared_label_rename");
      }
      return await handleRenameSharedLabel(args);

    case "todoist_shared_label_remove":
      if (!isRemoveSharedLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_shared_label_remove");
      }
      return await handleRemoveSharedLabel(args);

    case "todoist_backups_get":
      return await handleGetBackups();

    case "todoist_backup_download":
      if (!isDownloadBackupArgs(args)) {
        throw new Error("Invalid arguments for todoist_backup_download");
      }
      return await handleDownloadBackup(args);

    case "todoist_project_notes_get":
      if (!isGetProjectNotesArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_notes_get");
      }
      return await handleGetProjectNotes(args);

    case "todoist_project_note_create":
      if (!isCreateProjectNoteArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_note_create");
      }
      return await handleCreateProjectNote(args);

    case "todoist_project_note_update":
      if (!isUpdateProjectNoteArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_note_update");
      }
      return await handleUpdateProjectNote(args);

    case "todoist_project_note_delete":
      if (!isDeleteProjectNoteArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_note_delete");
      }
      return await handleDeleteProjectNote(args);

    case "todoist_workspaces_get":
      return await handleGetWorkspaces();

    case "todoist_invitations_get":
      return await handleGetInvitations();

    case "todoist_project_invite":
      if (!isInviteToProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_project_invite");
      }
      return await handleInviteToProject(args);

    case "todoist_invitation_accept":
      if (!isAcceptInvitationArgs(args)) {
        throw new Error("Invalid arguments for todoist_invitation_accept");
      }
      return await handleAcceptInvitation(args);

    case "todoist_invitation_reject":
      if (!isRejectInvitationArgs(args)) {
        throw new Error("Invalid arguments for todoist_invitation_reject");
      }
      return await handleRejectInvitation(args);

    case "todoist_invitation_delete":
      if (!isDeleteInvitationArgs(args)) {
        throw new Error("Invalid arguments for todoist_invitation_delete");
      }
      return await handleDeleteInvitation(args);

    case "todoist_notifications_get":
      if (!isGetLiveNotificationsArgs(args)) {
        throw new Error("Invalid arguments for todoist_notifications_get");
      }
      return await handleGetLiveNotifications(args);

    case "todoist_notification_mark_read":
      if (!isMarkNotificationReadArgs(args)) {
        throw new Error("Invalid arguments for todoist_notification_mark_read");
      }
      return await handleMarkNotificationRead(args);

    case "todoist_notifications_mark_all_read":
      return await handleMarkAllNotificationsRead();

    case "todoist_test_connection": {
      const connectionResult = await handleTestConnection(client);
      return JSON.stringify(connectionResult, null, 2);
    }

    case "todoist_test_all_features": {
      const featuresResult = await handleTestAllFeatures(
        client,
        args as { mode?: "basic" | "enhanced" },
        apiToken
      );
      return JSON.stringify(featuresResult, null, 2);
    }

    case "todoist_test_performance": {
      const performanceResult = await handleTestPerformance(
        client,
        args as { iterations?: number }
      );
      return JSON.stringify(performanceResult, null, 2);
    }

    default:
      // Return null to indicate this router doesn't handle this tool
      return null;
  }
}
