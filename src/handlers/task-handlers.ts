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
} from "../types.js";
import { CacheManager } from "../cache.js";
import { ValidationError } from "../errors.js";
// Removed unused imports - now using ErrorHandler utility
import { extractTaskIdentifiers } from "../utils/parameter-transformer.js";
import {
  validateTaskContent,
  validateDescription,
  validatePriority,
  validateDateString,
  validateLabels,
  validateProjectId,
  validateSectionId,
  validateLimit,
  validateOffset,
  validateTaskIdentifier,
  validateBulkSearchCriteria,
} from "../validation.js";
import {
  resolveProjectIdentifier,
  extractArrayFromResponse,
  createCacheKey,
  formatTaskForDisplay,
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

    const task = await todoistClient.addTask(taskData);

    // Clear cache after creating task
    taskCache.clear();

    const displayPriority = fromApiPriority(task.priority);
    const dueDetails = formatDueDetails(task.due);

    // Check if this was a dry-run operation
    const isDryRun = (task as any).__dryRun === true;
    const prefix = isDryRun ? "[DRY-RUN] " : "";

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
    }${args.section_id ? `\nSection ID: ${args.section_id}` : ""}`;
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

  let latestTask = matchingTask;

  if (Object.keys(updateData).length > 0) {
    latestTask = await todoistClient.updateTask(matchingTask.id, updateData);
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

  return `${prefix}Task "${matchingTask.content}" updated:\nNew Title: ${
    latestTask.content
  }${
    latestTask.description ? `\nNew Description: ${latestTask.description}` : ""
  }${updatedDueDetails ? `\nNew Due Date: ${updatedDueDetails}` : ""}${
    displayUpdatedPriority ? `\nNew Priority: ${displayUpdatedPriority}` : ""
  }${projectLine}${sectionLine}${labelsLine}`;
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

        const task = await todoistClient.addTask(taskData);
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
          latestTask = await todoistClient.updateTask(task.id, updateData);
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
 * The REST API doesn't support fetching completed tasks, so we use the Sync API directly.
 */
export async function handleGetCompletedTasks(
  todoistClient: TodoistApi,
  args: GetCompletedTasksArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("get completed tasks", async () => {
    // Validate inputs
    validateLimit(args.limit, 200);
    validateOffset(args.offset);
    validateDateString(args.since, "since");
    validateDateString(args.until, "until");
    validateProjectId(args.project_id);

    // Extract API token from TodoistApi client
    const apiToken: string | undefined =
      (todoistClient as any).authToken ??
      (todoistClient as any).token ??
      (todoistClient as any).apiToken;

    if (!apiToken) {
      throw new Error("Missing API token in TodoistApi client instance.");
    }

    // Build query parameters
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
        throw new Error("Authentication failed. Check your API token.");
      } else if (response.status === 403) {
        throw new Error("Access denied. Premium feature may be required.");
      }
      throw new Error(`Todoist API error (${response.status}): ${errorText}`);
    }

    const data: CompletedTasksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return "No completed tasks found matching the criteria.";
    }

    // Format the response
    const taskCount = data.items.length;
    const taskWord = taskCount === 1 ? "task" : "tasks";

    let result = `${taskCount} completed ${taskWord} found:\n\n`;

    for (const item of data.items) {
      // Get project name if available
      const projectName =
        data.projects[item.project_id]?.name || "Unknown Project";

      // Format completion date
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
