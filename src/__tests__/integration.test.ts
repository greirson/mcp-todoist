import { describe, test, expect, beforeAll } from "@jest/globals";
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleTestConnection,
  handleTestAllFeatures,
  handleTestPerformance,
} from "../handlers/test-handlers";
import { handleGetCompletedTasks } from "../handlers/task-handlers";

const token = process.env.TODOIST_API_TOKEN;
const describeIfToken = token ? describe : describe.skip;

if (!token) {
  console.log(
    "⚠️  Skipping integration tests: TODOIST_API_TOKEN environment variable not set.\n" +
      "   To run integration tests, set your Todoist API token:\n" +
      "   export TODOIST_API_TOKEN='your-token-here'"
  );
}

describeIfToken("Todoist MCP Integration Tests", () => {
  let todoistClient: TodoistApi;

  beforeAll(() => {
    if (!token) {
      throw new Error(
        "TODOIST_API_TOKEN environment variable is required for tests"
      );
    }
    todoistClient = new TodoistApi(token);
  });

  describe("Connection Tests", () => {
    test("should successfully connect to Todoist API", async () => {
      const result = await handleTestConnection(todoistClient);

      expect(result.status).toBe("success");
      expect(result.message).toBe("Connection successful");
      expect(result.responseTime).toBeDefined();
      expect(result.apiVersion).toBe("v2");
    });

    test("should fail with invalid token", async () => {
      const invalidClient = new TodoistApi("invalid-token");
      const result = await handleTestConnection(invalidClient);

      expect(result.status).toBe("error");
      expect(result.error).toBeDefined();
    });
  });

  describe("Feature Tests", () => {
    test("should run all feature tests successfully", async () => {
      const result = (await handleTestAllFeatures(todoistClient)) as any;

      expect(result.overallStatus).toMatch(/success|partial/);
      expect(result.totalTests).toBeGreaterThan(0);
      expect(result.features).toBeDefined();
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.totalResponseTime).toBeGreaterThan(0);

      // Check specific features
      const featureNames = result.features.map((f: any) => f.feature);
      expect(featureNames).toContain("Task Operations");
      expect(featureNames).toContain("Project Operations");
      expect(featureNames).toContain("Label Operations");
      expect(featureNames).toContain("Section Operations");
      expect(featureNames).toContain("Comment Operations");
    }, 120000); // 2 minute timeout for comprehensive feature tests hitting live API
  });

  describe("Performance Tests", () => {
    test("should measure performance with default iterations", async () => {
      const result = await handleTestPerformance(todoistClient);

      expect(result.iterations).toBe(5);
      expect(result.averageResponseTime).toBeGreaterThan(0);
      expect(result.minResponseTime).toBeGreaterThan(0);
      expect(result.maxResponseTime).toBeGreaterThanOrEqual(
        result.minResponseTime
      );
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    }, 30000);

    test("should measure performance with custom iterations", async () => {
      const result = await handleTestPerformance(todoistClient, {
        iterations: 3,
      });

      expect(result.iterations).toBe(3);
      expect(
        result.results.filter((r) => r.operation === "getProjects").length
      ).toBe(3);
      expect(
        result.results.filter((r) => r.operation === "getTasks").length
      ).toBe(3);
    }, 30000);
  });

  describe("Feature-specific Tests", () => {
    test("Task operations should handle empty results gracefully", async () => {
      const result = (await handleTestAllFeatures(todoistClient)) as any;
      const taskOps = result.features.find(
        (f: any) => f.feature === "Task Operations"
      );

      expect(taskOps).toBeDefined();
      expect(taskOps?.status).toMatch(/success|error/);
      if (taskOps?.status === "success") {
        expect(taskOps.details).toBeDefined();
      }
    }, 120000);

    test("Project operations should always succeed", async () => {
      const result = (await handleTestAllFeatures(todoistClient)) as any;
      const projectOps = result.features.find(
        (f: any) => f.feature === "Project Operations"
      );

      expect(projectOps).toBeDefined();
      expect(projectOps?.status).toBe("success");
      expect(projectOps?.details?.projectCount).toBeGreaterThanOrEqual(0);
    }, 120000);
  });

  describe("Completed Tasks (Sync API)", () => {
    test("should fetch completed tasks without filters", async () => {
      const result = await handleGetCompletedTasks(todoistClient!, {});

      // Should return either tasks or "no tasks found" message
      expect(typeof result).toBe("string");
      expect(
        result.includes("completed") || result.includes("No completed tasks")
      ).toBe(true);
    });

    test("should fetch completed tasks with limit", async () => {
      const result = await handleGetCompletedTasks(todoistClient!, {
        limit: 5,
      });

      expect(typeof result).toBe("string");
      // If there are results, count shouldn't exceed limit
      const match = result.match(/^(\d+) completed/);
      if (match) {
        expect(parseInt(match[1])).toBeLessThanOrEqual(5);
      }
    });

    test("should fetch completed tasks with date range", async () => {
      // Get tasks from the last 7 days
      const until = new Date().toISOString().split("T")[0] + "T23:59:59";
      const since =
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] + "T00:00:00";

      const result = await handleGetCompletedTasks(todoistClient!, {
        since,
        until,
      });

      expect(typeof result).toBe("string");
      expect(
        result.includes("completed") || result.includes("No completed tasks")
      ).toBe(true);
    });

    test("should handle invalid limit gracefully", async () => {
      await expect(
        handleGetCompletedTasks(todoistClient!, { limit: 500 })
      ).rejects.toThrow("Limit must be an integer between 1 and 200");
    });

    test("should include project names in output", async () => {
      const result = await handleGetCompletedTasks(todoistClient!, {
        limit: 3,
      });

      // If there are results, they should include project info
      if (!result.includes("No completed tasks")) {
        expect(result.includes("Project:")).toBe(true);
      }
    });
  });
});
