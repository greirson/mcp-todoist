import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateTaskArgs,
  GetTasksArgs,
  TodoistTaskData,
  TodoistTask,
} from "../../types/index.js";
import { CacheManager } from "../../cache/index.js";
import { ValidationError } from "../../errors.js";
import { extractTaskIdentifiers } from "../../utils/parameter-transformer.js";
import {
  validateTaskContent,
  validateDescription,
  validatePriority,
  validateDateString,
  validateLabels,
  validateProjectId,
  validateSectionId,
  validateTaskIdentifier,
  validateDurationPair,
  validateLimit,
} from "../../validation/index.js";
import type { DurationUnit } from "../../types/index.js";
import {
  extractArrayFromResponse,
  createCacheKey,
  formatTaskForDisplay,
} from "../../utils/api-helpers.js";
import {
  formatDueDetails,
  getDueDateOnly,
} from "../../utils/datetime-utils.js";
import { toApiPriority, fromApiPriority } from "../../utils/priority-mapper.js";
import { ErrorHandler } from "../../utils/error-handling.js";

// Get centralized cache manager and register task cache
const cacheManager = CacheManager.getInstance();
const taskCache = cacheManager.getOrCreateCache<TodoistTask[]>("tasks", 30000, {
  maxSize: 1000,
  enableStats: true,
  enableAccessTracking: true,
});

// Helper function to get all labels with caching
async function getAllLabels(
  todoistClient: TodoistApi
): Promise<{ id: string; name: string }[]> {
  const labelCache = cacheManager.getOrCreateCache<
    { id: string; name: string }[]
  >("labels", 30000);
  const cacheKey = "all_labels";

  let labels = labelCache.get(cacheKey);
  if (!labels) {
    const response = await todoistClient.getLabels();
    labels = Array.isArray(response) ? response : [];
    labelCache.set(cacheKey, labels);
  }

  return labels || [];
}

// Helper function to find a task by ID or name (handles both snake_case and camelCase)
export async function findTaskByIdOrName(
  todoistClient: TodoistApi,
  args: any
): Promise<TodoistTask> {
  const { taskId, taskName } = extractTaskIdentifiers(args);

  if (!taskId && !taskName) {
    throw new Error(
      "Either task_id/taskId or task_name/taskName must be provided"
    );
  }

  let task: TodoistTask | null = null;

  // Try to find by ID first if provided
  if (taskId) {
    try {
      const response = await todoistClient.getTask(taskId);
      task = response as TodoistTask;
    } catch {
      // If not found by ID, continue to try by name if provided
      if (!taskName) {
        ErrorHandler.handleTaskNotFound(`ID: ${taskId}`);
      }
    }
  }

  // If not found by ID or ID not provided, try by name
  if (!task && taskName) {
    const result = await todoistClient.getTasks();
    const tasks = extractArrayFromResponse<TodoistTask>(result);
    const matchingTask = tasks.find((t: TodoistTask) =>
      t.content.toLowerCase().includes(taskName.toLowerCase())
    );

    if (matchingTask) {
      task = matchingTask;
    } else {
      ErrorHandler.handleTaskNotFound(taskName);
    }
  }

  if (!task) {
    ErrorHandler.handleTaskNotFound(taskId ? `ID: ${taskId}` : taskName!);
  }

  return task!;
}

// Export task cache for use by other modules
export { taskCache };

