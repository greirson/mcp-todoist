// Main enhanced test handler combining all test suites
import { TodoistApi } from "@doist/todoist-api-typescript";
import { testTaskOperations } from "./task-tests.js";
import { testSubtaskOperations } from "./subtask-tests.js";
import { testLabelOperations } from "./label-tests.js";
import { testBulkOperations } from "./bulk-tests.js";
import { testQuickAddOperations } from "./quick-add-tests.js";
import { testDurationAndReopenOperations } from "./duration-reopen-tests.js";
import { testSectionOperations } from "./section-tests.js";
import { testProjectOperations } from "./project-tests.js";
import { TestSuite, ComprehensiveTestReport } from "./types.js";

export async function handleTestAllFeaturesEnhanced(
  todoistClient: TodoistApi,
  apiToken?: string
): Promise<ComprehensiveTestReport> {
  const testStartTime = Date.now();
  const suites: TestSuite[] = [];

  // Run all test suites
  suites.push(await testTaskOperations(todoistClient));
  suites.push(await testSubtaskOperations(todoistClient));
  suites.push(await testLabelOperations(todoistClient));
  suites.push(await testSectionOperations(todoistClient));
  suites.push(await testBulkOperations(todoistClient));
  suites.push(await testDurationAndReopenOperations(todoistClient));
  suites.push(await testProjectOperations(todoistClient));

  // Run quick add tests if API token is provided
  if (apiToken) {
    suites.push(await testQuickAddOperations(todoistClient, apiToken));
  }

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

// Export types for use by other modules
export type {
  EnhancedTestResult,
  TestSuite,
  ComprehensiveTestReport,
} from "./types.js";

// Export individual test functions for potential standalone use
export { testTaskOperations } from "./task-tests.js";
export { testSubtaskOperations } from "./subtask-tests.js";
export { testLabelOperations } from "./label-tests.js";
export { testSectionOperations } from "./section-tests.js";
export { testBulkOperations } from "./bulk-tests.js";
export { testQuickAddOperations } from "./quick-add-tests.js";
export { testDurationAndReopenOperations } from "./duration-reopen-tests.js";
export { testProjectOperations } from "./project-tests.js";
