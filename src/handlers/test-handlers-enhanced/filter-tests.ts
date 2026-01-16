// Filter operations testing module (Sync API)
import {
  handleGetFilters,
  handleCreateFilter,
  handleUpdateFilter,
  handleDeleteFilter,
  clearFilterCache,
} from "../filter-handlers.js";
import { TestSuite, EnhancedTestResult } from "./types.js";

function generateFilterTestData(): {
  filterName: string;
  filterQuery: string;
} {
  const timestamp = Date.now();
  return {
    filterName: `Test Filter ${timestamp}`,
    filterQuery: "p1",
  };
}

export async function testFilterOperations(): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateFilterTestData();
  let createdFilterId: string | null = null;

  // Clear filter cache before tests
  clearFilterCache();

  // Test 1: Get Filters (initial)
  const getStart = Date.now();
  try {
    const filters = await handleGetFilters();
    tests.push({
      toolName: "todoist_filter_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved filters",
      responseTime: Date.now() - getStart,
      details: { resultPreview: filters.substring(0, 100) },
    });
  } catch (error) {
    // Filters require Pro/Business plan, so this might fail
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isPlanRestriction = errorMessage.includes("Pro") || errorMessage.includes("Business");

    tests.push({
      toolName: "todoist_filter_get",
      operation: "READ",
      status: isPlanRestriction ? "skipped" : "error",
      message: isPlanRestriction
        ? "Skipped: Filters require Todoist Pro/Business plan"
        : "Failed to retrieve filters",
      responseTime: Date.now() - getStart,
      error: errorMessage,
    });

    // If we can't read filters due to plan restrictions, skip remaining tests
    if (isPlanRestriction) {
      const passed = tests.filter((t) => t.status === "success").length;
      const failed = tests.filter((t) => t.status === "error").length;
      const skipped = tests.filter((t) => t.status === "skipped").length;

      return {
        suiteName: "Filter Operations",
        tests,
        totalTime: Date.now() - startTime,
        passed,
        failed,
        skipped,
      };
    }
  }

  // Test 2: Create Filter
  const createStart = Date.now();
  try {
    const createResult = await handleCreateFilter({
      name: testData.filterName,
      query: testData.filterQuery,
      color: "red",
      is_favorite: false,
    });

    // Extract filter ID from result
    const idMatch = createResult.match(/ID: ([a-zA-Z0-9-]+)/);
    createdFilterId = idMatch ? idMatch[1] : null;

    tests.push({
      toolName: "todoist_filter_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created filter",
      responseTime: Date.now() - createStart,
      details: { filterId: createdFilterId, filterName: testData.filterName },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isPlanRestriction = errorMessage.includes("Pro") || errorMessage.includes("Business");

    tests.push({
      toolName: "todoist_filter_create",
      operation: "CREATE",
      status: isPlanRestriction ? "skipped" : "error",
      message: isPlanRestriction
        ? "Skipped: Filters require Todoist Pro/Business plan"
        : "Failed to create filter",
      responseTime: Date.now() - createStart,
      error: errorMessage,
    });
  }

  // Test 3: Update Filter
  if (createdFilterId) {
    const updateStart = Date.now();
    try {
      await handleUpdateFilter({
        filter_name: testData.filterName,
        query: "p1 & today",
        color: "blue",
      });
      tests.push({
        toolName: "todoist_filter_update",
        operation: "UPDATE",
        status: "success",
        message: "Successfully updated filter",
        responseTime: Date.now() - updateStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_filter_update",
        operation: "UPDATE",
        status: "error",
        message: "Failed to update filter",
        responseTime: Date.now() - updateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_filter_update",
      operation: "UPDATE",
      status: "skipped",
      message: "Skipped: No filter created to update",
      responseTime: 0,
    });
  }

  // Test 4: Get Filters (verify update)
  if (createdFilterId) {
    const getAfterUpdateStart = Date.now();
    try {
      const filters = await handleGetFilters();
      const hasUpdatedFilter = filters.includes("p1 & today");
      tests.push({
        toolName: "todoist_filter_get",
        operation: "READ (verify update)",
        status: hasUpdatedFilter ? "success" : "error",
        message: hasUpdatedFilter
          ? "Successfully verified filter update"
          : "Filter update verification failed - updated query not found",
        responseTime: Date.now() - getAfterUpdateStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_filter_get",
        operation: "READ (verify update)",
        status: "error",
        message: "Failed to verify filter update",
        responseTime: Date.now() - getAfterUpdateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 5: Delete Filter
  if (createdFilterId) {
    const deleteStart = Date.now();
    try {
      await handleDeleteFilter({
        filter_name: testData.filterName,
      });
      tests.push({
        toolName: "todoist_filter_delete",
        operation: "DELETE",
        status: "success",
        message: "Successfully deleted filter",
        responseTime: Date.now() - deleteStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_filter_delete",
        operation: "DELETE",
        status: "error",
        message: "Failed to delete filter",
        responseTime: Date.now() - deleteStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_filter_delete",
      operation: "DELETE",
      status: "skipped",
      message: "Skipped: No filter created to delete",
      responseTime: 0,
    });
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Filter Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}
