/**
 * Unified Router Index - Exports all routing handlers
 *
 * These routers provide a unified action-based interface for the MCP tools,
 * delegating to existing domain-specific handlers.
 */

// Task routing
export {
  handleTaskAction,
  handleTaskBulkAction,
  handleCompletedAction,
} from "./task-router.js";

// Project routing
export {
  handleProjectAction,
  handleProjectOpsAction,
} from "./project-router.js";

// Section routing
export { handleSectionAction } from "./section-router.js";

// Subtask routing
export { handleSubtaskAction } from "./subtask-router.js";

// Label routing
export { handleLabelAction, handleSharedLabelsAction } from "./label-router.js";

// Comment routing
export { handleCommentAction } from "./comment-router.js";

// Reminder routing
export { handleReminderAction } from "./reminder-router.js";

// Filter routing
export { handleFilterAction } from "./filter-router.js";

// Collaboration routing
export { handleCollaborationAction } from "./collab-router.js";

// User routing
export { handleUserAction } from "./user-router.js";

// Utility routing (testing, duplicates)
export { handleUtilityAction } from "./utility-router.js";

// Activity routing
export { handleActivityAction } from "./activity-router.js";

// Task operations routing (move, reorder, close)
export { handleTaskOpsAction } from "./task-ops-router.js";

// Backup routing
export { handleBackupAction } from "./backup-router.js";

// Project notes routing
export { handleNotesAction } from "./notes-router.js";
