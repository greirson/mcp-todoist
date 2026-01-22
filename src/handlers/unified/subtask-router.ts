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
    case "get_hierarchy": {
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

interface TaskNode {
  task: {
    id: string;
    content: string;
    isCompleted?: boolean;
  };
  children: TaskNode[];
  depth: number;
  completionPercentage: number;
  isOriginalTask?: boolean;
}

interface TaskHierarchy {
  root: TaskNode;
  totalTasks: number;
  completedTasks: number;
  overallCompletion: number;
}

function formatTaskHierarchy(hierarchy: TaskHierarchy): string {
  const lines: string[] = [];
  lines.push(`Task Hierarchy (${hierarchy.overallCompletion}% complete)`);
  lines.push(
    `Total: ${hierarchy.totalTasks} tasks, Completed: ${hierarchy.completedTasks}`
  );
  lines.push("");

  function formatNode(node: TaskNode, prefix: string = ""): void {
    const marker = node.isOriginalTask ? ">>>" : "";
    const status = node.task.isCompleted ? "[x]" : "[ ]";
    const completion =
      node.children.length > 0 ? ` (${node.completionPercentage}%)` : "";
    lines.push(
      `${prefix}${status} ${node.task.content}${completion} ${marker}`
    );

    node.children.forEach((child, index) => {
      const isLast = index === node.children.length - 1;
      const connector = isLast ? "\\-- " : "|-- ";
      formatNode(child, prefix + connector.substring(0, 4));
    });
  }

  formatNode(hierarchy.root);
  return lines.join("\n");
}
