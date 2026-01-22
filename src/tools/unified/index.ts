// Re-export all unified tools
export { todoistTaskTool, todoistTaskBulkTool } from "./task-unified.js";
export { todoistSubtaskTool } from "./subtask-unified.js";
export {
  todoistProjectTool,
  todoistProjectOpsTool,
} from "./project-unified.js";
export { todoistSectionTool } from "./section-unified.js";
export { todoistLabelTool, todoistSharedLabelsTool } from "./label-unified.js";
export { todoistCommentTool } from "./comment-unified.js";
export { todoistReminderTool } from "./reminder-unified.js";
export { todoistFilterTool } from "./filter-unified.js";
export { todoistCollaborationTool } from "./collab-unified.js";
export { todoistUserTool } from "./user-unified.js";
export { todoistUtilityTool } from "./utility-unified.js";
export { todoistActivityTool } from "./activity-unified.js";
export { todoistTaskOpsTool } from "./task-ops-unified.js";
export { todoistBackupTool } from "./backup-unified.js";
export { todoistNotesTool } from "./notes-unified.js";
export { todoistCompletedTool } from "./completed-unified.js";

import { todoistTaskTool, todoistTaskBulkTool } from "./task-unified.js";
import { todoistSubtaskTool } from "./subtask-unified.js";
import {
  todoistProjectTool,
  todoistProjectOpsTool,
} from "./project-unified.js";
import { todoistSectionTool } from "./section-unified.js";
import { todoistLabelTool, todoistSharedLabelsTool } from "./label-unified.js";
import { todoistCommentTool } from "./comment-unified.js";
import { todoistReminderTool } from "./reminder-unified.js";
import { todoistFilterTool } from "./filter-unified.js";
import { todoistCollaborationTool } from "./collab-unified.js";
import { todoistUserTool } from "./user-unified.js";
import { todoistUtilityTool } from "./utility-unified.js";
import { todoistActivityTool } from "./activity-unified.js";
import { todoistTaskOpsTool } from "./task-ops-unified.js";
import { todoistBackupTool } from "./backup-unified.js";
import { todoistNotesTool } from "./notes-unified.js";
import { todoistCompletedTool } from "./completed-unified.js";

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * All 19 unified MCP tools for Todoist integration
 */
export const ALL_UNIFIED_TOOLS: Tool[] = [
  // Core tools (12)
  todoistTaskTool,
  todoistTaskBulkTool,
  todoistSubtaskTool,
  todoistProjectTool,
  todoistSectionTool,
  todoistLabelTool,
  todoistCommentTool,
  todoistReminderTool,
  todoistFilterTool,
  todoistCollaborationTool,
  todoistUserTool,
  todoistUtilityTool,
  // Advanced tools (6)
  todoistTaskOpsTool,
  todoistProjectOpsTool,
  todoistCompletedTool,
  todoistBackupTool,
  todoistNotesTool,
  todoistSharedLabelsTool,
  // Activity (1)
  todoistActivityTool,
];
