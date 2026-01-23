import { v4 as uuidv4 } from "uuid";
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  MoveTaskArgs,
  ReorderTaskArgs,
  BulkReorderTasksArgs,
  CloseTaskArgs,
  UpdateDayOrderArgs,
  SyncApiResponse,
  TodoistTask,
  TasksResponse,
} from "../types.js";
import {
  ValidationError,
  TaskNotFoundError,
  TodoistAPIError,
} from "../errors.js";
import { extractArrayFromResponse } from "../utils/api-helpers.js";

const SYNC_API_URL = "https://api.todoist.com/sync/v9";

function getApiToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new TodoistAPIError(
      "TODOIST_API_TOKEN environment variable is not set"
    );
  }
  return token;
}

function isDryRunMode(): boolean {
  return process.env.DRYRUN === "true";
}

async function makeSyncRequest(
  body: Record<string, string>
): Promise<SyncApiResponse> {
  const token = getApiToken();

  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    formData.append(key, value);
  }

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Sync API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json() as Promise<SyncApiResponse>;
}

async function executeSyncCommand(
  type: string,
  args: Record<string, unknown>
): Promise<SyncApiResponse> {
  const uuid = uuidv4();
  const command = {
    type,
    uuid,
    args,
  };

  const response = await makeSyncRequest({
    commands: JSON.stringify([command]),
  });

  if (response.sync_status) {
    const status = response.sync_status[uuid];
    if (status && typeof status === "object" && "error" in status) {
      throw new TodoistAPIError(
        `Operation failed: ${status.error} (code: ${status.error_code})`
      );
    }
    if (status !== "ok") {
      throw new TodoistAPIError(`Operation failed with status: ${status}`);
    }
  }

  return response;
}

async function findTaskByName(
  api: TodoistApi,
  taskName: string
): Promise<string> {
  const response = (await api.getTasks()) as TasksResponse;
  const tasks = extractArrayFromResponse(response) as TodoistTask[];
  const normalizedSearch = taskName.toLowerCase();

  const exactMatch = tasks.find(
    (t) => t.content.toLowerCase() === normalizedSearch
  );
  if (exactMatch) return exactMatch.id;

  const partialMatch = tasks.find((t) =>
    t.content.toLowerCase().includes(normalizedSearch)
  );
  if (partialMatch) return partialMatch.id;

  throw new TaskNotFoundError(`No task found matching: "${taskName}"`);
}

async function resolveTaskId(
  api: TodoistApi,
  taskId?: string,
  taskName?: string
): Promise<string> {
  if (taskId) return taskId;
  if (taskName) return findTaskByName(api, taskName);
  throw new ValidationError("Either task_id or task_name must be provided");
}

export async function handleMoveTask(
  api: TodoistApi,
  args: MoveTaskArgs
): Promise<string> {
  const taskId = await resolveTaskId(api, args.task_id, args.task_name);

  if (!args.project_id && !args.section_id && !args.parent_id) {
    throw new ValidationError(
      "At least one destination must be provided: project_id, section_id, or parent_id"
    );
  }

  if (isDryRunMode()) {
    const destinations: string[] = [];
    if (args.project_id) destinations.push(`project ${args.project_id}`);
    if (args.section_id) destinations.push(`section ${args.section_id}`);
    if (args.parent_id) destinations.push(`parent task ${args.parent_id}`);
    console.error(
      `[DRY-RUN] Would move task ${taskId} to ${destinations.join(", ")}`
    );
    return `[DRY-RUN] Would move task ${taskId} to ${destinations.join(", ")}`;
  }

  const commandArgs: Record<string, unknown> = { id: taskId };
  if (args.project_id) commandArgs.project_id = args.project_id;
  if (args.section_id) commandArgs.section_id = args.section_id;
  if (args.parent_id) commandArgs.parent_id = args.parent_id;

  await executeSyncCommand("item_move", commandArgs);

  const destinations: string[] = [];
  if (args.project_id) destinations.push(`project ${args.project_id}`);
  if (args.section_id) destinations.push(`section ${args.section_id}`);
  if (args.parent_id) destinations.push(`parent task ${args.parent_id}`);

  return `Task ${taskId} moved successfully to ${destinations.join(", ")}`;
}

export async function handleReorderTask(
  api: TodoistApi,
  args: ReorderTaskArgs
): Promise<string> {
  const taskId = await resolveTaskId(api, args.task_id, args.task_name);

  if (args.child_order < 0) {
    throw new ValidationError("child_order must be a non-negative integer");
  }

  if (isDryRunMode()) {
    console.error(
      `[DRY-RUN] Would set task ${taskId} order to ${args.child_order}`
    );
    return `[DRY-RUN] Would set task ${taskId} order to ${args.child_order}`;
  }

  await executeSyncCommand("item_reorder", {
    items: [{ id: taskId, child_order: args.child_order }],
  });

  return `Task ${taskId} reordered to position ${args.child_order}`;
}

export async function handleBulkReorderTasks(
  args: BulkReorderTasksArgs
): Promise<string> {
  if (!args.items || args.items.length === 0) {
    throw new ValidationError(
      "At least one item must be provided for reordering"
    );
  }

  for (const item of args.items) {
    if (!item.id || item.child_order < 0) {
      throw new ValidationError(
        "Each item must have a valid id and non-negative child_order"
      );
    }
  }

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would reorder ${args.items.length} tasks`);
    return `[DRY-RUN] Would reorder ${args.items.length} tasks: ${args.items.map((i) => `${i.id}=>${i.child_order}`).join(", ")}`;
  }

  await executeSyncCommand("item_reorder", { items: args.items });

  return `Successfully reordered ${args.items.length} tasks`;
}

export async function handleCloseTask(
  api: TodoistApi,
  args: CloseTaskArgs
): Promise<string> {
  const taskId = await resolveTaskId(api, args.task_id, args.task_name);

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would close task ${taskId}`);
    return `[DRY-RUN] Would close task ${taskId} (for recurring tasks, this completes the current occurrence)`;
  }

  await executeSyncCommand("item_close", { id: taskId });

  return `Task ${taskId} closed successfully (for recurring tasks, this completes the current occurrence)`;
}

export async function handleUpdateDayOrders(
  args: UpdateDayOrderArgs
): Promise<string> {
  if (!args.items || args.items.length === 0) {
    throw new ValidationError("At least one item must be provided");
  }

  for (const item of args.items) {
    if (!item.id || typeof item.day_order !== "number") {
      throw new ValidationError("Each item must have a valid id and day_order");
    }
  }

  if (isDryRunMode()) {
    console.error(
      `[DRY-RUN] Would update day order for ${args.items.length} tasks`
    );
    return `[DRY-RUN] Would update day order for ${args.items.length} tasks in Today view`;
  }

  await executeSyncCommand("item_update_day_orders", {
    ids_to_orders: Object.fromEntries(
      args.items.map((item) => [item.id, item.day_order])
    ),
  });

  return `Successfully updated day order for ${args.items.length} tasks in Today view`;
}
