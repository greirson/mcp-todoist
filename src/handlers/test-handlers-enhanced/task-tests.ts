// Task operations testing module
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleCreateTask,
  handleGetTasks,
  handleUpdateTask,
  handleDeleteTask,
  handleCompleteTask,
} from "../task-handlers.js";
import { TestSuite, EnhancedTestResult, generateTestData } from "./types.js";

export async function testTaskOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateTestData();
  let createdTaskId: string | null = null;

  // Test 1: Create Task
  const createStart = Date.now();
  try {
    const createResult = await handleCreateTask(todoistClient, {
      content: testData.taskContent,
      description: "Test task description",
      priority: 2,
      labels: ["test"],
    });

    // Extract task ID from result
    const idMatch = createResult.match(/ID: ([a-zA-Z0-9]+)/);
    createdTaskId = idMatch ? idMatch[1] : null;

    tests.push({
      toolName: "todoist_task_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created task",
      responseTime: Date.now() - createStart,
      details: { taskId: createdTaskId },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_create",
      operation: "CREATE",
      status: "error",
      message: "Failed to create task",
      responseTime: Date.now() - createStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Get Tasks
  const getStart = Date.now();
  try {
    const getResult = await handleGetTasks(todoistClient, { limit: 5 });
    tests.push({
      toolName: "todoist_task_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved tasks",
      responseTime: Date.now() - getStart,
      details: { resultLength: getResult.length },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_get",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve tasks",
      responseTime: Date.now() - getStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Update Task
  if (createdTaskId) {
    const updateStart = Date.now();
    try {
      await handleUpdateTask(todoistClient, {
        task_name: testData.taskContent,
        content: `${testData.taskContent} - Updated`,
        priority: 3,
      });
      tests.push({
        toolName: "todoist_task_update",
        operation: "UPDATE",
        status: "success",
        message: "Successfully updated task",
        responseTime: Date.now() - updateStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_task_update",
        operation: "UPDATE",
        status: "error",
        message: "Failed to update task",
        responseTime: Date.now() - updateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_task_update",
      operation: "UPDATE",
      status: "skipped",
      message: "Skipped - no task created",
      responseTime: 0,
    });
  }

  // Test 4: Complete Task
  if (createdTaskId) {
    const completeStart = Date.now();
    try {
      await handleCompleteTask(todoistClient, {
        task_name: `${testData.taskContent} - Updated`,
      });
      tests.push({
        toolName: "todoist_task_complete",
        operation: "UPDATE",
        status: "success",
        message: "Successfully completed task",
        responseTime: Date.now() - completeStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_task_complete",
        operation: "UPDATE",
        status: "error",
        message: "Failed to complete task",
        responseTime: Date.now() - completeStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 5: Delete Task (cleanup)
  if (createdTaskId) {
    const deleteStart = Date.now();
    try {
      await handleDeleteTask(todoistClient, {
        task_name: testData.taskContent,
      });
      tests.push({
        toolName: "todoist_task_delete",
        operation: "DELETE",
        status: "success",
        message: "Successfully deleted task",
        responseTime: Date.now() - deleteStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_task_delete",
        operation: "DELETE",
        status: "error",
        message: "Failed to delete task",
        responseTime: Date.now() - deleteStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Task Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}