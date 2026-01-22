/**
 * Subtask Router - Routes todoist_subtask actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleCreateSubtask,
  handleConvertToSubtask,
  handlePromoteSubtask,
  handleGetTaskHierarchy,
  handleBulkCreateSubtasks,
} from "../subtask-handlers.js";
import {
  CreateSubtaskArgs,
  BulkCreateSubtasksArgs,
  ConvertToSubtaskArgs,
  PromoteSubtaskArgs,
  GetTaskHierarchyArgs,
} from "../../types.js";
import { formatTaskHierarchy } from "../../utils/formatters.js";

export async function handleSubtaskAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "create": {
      const result = await handleCreateSubtask(
        api,
        args as unknown as CreateSubtaskArgs
      );
      return `Subtask created:\nID: ${result.subtask.id}\nContent: ${result.subtask.content}\nParent: ${result.parent.content} (ID: ${result.parent.id})`;
    }
    case "bulk_create": {
      const result = await handleBulkCreateSubtasks(
        api,
        args as unknown as BulkCreateSubtasksArgs
      );
      let response = `Bulk subtask creation completed for parent "${result.parent.content}":\n`;
      response += `Created: ${result.created.length}, Failed: ${result.failed.length}\n\n`;
      if (result.created.length > 0) {
        response += "Created subtasks:\n";
        response += result.created
          .map((t) => `- ${t.content} (ID: ${t.id})`)
          .join("\n");
      }
      if (result.failed.length > 0) {
        response += "\n\nFailed:\n";
        response += result.failed
          .map((f) => `- ${f.task.content}: ${f.error}`)
          .join("\n");
      }
      return response;
    }
    case "convert": {
      const result = await handleConvertToSubtask(
        api,
        args as unknown as ConvertToSubtaskArgs
      );
      return `Task converted to subtask:\nID: ${result.task.id}\nContent: ${result.task.content}\nParent: ${result.parent.content} (ID: ${result.parent.id})`;
    }
    case "promote": {
      const result = await handlePromoteSubtask(
        api,
        args as unknown as PromoteSubtaskArgs
      );
      return `Subtask promoted to task:\nID: ${result.id}\nContent: ${result.content}\nProject: ${result.projectId}`;
    }
    case "hierarchy": {
      const result = await handleGetTaskHierarchy(
        api,
        args as unknown as GetTaskHierarchyArgs
      );
      return formatTaskHierarchy(result);
    }
    default:
      throw new ValidationError(`Unknown subtask action: ${action}`);
  }
}
