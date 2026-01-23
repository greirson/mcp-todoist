/**
 * User Router - Routes todoist_user actions to existing handlers
 */

import { ValidationError } from "../../errors.js";
import {
  handleGetUser,
  handleGetProductivityStats,
  handleGetUserSettings,
} from "../user-handlers.js";

export async function handleUserAction(
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetUser();
    case "get_stats":
      return handleGetProductivityStats();
    case "get_settings":
      return handleGetUserSettings();
    default:
      throw new ValidationError(`Unknown user action: ${action}`);
  }
}
