// Collaboration operations testing module
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleGetProjects,
  handleGetCollaborators,
} from "../project-handlers.js";
import { handleCreateTask, handleDeleteTask } from "../task-handlers.js";
import { TestSuite, EnhancedTestResult, generateTestData } from "./types.js";
import { extractArrayFromResponse } from "../../utils/api-helpers.js";

interface ProjectInfo {
  id: string;
  name: string;
}

export async function testCollaborationOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateTestData();
  let testProjectId: string | null = null;
  let firstCollaboratorId: string | null = null;
  let assignedTaskId: string | null = null;

  // Test 1: Get projects to find a suitable test project
  const getProjectsStart = Date.now();
  try {
    const projectsResult = await handleGetProjects(todoistClient);
    // Find the first project ID from the result
    const idMatch = projectsResult.match(/ID: ([a-zA-Z0-9]+)/);
    testProjectId = idMatch ? idMatch[1] : null;

    tests.push({
      toolName: "todoist_project_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved projects for collaboration testing",
      responseTime: Date.now() - getProjectsStart,
      details: { foundProjectId: testProjectId },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_project_get",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve projects",
      responseTime: Date.now() - getProjectsStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Get collaborators for the test project
  if (testProjectId) {
    const getCollabStart = Date.now();
    try {
      const collabResult = await handleGetCollaborators(todoistClient, {
        project_id: testProjectId,
      });

      // Check if we found any collaborators (extract ID from result)
      const collabIdMatch = collabResult.match(/ID: ([a-zA-Z0-9]+)/);
      firstCollaboratorId = collabIdMatch ? collabIdMatch[1] : null;

      // For personal projects (no collaborators), this is still success
      const hasCollaborators = !collabResult.includes("No collaborators found");

      tests.push({
        toolName: "todoist_collaborators_get",
        operation: "READ",
        status: "success",
        message: hasCollaborators
          ? "Successfully retrieved project collaborators"
          : "Project has no collaborators (personal project)",
        responseTime: Date.now() - getCollabStart,
        details: {
          projectId: testProjectId,
          hasCollaborators,
          firstCollaboratorId,
        },
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_collaborators_get",
        operation: "READ",
        status: "error",
        message: "Failed to retrieve collaborators",
        responseTime: Date.now() - getCollabStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_collaborators_get",
      operation: "READ",
      status: "skipped",
      message: "Skipped - no project ID available",
      responseTime: 0,
    });
  }

  // Test 3: Create a task with assignee (if collaborators exist)
  if (testProjectId && firstCollaboratorId) {
    const createAssignedStart = Date.now();
    try {
      const createResult = await handleCreateTask(todoistClient, {
        content: `${testData.taskContent} - Assigned`,
        project_id: testProjectId,
        assignee_id: firstCollaboratorId,
      });

      // Extract task ID from result
      const idMatch = createResult.match(/ID: ([a-zA-Z0-9]+)/);
      assignedTaskId = idMatch ? idMatch[1] : null;

      tests.push({
        toolName: "todoist_task_create",
        operation: "CREATE (with assignee)",
        status: "success",
        message: "Successfully created task with assignee",
        responseTime: Date.now() - createAssignedStart,
        details: {
          taskId: assignedTaskId,
          assigneeId: firstCollaboratorId,
        },
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_task_create",
        operation: "CREATE (with assignee)",
        status: "error",
        message: "Failed to create task with assignee",
        responseTime: Date.now() - createAssignedStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    tests.push({
      toolName: "todoist_task_create",
      operation: "CREATE (with assignee)",
      status: "skipped",
      message:
        "Skipped - no shared project with collaborators available for assignment testing",
      responseTime: 0,
    });
  }

  // Cleanup: Delete the assigned task if created
  if (assignedTaskId) {
    const deleteStart = Date.now();
    try {
      await handleDeleteTask(todoistClient, {
        task_id: assignedTaskId,
      });
      tests.push({
        toolName: "todoist_task_delete",
        operation: "DELETE (cleanup)",
        status: "success",
        message: "Successfully cleaned up assigned task",
        responseTime: Date.now() - deleteStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_task_delete",
        operation: "DELETE (cleanup)",
        status: "error",
        message: "Failed to cleanup assigned task",
        responseTime: Date.now() - deleteStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Collaboration Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}
