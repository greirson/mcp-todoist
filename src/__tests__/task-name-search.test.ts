import { TodoistApi } from "@doist/todoist-api-typescript";
import { handleGetTasks } from "../handlers/task-handlers.js";
import { GetTasksArgs, TodoistTask } from "../types.js";
import { ValidationError } from "../errors.js";

// Mock the TodoistApi
jest.mock("@doist/todoist-api-typescript");

describe("Task Name Search Functionality", () => {
  let mockTodoistClient: TodoistApi;

  const mockTasks: TodoistTask[] = [
    {
      id: "1",
      content: "Bobo McJiggles Task",
      description: "Test task 1",
      priority: 4, // API priority 4 = user priority 1 (highest)
      labels: [],
      projectId: "project1",
      sectionId: null,
      parentId: null,
      isCompleted: false,
      due: null,
    },
    {
      id: "2",
      content: "Another Bobo McJiggles Task",
      description: "Test task 2",
      priority: 3, // API priority 3 = user priority 2
      labels: [],
      projectId: "project1",
      sectionId: null,
      parentId: null,
      isCompleted: false,
      due: null,
    },
    {
      id: "3",
      content: "Regular Task",
      description: "Test task 3",
      priority: 2, // API priority 2 = user priority 3
      labels: [],
      projectId: "project1",
      sectionId: null,
      parentId: null,
      isCompleted: false,
      due: null,
    },
  ];

  beforeEach(() => {
    mockTodoistClient = {
      getTasks: jest.fn().mockResolvedValue(mockTasks),
      getTasksByFilter: jest.fn(),
      getTask: jest.fn(),
    } as any;

    // Clear module cache
    jest.clearAllMocks();

    // Clear the task cache to ensure tests are isolated
    const { CacheManager } = require("../cache.js");
    const cacheManager = CacheManager.getInstance();
    cacheManager.clearAll();
  });

  describe("task_name parameter", () => {
    it("should filter tasks by partial name match (case-insensitive)", async () => {
      const args: GetTasksArgs = {
        task_name: "bobo",
      };

      const result = await handleGetTasks(mockTodoistClient, args);

      expect(mockTodoistClient.getTasks).toHaveBeenCalledWith(undefined);
      expect(result).toContain("Bobo McJiggles Task");
      expect(result).toContain("Another Bobo McJiggles Task");
      expect(result).not.toContain("Regular Task");
    });

    it("should handle task_name with different casing", async () => {
      const args: GetTasksArgs = {
        task_name: "BOBO",
      };

      const result = await handleGetTasks(mockTodoistClient, args);

      expect(result).toContain("Bobo McJiggles Task");
      expect(result).toContain("Another Bobo McJiggles Task");
      expect(result).not.toContain("Regular Task");
    });

    it("should return no tasks message when task_name doesn't match", async () => {
      const args: GetTasksArgs = {
        task_name: "nonexistent",
      };

      const result = await handleGetTasks(mockTodoistClient, args);

      expect(result).toBe("No tasks found matching the criteria");
    });

    it("should combine task_name with other filters", async () => {
      const args: GetTasksArgs = {
        task_name: "bobo",
        priority: 1, // User-facing priority 1 (highest) maps to API priority 4
      };

      const result = await handleGetTasks(mockTodoistClient, args);

      expect(result).toContain("Bobo McJiggles Task");
      expect(result).not.toContain("Another Bobo McJiggles Task"); // priority 2
      expect(result).not.toContain("Regular Task");
    });
  });

  describe("filter parameter error handling", () => {
    it("should provide helpful error for invalid filter syntax", async () => {
      const args: GetTasksArgs = {
        filter: "bobo", // Invalid filter syntax
      };

      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockRejectedValue(new Error("Request failed with status code 400"));

      await expect(handleGetTasks(mockTodoistClient, args)).rejects.toThrow(
        ValidationError
      );

      await expect(handleGetTasks(mockTodoistClient, args)).rejects.toThrow(
        /Invalid filter syntax "bobo"/
      );

      await expect(handleGetTasks(mockTodoistClient, args)).rejects.toThrow(
        /use the task_name parameter instead/
      );
    });

    it("should work with valid filter syntax", async () => {
      const args: GetTasksArgs = {
        filter: "today",
      };

      const filterResults = [mockTasks[0]];
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(filterResults);

      const result = await handleGetTasks(mockTodoistClient, args);

      expect(mockTodoistClient.getTasksByFilter).toHaveBeenCalledWith({
        query: "today",
        lang: undefined,
        limit: undefined,
      });
      expect(result).toContain("Bobo McJiggles Task");
    });

    it("should work with search filter syntax", async () => {
      const args: GetTasksArgs = {
        filter: 'search:"bobo"',
      };

      const filterResults = [mockTasks[0], mockTasks[1]];
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(filterResults);

      const result = await handleGetTasks(mockTodoistClient, args);

      expect(mockTodoistClient.getTasksByFilter).toHaveBeenCalledWith({
        query: 'search:"bobo"',
        lang: undefined,
        limit: undefined,
      });
      expect(result).toContain("Bobo McJiggles Task");
      expect(result).toContain("Another Bobo McJiggles Task");
    });

    it("should re-throw non-400 errors from filter", async () => {
      const args: GetTasksArgs = {
        filter: "today",
      };

      const networkError = new Error("Network error");
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockRejectedValue(networkError);

      // Ensure getTasks is also mocked to avoid fallback
      mockTodoistClient.getTasks = jest.fn().mockRejectedValue(networkError);

      await expect(handleGetTasks(mockTodoistClient, args)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("combined filter and task_name", () => {
    it("should apply both filter and task_name when provided together", async () => {
      const args: GetTasksArgs = {
        filter: "p1 | p2",
        task_name: "bobo",
      };

      // Filter returns first two tasks (both have bobo)
      const filterResults = [mockTasks[0], mockTasks[1]];
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(filterResults);

      const result = await handleGetTasks(mockTodoistClient, args);

      expect(mockTodoistClient.getTasksByFilter).toHaveBeenCalled();
      // Both tasks match "bobo" so both should be in result
      expect(result).toContain("Bobo McJiggles Task");
      expect(result).toContain("Another Bobo McJiggles Task");
    });

    it("should filter out tasks that don't match task_name even if filter returns them", async () => {
      const args: GetTasksArgs = {
        filter: "today",
        task_name: "regular",
      };

      // Filter returns all tasks
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(mockTasks);

      const result = await handleGetTasks(mockTodoistClient, args);

      // Only "Regular Task" matches task_name
      expect(result).not.toContain("Bobo McJiggles");
      expect(result).toContain("Regular Task");
    });
  });

  describe("limit parameter interaction", () => {
    it("should apply limit after task_name filtering", async () => {
      const args: GetTasksArgs = {
        task_name: "bobo",
        limit: 1,
      };

      const result = await handleGetTasks(mockTodoistClient, args);

      // Should only return one Bobo task due to limit
      expect(result).toContain("1 task found");
      expect(result).toContain("Bobo McJiggles Task");
    });
  });
});
