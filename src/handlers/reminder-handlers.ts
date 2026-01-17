// Reminder handlers using Todoist Sync API
// The REST API doesn't support reminders, so we use the Sync API directly

import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  TodoistReminder,
  GetRemindersArgs,
  CreateReminderArgs,
  UpdateReminderArgs,
  DeleteReminderArgs,
  SyncResponse,
} from "../types.js";
import {
  ValidationError,
  TaskNotFoundError,
  TodoistAPIError,
} from "../errors.js";
import { SimpleCache } from "../cache.js";

// Cache for reminder data (30 second TTL)
const reminderCache = new SimpleCache<TodoistReminder[]>(30000);

// Todoist Sync API base URL
const SYNC_API_URL = "https://api.todoist.com/sync/v9";

/**
 * Get the API token from the TodoistApi client
 * We need this for direct Sync API calls
 */
function getApiToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new TodoistAPIError("TODOIST_API_TOKEN not configured");
  }
  return token;
}

/**
 * Make a Sync API request
 */
async function syncRequest(
  endpoint: string,
  body: Record<string, unknown>
): Promise<SyncResponse> {
  const token = getApiToken();

  const response = await fetch(`${SYNC_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(
      Object.entries(body).map(([k, v]) => [
        k,
        typeof v === "string" ? v : JSON.stringify(v),
      ])
    ),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Sync API error (${response.status}): ${errorText}`
    );
  }

  return (await response.json()) as SyncResponse;
}

/**
 * Generate a UUID for Sync API commands
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Fetch all reminders from Sync API
 */
async function fetchReminders(): Promise<TodoistReminder[]> {
  const cacheKey = "reminders:all";
  const cached = reminderCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await syncRequest("/sync", {
    sync_token: "*",
    resource_types: JSON.stringify(["reminders"]),
  });

  const reminders = (response.reminders || []).filter((r) => !r.is_deleted);
  reminderCache.set(cacheKey, reminders);

  return reminders;
}

/**
 * Find a task by name or ID
 */
async function findTask(
  todoistClient: TodoistApi,
  taskId?: string,
  taskName?: string
): Promise<{ id: string; content: string }> {
  if (taskId) {
    try {
      const task = await todoistClient.getTask(taskId);
      return { id: task.id, content: task.content };
    } catch {
      throw new TaskNotFoundError(`Task with ID ${taskId} not found`);
    }
  }

  if (!taskName) {
    throw new ValidationError("Either task_id or task_name must be provided");
  }

  const tasks = await todoistClient.getTasks();
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const matchingTask = taskArray.find((t) =>
    t.content.toLowerCase().includes(taskName.toLowerCase())
  );

  if (!matchingTask) {
    throw new TaskNotFoundError(`No task found matching "${taskName}"`);
  }

  return { id: matchingTask.id, content: matchingTask.content };
}

/**
 * Format a reminder for display
 */
function formatReminder(reminder: TodoistReminder): string {
  let details = `ID: ${reminder.id}, Type: ${reminder.type}`;

  if (reminder.type === "relative" && reminder.minute_offset !== undefined) {
    details += `, ${reminder.minute_offset} minutes before due`;
  } else if (reminder.type === "absolute" && reminder.due) {
    details += `, At: ${reminder.due.date}`;
    if (reminder.due.timezone) {
      details += ` (${reminder.due.timezone})`;
    }
  } else if (reminder.type === "location") {
    details += `, Location: ${reminder.name || "unnamed"}`;
    if (reminder.loc_lat && reminder.loc_long) {
      details += ` (${reminder.loc_lat}, ${reminder.loc_long})`;
    }
    if (reminder.loc_trigger) {
      details += `, Trigger: ${reminder.loc_trigger}`;
    }
    if (reminder.radius) {
      details += `, Radius: ${reminder.radius}m`;
    }
  }

  return details;
}

/**
 * Handle getting reminders
 */
