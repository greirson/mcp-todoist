import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateTaskArgs,
  GetTasksArgs,
  TodoistTaskData,
  TodoistTask,
  BulkCreateTasksArgs,
  BulkUpdateTasksArgs,
  BulkTaskFilterArgs,
  GetCompletedTasksArgs,
  CompletedTasksResponse,
  QuickAddTaskArgs,
  QuickAddTaskResult,
} from "../types.js";
import { CacheManager } from "../cache.js";
import {
  ValidationError,
  AuthenticationError,
  TodoistAPIError,
} from "../errors.js";
// Removed unused imports - now using ErrorHandler utility
import { extractTaskIdentifiers } from "../utils/parameter-transformer.js";
import {
  validateTaskContent,
  validateDescription,
  validatePriority,
  validateDateString,
  validateIsoDatetime,
  validateLabels,
  validateProjectId,
  validateSectionId,
  validateLimit,
  validateOffset,
  validateTaskIdentifier,
  validateBulkSearchCriteria,
  VALIDATION_LIMITS,
  validateDurationPair,
} from "../validation.js";
import type { DurationUnit } from "../types.js";
import {
  resolveProjectIdentifier,
  extractArrayFromResponse,
  createCacheKey,
  formatTaskForDisplay,
  extractApiToken,
} from "../utils/api-helpers.js";
import { formatDueDetails, getDueDateOnly } from "../utils/datetime-utils.js";
import { toApiPriority, fromApiPriority } from "../utils/priority-mapper.js";
import { ErrorHandler } from "../utils/error-handling.js";

// Get centralized cache manager and register task cache
const cacheManager = CacheManager.getInstance();
const taskCache = cacheManager.getOrCreateCache<TodoistTask[]>("tasks", 30000, {
  maxSize: 1000, // Limit to 1000 entries
  enableStats: true,
  enableAccessTracking: true,
});

// Using shared utilities from api-helpers.ts

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
    // Handle the response format from the API
    labels = Array.isArray(response) ? response : [];
    labelCache.set(cacheKey, labels);
  }

  return labels || [];
}

