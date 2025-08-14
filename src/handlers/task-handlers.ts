import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateTaskArgs,
  GetTasksArgs,
  UpdateTaskArgs,
  TaskNameArgs,
  TodoistTaskData,
  TodoistTask,
  BulkCreateTasksArgs,
  BulkUpdateTasksArgs,
  BulkTaskFilterArgs,
} from "../types.js";
import { CacheManager } from "../cache.js";
// Removed unused imports - now using ErrorHandler utility
import { resolveProjectIdentifier } from "../utils/api-helpers.js";
import {
  validateTaskContent,
  validateDescription,
  validatePriority,
  validateDateString,
  validateLabels,
  validateProjectId,
  validateSectionId,
  validateLimit,
  validateTaskIdentifier,
} from "../validation.js";
import {
  extractArrayFromResponse,
  createCacheKey,
  formatTaskForDisplay,
} from "../utils/api-helpers.js";
import { ErrorHandler } from "../utils/error-handling.js";

// Get centralized cache manager and register task cache
const cacheManager = CacheManager.getInstance();
const taskCache = cacheManager.getOrCreateCache<TodoistTask[]>("tasks", 30000, {
  maxSize: 1000, // Limit to 1000 entries
  enableStats: true,
  enableAccessTracking: true,
});

// Using shared utilities from api-helpers.ts

