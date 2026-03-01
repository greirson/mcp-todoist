import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  GetCompletedTasksArgs,
  CompletedTasksResponse,
} from "../../types/index.js";
import { AuthenticationError, TodoistAPIError } from "../../errors.js";
import {
  validateLimit,
  validateIsoDatetime,
  validateProjectId,
  VALIDATION_LIMITS,
} from "../../validation/index.js";
import { extractApiToken } from "../../utils/api-helpers.js";
import { ErrorHandler } from "../../utils/error-handling.js";
import { API_V1_BASE } from "../../utils/api-constants.js";

/**
 * Fetches completed tasks from the Todoist API v1.
 * The v1 endpoint requires since/until params (max 3 month range)
 * and uses cursor-based pagination instead of offset.
 */
export async function handleGetCompletedTasks(
  todoistClient: TodoistApi,
  args: GetCompletedTasksArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("get completed tasks", async () => {
    validateLimit(args.limit, VALIDATION_LIMITS.SYNC_API_LIMIT_MAX);
    validateIsoDatetime(args.since, "since");
    validateIsoDatetime(args.until, "until");
    validateProjectId(args.project_id);

    if (process.env.DRYRUN === "true") {
      console.error("[DRY-RUN] Would fetch completed tasks from API v1");
      console.error(
        `[DRY-RUN] Parameters: project_id=${args.project_id || "all"}, since=${args.since || "default"}, until=${args.until || "default"}, limit=${args.limit || 30}`
      );
      return "DRY-RUN: Would retrieve completed tasks from Todoist API v1. No actual API call made.";
    }

    const apiToken = extractApiToken(todoistClient);

    // v1 API requires since/until — default to last 2 weeks if not provided
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const since =
      args.since || twoWeeksAgo.toISOString().replace(/\.\d{3}Z$/, "Z");
    const until = args.until || now.toISOString().replace(/\.\d{3}Z$/, "Z");

    const params = new URLSearchParams();
    params.append("since", since);
    params.append("until", until);
    if (args.project_id) {
      params.append("project_id", args.project_id);
    }
    if (args.limit !== undefined) {
      params.append("limit", args.limit.toString());
    }

    const url = `${API_V1_BASE}/tasks/completed/by_completion_date?${params.toString()}`;

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
        `API error (${response.status}): ${errorText}`
      );
    }

    const data: CompletedTasksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return "No completed tasks found matching the criteria.";
    }

    // Build project name lookup by fetching unique project IDs via SDK
    const uniqueProjectIds = [
      ...new Set(data.items.map((item) => item.project_id)),
    ];
    const projectNames: Record<string, string> = {};
    for (const projectId of uniqueProjectIds) {
      try {
        const project = await todoistClient.getProject(projectId);
        projectNames[projectId] = project.name;
      } catch {
        projectNames[projectId] = "Unknown Project";
      }
    }

    const taskCount = data.items.length;
    const taskWord = taskCount === 1 ? "task" : "tasks";

    let result = `${taskCount} completed ${taskWord} found:\n\n`;

    for (const item of data.items) {
      const projectName = projectNames[item.project_id] || "Unknown Project";
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