export async function handleGetReminders(
  todoistClient: TodoistApi,
  args: GetRemindersArgs
): Promise<string> {
  let reminders = await fetchReminders();

  // Filter by task if specified
  if (args.task_id || args.task_name) {
    const task = await findTask(todoistClient, args.task_id, args.task_name);
    reminders = reminders.filter((r) => r.item_id === task.id);

    if (reminders.length === 0) {
      return `No reminders found for task "${task.content}"`;
    }

    const reminderList = reminders
      .map((r) => `  - ${formatReminder(r)}`)
      .join("\n");
    return `Found ${reminders.length} reminder(s) for task "${task.content}":\n${reminderList}`;
  }

  if (reminders.length === 0) {
    return "No reminders found. Note: Reminders require Todoist Pro or Business plan.";
  }

  // Group reminders by task
  const remindersByTask = new Map<string, TodoistReminder[]>();
  for (const reminder of reminders) {
    const taskReminders = remindersByTask.get(reminder.item_id) || [];
    taskReminders.push(reminder);
    remindersByTask.set(reminder.item_id, taskReminders);
  }

  let output = `Found ${reminders.length} reminder(s) across ${remindersByTask.size} task(s):\n\n`;

  for (const [taskId, taskReminders] of remindersByTask) {
    output += `Task ID: ${taskId}\n`;
    for (const reminder of taskReminders) {
      output += `  - ${formatReminder(reminder)}\n`;
    }
    output += "\n";
  }

  return output.trim();
}

/**
 * Handle creating a reminder
 */
export async function handleCreateReminder(
  todoistClient: TodoistApi,
  args: CreateReminderArgs
): Promise<string> {
  // Validate and find the task
  const task = await findTask(todoistClient, args.task_id, args.task_name);

  // Validate reminder type-specific requirements
  if (args.type === "relative") {
    if (args.minute_offset === undefined) {
      throw new ValidationError(
        "minute_offset is required for relative reminders"
      );
    }
    if (args.minute_offset < 0) {
      throw new ValidationError("minute_offset must be a positive number");
    }
  } else if (args.type === "absolute") {
    if (!args.due_date) {
      throw new ValidationError("due_date is required for absolute reminders");
    }
  } else if (args.type === "location") {
    if (!args.latitude || !args.longitude) {
      throw new ValidationError(
        "latitude and longitude are required for location reminders"
      );
    }
    if (!args.location_trigger) {
      throw new ValidationError(
        "location_trigger (on_enter or on_leave) is required for location reminders"
      );
    }
  }

  // Build the command arguments
  const commandArgs: Record<string, unknown> = {
    item_id: task.id,
    type: args.type,
  };

  if (args.type === "relative") {
    commandArgs.minute_offset = args.minute_offset;
  } else if (args.type === "absolute") {
    commandArgs.due = {
      date: args.due_date,
      ...(args.timezone && { timezone: args.timezone }),
    };
  } else if (args.type === "location") {
    commandArgs.name = args.location_name || "Location reminder";
    commandArgs.loc_lat = args.latitude;
    commandArgs.loc_long = args.longitude;
    commandArgs.loc_trigger = args.location_trigger;
    if (args.radius) {
      commandArgs.radius = args.radius;
    }
  }

  const tempId = generateUUID();
  const uuid = generateUUID();

  const response = await syncRequest("/sync", {
    commands: JSON.stringify([
      {
        type: "reminder_add",
        temp_id: tempId,
        uuid: uuid,
        args: commandArgs,
      },
    ]),
  });

  // Check for errors
  if (response.sync_status[uuid] !== "ok") {
    const status = response.sync_status[uuid];
    if (typeof status === "object" && status !== null) {
      throw new TodoistAPIError(
        `Failed to create reminder: ${JSON.stringify(status)}`
      );
    }
    throw new TodoistAPIError(`Failed to create reminder: ${status}`);
  }

  // Clear cache
  reminderCache.clear();

  const reminderId = response.temp_id_mapping?.[tempId] || "unknown";

  let successMessage = `Created ${args.type} reminder (ID: ${reminderId}) for task "${task.content}"`;

  if (args.type === "relative") {
    successMessage += ` - ${args.minute_offset} minutes before due`;
  } else if (args.type === "absolute") {
    successMessage += ` - at ${args.due_date}`;
  } else if (args.type === "location") {
    successMessage += ` - at ${args.location_name || "location"} (${args.location_trigger})`;
  }

  return successMessage;
}

