/**
 * Activity Router - Routes todoist_activity actions to existing handlers
 */

import { ValidationError } from "../../errors.js";
import {
  handleGetActivity,
  handleGetActivityByProject,
  handleGetActivityByDateRange,
} from "../activity-handlers.js";
import {
  GetActivityArgs,
  GetActivityByProjectArgs,
  GetActivityByDateRangeArgs,
} from "../../types.js";

export async function handleActivityAction(
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetActivity(args as unknown as GetActivityArgs);
    case "get_by_project":
      return handleGetActivityByProject(
        args as unknown as GetActivityByProjectArgs
      );
    case "get_by_date_range":
      return handleGetActivityByDateRange(
        args as unknown as GetActivityByDateRangeArgs
      );
    default:
      throw new ValidationError(`Unknown activity action: ${action}`);
  }
}
