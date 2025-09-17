// Common types and utilities for enhanced testing
export interface EnhancedTestResult {
  toolName: string;
  operation: string;
  status: "success" | "error" | "skipped";
  message: string;
  responseTime: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface TestSuite {
  suiteName: string;
  tests: EnhancedTestResult[];
  totalTime: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface ComprehensiveTestReport {
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
export function generateTestData(): {
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
