// Subtask operations testing module
import { TodoistApi } from "@doist/todoist-api-typescript";
import { handleCreateTask } from "../task-handlers.js";
import {
  handleCreateSubtask,
  handleBulkCreateSubtasks,
  handlePromoteSubtask,
  handleGetTaskHierarchy,
} from "../subtask-handlers.js";
import { TestSuite, EnhancedTestResult, generateTestData } from "./types.js";

export async function testSubtaskOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateTestData();
  let parentTaskId: string | null = null;
  let subtaskId: string | null = null;

  // Create parent task first
  try {
    const parentResult = await handleCreateTask(todoistClient, {
      content: `${testData.taskContent} - Parent`,
      priority: 2,
    });
    const idMatch = parentResult.match(/ID: ([a-zA-Z0-9]+)/);
    parentTaskId = idMatch ? idMatch[1] : null;
  } catch {
    // If we can't create parent, skip all subtask tests
    return {
      suiteName: "Subtask Operations",
      tests: [
        {
          toolName: "subtask_tests",
          operation: "SETUP",
          status: "error",
          message: "Failed to create parent task for subtask tests",
          responseTime: Date.now() - startTime,
        },
      ],
      totalTime: Date.now() - startTime,
      passed: 0,
      failed: 1,
      skipped: 0,
    };
  }

  // Test 1: Create Subtask
  const createSubtaskStart = Date.now();
  try {
    const result = await handleCreateSubtask(todoistClient, {
      parent_task_name: `${testData.taskContent} - Parent`,
      content: testData.subtaskContent,
      description: "Test subtask description",
      priority: 1,
    });
    subtaskId = result.subtask.id;
    tests.push({
      toolName: "todoist_subtask_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created subtask",
      responseTime: Date.now() - createSubtaskStart,
      details: { subtaskId, parentTaskId },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_subtask_create",
      operation: "CREATE",
      status: "error",
      message: "Failed to create subtask",
      responseTime: Date.now() - createSubtaskStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Get Task Hierarchy
  const hierarchyStart = Date.now();
  try {
    const hierarchy = await handleGetTaskHierarchy(todoistClient, {
      task_name: `${testData.taskContent} - Parent`,
      include_completed: false,
    });
    tests.push({
      toolName: "todoist_task_hierarchy_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved task hierarchy",
      responseTime: Date.now() - hierarchyStart,
      details: {
        totalTasks: hierarchy.totalTasks,
        depth: hierarchy.root.depth,
      },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_hierarchy_get",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve task hierarchy",
      responseTime: Date.now() - hierarchyStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Bulk Create Subtasks
  const bulkCreateStart = Date.now();
  try {
    const bulkResult = await handleBulkCreateSubtasks(todoistClient, {
      parent_task_name: `${testData.taskContent} - Parent`,
      subtasks: [
        { content: `${testData.subtaskContent} - Bulk 1`, priority: 2 },
        { content: `${testData.subtaskContent} - Bulk 2`, priority: 3 },
      ],
    });
    tests.push({
      toolName: "todoist_subtasks_bulk_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created bulk subtasks",
      responseTime: Date.now() - bulkCreateStart,
      details: {
        created: bulkResult.created.length,
        failed: bulkResult.failed.length,
      },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_subtasks_bulk_create",
      operation: "CREATE",
      status: "error",
      message: "Failed to create bulk subtasks",
      responseTime: Date.now() - bulkCreateStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 4: Promote Subtask
  if (subtaskId) {
    const promoteStart = Date.now();
    try {
      const promoted = await handlePromoteSubtask(todoistClient, {
        subtask_name: testData.subtaskContent,
      });
      tests.push({
        toolName: "todoist_subtask_promote",
        operation: "UPDATE",
        status: "success",
        message: "Successfully promoted subtask to main task",
        responseTime: Date.now() - promoteStart,
        details: { promotedTaskId: promoted.id },
      });

      // Clean up promoted task
      await todoistClient.deleteTask(promoted.id);
    } catch (error) {
      tests.push({
        toolName: "todoist_subtask_promote",
        operation: "UPDATE",
        status: "error",
        message: "Failed to promote subtask",
        responseTime: Date.now() - promoteStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Cleanup
  if (parentTaskId) {
    try {
      await todoistClient.deleteTask(parentTaskId);
    } catch {
      // Ignore cleanup errors
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Subtask Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}