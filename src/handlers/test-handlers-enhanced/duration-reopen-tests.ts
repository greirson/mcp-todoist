// Duration and Reopen task operations testing module
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleCreateTask,
  handleUpdateTask,
  handleCompleteTask,
  handleReopenTask,
  handleDeleteTask,
} from "../task-handlers.js";
import { TestSuite, EnhancedTestResult, generateTestData } from "./types.js";

export async function testDurationAndReopenOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateTestData();
  let createdTaskId: string | null = null;

  // Test 1: Create Task with Duration
  const createStart = Date.now();
  try {
    const createResult = await handleCreateTask(todoistClient, {
      content: `${testData.taskContent} with duration`,
      description: "Test task with 30 minute duration",
      duration: 30,
      duration_unit: "minute",
    });

    // Extract task ID from result
    const idMatch = createResult.match(/ID: ([a-zA-Z0-9]+)/);
    createdTaskId = idMatch ? idMatch[1] : null;

    // Verify duration is in the response
    const hasDuration = createResult.includes("Duration:");

    tests.push({
      toolName: "todoist_task_create",
      operation: "CREATE_WITH_DURATION",
      status: "success",
      message: hasDuration
        ? "Successfully created task with duration"
        : "Task created but duration not in response",
      responseTime: Date.now() - createStart,
      details: { taskId: createdTaskId, hasDuration },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_create",
      operation: "CREATE_WITH_DURATION",
      status: "error",
      message: "Failed to create task with duration",
      responseTime: Date.now() - createStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Update Task Duration
  if (createdTaskId) {
    const updateStart = Date.now();
    try {
      const updateResult = await handleUpdateTask(todoistClient, {
        task_id: createdTaskId,
        duration: 60,
        duration_unit: "minute",
      });

      const hasDuration = updateResult.includes("Duration:");

      tests.push({
        toolName: "todoist_task_update",
        operation: "UPDATE_DURATION",
        status: "success",
        message: hasDuration
          ? "Successfully updated task duration"
          : "Task updated but duration not in response",
        responseTime: Date.now() - updateStart,
        details: { hasDuration },
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_task_update",
        operation: "UPDATE_DURATION",
        status: "error",
        message: "Failed to update task duration",
        responseTime: Date.now() - updateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_task_update",
      operation: "UPDATE_DURATION",
      status: "skipped",
      message: "Skipped - no task created",
      responseTime: 0,
    });
  }

  // Test 3: Create Task with Day Duration
  const createDayStart = Date.now();
  let dayDurationTaskId: string | null = null;
  try {
    const createResult = await handleCreateTask(todoistClient, {
      content: `${testData.taskContent} with day duration`,
      description: "Test task with 2 day duration",
      duration: 2,
      duration_unit: "day",
    });

    const idMatch = createResult.match(/ID: ([a-zA-Z0-9]+)/);
    dayDurationTaskId = idMatch ? idMatch[1] : null;

    const hasDuration = createResult.includes("Duration:");

    tests.push({
      toolName: "todoist_task_create",
      operation: "CREATE_WITH_DAY_DURATION",
      status: "success",
      message: hasDuration
        ? "Successfully created task with day duration"
        : "Task created but duration not in response",
      responseTime: Date.now() - createDayStart,
      details: { taskId: dayDurationTaskId, hasDuration },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_create",
      operation: "CREATE_WITH_DAY_DURATION",
      status: "error",
      message: "Failed to create task with day duration",
      responseTime: Date.now() - createDayStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 4: Complete Task (for reopen test)
  if (createdTaskId) {
    const completeStart = Date.now();
    try {
      await handleCompleteTask(todoistClient, {
        task_id: createdTaskId,
      });

      tests.push({
        toolName: "todoist_task_complete",
        operation: "COMPLETE",
        status: "success",
        message: "Successfully completed task for reopen test",
        responseTime: Date.now() - completeStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_task_complete",
        operation: "COMPLETE",
        status: "error",
        message: "Failed to complete task",
        responseTime: Date.now() - completeStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 5: Reopen Task
  if (createdTaskId) {
    const reopenStart = Date.now();
    try {
      const reopenResult = await handleReopenTask(todoistClient, {
        task_id: createdTaskId,
      });

      const isSuccess = reopenResult.includes("Successfully reopened");

      tests.push({
        toolName: "todoist_task_reopen",
        operation: "REOPEN",
        status: isSuccess ? "success" : "error",
        message: isSuccess
          ? "Successfully reopened task"
          : "Reopen returned unexpected result",
        responseTime: Date.now() - reopenStart,
        details: { result: reopenResult },
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_task_reopen",
        operation: "REOPEN",
        status: "error",
        message: "Failed to reopen task",
        responseTime: Date.now() - reopenStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_task_reopen",
      operation: "REOPEN",
      status: "skipped",
      message: "Skipped - no task created",
      responseTime: 0,
    });
  }

  // Cleanup: Delete test tasks
  const cleanupTasks = [createdTaskId, dayDurationTaskId].filter(
    (id) => id !== null
  );
  for (const taskId of cleanupTasks) {
    try {
      await handleDeleteTask(todoistClient, { task_id: taskId });
    } catch {
      // Silently handle cleanup errors
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Duration & Reopen Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}
