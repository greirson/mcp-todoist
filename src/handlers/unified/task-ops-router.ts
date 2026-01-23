/**
 * Task Operations Router - Routes todoist_task_ops actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleMoveTask,
  handleReorderTask,
  handleBulkReorderTasks,
  handleCloseTask,
  handleUpdateDayOrders,
} from "../item-operations-handlers.js";
import {
  MoveTaskArgs,
  ReorderTaskArgs,
  BulkReorderTasksArgs,
  CloseTaskArgs,
  UpdateDayOrderArgs,
} from "../../types.js";

export async function handleTaskOpsAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "move":
      return handleMoveTask(api, args as unknown as MoveTaskArgs);
    case "reorder":
      return handleReorderTask(api, args as unknown as ReorderTaskArgs);
    case "bulk_reorder":
      return handleBulkReorderTasks(args as unknown as BulkReorderTasksArgs);
    case "close":
      return handleCloseTask(api, args as unknown as CloseTaskArgs);
    case "day_order":
      return handleUpdateDayOrders(args as unknown as UpdateDayOrderArgs);
    default:
      throw new ValidationError(`Unknown task operations action: ${action}`);
  }
}
