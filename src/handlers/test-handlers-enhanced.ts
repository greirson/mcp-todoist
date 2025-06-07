// Enhanced test handlers for comprehensive MCP tool testing
// Tests actual tool functionality including CRUD operations

import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleCreateTask,
  handleGetTasks,
  handleUpdateTask,
  handleDeleteTask,
  handleCompleteTask,
  handleBulkCreateTasks,
  handleBulkUpdateTasks,
  handleBulkDeleteTasks,
  handleBulkCompleteTasks,
} from "./task-handlers.js";
import {
  handleCreateLabel,
  handleGetLabels,
  handleUpdateLabel,
  handleDeleteLabel,
  handleGetLabelStats,
} from "./label-handlers.js";
import {
  handleCreateSubtask,
  handleBulkCreateSubtasks,
  handlePromoteSubtask,
  handleGetTaskHierarchy,
} from "./subtask-handlers.js";

interface EnhancedTestResult {
  toolName: string;
  operation: string;
  status: "success" | "error" | "skipped";
  message: string;
  responseTime: number;
  details?: Record<string, unknown>;
  error?: string;
}

interface TestSuite {
  suiteName: string;
  tests: EnhancedTestResult[];
  totalTime: number;
  passed: number;
  failed: number;
  skipped: number;
}

interface ComprehensiveTestReport {
  overallStatus: "success" | "partial" | "error";
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  suites: TestSuite[];
  totalResponseTime: number;
  timestamp: string;
  testDuration: number;
}

// Test data generator
function generateTestData(): {
  projectName: string;
  taskContent: string;
  subtaskContent: string;
  labelName: string;
  sectionName: string;
  commentContent: string;
} {
  const timestamp = Date.now();
  return {
    projectName: `Test Project ${timestamp}`,
    taskContent: `Test Task ${timestamp}`,
    subtaskContent: `Test Subtask ${timestamp}`,
    labelName: `test-label-${timestamp}`,
    sectionName: `Test Section ${timestamp}`,
    commentContent: `Test comment at ${new Date().toISOString()}`,
  };
}

// Test task operations
async function testTaskOperations(
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

// Test subtask operations
async function testSubtaskOperations(
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

// Test label operations
async function testLabelOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateTestData();
  let createdLabelId: string | null = null;

  // Test 1: Create Label
  const createStart = Date.now();
  try {
    const createResult = await handleCreateLabel(todoistClient, {
      name: testData.labelName,
      color: "red",
      is_favorite: false,
    });

    // Extract label ID from result
    const idMatch = createResult.match(/ID: ([a-zA-Z0-9]+)/);
    createdLabelId = idMatch ? idMatch[1] : null;

    tests.push({
      toolName: "todoist_label_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created label",
      responseTime: Date.now() - createStart,
      details: { labelId: createdLabelId },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_label_create",
      operation: "CREATE",
      status: "error",
      message: "Failed to create label",
      responseTime: Date.now() - createStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Get Labels
  const getStart = Date.now();
  try {
    const labels = await handleGetLabels(todoistClient);
    tests.push({
      toolName: "todoist_label_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved labels",
      responseTime: Date.now() - getStart,
      details: { labelCount: labels.split("\n").length - 1 },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_label_get",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve labels",
      responseTime: Date.now() - getStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Update Label
  if (createdLabelId) {
    const updateStart = Date.now();
    try {
      await handleUpdateLabel(todoistClient, {
        label_name: testData.labelName,
        name: `${testData.labelName}-updated`,
        color: "blue",
      });
      tests.push({
        toolName: "todoist_label_update",
        operation: "UPDATE",
        status: "success",
        message: "Successfully updated label",
        responseTime: Date.now() - updateStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_label_update",
        operation: "UPDATE",
        status: "error",
        message: "Failed to update label",
        responseTime: Date.now() - updateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 4: Get Label Stats
  const statsStart = Date.now();
  try {
    await handleGetLabelStats(todoistClient);
    tests.push({
      toolName: "todoist_label_stats",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved label statistics",
      responseTime: Date.now() - statsStart,
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_label_stats",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve label statistics",
      responseTime: Date.now() - statsStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 5: Delete Label
  if (createdLabelId) {
    const deleteStart = Date.now();
    try {
      await handleDeleteLabel(todoistClient, {
        label_name: `${testData.labelName}-updated`,
      });
      tests.push({
        toolName: "todoist_label_delete",
        operation: "DELETE",
        status: "success",
        message: "Successfully deleted label",
        responseTime: Date.now() - deleteStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_label_delete",
        operation: "DELETE",
        status: "error",
        message: "Failed to delete label",
        responseTime: Date.now() - deleteStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Label Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}

// Test bulk operations
async function testBulkOperations(
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

// Export enhanced test all features
export async function handleTestAllFeaturesEnhanced(
  todoistClient: TodoistApi
): Promise<ComprehensiveTestReport> {
  const testStartTime = Date.now();
  const suites: TestSuite[] = [];

  // Run all test suites
  suites.push(await testTaskOperations(todoistClient));
  suites.push(await testSubtaskOperations(todoistClient));
  suites.push(await testLabelOperations(todoistClient));
  suites.push(await testBulkOperations(todoistClient));

  // Calculate totals
  const totalTests = suites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const passed = suites.reduce((sum, suite) => sum + suite.passed, 0);
  const failed = suites.reduce((sum, suite) => sum + suite.failed, 0);
  const skipped = suites.reduce((sum, suite) => sum + suite.skipped, 0);
  const totalResponseTime = suites.reduce(
    (sum, suite) => sum + suite.totalTime,
    0
  );

  return {
    overallStatus: failed === 0 ? "success" : passed > 0 ? "partial" : "error",
    totalTests,
    passed,
    failed,
    skipped,
    suites,
    totalResponseTime,
    timestamp: new Date().toISOString(),
    testDuration: Date.now() - testStartTime,
  };
}