// Helper function to find a task by ID or name (handles both snake_case and camelCase)
async function findTaskByIdOrName(
  todoistClient: TodoistApi,
  args: any
): Promise<TodoistTask> {
  // Handle both snake_case and camelCase from MCP framework
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
    validateDurationPair(args.duration, args.duration_unit);

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

    // Format duration for display
    const durationDisplay = task.duration
      ? `\nDuration: ${task.duration.amount} ${task.duration.unit}${task.duration.amount !== 1 ? "s" : ""}`
      : args.duration
        ? `\nDuration: ${args.duration} ${args.duration_unit || "minute"}${args.duration !== 1 ? "s" : ""}`
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
  validateLimit(args.limit);
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
  validateDurationPair(args.duration, args.duration_unit);

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

  // Format duration for display
  const durationProvided = args.duration !== undefined;
  const durationLine = durationProvided
    ? `\nNew Duration: ${args.duration} ${args.duration_unit || "minute"}${args.duration !== 1 ? "s" : ""}`
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

function filterTasksByCriteria(
  tasks: TodoistTask[],
  criteria: BulkTaskFilterArgs["search_criteria"]
): TodoistTask[] {
  return tasks.filter((task) => {
    if (criteria.project_id && task.projectId !== criteria.project_id)
      return false;
    const apiPriorityFilter = toApiPriority(criteria.priority);
    if (apiPriorityFilter !== undefined && task.priority !== apiPriorityFilter)
      return false;
    // Fix for issue #34: Handle empty string in content_contains
    if (criteria.content_contains !== undefined) {
      // Treat empty or whitespace-only strings as "no match"
      const searchTerm = criteria.content_contains.trim();
      if (searchTerm === "") {
        // Empty search should match nothing, not everything
        return false;
      }
      if (!task.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    if (criteria.due_before || criteria.due_after) {
      const taskDate = getDueDateOnly(task.due);
      if (!taskDate) {
        return false;
      }

      const isBeforeThreshold =
        !criteria.due_before || taskDate < criteria.due_before;
      const isAfterThreshold =
        !criteria.due_after || taskDate > criteria.due_after;

      if (!isBeforeThreshold || !isAfterThreshold) {
        return false;
      }
    }

    return true;
  });
}

export async function handleBulkCreateTasks(
  todoistClient: TodoistApi,
  args: BulkCreateTasksArgs
): Promise<string> {
  try {
    const createdTasks: TodoistTask[] = [];
    const errors: string[] = [];

    for (const taskArgs of args.tasks) {
      try {
        // Validate each task input
        validateTaskContent(taskArgs.content);
        validatePriority(taskArgs.priority);
        validateDateString(taskArgs.deadline_date, "deadline_date");
        validateLabels(taskArgs.labels);
        validateProjectId(taskArgs.project_id);
        validateSectionId(taskArgs.section_id);
        validateDurationPair(taskArgs.duration, taskArgs.duration_unit);

        const taskData: TodoistTaskData = {
          content: taskArgs.content,
          description: taskArgs.description,
          dueString: taskArgs.due_string,
        };

        const apiPriority = toApiPriority(taskArgs.priority);
        if (apiPriority !== undefined) {
          taskData.priority = apiPriority;
        }

        if (taskArgs.labels && taskArgs.labels.length > 0) {
          taskData.labels = taskArgs.labels;
        }
        if (taskArgs.deadline_date)
          taskData.deadlineDate = taskArgs.deadline_date;
        if (taskArgs.project_id) taskData.projectId = taskArgs.project_id;
        if (taskArgs.section_id) taskData.sectionId = taskArgs.section_id;

        // Add duration support
        if (taskArgs.duration !== undefined) {
          taskData.duration = taskArgs.duration;
          taskData.durationUnit = (taskArgs.duration_unit ||
            "minute") as DurationUnit;
        }

        // Cast to any to work around SDK's RequireAllOrNone constraint on duration/durationUnit
        const task = await todoistClient.addTask(taskData as any);
        createdTasks.push(task);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        // Provide more specific error messages based on the error
        if (
          errorMessage.includes("400") ||
          errorMessage.includes("Bad Request")
        ) {
          errors.push(
            `Failed to create task "${taskArgs.content}": Invalid request format. Check that all parameters are correct.`
          );
        } else if (
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          errors.push(
            `Failed to create task "${taskArgs.content}": Authentication failed. Check your API token.`
          );
        } else if (
          errorMessage.includes("403") ||
          errorMessage.includes("Forbidden")
        ) {
          errors.push(
            `Failed to create task "${taskArgs.content}": Access denied. You may not have permission to add tasks to this project.`
          );
        } else if (
          errorMessage.includes("404") ||
          errorMessage.includes("Not Found")
        ) {
          errors.push(
            `Failed to create task "${taskArgs.content}": Project or section not found. Verify the IDs are correct.`
          );
        } else {
          errors.push(
            `Failed to create task "${taskArgs.content}": ${errorMessage}`
          );
        }
      }
    }

    // Clear cache after bulk creation
    taskCache.clear();

    const successCount = createdTasks.length;
    const errorCount = errors.length;

    // Check if we're in dry-run mode
    const isDryRun = process.env.DRYRUN === "true";
    const prefix = isDryRun ? "[DRY-RUN] " : "";

    let result = `${prefix}Bulk task creation completed: ${successCount} created, ${errorCount} failed.\n\n`;

    if (successCount > 0) {
      result += "Created tasks:\n";
      result += createdTasks
        .map((task) => `- ${task.content} (ID: ${task.id})`)
        .join("\n");
      result += "\n\n";
    }

    if (errorCount > 0) {
      result += "Errors:\n";
      result += errors.join("\n");
    }

    return result.trim();
  } catch (error) {
    ErrorHandler.handleAPIError("bulk create tasks", error);
  }
}

export async function handleBulkUpdateTasks(
  todoistClient: TodoistApi,
  args: BulkUpdateTasksArgs
): Promise<string> {
  try {
    // Clear cache since we're updating
    taskCache.clear();

    validateBulkSearchCriteria(args.search_criteria);

    const result = await todoistClient.getTasks();
    const allTasks = extractArrayFromResponse<TodoistTask>(result);
    const matchingTasks = filterTasksByCriteria(allTasks, args.search_criteria);

    if (matchingTasks.length === 0) {
      // Provide more helpful information about why no tasks were found
      let debugInfo = "No tasks found matching the search criteria.\n";
      debugInfo += "Search criteria used:\n";
      if (args.search_criteria.project_id) {
        debugInfo += `  - Project ID: ${args.search_criteria.project_id}\n`;
      }
      if (args.search_criteria.content_contains) {
        debugInfo += `  - Content contains: "${args.search_criteria.content_contains}"\n`;
      }
      if (args.search_criteria.priority) {
        debugInfo += `  - Priority: ${args.search_criteria.priority}\n`;
      }
      if (args.search_criteria.due_before) {
        debugInfo += `  - Due before: ${args.search_criteria.due_before}\n`;
      }
      if (args.search_criteria.due_after) {
        debugInfo += `  - Due after: ${args.search_criteria.due_after}\n`;
      }
      debugInfo += `\nTotal tasks searched: ${allTasks.length}`;
      return debugInfo;
    }

    const updatedTasks: TodoistTask[] = [];
    const errors: string[] = [];

    validateLabels(args.updates.labels);
    validateDurationPair(args.updates.duration, args.updates.duration_unit);

    const updateData: Partial<TodoistTaskData> = {};
    if (args.updates.content) updateData.content = args.updates.content;
    if (args.updates.description)
      updateData.description = args.updates.description;
    if (args.updates.due_string) updateData.dueString = args.updates.due_string;
    const apiPriority = toApiPriority(args.updates.priority);
    if (apiPriority !== undefined) updateData.priority = apiPriority;
    const bulkLabelsProvided = Object.prototype.hasOwnProperty.call(
      args.updates,
      "labels"
    );
    if (bulkLabelsProvided) {
      updateData.labels = Array.isArray(args.updates.labels)
        ? args.updates.labels
        : [];
    }

    // Add duration support for bulk updates
    if (args.updates.duration !== undefined) {
      updateData.duration = args.updates.duration;
      updateData.durationUnit = (args.updates.duration_unit ||
        "minute") as DurationUnit;
    }

    let moveProjectId: string | undefined;
    if (args.updates.project_id) {
      try {
        moveProjectId = await resolveProjectIdentifier(
          todoistClient,
          args.updates.project_id
        );
      } catch (error) {
        return `Failed to resolve project: ${(error as Error).message}`;
      }
    }

    const moveSectionId = args.updates.section_id;

    const hasUpdateFields = Object.keys(updateData).length > 0;

    for (const task of matchingTasks) {
      try {
        let latestTask = task;

        if (hasUpdateFields) {
          // Cast to any to work around SDK's RequireAllOrNone constraint on duration/durationUnit
          latestTask = await todoistClient.updateTask(
            task.id,
            updateData as any
          );
        }

        if (moveProjectId && moveProjectId !== latestTask.projectId) {
          const movedTasks = await todoistClient.moveTasks([task.id], {
            projectId: moveProjectId,
          });
          if (movedTasks.length > 0) {
            latestTask = movedTasks[0];
          }
        }

        if (moveSectionId && moveSectionId !== latestTask.sectionId) {
          const movedTasks = await todoistClient.moveTasks([task.id], {
            sectionId: moveSectionId,
          });
          if (movedTasks.length > 0) {
            latestTask = movedTasks[0];
          }
        }

        updatedTasks.push(latestTask);
      } catch (error) {
        errors.push(
          `Failed to update task "${task.content}": ${(error as Error).message}`
        );
      }
    }

    const successCount = updatedTasks.length;
    const errorCount = errors.length;

    // Check if we're in dry-run mode
    const isDryRun = process.env.DRYRUN === "true";
    const prefix = isDryRun ? "[DRY-RUN] " : "";

    let response = `${prefix}Bulk update completed: ${successCount} updated, ${errorCount} failed.\n\n`;

    if (successCount > 0) {
      response += "Updated tasks:\n";
      response += updatedTasks
        .map((task) => `- ${task.content} (ID: ${task.id})`)
        .join("\n");
      response += "\n\n";
    }

    if (errorCount > 0) {
      response += "Errors:\n";
      response += errors.join("\n");
    }

    return response.trim();
  } catch (error) {
    ErrorHandler.handleAPIError("bulk update tasks", error);
  }
}

export async function handleBulkDeleteTasks(
  todoistClient: TodoistApi,
  args: BulkTaskFilterArgs
): Promise<string> {
  try {
    // Clear cache since we're deleting
    taskCache.clear();

    validateBulkSearchCriteria(args.search_criteria);

    const result = await todoistClient.getTasks();
    const allTasks = extractArrayFromResponse<TodoistTask>(result);
    const matchingTasks = filterTasksByCriteria(allTasks, args.search_criteria);

    if (matchingTasks.length === 0) {
      return "No tasks found matching the search criteria.";
    }

    const deletedTasks: string[] = [];
    const errors: string[] = [];

    for (const task of matchingTasks) {
      try {
        await todoistClient.deleteTask(task.id);
        deletedTasks.push(task.content);
      } catch (error) {
        errors.push(
          `Failed to delete task "${task.content}": ${(error as Error).message}`
        );
      }
    }

    const successCount = deletedTasks.length;
    const errorCount = errors.length;

    // Check if we're in dry-run mode
    const isDryRun = process.env.DRYRUN === "true";
    const prefix = isDryRun ? "[DRY-RUN] " : "";

    let response = `${prefix}Bulk delete completed: ${successCount} deleted, ${errorCount} failed.\n\n`;

    if (successCount > 0) {
      response += "Deleted tasks:\n";
      response += deletedTasks.map((content) => `- ${content}`).join("\n");
      response += "\n\n";
    }

    if (errorCount > 0) {
      response += "Errors:\n";
      response += errors.join("\n");
    }

    return response.trim();
  } catch (error) {
    ErrorHandler.handleAPIError("bulk delete tasks", error);
  }
}

export async function handleBulkCompleteTasks(
  todoistClient: TodoistApi,
  args: BulkTaskFilterArgs
): Promise<string> {
  try {
    // Clear cache since we're completing
    taskCache.clear();

    validateBulkSearchCriteria(args.search_criteria);

    const result = await todoistClient.getTasks();
    const allTasks = extractArrayFromResponse<TodoistTask>(result);
    const matchingTasks = filterTasksByCriteria(allTasks, args.search_criteria);

    if (matchingTasks.length === 0) {
      return "No tasks found matching the search criteria.";
    }

    const completedTasks: string[] = [];
    const errors: string[] = [];

    for (const task of matchingTasks) {
      try {
        await todoistClient.closeTask(task.id);
        completedTasks.push(task.content);
      } catch (error) {
        errors.push(
          `Failed to complete task "${task.content}": ${(error as Error).message}`
        );
      }
    }

    const successCount = completedTasks.length;
    const errorCount = errors.length;

    // Check if we're in dry-run mode
    const isDryRun = process.env.DRYRUN === "true";
    const prefix = isDryRun ? "[DRY-RUN] " : "";

    let response = `${prefix}Bulk complete completed: ${successCount} completed, ${errorCount} failed.\n\n`;

    if (successCount > 0) {
      response += "Completed tasks:\n";
      response += completedTasks.map((content) => `- ${content}`).join("\n");
      response += "\n\n";
    }

    if (errorCount > 0) {
      response += "Errors:\n";
      response += errors.join("\n");
    }

    return response.trim();
  } catch (error) {
    ErrorHandler.handleAPIError("bulk complete tasks", error);
  }
}

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

interface QuickAddRequestBody {
  text: string;
  note?: string;
  reminder?: string;
  auto_reminder?: boolean;
  meta?: boolean;
}

/**
 * Handles quick add task using natural language parsing.
 */
export async function handleQuickAddTask(
  apiToken: string,
  args: QuickAddTaskArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("quick add task", async () => {
    if (!args.text || args.text.trim().length === 0) {
      throw new ValidationError("Task text cannot be empty", "text");
    }

    const isDryRun = process.env.DRYRUN === "true";

    if (isDryRun) {
      console.error(`[DRY-RUN] Would quick add task: "${args.text}"`);
      if (args.note) {
        console.error(`[DRY-RUN]   with note: "${args.note}"`);
      }
      if (args.reminder) {
        console.error(`[DRY-RUN]   with reminder: "${args.reminder}"`);
      }
      if (args.auto_reminder) {
        console.error(`[DRY-RUN]   with auto_reminder enabled`);
      }

      const parsed = parseQuickAddText(args.text);

      return (
        `[DRY-RUN] Task would be created:\n` +
        `Text: ${args.text}\n` +
        `Parsed content: ${parsed.content}\n` +
        (parsed.project ? `Project: #${parsed.project}\n` : "") +
        (parsed.labels.length > 0
          ? `Labels: ${parsed.labels.map((l) => `@${l}`).join(", ")}\n`
          : "") +
        (parsed.priority ? `Priority: p${parsed.priority}\n` : "") +
        (parsed.description ? `Description: ${parsed.description}\n` : "") +
        (args.note ? `Note: ${args.note}\n` : "") +
        (args.reminder ? `Reminder: ${args.reminder}\n` : "")
      );
    }

    const requestBody: QuickAddRequestBody = {
      text: args.text.trim(),
    };

    if (args.note) {
      requestBody.note = args.note;
    }
    if (args.reminder) {
      requestBody.reminder = args.reminder;
    }
    if (args.auto_reminder !== undefined) {
      requestBody.auto_reminder = args.auto_reminder;
    }

    const response = await fetch("https://api.todoist.com/api/v1/tasks/quick", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.error || errorJson.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      throw new Error(`Quick Add API error: ${errorMessage}`);
    }

    const responseText = await response.text();
    let taskResult: QuickAddTaskResult | null = null;

    if (responseText && responseText !== "{}") {
      try {
        taskResult = JSON.parse(responseText);
      } catch {
        // Response was not valid JSON, continue without task details
      }
    }

    taskCache.clear();

    let result = "Task created via Quick Add:\n";
    result += `Input: "${args.text}"\n`;

    if (taskResult && taskResult.id) {
      result += `\nCreated Task:\n`;
      result += `ID: ${taskResult.id}\n`;
      if (taskResult.content) {
        result += `Content: ${taskResult.content}\n`;
      }
      if (taskResult.description) {
        result += `Description: ${taskResult.description}\n`;
      }
      if (taskResult.project_name) {
        result += `Project: ${taskResult.project_name}\n`;
      } else if (taskResult.project_id) {
        result += `Project ID: ${taskResult.project_id}\n`;
      }
      if (taskResult.labels && taskResult.labels.length > 0) {
        result += `Labels: ${taskResult.labels.join(", ")}\n`;
      }
      if (taskResult.priority && taskResult.priority !== 1) {
        const displayPriority = fromApiPriority(taskResult.priority);
        if (displayPriority) {
          result += `Priority: ${displayPriority}\n`;
        }
      }
      if (taskResult.due) {
        const dueDetails = formatDueDetails(taskResult.due);
        if (dueDetails) {
          result += `Due: ${dueDetails}\n`;
        }
      }
      if (taskResult.deadline) {
        result += `Deadline: ${taskResult.deadline.date}\n`;
      }
      if (taskResult.url) {
        result += `URL: ${taskResult.url}\n`;
      }
    } else {
      result += "\nTask created successfully (details not returned by API)";
    }

    if (args.note) {
      result += `\nNote added: ${args.note}`;
    }
    if (args.reminder) {
      result += `\nReminder set: ${args.reminder}`;
    }

    return result.trim();
  });
}

function parseQuickAddText(text: string): {
  content: string;
  project: string | null;
  labels: string[];
  priority: number | null;
  description: string | null;
} {
  let content = text;
  let project: string | null = null;
  const labels: string[] = [];
  let priority: number | null = null;
  let description: string | null = null;

  const descMatch = content.match(/\/\/(.*)$/);
  if (descMatch) {
    description = descMatch[1].trim();
    content = content.replace(/\/\/.*$/, "").trim();
  }

  const priorityMatch = content.match(/\bp([1-4])\b/i);
  if (priorityMatch) {
    priority = parseInt(priorityMatch[1], 10);
    content = content.replace(/\bp[1-4]\b/gi, "").trim();
  }

  const projectMatch = content.match(/#(\S+)/);
  if (projectMatch) {
    project = projectMatch[1];
    content = content.replace(/#\S+/g, "").trim();
  }

  const labelMatches = content.match(/@(\S+)/g);
  if (labelMatches) {
    labelMatches.forEach((match) => {
      labels.push(match.substring(1));
    });
    content = content.replace(/@\S+/g, "").trim();
  }

  content = content.replace(/\{[^}]+\}/g, "").trim();
  content = content.replace(/\+\S+/g, "").trim();
  content = content.replace(/\s+/g, " ").trim();

  return { content, project, labels, priority, description };
}
