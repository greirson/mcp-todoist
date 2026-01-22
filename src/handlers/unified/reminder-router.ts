/**
 * Reminder Router - Routes todoist_reminder actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleGetReminders,
  handleCreateReminder,
  handleUpdateReminder,
  handleDeleteReminder,
} from "../reminder-handlers.js";
import {
  GetRemindersArgs,
  CreateReminderArgs,
  UpdateReminderArgs,
  DeleteReminderArgs,
} from "../../types.js";

export async function handleReminderAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetReminders(api, args as unknown as GetRemindersArgs);
    case "create":
      return handleCreateReminder(api, args as unknown as CreateReminderArgs);
    case "update":
      return handleUpdateReminder(args as unknown as UpdateReminderArgs);
    case "delete":
      return handleDeleteReminder(args as unknown as DeleteReminderArgs);
    default:
      throw new ValidationError(`Unknown reminder action: ${action}`);
  }
}