export async function handleCreateTask(
  todoistClient: TodoistApi,
  args: CreateTaskArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("create task", async () => {
    // Validate and sanitize input
    const sanitizedContent = validateTaskContent(args.content);
    const sanitizedDescription = validateDescription(args.description);
    validatePriority(args.priority);
    validateDateString(args.deadline_date, "deadline_date");
    validateLabels(args.labels);
    validateProjectId(args.project_id);
    validateSectionId(args.section_id);
    validateDurationPair(args.duration, args.duration_unit, args.due_string);

    const taskData: TodoistTaskData = {
      content: sanitizedContent,
      description: sanitizedDescription,
      dueString: args.due_string,
    };

    const apiPriority = toApiPriority(args.priority);
    if (apiPriority !== undefined) {
      taskData.priority = apiPriority;
    }

    if (args.labels && args.labels.length > 0) {
      taskData.labels = args.labels;
    }

    if (args.deadline_date) {
      taskData.deadlineDate = args.deadline_date;
    }

    if (args.project_id) {
      taskData.projectId = args.project_id;
    }

    if (args.section_id) {
      taskData.sectionId = args.section_id;
    }

    // Add duration support
    if (args.duration !== undefined) {
      taskData.duration = args.duration;
      taskData.durationUnit = (args.duration_unit || "minute") as DurationUnit;
    }

    // Add advanced task ordering/visibility options
    if (args.child_order !== undefined) {
      (taskData as unknown as Record<string, unknown>).childOrder =
        args.child_order;
    }
    if (args.day_order !== undefined) {
      (taskData as unknown as Record<string, unknown>).dayOrder =
        args.day_order;
    }
    if (args.is_collapsed !== undefined) {
      (taskData as unknown as Record<string, unknown>).isCollapsed =
        args.is_collapsed;
    }

    // Cast to any to work around SDK's RequireAllOrNone constraint on duration/durationUnit
    // We've validated the pair in validateDurationPair() so this is safe
    const task = await todoistClient.addTask(taskData as any);

    // Clear cache after creating task
    taskCache.clear();

    const displayPriority = fromApiPriority(task.priority);
    const dueDetails = formatDueDetails(task.due);

    // Check if this was a dry-run operation
    const isDryRun = (task as any).__dryRun === true;
    const prefix = isDryRun ? "[DRY-RUN] " : "";

    // Format duration for display - only show if API returned it (not from input args)
    const durationDisplay = task.duration
      ? `\nDuration: ${task.duration.amount} ${task.duration.unit}${task.duration.amount !== 1 ? "s" : ""}`
      : "";

    return `${prefix}Task created:\nID: ${task.id}\nTitle: ${task.content}${
      task.description ? `\nDescription: ${task.description}` : ""
    }${dueDetails ? `\nDue: ${dueDetails}` : ""}${
      displayPriority ? `\nPriority: ${displayPriority}` : ""
    }${
      task.labels && task.labels.length > 0
        ? `\nLabels: ${task.labels.join(", ")}`
        : ""
    }${args.deadline_date ? `\nDeadline: ${args.deadline_date}` : ""}${
      args.project_id ? `\nProject ID: ${args.project_id}` : ""
    }${args.section_id ? `\nSection ID: ${args.section_id}` : ""}${durationDisplay}`;
  });
}

