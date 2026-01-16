// Reminder operations testing module (Phase 10)
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleGetReminders,
  handleCreateReminder,
  handleUpdateReminder,
  handleDeleteReminder,
} from "../reminder-handlers.js";
import { TestSuite, EnhancedTestResult } from "./types.js";

export async function testReminderOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  let createdReminderId: string | null = null;
  let testTaskId: string | null = null;
  let testTaskContent: string | null = null;

  // First, create a test task to attach reminders to
  const taskSetupStart = Date.now();
  try {
    const timestamp = Date.now();
    const testTask = await todoistClient.addTask({
      content: `Test Reminder Task ${timestamp}`,
      dueString: "tomorrow at 10am", // Task needs due date for relative reminders
    });
    testTaskId = testTask.id;
    testTaskContent = testTask.content;

    tests.push({
      toolName: "setup_test_task",
      operation: "SETUP",
      status: "success",
      message: "Created test task for reminder tests",
      responseTime: Date.now() - taskSetupStart,
      details: { taskId: testTaskId },
    });
  } catch (error) {
    tests.push({
      toolName: "setup_test_task",
      operation: "SETUP",
      status: "error",
      message: "Failed to create test task for reminder tests",
      responseTime: Date.now() - taskSetupStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Return early if we can't create a test task
    return {
      suiteName: "Reminder Operations",
      tests,
      totalTime: Date.now() - startTime,
      passed: 0,
      failed: 1,
      skipped: 4,
    };
  }

  // Test 1: Get Reminders (initial - should be empty or existing)
  const getStart = Date.now();
  try {
    const reminders = await handleGetReminders(todoistClient, {});
    tests.push({
      toolName: "todoist_reminder_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved reminders",
      responseTime: Date.now() - getStart,
      details: { resultLength: reminders.length },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Check if this is a plan limitation error
    if (
      errorMessage.includes("Pro") ||
      errorMessage.includes("Business") ||
      errorMessage.includes("premium")
    ) {
      tests.push({
        toolName: "todoist_reminder_get",
        operation: "READ",
        status: "skipped",
        message: "Skipped: Reminders require Todoist Pro or Business plan",
        responseTime: Date.now() - getStart,
      });

      // Clean up test task and return early
      if (testTaskId) {
        try {
          await todoistClient.deleteTask(testTaskId);
        } catch {
          // Ignore cleanup errors
        }
      }

      return {
        suiteName: "Reminder Operations",
        tests,
        totalTime: Date.now() - startTime,
        passed: 1, // Setup succeeded
        failed: 0,
        skipped: 4,
      };
    }

    tests.push({
      toolName: "todoist_reminder_get",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve reminders",
      responseTime: Date.now() - getStart,
      error: errorMessage,
    });
  }

  // Test 2: Create Absolute Reminder
  const createStart = Date.now();
  try {
    // Create a reminder for 1 hour from now
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const createResult = await handleCreateReminder(todoistClient, {
      task_id: testTaskId!,
      type: "absolute",
      due_date: reminderTime.toISOString(),
    });

    // Extract reminder ID from result
    const idMatch = createResult.match(/ID: ([a-zA-Z0-9]+)/);
    createdReminderId = idMatch ? idMatch[1] : null;

    tests.push({
      toolName: "todoist_reminder_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created absolute reminder",
      responseTime: Date.now() - createStart,
      details: { reminderId: createdReminderId },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (
      errorMessage.includes("Pro") ||
      errorMessage.includes("Business") ||
      errorMessage.includes("premium")
    ) {
      tests.push({
        toolName: "todoist_reminder_create",
        operation: "CREATE",
        status: "skipped",
        message: "Skipped: Reminders require Todoist Pro or Business plan",
        responseTime: Date.now() - createStart,
      });
    } else {
      tests.push({
        toolName: "todoist_reminder_create",
        operation: "CREATE",
        status: "error",
        message: "Failed to create reminder",
        responseTime: Date.now() - createStart,
        error: errorMessage,
      });
    }
  }

  // Test 3: Update Reminder
  if (createdReminderId) {
    const updateStart = Date.now();
    try {
      // Update to 2 hours from now
      const newReminderTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await handleUpdateReminder({
        reminder_id: createdReminderId,
        due_date: newReminderTime.toISOString(),
      });

      tests.push({
        toolName: "todoist_reminder_update",
        operation: "UPDATE",
        status: "success",
        message: "Successfully updated reminder",
        responseTime: Date.now() - updateStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_reminder_update",
        operation: "UPDATE",
        status: "error",
        message: "Failed to update reminder",
        responseTime: Date.now() - updateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_reminder_update",
      operation: "UPDATE",
      status: "skipped",
      message: "Skipped: No reminder created to update",
      responseTime: 0,
    });
  }

  // Test 4: Get Reminders for Task
  const getTaskRemindersStart = Date.now();
  try {
    const taskReminders = await handleGetReminders(todoistClient, {
      task_id: testTaskId!,
    });

    tests.push({
      toolName: "todoist_reminder_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved reminders for task",
      responseTime: Date.now() - getTaskRemindersStart,
      details: { resultLength: taskReminders.length },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_reminder_get",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve reminders for task",
      responseTime: Date.now() - getTaskRemindersStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 5: Delete Reminder
  if (createdReminderId) {
    const deleteStart = Date.now();
    try {
      await handleDeleteReminder({
        reminder_id: createdReminderId,
      });

      tests.push({
        toolName: "todoist_reminder_delete",
        operation: "DELETE",
        status: "success",
        message: "Successfully deleted reminder",
        responseTime: Date.now() - deleteStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_reminder_delete",
        operation: "DELETE",
        status: "error",
        message: "Failed to delete reminder",
        responseTime: Date.now() - deleteStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_reminder_delete",
      operation: "DELETE",
      status: "skipped",
      message: "Skipped: No reminder created to delete",
      responseTime: 0,
    });
  }

  // Cleanup: Delete the test task
  if (testTaskId) {
    const cleanupStart = Date.now();
    try {
      await todoistClient.deleteTask(testTaskId);
      tests.push({
        toolName: "cleanup_test_task",
        operation: "CLEANUP",
        status: "success",
        message: `Cleaned up test task "${testTaskContent}"`,
        responseTime: Date.now() - cleanupStart,
      });
    } catch (error) {
      tests.push({
        toolName: "cleanup_test_task",
        operation: "CLEANUP",
        status: "error",
        message: "Failed to clean up test task",
        responseTime: Date.now() - cleanupStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Reminder Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}
