/**
 * Filter Router - Routes todoist_filter actions to existing handlers
 */

import { ValidationError } from "../../errors.js";
import {
  handleGetFilters,
  handleCreateFilter,
  handleUpdateFilter,
  handleDeleteFilter,
} from "../filter-handlers.js";
import {
  CreateFilterArgs,
  UpdateFilterArgs,
  FilterNameArgs,
} from "../../types.js";

export async function handleFilterAction(
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetFilters();
    case "create":
      return handleCreateFilter(args as unknown as CreateFilterArgs);
    case "update":
      return handleUpdateFilter(args as unknown as UpdateFilterArgs);
    case "delete":
      return handleDeleteFilter(args as unknown as FilterNameArgs);
    default:
      throw new ValidationError(`Unknown filter action: ${action}`);
  }
}