export async function handleGetTasks(
  todoistClient: TodoistApi,
  args: GetTasksArgs
): Promise<string> {
  // Validate input
  validatePriority(args.priority);
  validateProjectId(args.project_id);
  if (args.limit !== undefined) {
    validateLimit(args.limit);
  }
  if (args.due_before) {
    validateDateString(args.due_before, "due_before");
  }
  if (args.due_after) {
    validateDateString(args.due_after, "due_after");
  }

  // If task_id is provided, fetch specific task
  if (args.task_id) {
    try {
      const task = await todoistClient.getTask(args.task_id);
      return formatTaskForDisplay(task as TodoistTask);
    } catch {
      return `Task with ID "${args.task_id}" not found`;
    }
  }

  const filterString = args.filter?.trim();
  const language = args.lang?.trim();
  const dueBefore = args.due_before?.trim();
  const dueAfter = args.due_after?.trim();

  let tasks: TodoistTask[] | null = null;

  if (filterString) {
    const filterCacheKey = createCacheKey("tasks_filter", {
      filter: filterString,
      lang: language,
      limit: args.limit,
    });
    tasks = taskCache.get(filterCacheKey);

    if (!tasks) {
      try {
        const result = await todoistClient.getTasksByFilter({
          query: filterString,
          lang: language,
          limit: args.limit,
        });
        tasks = extractArrayFromResponse<TodoistTask>(result);
        taskCache.set(filterCacheKey, tasks);
      } catch (error: unknown) {
        // Check if it's a 400 Bad Request from invalid filter syntax
        if (error instanceof Error && error.message.includes("400")) {
          throw new ValidationError(
            `Invalid filter syntax "${filterString}". The filter parameter expects Todoist filter syntax ` +
              `like 'today', 'overdue', 'p1', or 'search:"${filterString}"'. ` +
              `For simple text search, use the task_name parameter instead.`,
            "filter"
          );
        }
        // Re-throw other errors
        throw error;
      }
    }
  } else {
    const apiParams: Record<string, string | number | undefined> = {};
    if (args.project_id) {
      apiParams.projectId = args.project_id;
    }
    if (args.label_id) {
      apiParams.label = args.label_id;
    }
    if (args.limit && args.limit > 0) {
      apiParams.limit = args.limit;
    }

    const cacheKey = createCacheKey("tasks", apiParams);
    tasks = taskCache.get(cacheKey);

    if (!tasks) {
      const result = await todoistClient.getTasks(
        Object.keys(apiParams).length > 0
          ? (apiParams as Parameters<typeof todoistClient.getTasks>[0])
          : undefined
      );
      // Handle both array response and object response formats
      tasks = extractArrayFromResponse<TodoistTask>(result);
      taskCache.set(cacheKey, tasks);
    }
  }

  let filteredTasks = tasks || [];

  if (args.project_id) {
    filteredTasks = filteredTasks.filter(
      (task) => task.projectId === args.project_id
    );
  }

  // Handle label filtering - support both IDs and names
  if (args.label_id) {
    let labelName = args.label_id;

    // Remove @ prefix if present
    if (labelName.startsWith("@")) {
      labelName = labelName.substring(1);
    }

    // Check if it's a numeric ID and resolve to name
    if (/^\d+$/.test(labelName)) {
      const labels = await getAllLabels(todoistClient);
      const label = labels.find((l) => l.id === labelName);
      labelName = label ? label.name : labelName;
    }

    // Filter tasks by label name
    filteredTasks = filteredTasks.filter((task) =>
      Array.isArray(task.labels) ? task.labels.includes(labelName) : false
    );
  }

  // Handle @label syntax in filter parameter
  if (filterString) {
    const labelMatches = filterString.match(/@([\w-]+)/g);
    if (labelMatches) {
      const requiredLabels = labelMatches.map((m) => m.substring(1));

      // Check if it's an AND condition (all labels required)
      if (filterString.includes("&")) {
        filteredTasks = filteredTasks.filter((task) => {
          if (!Array.isArray(task.labels)) return false;
          return requiredLabels.every((label) => task.labels!.includes(label));
        });
      } else {
        // OR condition (any label matches)
        filteredTasks = filteredTasks.filter((task) => {
          if (!Array.isArray(task.labels)) return false;
          return requiredLabels.some((label) => task.labels!.includes(label));
        });
      }
    }
  }

  const apiPriorityFilter = toApiPriority(args.priority);
  if (apiPriorityFilter !== undefined) {
    filteredTasks = filteredTasks.filter(
      (task) => task.priority === apiPriorityFilter
    );
  }

  if (dueBefore || dueAfter) {
    filteredTasks = filteredTasks.filter((task) => {
      const dueDate = getDueDateOnly(task.due);
      if (!dueDate) {
        return false;
      }

      const isBeforeThreshold = !dueBefore || dueDate < dueBefore;
      const isAfterThreshold = !dueAfter || dueDate > dueAfter;

      return isBeforeThreshold && isAfterThreshold;
    });
  }

  // Apply task_name filter if provided
  if (args.task_name) {
    const searchTerm = args.task_name.toLowerCase();
    filteredTasks = filteredTasks.filter((task) =>
      task.content.toLowerCase().includes(searchTerm)
    );
  }

  if (args.limit && args.limit > 0) {
    filteredTasks = filteredTasks.slice(0, args.limit);
  }

  const taskList = filteredTasks
    .map((task) => formatTaskForDisplay(task))
    .join("\n\n");

  const taskCount = filteredTasks.length;

  if (taskCount === 0) {
    return "No tasks found matching the criteria";
  }

  const taskWord = taskCount === 1 ? "task" : "tasks";
  return `${taskCount} ${taskWord} found:\n\n${taskList}`;
}

