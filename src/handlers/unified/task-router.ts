/**
 * Task Router - Routes todoist_task and todoist_task_bulk actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleCreateTask,
  handleGetTasks,
  handleUpdateTask,
  handleDeleteTask,
  handleCompleteTask,
  handleReopenTask,
  handleQuickAddTask,
  handleBulkCreateTasks,
  handleBulkUpdateTasks,
  handleBulkDeleteTasks,
  handleBulkCompleteTasks,
  handleGetCompletedTasks,
} from "../task-handlers.js";
import {
  CreateTaskArgs,
  GetTasksArgs,
  QuickAddTaskArgs,
  BulkCreateTasksArgs,
  BulkUpdateTasksArgs,
  BulkTaskFilterArgs,
  GetCompletedTasksArgs,
} from "../../types.js";
import { extractApiToken } from "../../utils/api-helpers.js";

export async function handleTaskAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "create":
      return handleCreateTask(api, args as unknown as CreateTaskArgs);
    case "get":
      return handleGetTasks(api, args as unknown as GetTasksArgs);
    case "update":
      return handleUpdateTask(api, args);
    case "delete":
      return handleDeleteTask(api, args);
    case "complete":
      return handleCompleteTask(api, args);
    case "reopen":
      return handleReopenTask(api, args);
    case "quick_add": {
      const apiToken = extractApiToken(api);
      return handleQuickAddTask(apiToken, args as unknown as QuickAddTaskArgs);
    }
    default:
      throw new ValidationError(`Unknown task action: ${action}`);
  }
}

export async function handleTaskBulkAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "bulk_create":
      return handleBulkCreateTasks(api, args as unknown as BulkCreateTasksArgs);
    case "bulk_update":
      return handleBulkUpdateTasks(api, args as unknown as BulkUpdateTasksArgs);
    case "bulk_delete":
      return handleBulkDeleteTasks(api, args as unknown as BulkTaskFilterArgs);
    case "bulk_complete":
      return handleBulkCompleteTasks(
        api,
        args as unknown as BulkTaskFilterArgs
      );
    default:
      throw new ValidationError(`Unknown bulk task action: ${action}`);
  }
}

export async function handleCompletedAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetCompletedTasks(
        api,
        args as unknown as GetCompletedTasksArgs
      );
    default:
      throw new ValidationError(`Unknown completed tasks action: ${action}`);
  }
}
