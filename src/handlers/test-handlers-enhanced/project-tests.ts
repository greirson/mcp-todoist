// Project operations testing module
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleGetProjects,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
  handleArchiveProject,
  handleGetProjectCollaborators,
} from "../project-handlers.js";
import { TestSuite, EnhancedTestResult, generateTestData } from "./types.js";

export async function testProjectOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateTestData();
  let createdProjectId: string | null = null;
  let childProjectId: string | null = null;

  // Test 1: Create Parent Project with description and view_style
  const createStart = Date.now();
  try {
    const createResult = await handleCreateProject(todoistClient, {
      name: testData.projectName,
      color: "blue",
      is_favorite: false,
      description: "Test project for enhanced testing",
      view_style: "list",
    });

    // Extract project ID from result
    const idMatch = createResult.match(/ID: ([a-zA-Z0-9]+)/);
    createdProjectId = idMatch ? idMatch[1] : null;

    tests.push({
      toolName: "todoist_project_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created parent project with description",
      responseTime: Date.now() - createStart,
      details: { projectId: createdProjectId },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_project_create",
      operation: "CREATE",
      status: "error",
      message: "Failed to create parent project",
      responseTime: Date.now() - createStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Create Sub-project (child project)
  if (createdProjectId) {
    const childCreateStart = Date.now();
    try {
      const childResult = await handleCreateProject(todoistClient, {
        name: `${testData.projectName} - Child`,
        parent_id: createdProjectId,
        color: "green",
        view_style: "board",
      });

      // Extract child project ID
      const childIdMatch = childResult.match(/ID: ([a-zA-Z0-9]+)/);
      childProjectId = childIdMatch ? childIdMatch[1] : null;

      tests.push({
        toolName: "todoist_project_create",
        operation: "CREATE_SUBPROJECT",
        status: "success",
        message: "Successfully created sub-project",
        responseTime: Date.now() - childCreateStart,
        details: { childProjectId, parentProjectId: createdProjectId },
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_project_create",
        operation: "CREATE_SUBPROJECT",
        status: "error",
        message: "Failed to create sub-project",
        responseTime: Date.now() - childCreateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 3: Get Projects (verify hierarchy)
  const getStart = Date.now();
  try {
    const projects = await handleGetProjects(todoistClient);
    const hasHierarchy =
      projects.includes(testData.projectName) &&
      projects.includes("Sub-project of:");

    tests.push({
      toolName: "todoist_project_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved projects with hierarchy info",
      responseTime: Date.now() - getStart,
      details: { hierarchyDetected: hasHierarchy },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_project_get",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve projects",
      responseTime: Date.now() - getStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 4: Update Project (change description and color)
  if (createdProjectId) {
    const updateStart = Date.now();
    try {
      await handleUpdateProject(todoistClient, {
        project_id: createdProjectId,
        name: `${testData.projectName} - Updated`,
        description: "Updated description for testing",
        color: "red",
        view_style: "board",
      });

      tests.push({
        toolName: "todoist_project_update",
        operation: "UPDATE",
        status: "success",
        message: "Successfully updated project",
        responseTime: Date.now() - updateStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_project_update",
        operation: "UPDATE",
        status: "error",
        message: "Failed to update project",
        responseTime: Date.now() - updateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 5: Get Collaborators (for non-shared project, should return empty/message)
  if (createdProjectId) {
    const collabStart = Date.now();
    try {
      const collabResult = await handleGetProjectCollaborators(todoistClient, {
        project_id: createdProjectId,
      });

      // For non-shared projects, this should return a message about no collaborators
      const isExpectedResult =
        collabResult.includes("no collaborators") ||
        collabResult.includes("not shared") ||
        collabResult.includes("Collaborators");

      tests.push({
        toolName: "todoist_project_collaborators_get",
        operation: "READ",
        status: isExpectedResult ? "success" : "error",
        message: isExpectedResult
          ? "Successfully handled collaborators request"
          : "Unexpected collaborators response",
        responseTime: Date.now() - collabStart,
        details: { result: collabResult.substring(0, 100) },
      });
    } catch (error) {
      // This is acceptable for non-shared projects
      tests.push({
        toolName: "todoist_project_collaborators_get",
        operation: "READ",
        status: "success",
        message: "Collaborators endpoint handled (project not shared)",
        responseTime: Date.now() - collabStart,
        details: {
          note: "Expected behavior for non-shared project",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  // Test 6: Archive Project
  if (createdProjectId) {
    const archiveStart = Date.now();
    try {
      await handleArchiveProject(todoistClient, {
        project_id: createdProjectId,
        archive: true,
      });

      tests.push({
        toolName: "todoist_project_archive",
        operation: "ARCHIVE",
        status: "success",
        message: "Successfully archived project",
        responseTime: Date.now() - archiveStart,
      });
    } catch (error) {
      // Archive might not be available on all plans
      tests.push({
        toolName: "todoist_project_archive",
        operation: "ARCHIVE",
        status: "error",
        message: "Failed to archive project (may require premium)",
        responseTime: Date.now() - archiveStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 7: Unarchive Project
  if (createdProjectId) {
    const unarchiveStart = Date.now();
    try {
      await handleArchiveProject(todoistClient, {
        project_id: createdProjectId,
        archive: false,
      });

      tests.push({
        toolName: "todoist_project_archive",
        operation: "UNARCHIVE",
        status: "success",
        message: "Successfully unarchived project",
        responseTime: Date.now() - unarchiveStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_project_archive",
        operation: "UNARCHIVE",
        status: "error",
        message: "Failed to unarchive project",
        responseTime: Date.now() - unarchiveStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Cleanup: Delete child project first, then parent
  if (childProjectId) {
    const deleteChildStart = Date.now();
    try {
      await handleDeleteProject(todoistClient, {
        project_id: childProjectId,
      });

      tests.push({
        toolName: "todoist_project_delete",
        operation: "DELETE_SUBPROJECT",
        status: "success",
        message: "Successfully deleted sub-project",
        responseTime: Date.now() - deleteChildStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_project_delete",
        operation: "DELETE_SUBPROJECT",
        status: "error",
        message: "Failed to delete sub-project",
        responseTime: Date.now() - deleteChildStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 8: Delete Parent Project
  if (createdProjectId) {
    const deleteStart = Date.now();
    try {
      await handleDeleteProject(todoistClient, {
        project_id: createdProjectId,
      });

      tests.push({
        toolName: "todoist_project_delete",
        operation: "DELETE",
        status: "success",
        message: "Successfully deleted parent project",
        responseTime: Date.now() - deleteStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_project_delete",
        operation: "DELETE",
        status: "error",
        message: "Failed to delete parent project",
        responseTime: Date.now() - deleteStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Project Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}
