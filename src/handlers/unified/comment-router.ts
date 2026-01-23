/**
 * Comment Router - Routes todoist_comment actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleCreateComment,
  handleGetComments,
  handleUpdateComment,
  handleDeleteComment,
} from "../comment-handlers.js";
import {
  CreateCommentArgs,
  GetCommentsArgs,
  UpdateCommentArgs,
  DeleteCommentArgs,
} from "../../types.js";

export async function handleCommentAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetComments(api, args as unknown as GetCommentsArgs);
    case "create":
      return handleCreateComment(api, args as unknown as CreateCommentArgs);
    case "update":
      return handleUpdateComment(api, args as unknown as UpdateCommentArgs);
    case "delete":
      return handleDeleteComment(api, args as unknown as DeleteCommentArgs);
    default:
      throw new ValidationError(`Unknown comment action: ${action}`);
  }
}
