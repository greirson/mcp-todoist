import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  TodoistTaskData,
  TodoistTask,
  BulkCreateTasksArgs,
  BulkUpdateTasksArgs,
  BulkTaskFilterArgs,
} from "../../types/index.js";
import { CacheManager } from "../../cache/index.js";
import {
  validateTaskContent,
  validatePriority,
  validateDateString,
  validateLabels,
  validateProjectId,
  validateSectionId,
  validateBulkSearchCriteria,
  validateDurationPair,
} from "../../validation/index.js";
import type { DurationUnit } from "../../types/index.js";
import {
  resolveProjectIdentifier,
  extractArrayFromResponse,
} from "../../utils/api-helpers.js";
import { getDueDateOnly } from "../../utils/datetime-utils.js";
import { toApiPriority } from "../../utils/priority-mapper.js";
import { ErrorHandler } from "../../utils/error-handling.js";

// Get centralized cache manager and register task cache
const cacheManager = CacheManager.getInstance();
const taskCache = cacheManager.getOrCreateCache<TodoistTask[]>("tasks", 30000, {
  maxSize: 1000,
  enableStats: true,
  enableAccessTracking: true,
});

/**
 * Filters tasks based on search criteria for bulk operations.
 */
export function filterTasksByCriteria(
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
        validateDurationPair(
          taskArgs.duration,
          taskArgs.duration_unit,
          taskArgs.due_string
        );

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
    validateDurationPair(
      args.updates.duration,
      args.updates.duration_unit,
      args.updates.due_string
    );

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
