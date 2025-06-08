// Label operations testing module
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleCreateLabel,
  handleGetLabels,
  handleUpdateLabel,
  handleDeleteLabel,
  handleGetLabelStats,
} from "../label-handlers.js";
import { TestSuite, EnhancedTestResult, generateTestData } from "./types.js";

export async function testLabelOperations(
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