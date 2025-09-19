// Handler functions for subtask operations in the Todoist MCP server
// Manages hierarchical task relationships and parent-child task structures

import { TodoistApi } from "@doist/todoist-api-typescript";
import type {
  CreateSubtaskArgs,
  BulkCreateSubtasksArgs,
  ConvertToSubtaskArgs,
  PromoteSubtaskArgs,
  GetTaskHierarchyArgs,
  TaskNode,
  TaskHierarchy,
  TodoistTask,
  TasksResponse,
} from "../types.js";
import { TaskNotFoundError, ValidationError } from "../errors.js";
import {
  validateTaskContent,
  validatePriority,
  validateDateString,
} from "../validation.js";
import { extractArrayFromResponse } from "../utils/api-helpers.js";
import { ErrorHandler } from "../utils/error-handling.js";
import { SimpleCache } from "../cache.js";
import { toApiPriority } from "../utils/priority-mapper.js";

// Cache for task data (30 second TTL)
const taskCache = new SimpleCache<TodoistTask[]>(30000);

// Extended TaskNode interface for internal use
interface ExtendedTaskNode extends TaskNode {
  totalTasks: number;
  completedTasks: number;
}

// Task creation data interface
interface TaskCreationData {
  content: string;
  parentId?: string;
  projectId?: string;
  description?: string;
  dueString?: string;
  priority?: number;
  labels?: string[];
  deadline?: { date: string };
  sectionId?: string;
}

/**
 * Find a task by ID or name
 */
async function findTask(
  todoistClient: TodoistApi,
  args: { task_id?: string; task_name?: string }
): Promise<TodoistTask> {
  if (!args.task_id && !args.task_name) {
    throw new ValidationError("Either task_id or task_name is required");
  }

  try {
    let task: TodoistTask | undefined;

    if (args.task_id) {
      const response = await todoistClient.getTask(args.task_id);
      task = response as TodoistTask;
    } else if (args.task_name) {
      const cachedTasks = taskCache.get("todoist_tasks");
      let tasks: TodoistTask[];

      if (cachedTasks) {
        tasks = cachedTasks;
      } else {
        const response = (await todoistClient.getTasks()) as TasksResponse;
        tasks = extractArrayFromResponse(response);
        taskCache.set("todoist_tasks", tasks);
      }

      const searchTerm = args.task_name.toLowerCase();
      task = tasks.find((t) => t.content.toLowerCase().includes(searchTerm));
    }

    if (!task) {
      throw new TaskNotFoundError(
        `Task not found: ${args.task_id || args.task_name}`
      );
    }

    return task;
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      throw error;
    }
    throw ErrorHandler.handleAPIError("findTask", error);
  }
}

/**
 * Create a subtask under a parent task
 */
export async function handleCreateSubtask(
  todoistClient: TodoistApi,
  args: CreateSubtaskArgs
): Promise<{ subtask: TodoistTask; parent: TodoistTask }> {
  try {
    // Validate required fields
    validateTaskContent(args.content);

    // Find parent task
    const parent = await findTask(todoistClient, {
      task_id: args.parent_task_id,
      task_name: args.parent_task_name,
    });

    // Validate optional fields
    if (args.priority !== undefined) {
      validatePriority(args.priority);
    }
    if (args.deadline_date) {
      validateDateString(args.deadline_date, "deadline");
    }

    // Create subtask with parentId
    const subtaskData: TaskCreationData = {
      content: args.content,
      parentId: parent.id,
      projectId: parent.projectId,
    };

    if (args.description) subtaskData.description = args.description;
    if (args.due_string) subtaskData.dueString = args.due_string;
    const apiPriority = toApiPriority(args.priority);
    if (apiPriority !== undefined) subtaskData.priority = apiPriority;
    if (args.labels) subtaskData.labels = args.labels;
    if (args.deadline_date) subtaskData.deadline = { date: args.deadline_date };

    const subtask = (await todoistClient.addTask(subtaskData)) as TodoistTask;

    // Clear cache
    taskCache.clear();

    return { subtask, parent };
  } catch (error) {
    throw ErrorHandler.handleAPIError("createSubtask", error);
  }
}

