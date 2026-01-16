// Comment management test suite
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  EnhancedTestResult,
  TestSuite,
  generateTestData,
} from "./types.js";

interface CommentTestContext {
  taskId?: string;
  commentId?: string;
}

export async function testCommentOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const suiteStartTime = Date.now();
  const testData = generateTestData();
  const context: CommentTestContext = {};

  // Test 1: Create a task to test comments on
  const createTaskStart = Date.now();
  try {
    const task = await todoistClient.addTask({
      content: `${testData.taskContent} - Comment Test`,
    });
    context.taskId = task.id;
    tests.push({
      toolName: "todoist_task_create",
      operation: "Create task for comment testing",
      status: "success",
      message: `Created task: ${task.content} (ID: ${task.id})`,
      responseTime: Date.now() - createTaskStart,
      details: { taskId: task.id },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_task_create",
      operation: "Create task for comment testing",
      status: "error",
      message: "Failed to create test task",
      responseTime: Date.now() - createTaskStart,
      error: error instanceof Error ? error.message : String(error),
    });
    // Return early if we can't create the task
    return createTestSuite(tests, suiteStartTime);
  }

  // Test 2: Create a comment on the task
  const createCommentStart = Date.now();
  try {
    const comment = await todoistClient.addComment({
      taskId: context.taskId!,
      content: testData.commentContent,
    });
    context.commentId = comment.id;
    tests.push({
      toolName: "todoist_comment_create",
      operation: "Create comment on task",
      status: "success",
      message: `Created comment: ${comment.content} (ID: ${comment.id})`,
      responseTime: Date.now() - createCommentStart,
      details: { commentId: comment.id, taskId: context.taskId },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_comment_create",
      operation: "Create comment on task",
      status: "error",
      message: "Failed to create comment",
      responseTime: Date.now() - createCommentStart,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 3: Get comments for the task
  const getCommentsStart = Date.now();
  try {
    const commentsResult = await todoistClient.getComments({
      taskId: context.taskId!,
    });
    // Handle both array and object with results property
    const comments = Array.isArray(commentsResult)
      ? commentsResult
      : (commentsResult as { results?: unknown[] }).results || [];
    tests.push({
      toolName: "todoist_comment_get",
      operation: "Get comments for task",
      status: "success",
      message: `Retrieved ${comments.length} comment(s)`,
      responseTime: Date.now() - getCommentsStart,
      details: { commentCount: comments.length },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_comment_get",
      operation: "Get comments for task",
      status: "error",
      message: "Failed to get comments",
      responseTime: Date.now() - getCommentsStart,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 4: Update the comment
  if (context.commentId) {
    const updateCommentStart = Date.now();
    try {
      const updatedComment = await todoistClient.updateComment(
        context.commentId,
        {
          content: `Updated: ${testData.commentContent}`,
        }
      );
      tests.push({
        toolName: "todoist_comment_update",
        operation: "Update comment content",
        status: "success",
        message: `Updated comment: ${updatedComment.content}`,
        responseTime: Date.now() - updateCommentStart,
        details: { commentId: context.commentId },
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_comment_update",
        operation: "Update comment content",
        status: "error",
        message: "Failed to update comment",
        responseTime: Date.now() - updateCommentStart,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    tests.push({
      toolName: "todoist_comment_update",
      operation: "Update comment content",
      status: "skipped",
      message: "Skipped - no comment ID available",
      responseTime: 0,
    });
  }

  // Test 5: Delete the comment
  if (context.commentId) {
    const deleteCommentStart = Date.now();
    try {
      const deleteResult = await todoistClient.deleteComment(context.commentId);
      tests.push({
        toolName: "todoist_comment_delete",
        operation: "Delete comment",
        status: deleteResult ? "success" : "error",
        message: deleteResult
          ? `Deleted comment (ID: ${context.commentId})`
          : "Delete returned false",
        responseTime: Date.now() - deleteCommentStart,
        details: { commentId: context.commentId, success: deleteResult },
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_comment_delete",
        operation: "Delete comment",
        status: "error",
        message: "Failed to delete comment",
        responseTime: Date.now() - deleteCommentStart,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    tests.push({
      toolName: "todoist_comment_delete",
      operation: "Delete comment",
      status: "skipped",
      message: "Skipped - no comment ID available",
      responseTime: 0,
    });
  }

  // Cleanup: Delete the test task
  if (context.taskId) {
    const cleanupStart = Date.now();
    try {
      await todoistClient.deleteTask(context.taskId);
      tests.push({
        toolName: "cleanup",
        operation: "Delete test task",
        status: "success",
        message: `Cleaned up test task (ID: ${context.taskId})`,
        responseTime: Date.now() - cleanupStart,
      });
    } catch (error) {
      tests.push({
        toolName: "cleanup",
        operation: "Delete test task",
        status: "error",
        message: "Failed to clean up test task",
        responseTime: Date.now() - cleanupStart,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return createTestSuite(tests, suiteStartTime);
}

function createTestSuite(
  tests: EnhancedTestResult[],
  startTime: number
): TestSuite {
  return {
    suiteName: "Comment Management",
    tests,
    totalTime: Date.now() - startTime,
    passed: tests.filter((t) => t.status === "success").length,
    failed: tests.filter((t) => t.status === "error").length,
    skipped: tests.filter((t) => t.status === "skipped").length,
  };
}