export async function handleUpdateTask(
  todoistClient: TodoistApi,
  args: any
): Promise<string> {
  // Handle both snake_case and camelCase
  const { taskId, taskName } = extractTaskIdentifiers(args);

  // Validate that at least one identifier is provided
  validateTaskIdentifier(taskId, taskName);
  validateLabels(args.labels);
  validateDurationPair(args.duration, args.duration_unit, args.due_string);

  // Clear cache since we're updating
  taskCache.clear();

  const matchingTask = await findTaskByIdOrName(todoistClient, args);

  const requestedProjectId =
    typeof args.project_id === "string" ? args.project_id : undefined;
  const requestedSectionId =
    typeof args.section_id === "string" ? args.section_id : undefined;

  const updateData: Partial<TodoistTaskData> = {};
  if (args.content) updateData.content = args.content;
  if (args.description !== undefined) updateData.description = args.description;
  if (args.due_string) updateData.dueString = args.due_string;
  const apiPriorityUpdate = toApiPriority(args.priority);
  if (apiPriorityUpdate !== undefined) updateData.priority = apiPriorityUpdate;
  const labelsProvided = Object.prototype.hasOwnProperty.call(args, "labels");
  if (labelsProvided) {
    updateData.labels = Array.isArray(args.labels) ? args.labels : [];
  }

  // Add duration support
  if (args.duration !== undefined) {
    updateData.duration = args.duration;
    updateData.durationUnit = (args.duration_unit || "minute") as DurationUnit;
  }

  // Add advanced task ordering/visibility options
  if (args.child_order !== undefined) {
    (updateData as unknown as Record<string, unknown>).childOrder =
      args.child_order;
  }
  if (args.day_order !== undefined) {
    (updateData as unknown as Record<string, unknown>).dayOrder =
      args.day_order;
  }
  if (args.is_collapsed !== undefined) {
    (updateData as unknown as Record<string, unknown>).isCollapsed =
      args.is_collapsed;
  }

  let latestTask = matchingTask;

  if (Object.keys(updateData).length > 0) {
    // Cast to any to work around SDK's RequireAllOrNone constraint on duration/durationUnit
    latestTask = await todoistClient.updateTask(
      matchingTask.id,
      updateData as any
    );
  }

  if (requestedProjectId && requestedProjectId !== latestTask.projectId) {
    const movedTasks = await todoistClient.moveTasks([matchingTask.id], {
      projectId: requestedProjectId,
    });
    if (movedTasks.length > 0) {
      latestTask = movedTasks[0];
    }
  }

  if (requestedSectionId && requestedSectionId !== latestTask.sectionId) {
    const movedTasks = await todoistClient.moveTasks([matchingTask.id], {
      sectionId: requestedSectionId,
    });
    if (movedTasks.length > 0) {
      latestTask = movedTasks[0];
    }
  }

  // Check if this was a dry-run operation
  const isDryRun = (latestTask as any).__dryRun === true;
  const prefix = isDryRun ? "[DRY-RUN] " : "";

  const displayUpdatedPriority = fromApiPriority(latestTask.priority);
  const updatedDueDetails = formatDueDetails(latestTask.due);
  const projectLine =
    requestedProjectId && latestTask.projectId
      ? `\nNew Project ID: ${latestTask.projectId}`
      : "";
  const sectionLine = requestedSectionId
    ? `\nNew Section ID: ${latestTask.sectionId ?? "None"}`
    : "";

  const labelsLine = labelsProvided
    ? `\nNew Labels: ${
        latestTask.labels && latestTask.labels.length > 0
          ? latestTask.labels.join(", ")
          : "None"
      }`
    : "";

  // Format duration for display - show from API response, not input args
  const durationLine = latestTask.duration
    ? `\nNew Duration: ${latestTask.duration.amount} ${latestTask.duration.unit}${latestTask.duration.amount !== 1 ? "s" : ""}`
    : "";

  return `${prefix}Task "${matchingTask.content}" updated:\nNew Title: ${
    latestTask.content
  }${
    latestTask.description ? `\nNew Description: ${latestTask.description}` : ""
  }${updatedDueDetails ? `\nNew Due Date: ${updatedDueDetails}` : ""}${
    displayUpdatedPriority ? `\nNew Priority: ${displayUpdatedPriority}` : ""
  }${projectLine}${sectionLine}${labelsLine}${durationLine}`;
}

export async function handleDeleteTask(
  todoistClient: TodoistApi,
  args: any
): Promise<string> {
  // Handle both snake_case and camelCase
  const { taskId, taskName } = extractTaskIdentifiers(args);

  // Validate that at least one identifier is provided
  validateTaskIdentifier(taskId, taskName);

  // Clear cache since we're deleting
  taskCache.clear();

  const matchingTask = await findTaskByIdOrName(todoistClient, args);

  await todoistClient.deleteTask(matchingTask.id);

  // Check if we're in dry-run mode
  const isDryRun = process.env.DRYRUN === "true";
  const prefix = isDryRun ? "[DRY-RUN] " : "";

  return `${prefix}Successfully deleted task: "${matchingTask.content}"`;
}

export async function handleCompleteTask(
  todoistClient: TodoistApi,
  args: any
): Promise<string> {
  // Handle both snake_case and camelCase
  const { taskId, taskName } = extractTaskIdentifiers(args);

  // Validate that at least one identifier is provided
  validateTaskIdentifier(taskId, taskName);

  // Clear cache since we're completing
  taskCache.clear();

  const matchingTask = await findTaskByIdOrName(todoistClient, args);

  await todoistClient.closeTask(matchingTask.id);

  // Check if we're in dry-run mode
  const isDryRun = process.env.DRYRUN === "true";
  const prefix = isDryRun ? "[DRY-RUN] " : "";

  return `${prefix}Successfully completed task: "${matchingTask.content}"`;
}

export async function handleReopenTask(
  todoistClient: TodoistApi,
  args: any
): Promise<string> {
  // Handle both snake_case and camelCase
  const { taskId, taskName } = extractTaskIdentifiers(args);

  // Validate that at least one identifier is provided
  validateTaskIdentifier(taskId, taskName);

  // Clear cache since we're reopening
  taskCache.clear();

  const matchingTask = await findTaskByIdOrName(todoistClient, args);

  await todoistClient.reopenTask(matchingTask.id);

  // Check if we're in dry-run mode
  const isDryRun = process.env.DRYRUN === "true";
  const prefix = isDryRun ? "[DRY-RUN] " : "";

  return `${prefix}Successfully reopened task: "${matchingTask.content}"`;
}
