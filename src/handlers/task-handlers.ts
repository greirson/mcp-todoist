import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateTaskArgs,
  GetTasksArgs,
  UpdateTaskArgs,
  TaskNameArgs,
  TodoistTaskData,
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
  validateTaskName,
  validateLimit,
} from "../validation.js";

// Cache for task data (30 second TTL)
const taskCache = new SimpleCache<any[]>(30000);

export async function handleCreateTask(
  todoistClient: TodoistApi,
  args: CreateTaskArgs
): Promise<string> {
  try {
    // Validate input
    validateTaskContent(args.content);
    validatePriority(args.priority);
    validateDateString(args.deadline, "deadline");
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

    if (args.deadline) {
      taskData.deadline = args.deadline;
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
    }${args.deadline ? `\nDeadline: ${args.deadline}` : ""}${
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
    tasks = await todoistClient.getTasks(
      Object.keys(apiParams).length > 0
        ? (apiParams as Parameters<typeof todoistClient.getTasks>[0])
        : undefined
    );
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
          task.priority ? `\n  Priority: ${task.priority}` : ""
        }`
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
  
  const tasks = await todoistClient.getTasks();
  const matchingTask = tasks.find((task) =>
    task.content.toLowerCase().includes(args.task_name.toLowerCase())
  );

  if (!matchingTask) {
    throw new Error(`Could not find a task matching "${args.task_name}"`);
  }

  const updateData: Partial<TodoistTaskData> = {};
  if (args.content) updateData.content = args.content;
  if (args.description) updateData.description = args.description;
  if (args.due_string) updateData.dueString = args.due_string;
  if (args.priority) updateData.priority = args.priority;
  if (args.project_id) updateData.projectId = args.project_id;
  if (args.section_id) updateData.sectionId = args.section_id;

  const updatedTask = await todoistClient.updateTask(matchingTask.id, updateData);

  return `Task "${matchingTask.content}" updated:\nNew Title: ${
    updatedTask.content
  }${
    updatedTask.description ? `\nNew Description: ${updatedTask.description}` : ""
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
  
  const tasks = await todoistClient.getTasks();
  const matchingTask = tasks.find((task) =>
    task.content.toLowerCase().includes(args.task_name.toLowerCase())
  );

  if (!matchingTask) {
    throw new Error(`Could not find a task matching "${args.task_name}"`);
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
  
  const tasks = await todoistClient.getTasks();
  const matchingTask = tasks.find((task) =>
    task.content.toLowerCase().includes(args.task_name.toLowerCase())
  );

  if (!matchingTask) {
    throw new Error(`Could not find a task matching "${args.task_name}"`);
  }

  await todoistClient.closeTask(matchingTask.id);
  return `Successfully completed task: "${matchingTask.content}"`;
}