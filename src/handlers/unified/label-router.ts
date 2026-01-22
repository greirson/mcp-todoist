/**
 * Label Router - Routes todoist_label and todoist_shared_labels actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleGetLabels,
  handleCreateLabel,
  handleUpdateLabel,
  handleDeleteLabel,
  handleGetLabelStats,
} from "../label-handlers.js";
import {
  handleGetSharedLabels,
  handleRenameSharedLabel,
  handleRemoveSharedLabel,
} from "../shared-label-handlers.js";
import {
  CreateLabelArgs,
  UpdateLabelArgs,
  LabelNameArgs,
  RenameSharedLabelArgs,
  RemoveSharedLabelArgs,
} from "../../types.js";

export async function handleLabelAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetLabels(api);
    case "create":
      return handleCreateLabel(api, args as unknown as CreateLabelArgs);
    case "update":
      return handleUpdateLabel(api, args as unknown as UpdateLabelArgs);
    case "delete":
      return handleDeleteLabel(api, args as unknown as LabelNameArgs);
    case "stats":
      return handleGetLabelStats(api);
    default:
      throw new ValidationError(`Unknown label action: ${action}`);
  }
}

export async function handleSharedLabelsAction(
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetSharedLabels();
    case "rename":
      return handleRenameSharedLabel(args as unknown as RenameSharedLabelArgs);
    case "remove":
      return handleRemoveSharedLabel(args as unknown as RemoveSharedLabelArgs);
    default:
      throw new ValidationError(`Unknown shared labels action: ${action}`);
  }
}
