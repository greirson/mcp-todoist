/**
 * Task Handlers Module
 *
 * This module provides all task-related handler functions organized by functionality:
 * - crud.ts: Single task CRUD operations (create, get, update, delete, complete, reopen)
 * - bulk.ts: Bulk operations (bulk create, update, delete, complete)
 * - completed.ts: Completed tasks retrieval via Sync API
 * - quick-add.ts: Quick add with natural language parsing
 */

// CRUD operations for single tasks
export {
  handleCreateTask,
  handleGetTasks,
  handleUpdateTask,
  handleDeleteTask,
  handleCompleteTask,
  handleReopenTask,
  findTaskByIdOrName,
  taskCache,
} from "./crud.js";

// Bulk operations for multiple tasks
export {
  filterTasksByCriteria,
  handleBulkCreateTasks,
  handleBulkUpdateTasks,
  handleBulkDeleteTasks,
  handleBulkCompleteTasks,
} from "./bulk.js";

// Completed tasks retrieval (Sync API)
export { handleGetCompletedTasks } from "./completed.js";

// Quick add with natural language parsing
export { handleQuickAddTask, parseQuickAddText } from "./quick-add.js";
