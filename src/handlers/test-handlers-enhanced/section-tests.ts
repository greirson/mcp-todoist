// Section operations testing module
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleGetSections,
  handleCreateSection,
  handleUpdateSection,
  handleDeleteSection,
  handleGetProjects,
} from "../project-handlers.js";
import { TestSuite, EnhancedTestResult, generateTestData } from "./types.js";

export async function testSectionOperations(
  todoistClient: TodoistApi
): Promise<TestSuite> {
  const tests: EnhancedTestResult[] = [];
  const startTime = Date.now();
  const testData = generateTestData();
  let createdSectionId: string | null = null;
  let testProjectId: string | null = null;

  // First, get a project to use for section tests
  try {
    const projectsResult = await handleGetProjects(todoistClient);
    // Extract first project ID from result (format: "- ProjectName (ID: xxx)")
    const idMatch = projectsResult.match(/\(ID: ([a-zA-Z0-9]+)\)/);
    testProjectId = idMatch ? idMatch[1] : null;
  } catch {
    // If we can't get projects, skip section tests
    return {
      suiteName: "Section Operations",
      tests: [
        {
          toolName: "todoist_section_*",
          operation: "SETUP",
          status: "skipped",
          message: "Could not get project for section tests",
          responseTime: 0,
        },
      ],
      totalTime: Date.now() - startTime,
      passed: 0,
      failed: 0,
      skipped: 1,
    };
  }

  if (!testProjectId) {
    return {
      suiteName: "Section Operations",
      tests: [
        {
          toolName: "todoist_section_*",
          operation: "SETUP",
          status: "skipped",
          message: "No project available for section tests",
          responseTime: 0,
        },
      ],
      totalTime: Date.now() - startTime,
      passed: 0,
      failed: 0,
      skipped: 1,
    };
  }

  // Test 1: Create Section
  const createStart = Date.now();
  try {
    const createResult = await handleCreateSection(todoistClient, {
      name: testData.sectionName,
      project_id: testProjectId,
      order: 1,
    });

    // Extract section ID from result
    const idMatch = createResult.match(/ID: ([a-zA-Z0-9]+)/);
    createdSectionId = idMatch ? idMatch[1] : null;

    tests.push({
      toolName: "todoist_section_create",
      operation: "CREATE",
      status: "success",
      message: "Successfully created section",
      responseTime: Date.now() - createStart,
      details: { sectionId: createdSectionId, projectId: testProjectId },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_section_create",
      operation: "CREATE",
      status: "error",
      message: "Failed to create section",
      responseTime: Date.now() - createStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Get Sections
  const getStart = Date.now();
  try {
    const sections = await handleGetSections(todoistClient, {
      project_id: testProjectId,
    });
    tests.push({
      toolName: "todoist_section_get",
      operation: "READ",
      status: "success",
      message: "Successfully retrieved sections",
      responseTime: Date.now() - getStart,
      details: { sectionCount: sections.split("\n").length - 1 },
    });
  } catch (error) {
    tests.push({
      toolName: "todoist_section_get",
      operation: "READ",
      status: "error",
      message: "Failed to retrieve sections",
      responseTime: Date.now() - getStart,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Update Section by ID
  if (createdSectionId) {
    const updateStart = Date.now();
    try {
      await handleUpdateSection(todoistClient, {
        section_id: createdSectionId,
        name: `${testData.sectionName} Updated`,
      });
      tests.push({
        toolName: "todoist_section_update",
        operation: "UPDATE",
        status: "success",
        message: "Successfully updated section by ID",
        responseTime: Date.now() - updateStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_section_update",
        operation: "UPDATE",
        status: "error",
        message: "Failed to update section",
        responseTime: Date.now() - updateStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 4: Update Section by Name
  if (createdSectionId) {
    const updateByNameStart = Date.now();
    try {
      await handleUpdateSection(todoistClient, {
        section_name: `${testData.sectionName} Updated`,
        project_id: testProjectId,
        name: `${testData.sectionName} Final`,
      });
      tests.push({
        toolName: "todoist_section_update",
        operation: "UPDATE_BY_NAME",
        status: "success",
        message: "Successfully updated section by name",
        responseTime: Date.now() - updateByNameStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_section_update",
        operation: "UPDATE_BY_NAME",
        status: "error",
        message: "Failed to update section by name",
        responseTime: Date.now() - updateByNameStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test 5: Delete Section
  if (createdSectionId) {
    const deleteStart = Date.now();
    try {
      await handleDeleteSection(todoistClient, {
        section_id: createdSectionId,
      });
      tests.push({
        toolName: "todoist_section_delete",
        operation: "DELETE",
        status: "success",
        message: "Successfully deleted section",
        responseTime: Date.now() - deleteStart,
      });
    } catch (error) {
      tests.push({
        toolName: "todoist_section_delete",
        operation: "DELETE",
        status: "error",
        message: "Failed to delete section",
        responseTime: Date.now() - deleteStart,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const passed = tests.filter((t) => t.status === "success").length;
  const failed = tests.filter((t) => t.status === "error").length;
  const skipped = tests.filter((t) => t.status === "skipped").length;

  return {
    suiteName: "Section Operations",
    tests,
    totalTime: Date.now() - startTime,
    passed,
    failed,
    skipped,
  };
}
