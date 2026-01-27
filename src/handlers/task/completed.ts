import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  GetCompletedTasksArgs,
  CompletedTasksResponse,
} from "../../types/index.js";
import { AuthenticationError, TodoistAPIError } from "../../errors.js";
import {
  validateLimit,
  validateOffset,
  validateIsoDatetime,
  validateProjectId,
  VALIDATION_LIMITS,
} from "../../validation/index.js";
import { extractApiToken } from "../../utils/api-helpers.js";
import { ErrorHandler } from "../../utils/error-handling.js";

/**
 * Fetches completed tasks from the Todoist Sync API.
 */
export async function handleGetCompletedTasks(
  todoistClient: TodoistApi,
  args: GetCompletedTasksArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("get completed tasks", async () => {
    validateLimit(args.limit, VALIDATION_LIMITS.SYNC_API_LIMIT_MAX);
    validateOffset(args.offset);
    validateIsoDatetime(args.since, "since");
    validateIsoDatetime(args.until, "until");
    validateProjectId(args.project_id);

    if (process.env.DRYRUN === "true") {
      console.error("[DRY-RUN] Would fetch completed tasks from Sync API");
      console.error(
        `[DRY-RUN] Parameters: project_id=${args.project_id || "all"}, since=${args.since || "none"}, until=${args.until || "none"}, limit=${args.limit || 30}, offset=${args.offset || 0}`
      );
      return "DRY-RUN: Would retrieve completed tasks from Todoist Sync API. No actual API call made.";
    }

    const apiToken = extractApiToken(todoistClient);

    const params = new URLSearchParams();
    if (args.project_id) {
      params.append("project_id", args.project_id);
    }
    if (args.since) {
      params.append("since", args.since);
    }
    if (args.until) {
      params.append("until", args.until);
    }
    if (args.limit !== undefined) {
      params.append("limit", args.limit.toString());
    }
    if (args.offset !== undefined) {
      params.append("offset", args.offset.toString());
    }
    if (args.annotate_notes !== undefined) {
      params.append("annotate_notes", args.annotate_notes.toString());
    }

    const queryString = params.toString();
    const url = `https://api.todoist.com/sync/v9/completed/get_all${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new AuthenticationError();
      } else if (response.status === 403) {
        throw new TodoistAPIError(
          "Access denied. Completed tasks may require Todoist Premium."
        );
      }
      throw new TodoistAPIError(
        `Sync API error (${response.status}): ${errorText}`
      );
    }

    const data: CompletedTasksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return "No completed tasks found matching the criteria.";
    }

    const taskCount = data.items.length;
    const taskWord = taskCount === 1 ? "task" : "tasks";

    let result = `${taskCount} completed ${taskWord} found:\n\n`;

    for (const item of data.items) {
      const projectName =
        data.projects[item.project_id]?.name || "Unknown Project";
      const completedDate = item.completed_at.split("T")[0];

      result += `- ${item.content}\n`;
      result += `  Completed: ${completedDate}\n`;
      result += `  Project: ${projectName}\n`;
      if (item.note_count > 0) {
        result += `  Notes: ${item.note_count}\n`;
      }
      result += "\n";
    }

    return result.trim();
  });
}
