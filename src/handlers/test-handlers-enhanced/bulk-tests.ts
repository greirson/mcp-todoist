// Bulk operations testing module
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleBulkCreateTasks,
  handleBulkUpdateTasks,
  handleBulkDeleteTasks,
  handleBulkCompleteTasks,
} from "../task-handlers.js";
import { TestSuite, EnhancedTestResult, generateTestData } from "./types.js";

export async function testBulkOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateTestData();

  // Test 1: Bulk Create Tasks
  const bulkCreateStart = Date.now();
  try {
    await handleBulkCreateTasks(todoistClient, {
      tasks: [
        { content: `${testData.taskContent} - Bulk 1`, priority: 1 },
        { content: `${testData.taskContent} - Bulk 2`, priority: 2 },
        { content: `${testData.taskContent} - Bulk 3`, priority: 3 },
      ],
    });
    tests.push({
      toolName: "todoist_tasks_bulk_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created bulk tasks",
      responseTime: Date.now() - bulkCreateStart,
      details: {
        created: 3,
        pattern: testData.taskContent,
      },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_tasks_bulk_create",
      operation: "CREATE",
      status: "error",
      message: "Failed to create bulk tasks",
      responseTime: Date.now() - bulkCreateStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Bulk Update Tasks
  const bulkUpdateStart = Date.now();
  try {
    await handleBulkUpdateTasks(todoistClient, {
      search_criteria: {
        content_contains: testData.taskContent,
        priority: 2,
      },
      updates: {
        priority: 4,
        description: "Bulk updated description",
      },
    });
    tests.push({
      toolName: "todoist_tasks_bulk_update",
      operation: "UPDATE",
      status: "success",
      message: "Successfully updated bulk tasks",
      responseTime: Date.now() - bulkUpdateStart,
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_tasks_bulk_update",
      operation: "UPDATE",
      status: "error",
      message: "Failed to update bulk tasks",
      responseTime: Date.now() - bulkUpdateStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Bulk Complete Tasks
  const bulkCompleteStart = Date.now();
  try {
    await handleBulkCompleteTasks(todoistClient, {
      search_criteria: {
        content_contains: testData.taskContent,
        priority: 1,
      },
    });
    tests.push({
      toolName: "todoist_tasks_bulk_complete",
      operation: "UPDATE",
      status: "success",
      message: "Successfully completed bulk tasks",
      responseTime: Date.now() - bulkCompleteStart,
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_tasks_bulk_complete",
      operation: "UPDATE",
      status: "error",
      message: "Failed to complete bulk tasks",
      responseTime: Date.now() - bulkCompleteStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 4: Bulk Delete Tasks
  const bulkDeleteStart = Date.now();
  try {
    await handleBulkDeleteTasks(todoistClient, {
      search_criteria: {
        content_contains: testData.taskContent,
      },
    });
    tests.push({
      toolName: "todoist_tasks_bulk_delete",
      operation: "DELETE",
      status: "success",
      message: "Successfully deleted bulk tasks",
      responseTime: Date.now() - bulkDeleteStart,
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_tasks_bulk_delete",
      operation: "DELETE",
      status: "error",
      message: "Failed to delete bulk tasks",
      responseTime: Date.now() - bulkDeleteStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Bulk Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}