/**
 * Handle updating a reminder
 */
export async function handleUpdateReminder(
  args: UpdateReminderArgs
): Promise<string> {
  if (!args.reminder_id) {
    throw new ValidationError("reminder_id is required");
  }

  // Build the update arguments
  const commandArgs: Record<string, unknown> = {
    id: args.reminder_id,
  };

  if (args.type) {
    commandArgs.type = args.type;
  }

  if (args.minute_offset !== undefined) {
    commandArgs.minute_offset = args.minute_offset;
  }

  if (args.due_date) {
    commandArgs.due = {
      date: args.due_date,
      ...(args.timezone && { timezone: args.timezone }),
    };
  }

  if (args.location_name) {
    commandArgs.name = args.location_name;
  }

  if (args.latitude) {
    commandArgs.loc_lat = args.latitude;
  }

  if (args.longitude) {
    commandArgs.loc_long = args.longitude;
  }

  if (args.location_trigger) {
    commandArgs.loc_trigger = args.location_trigger;
  }

  if (args.radius !== undefined) {
    commandArgs.radius = args.radius;
  }

  const uuid = generateUUID();

  const response = await syncRequest("/sync", {
    commands: JSON.stringify([
      {
        type: "reminder_update",
        uuid: uuid,
        args: commandArgs,
      },
    ]),
  });

  // Check for errors
  if (response.sync_status[uuid] !== "ok") {
    const status = response.sync_status[uuid];
    if (typeof status === "object" && status !== null) {
      throw new TodoistAPIError(
        `Failed to update reminder: ${JSON.stringify(status)}`
      );
    }
    throw new TodoistAPIError(`Failed to update reminder: ${status}`);
  }

  // Clear cache
  reminderCache.clear();

  const changes: string[] = [];
  if (args.type) changes.push(`type: ${args.type}`);
  if (args.minute_offset !== undefined)
    changes.push(`minute_offset: ${args.minute_offset}`);
  if (args.due_date) changes.push(`due_date: ${args.due_date}`);
  if (args.location_name) changes.push(`location: ${args.location_name}`);
  if (args.location_trigger) changes.push(`trigger: ${args.location_trigger}`);

  return `Updated reminder (ID: ${args.reminder_id})${changes.length > 0 ? ` - ${changes.join(", ")}` : ""}`;
}

/**
 * Handle deleting a reminder
 */
export async function handleDeleteReminder(
  args: DeleteReminderArgs
): Promise<string> {
  if (!args.reminder_id) {
    throw new ValidationError("reminder_id is required");
  }

  const uuid = generateUUID();

  const response = await syncRequest("/sync", {
    commands: JSON.stringify([
      {
        type: "reminder_delete",
        uuid: uuid,
        args: {
          id: args.reminder_id,
        },
      },
    ]),
  });

  // Check for errors
  if (response.sync_status[uuid] !== "ok") {
    const status = response.sync_status[uuid];
    if (typeof status === "object" && status !== null) {
      throw new TodoistAPIError(
        `Failed to delete reminder: ${JSON.stringify(status)}`
      );
    }
    throw new TodoistAPIError(`Failed to delete reminder: ${status}`);
  }

  // Clear cache
  reminderCache.clear();

  return `Deleted reminder (ID: ${args.reminder_id})`;
}

/**
 * Clear reminder cache (useful for testing)
 */
export function clearReminderCache(): void {
  reminderCache.clear();
}