/**
 * Convert an existing task to a subtask
 */
export async function handleConvertToSubtask(
  todoistClient: TodoistApi,
  args: ConvertToSubtaskArgs
): Promise<{ task: TodoistTask; parent: TodoistTask }> {
  try {
    // Find both tasks
    const [task, parent] = await Promise.all([
      findTask(todoistClient, {
        task_id: args.task_id,
        task_name: args.task_name,
      }),
      findTask(todoistClient, {
        task_id: args.parent_task_id,
        task_name: args.parent_task_name,
      }),
    ]);

    // Check if already a subtask
    if (task.parentId) {
      throw new ValidationError(`Task "${task.content}" is already a subtask`);
    }

    // Delete the original task and recreate it as a subtask
    // This is a workaround since updateTask may not support parentId
    await todoistClient.deleteTask(task.id);

    const subtaskData: TaskCreationData = {
      content: task.content,
      parentId: parent.id,
      projectId: parent.projectId || task.projectId,
    };

    // Preserve other task properties
    if (task.description) subtaskData.description = task.description;
    if (task.due?.string) subtaskData.dueString = task.due.string;
    if (task.priority) subtaskData.priority = task.priority;
    if (task.labels) subtaskData.labels = task.labels;
    if (task.deadline?.date)
      subtaskData.deadline = { date: task.deadline.date };

    const updatedTask = (await todoistClient.addTask(
      subtaskData
    )) as TodoistTask;

    // Clear cache
    taskCache.clear();

    return { task: updatedTask, parent };
  } catch (error) {
    throw ErrorHandler.handleAPIError("convertToSubtask", error);
  }
}

/**
 * Promote a subtask to a main task
 */
export async function handlePromoteSubtask(
  todoistClient: TodoistApi,
  args: PromoteSubtaskArgs
): Promise<TodoistTask> {
  try {
    // Find subtask
    const subtask = await findTask(todoistClient, {
      task_id: args.subtask_id,
      task_name: args.subtask_name,
    });

    // Check if it's actually a subtask
    if (!subtask.parentId) {
      throw new ValidationError(`Task "${subtask.content}" is not a subtask`);
    }

    // Delete the subtask and recreate it as a main task
    // This is a workaround since updateTask may not support parentId changes
    await todoistClient.deleteTask(subtask.id);

    const taskData: TaskCreationData = {
      content: subtask.content,
      projectId: args.project_id || subtask.projectId,
    };

    // Preserve other task properties
    if (subtask.description) taskData.description = subtask.description;
    if (subtask.due?.string) taskData.dueString = subtask.due.string;
    if (subtask.priority) taskData.priority = subtask.priority;
    if (subtask.labels) taskData.labels = subtask.labels;
    if (subtask.deadline?.date)
      taskData.deadline = { date: subtask.deadline.date };
    if (args.section_id) taskData.sectionId = args.section_id;

    const promotedTask = (await todoistClient.addTask(taskData)) as TodoistTask;

    // Clear cache
    taskCache.clear();

    return promotedTask;
  } catch (error) {
    throw ErrorHandler.handleAPIError("promoteSubtask", error);
  }
}

/**
 * Get task hierarchy with all subtasks
 */