// Helper function to find a task by ID or name
async function findTaskByIdOrName(
  todoistClient: TodoistApi,
  args: { task_id?: string; task_name?: string }
): Promise<TodoistTask> {
  if (!args.task_id && !args.task_name) {
    throw new Error("Either task_id or task_name must be provided");
  }

  let task: TodoistTask | null = null;

  // Try to find by ID first if provided
  if (args.task_id) {
    try {
      const response = await todoistClient.getTask(args.task_id);
      task = response as TodoistTask;
    } catch {
      // If not found by ID, continue to try by name if provided
      if (!args.task_name) {
        ErrorHandler.handleTaskNotFound(`ID: ${args.task_id}`);
      }
    }
  }

  // If not found by ID or ID not provided, try by name
  if (!task && args.task_name) {
    const result = await todoistClient.getTasks();
    const tasks = extractArrayFromResponse<TodoistTask>(result);
    const matchingTask = tasks.find((t: TodoistTask) =>
      t.content.toLowerCase().includes(args.task_name!.toLowerCase())
    );

    if (matchingTask) {
      task = matchingTask;
    } else {
      ErrorHandler.handleTaskNotFound(args.task_name);
    }
  }

  if (!task) {
    ErrorHandler.handleTaskNotFound(
      args.task_id ? `ID: ${args.task_id}` : args.task_name!
    );
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
      priority: args.priority,
    };

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

    return `Task created:\nID: ${task.id}\nTitle: ${task.content}${
      task.description ? `\nDescription: ${task.description}` : ""
    }${task.due ? `\nDue: ${task.due.string}` : ""}${
      task.priority ? `\nPriority: ${task.priority}` : ""
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

  // If task_id is provided, fetch specific task
  if (args.task_id) {
    try {
      const task = await todoistClient.getTask(args.task_id);
      return formatTaskForDisplay(task as TodoistTask);
    } catch {
      return `Task with ID "${args.task_id}" not found`;
    }
  }

  const apiParams: Record<string, string | undefined> = {};
  if (args.project_id) {
    apiParams.projectId = args.project_id;
  }
  if (args.filter) {
    apiParams.filter = args.filter;
  }

  // Create cache key based on parameters
  const cacheKey = createCacheKey("tasks", apiParams);
  let tasks = taskCache.get(cacheKey);

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

  let filteredTasks = tasks || [];
  if (args.priority) {
    filteredTasks = filteredTasks.filter(
      (task) => task.priority === args.priority
    );
  }

  if (args.limit && args.limit > 0) {
    filteredTasks = filteredTasks.slice(0, args.limit);
  }

  const taskList = filteredTasks
    .map((task) => formatTaskForDisplay(task))
    .join("\n\n");

  return filteredTasks.length > 0
    ? taskList
    : "No tasks found matching the criteria";
}

export async function handleUpdateTask(
  todoistClient: TodoistApi,
  args: UpdateTaskArgs
): Promise<string> {
  // Validate that at least one identifier is provided
  validateTaskIdentifier(args.task_id, args.task_name);

  // Clear cache since we're updating
  taskCache.clear();

  const matchingTask = await findTaskByIdOrName(todoistClient, args);

  const updateData: Partial<TodoistTaskData> = {};
  if (args.content) updateData.content = args.content;
  if (args.description !== undefined) updateData.description = args.description;
  if (args.due_string) updateData.dueString = args.due_string;
  if (args.priority) updateData.priority = args.priority;
  if (args.project_id) updateData.projectId = args.project_id;
  if (args.section_id) updateData.sectionId = args.section_id;

  // Workaround: If only project/section is being changed, include current content
  // to avoid API error
  if (
    (args.project_id || args.section_id) &&
    !args.content &&
    Object.keys(updateData).length <= 2
  ) {
    updateData.content = matchingTask.content;
  }

  const updatedTask = await todoistClient.updateTask(
    matchingTask.id,
    updateData
  );

  return `Task "${matchingTask.content}" updated:\nNew Title: ${
    updatedTask.content
  }${
    updatedTask.description
      ? `\nNew Description: ${updatedTask.description}`
      : ""
  }${
    updatedTask.due ? `\nNew Due Date: ${updatedTask.due.string}` : ""
  }${updatedTask.priority ? `\nNew Priority: ${updatedTask.priority}` : ""}`;
}

export async function handleDeleteTask(
  todoistClient: TodoistApi,
  args: TaskNameArgs
): Promise<string> {
  // Validate that at least one identifier is provided
  validateTaskIdentifier(args.task_id, args.task_name);

  // Clear cache since we're deleting
  taskCache.clear();

  const matchingTask = await findTaskByIdOrName(todoistClient, args);

  await todoistClient.deleteTask(matchingTask.id);
  return `Successfully deleted task: "${matchingTask.content}"`;
}

export async function handleCompleteTask(
  todoistClient: TodoistApi,
  args: TaskNameArgs
): Promise<string> {
  // Validate that at least one identifier is provided
  validateTaskIdentifier(args.task_id, args.task_name);

  // Clear cache since we're completing
  taskCache.clear();

  const matchingTask = await findTaskByIdOrName(todoistClient, args);

  await todoistClient.closeTask(matchingTask.id);
  return `Successfully completed task: "${matchingTask.content}"`;
}

// Helper function to filter tasks based on search criteria
function filterTasksByCriteria(
  tasks: TodoistTask[],
  criteria: BulkTaskFilterArgs["search_criteria"]
): TodoistTask[] {
  return tasks.filter((task) => {
    if (criteria.project_id && task.projectId !== criteria.project_id)
      return false;
    if (criteria.priority && task.priority !== criteria.priority) return false;
    if (
      criteria.content_contains &&
      !task.content
        .toLowerCase()
        .includes(criteria.content_contains.toLowerCase())
    )
      return false;

    if (criteria.due_before || criteria.due_after) {
      if (!task.due?.string) return false;

      const taskDate = new Date(task.due.string);
      if (criteria.due_before && taskDate >= new Date(criteria.due_before))
        return false;
      if (criteria.due_after && taskDate <= new Date(criteria.due_after))
        return false;
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
          priority: taskArgs.priority,
        };

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

    let result = `Bulk task creation completed: ${successCount} created, ${errorCount} failed.\n\n`;

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

    const updateData: Partial<TodoistTaskData> = {};
    if (args.updates.content) updateData.content = args.updates.content;
    if (args.updates.description)
      updateData.description = args.updates.description;
    if (args.updates.due_string) updateData.dueString = args.updates.due_string;
    if (args.updates.priority) updateData.priority = args.updates.priority;

    // Resolve project identifier (ID or name) to project ID
    if (args.updates.project_id) {
      try {
        updateData.projectId = await resolveProjectIdentifier(
          todoistClient,
          args.updates.project_id
        );
      } catch (error) {
        return `Failed to resolve project: ${(error as Error).message}`;
      }
    }

    if (args.updates.section_id) updateData.sectionId = args.updates.section_id;

    for (const task of matchingTasks) {
      try {
        const updatedTask = await todoistClient.updateTask(task.id, updateData);
        updatedTasks.push(updatedTask);
      } catch (error) {
        errors.push(
          `Failed to update task "${task.content}": ${(error as Error).message}`
        );
      }
    }

    const successCount = updatedTasks.length;
    const errorCount = errors.length;

    let response = `Bulk update completed: ${successCount} updated, ${errorCount} failed.\n\n`;

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

    let response = `Bulk delete completed: ${successCount} deleted, ${errorCount} failed.\n\n`;

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

    let response = `Bulk complete completed: ${successCount} completed, ${errorCount} failed.\n\n`;

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
