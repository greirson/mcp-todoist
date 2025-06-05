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
import { SimpleCache } from "../cache.js";
import { TaskNotFoundError, TodoistAPIError } from "../errors.js";
import {
  validateTaskContent,
  validatePriority,
  validateDateString,
  validateLabels,
  validateProjectId,
  validateSectionId,
  validateLimit,
} from "../validation.js";

// Cache for task data (30 second TTL)
const taskCache = new SimpleCache<TodoistTask[]>(30000);

// Helper function to handle API response format changes
function extractTasksArray(result: unknown): TodoistTask[] {
  if (Array.isArray(result)) {
    return result as TodoistTask[];
  }

  const responseObj = result as {
    results?: TodoistTask[];
    data?: TodoistTask[];
  };
  // Handle both 'results' and 'data' properties
  return responseObj?.results || responseObj?.data || [];
}

export async function handleCreateTask(
  todoistClient: TodoistApi,
  args: CreateTaskArgs
): Promise<string> {
  try {
    // Validate input
    validateTaskContent(args.content);
    validatePriority(args.priority);
    validateDateString(args.deadline_date, "deadline_date");
    validateLabels(args.labels);
    validateProjectId(args.project_id);
    validateSectionId(args.section_id);

    const taskData: TodoistTaskData = {
      content: args.content,
      description: args.description,
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

    return `Task created:\nTitle: ${task.content}${
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
  } catch (error) {
    throw new TodoistAPIError("Failed to create task", error as Error);
  }
}

export async function handleGetTasks(
  todoistClient: TodoistApi,
  args: GetTasksArgs
): Promise<string> {
  // Validate input
  validatePriority(args.priority);
  validateProjectId(args.project_id);
  validateLimit(args.limit);

  const apiParams: Record<string, string | undefined> = {};
  if (args.project_id) {
    apiParams.projectId = args.project_id;
  }
  if (args.filter) {
    apiParams.filter = args.filter;
  }

  // Create cache key based on parameters
  const cacheKey = `tasks_${JSON.stringify(apiParams)}`;
  let tasks = taskCache.get(cacheKey);

  if (!tasks) {
    const result = await todoistClient.getTasks(
      Object.keys(apiParams).length > 0
        ? (apiParams as Parameters<typeof todoistClient.getTasks>[0])
        : undefined
    );
    // Handle both array response and object response formats
    tasks = extractTasksArray(result);
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
    .map(
      (task) =>
        `- ${task.content}${
          task.description ? `\n  Description: ${task.description}` : ""
        }${task.due ? `\n  Due: ${task.due.string}` : ""}${
          task.deadline ? `\n  Deadline: ${task.deadline.date}` : ""
        }${task.priority ? `\n  Priority: ${task.priority}` : ""}`
    )
    .join("\n\n");

  return filteredTasks.length > 0
    ? taskList
    : "No tasks found matching the criteria";
}

export async function handleUpdateTask(
  todoistClient: TodoistApi,
  args: UpdateTaskArgs
): Promise<string> {
  // Clear cache since we're updating
  taskCache.clear();

  const result = await todoistClient.getTasks();
  const tasks = extractTasksArray(result);
  const matchingTask = tasks.find((task: TodoistTask) =>
    task.content.toLowerCase().includes(args.task_name.toLowerCase())
  );

  if (!matchingTask) {
    throw new TaskNotFoundError(args.task_name);
  }

  const updateData: Partial<TodoistTaskData> = {};
  if (args.content) updateData.content = args.content;
  if (args.description) updateData.description = args.description;
  if (args.due_string) updateData.dueString = args.due_string;
  if (args.priority) updateData.priority = args.priority;
  if (args.project_id) updateData.projectId = args.project_id;
  if (args.section_id) updateData.sectionId = args.section_id;

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
  // Clear cache since we're deleting
  taskCache.clear();

  const result = await todoistClient.getTasks();
  const tasks = extractTasksArray(result);
  const matchingTask = tasks.find((task: TodoistTask) =>
    task.content.toLowerCase().includes(args.task_name.toLowerCase())
  );

  if (!matchingTask) {
    throw new TaskNotFoundError(args.task_name);
  }

  await todoistClient.deleteTask(matchingTask.id);
  return `Successfully deleted task: "${matchingTask.content}"`;
}

export async function handleCompleteTask(
  todoistClient: TodoistApi,
  args: TaskNameArgs
): Promise<string> {
  // Clear cache since we're completing
  taskCache.clear();

  const result = await todoistClient.getTasks();
  const tasks = extractTasksArray(result);
  const matchingTask = tasks.find((task: TodoistTask) =>
    task.content.toLowerCase().includes(args.task_name.toLowerCase())
  );

  if (!matchingTask) {
    throw new TaskNotFoundError(args.task_name);
  }

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
        errors.push(
          `Failed to create task "${taskArgs.content}": ${(error as Error).message}`
        );
      }
    }

    // Clear cache after bulk creation
    taskCache.clear();

    const successCount = createdTasks.length;
    const errorCount = errors.length;

    let result = `Bulk task creation completed: ${successCount} created, ${errorCount} failed.\n\n`;

    if (successCount > 0) {
      result += "Created tasks:\n";
      result += createdTasks.map((task) => `- ${task.content}`).join("\n");
      result += "\n\n";
    }

    if (errorCount > 0) {
      result += "Errors:\n";
      result += errors.join("\n");
    }

    return result.trim();
  } catch (error) {
    throw new TodoistAPIError("Failed to bulk create tasks", error as Error);
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
    const allTasks = extractTasksArray(result);
    const matchingTasks = filterTasksByCriteria(allTasks, args.search_criteria);

    if (matchingTasks.length === 0) {
      return "No tasks found matching the search criteria.";
    }

    const updatedTasks: TodoistTask[] = [];
    const errors: string[] = [];

    const updateData: Partial<TodoistTaskData> = {};
    if (args.updates.content) updateData.content = args.updates.content;
    if (args.updates.description)
      updateData.description = args.updates.description;
    if (args.updates.due_string) updateData.dueString = args.updates.due_string;
    if (args.updates.priority) updateData.priority = args.updates.priority;
    if (args.updates.project_id) updateData.projectId = args.updates.project_id;
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
      response += updatedTasks.map((task) => `- ${task.content}`).join("\n");
      response += "\n\n";
    }

    if (errorCount > 0) {
      response += "Errors:\n";
      response += errors.join("\n");
    }

    return response.trim();
  } catch (error) {
    throw new TodoistAPIError("Failed to bulk update tasks", error as Error);
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
    const allTasks = extractTasksArray(result);
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
    throw new TodoistAPIError("Failed to bulk delete tasks", error as Error);
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
    const allTasks = extractTasksArray(result);
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
    throw new TodoistAPIError("Failed to bulk complete tasks", error as Error);
  }
}