export async function handleGetTaskHierarchy(
  todoistClient: TodoistApi,
  args: GetTaskHierarchyArgs
): Promise<TaskHierarchy> {
  try {
    // Find root task
    const rootTask = await findTask(todoistClient, {
      task_id: args.task_id,
      task_name: args.task_name,
    });

    // Get all tasks for hierarchy building
    const response = (await todoistClient.getTasks()) as TasksResponse;
    const allTasks = extractArrayFromResponse(response) as TodoistTask[];

    // Build task tree recursively
    async function buildTaskTree(
      task: TodoistTask,
      depth: number = 0
    ): Promise<ExtendedTaskNode> {
      // Find direct children
      const children = allTasks.filter((t: unknown) => {
        const todoTask = t as TodoistTask;
        return (
          todoTask.parentId === task.id &&
          (args.include_completed || !todoTask.isCompleted)
        );
      });

      // Recursively build child nodes
      const childNodes = await Promise.all(
        children.map((child) => buildTaskTree(child as TodoistTask, depth + 1))
      );

      // Calculate completion percentage
      const totalSubtasks = childNodes.reduce(
        (sum, node) => sum + node.totalTasks,
        childNodes.length
      );
      const completedSubtasks = childNodes.reduce(
        (sum, node) => sum + node.completedTasks,
        childNodes.filter((n) => n.task.isCompleted).length
      );

      const completionPercentage =
        totalSubtasks > 0
          ? Math.round((completedSubtasks / totalSubtasks) * 100)
          : task.isCompleted
            ? 100
            : 0;

      return {
        task,
        children: childNodes,
        depth,
        completionPercentage,
        totalTasks: 1 + totalSubtasks,
        completedTasks: (task.isCompleted ? 1 : 0) + completedSubtasks,
      };
    }

    const rootNode = await buildTaskTree(rootTask);

    return {
      root: rootNode,
      totalTasks: rootNode.totalTasks,
      completedTasks: rootNode.completedTasks,
      overallCompletion: Math.round(
        (rootNode.completedTasks / rootNode.totalTasks) * 100
      ),
    };
  } catch (error) {
    throw ErrorHandler.handleAPIError("getTaskHierarchy", error);
  }
}

/**
 * Bulk create multiple subtasks
 */
export async function handleBulkCreateSubtasks(
  todoistClient: TodoistApi,
  args: BulkCreateSubtasksArgs
): Promise<{
  parent: TodoistTask;
  created: TodoistTask[];
  failed: Array<{ task: (typeof args.subtasks)[number]; error: string }>;
}> {
  try {
    // Validate subtasks array
    if (!args.subtasks || args.subtasks.length === 0) {
      throw new ValidationError("At least one subtask is required");
    }

    // Find parent task
    const parent = await findTask(todoistClient, {
      task_id: args.parent_task_id,
      task_name: args.parent_task_name,
    });

    const created: TodoistTask[] = [];
    const failed: Array<{
      task: (typeof args.subtasks)[number];
      error: string;
    }> = [];

    // Create subtasks sequentially
    for (const subtaskData of args.subtasks) {
      try {
        // Validate subtask data
        validateTaskContent(subtaskData.content);
        if (subtaskData.priority !== undefined) {
          validatePriority(subtaskData.priority);
        }
        if (subtaskData.deadline_date) {
          validateDateString(subtaskData.deadline_date, "deadline");
        }

        // Create subtask
        const taskData: TaskCreationData = {
          content: subtaskData.content,
          parentId: parent.id,
          projectId: parent.projectId,
        };

        if (subtaskData.description)
          taskData.description = subtaskData.description;
        if (subtaskData.due_string) taskData.dueString = subtaskData.due_string;
        const apiPriority = toApiPriority(subtaskData.priority);
        if (apiPriority !== undefined) taskData.priority = apiPriority;
        if (subtaskData.labels) taskData.labels = subtaskData.labels;
        if (subtaskData.deadline_date) {
          taskData.deadline = { date: subtaskData.deadline_date };
        }

        const subtask = (await todoistClient.addTask(taskData)) as TodoistTask;
        created.push(subtask);
      } catch (error) {
        failed.push({
          task: subtaskData,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Clear cache
    taskCache.clear();

    return { parent, created, failed };
  } catch (error) {
    throw ErrorHandler.handleAPIError("bulkCreateSubtasks", error);
  }
}
