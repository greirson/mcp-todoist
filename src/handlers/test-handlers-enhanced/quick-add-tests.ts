// Quick Add operations testing module
import { handleQuickAddTask } from "../task-handlers.js";
import { handleDeleteTask } from "../task-handlers.js";
import { TodoistApi } from "@doist/todoist-api-typescript";
import { TestSuite, EnhancedTestResult } from "./types.js";

export async function testQuickAddOperations(
  todoistClient: TodoistApi,
  apiToken: string
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const timestamp = Date.now();
  const createdTaskNames: string[] = [];

  // Test 1: Basic Quick Add
  const basicStart = Date.now();
  const basicTaskName = `Quick Add Test Basic ${timestamp}`;
  try {
    const basicResult = await handleQuickAddTask(apiToken, {
      text: basicTaskName,
    });
    createdTaskNames.push(basicTaskName);

    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "success",
      message: "Successfully created task via basic quick add",
      responseTime: Date.now() - basicStart,
      details: { input: basicTaskName, result: basicResult.substring(0, 100) },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "error",
      message: "Failed basic quick add",
      responseTime: Date.now() - basicStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Quick Add with due date
  const dueDateStart = Date.now();
  const dueDateTaskName = `Quick Add Due ${timestamp}`;
  try {
    const dueDateResult = await handleQuickAddTask(apiToken, {
      text: `${dueDateTaskName} tomorrow`,
    });
    createdTaskNames.push(dueDateTaskName);

    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "success",
      message: "Successfully created task with due date via quick add",
      responseTime: Date.now() - dueDateStart,
      details: {
        input: `${dueDateTaskName} tomorrow`,
        result: dueDateResult.substring(0, 100),
      },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "error",
      message: "Failed quick add with due date",
      responseTime: Date.now() - dueDateStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Quick Add with priority
  const priorityStart = Date.now();
  const priorityTaskName = `Quick Add Priority ${timestamp}`;
  try {
    const priorityResult = await handleQuickAddTask(apiToken, {
      text: `${priorityTaskName} p1`,
    });
    createdTaskNames.push(priorityTaskName);

    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "success",
      message: "Successfully created task with priority via quick add",
      responseTime: Date.now() - priorityStart,
      details: {
        input: `${priorityTaskName} p1`,
        result: priorityResult.substring(0, 100),
      },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "error",
      message: "Failed quick add with priority",
      responseTime: Date.now() - priorityStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 4: Quick Add with description
  const descStart = Date.now();
  const descTaskName = `Quick Add Desc ${timestamp}`;
  try {
    const descResult = await handleQuickAddTask(apiToken, {
      text: `${descTaskName} //This is a description`,
    });
    createdTaskNames.push(descTaskName);

    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "success",
      message: "Successfully created task with description via quick add",
      responseTime: Date.now() - descStart,
      details: {
        input: `${descTaskName} //This is a description`,
        result: descResult.substring(0, 100),
      },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "error",
      message: "Failed quick add with description",
      responseTime: Date.now() - descStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 5: Complex Quick Add with multiple features
  const complexStart = Date.now();
  const complexTaskName = `Quick Add Complex ${timestamp}`;
  try {
    const complexResult = await handleQuickAddTask(apiToken, {
      text: `${complexTaskName} tomorrow p2 //Complex task test`,
      note: "Additional note via API",
    });
    createdTaskNames.push(complexTaskName);

    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "success",
      message: "Successfully created complex task via quick add",
      responseTime: Date.now() - complexStart,
      details: {
        input: `${complexTaskName} tomorrow p2 //Complex task test`,
        result: complexResult.substring(0, 100),
      },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_quick_add",
      operation: "CREATE",
      status: "error",
      message: "Failed complex quick add",
      responseTime: Date.now() - complexStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Cleanup: Delete all created tasks
  for (const taskName of createdTaskNames) {
    try {
      await handleDeleteTask(todoistClient, { task_name: taskName });
    } catch {
      // Ignore cleanup errors
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Quick Add Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}
