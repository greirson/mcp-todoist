import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the cache module before importing handlers
jest.mock("../cache.js", () => ({
  CacheManager: {
    getInstance: jest.fn().mockReturnValue({
      getOrCreateCache: jest.fn().mockReturnValue({
        clear: jest.fn(),
      }),
    }),
  },
}));

// Mock the api-helpers module - fetchAllTasks delegates to the mock client's getTasks,
// fetchAllPaginated calls the provided fetch function and extracts results
jest.mock("../utils/api-helpers.js", () => ({
  extractArrayFromResponse: jest.fn((response: unknown) => response),
  fetchAllTasks: jest.fn(
    async (
      client: { getTasks: (params?: unknown) => Promise<unknown> },
      params?: unknown
    ) => {
      const result = await client.getTasks(params);
      return Array.isArray(result) ? result : [];
    }
  ),
  fetchAllPaginated: jest.fn(
    async (fetchPage: () => Promise<{ results: unknown[] }>) => {
      try {
        const response = await fetchPage();
        return Array.isArray(response) ? response : response?.results || [];
      } catch {
        return [];
      }
    }
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
type AnyFunction = (...args: any[]) => any;

// Create typed mock functions
const mockGetTasks = jest.fn<AnyFunction>();
const mockGetTask = jest.fn<AnyFunction>();
const mockGetProjects = jest.fn<AnyFunction>();
const mockCloseTask = jest.fn<AnyFunction>();
const mockDeleteTask = jest.fn<AnyFunction>();

// Mock the TodoistApi
jest.mock("@doist/todoist-api-typescript", () => ({
  TodoistApi: jest.fn().mockImplementation(() => ({
    getTasks: mockGetTasks,
    getTask: mockGetTask,
    getProjects: mockGetProjects,
    closeTask: mockCloseTask,
    deleteTask: mockDeleteTask,
  })),
}));

// Import after mocking
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleFindDuplicates,
  handleMergeDuplicates,
} from "../handlers/duplicate-handlers.js";

describe("Duplicate Handlers", () => {
  let mockClient: TodoistApi;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new TodoistApi("test-token");
    mockGetProjects.mockResolvedValue([]);
  });

  describe("handleFindDuplicates", () => {
    describe("Levenshtein similarity algorithm", () => {
      it("should find exact duplicates (100% similarity)", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Buy groceries", isCompleted: false },
          { id: "2", content: "Buy groceries", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
        });

        expect(result).toContain("Found 1 group(s) of potential duplicates");
        expect(result).toContain("100% similar");
        expect(result).toContain("Buy groceries");
      });

      it("should find similar tasks above threshold", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Buy groceries today", isCompleted: false },
          { id: "2", content: "Buy groceries tomorrow", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 70,
        });

        expect(result).toContain("Found 1 group(s) of potential duplicates");
        expect(result).toContain("Buy groceries today");
        expect(result).toContain("Buy groceries tomorrow");
      });

      it("should not group tasks below threshold", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Buy groceries", isCompleted: false },
          { id: "2", content: "Clean the house", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
        });

        expect(result).toContain("No duplicate tasks found");
      });

      it("should handle case-insensitive matching", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Buy Groceries", isCompleted: false },
          { id: "2", content: "buy groceries", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
        });

        expect(result).toContain("Found 1 group(s) of potential duplicates");
        expect(result).toContain("100% similar");
      });

      it("should use default threshold of 80 when not specified", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Meeting with team", isCompleted: false },
          { id: "2", content: "Meeting with team!", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {});

        expect(result).toContain("threshold: 80%");
      });
    });

    describe("threshold validation", () => {
      it("should reject threshold below 0", async () => {
        await expect(
          handleFindDuplicates(mockClient, { threshold: -1 })
        ).rejects.toThrow("Threshold must be between 0 and 100");
      });

      it("should reject threshold above 100", async () => {
        await expect(
          handleFindDuplicates(mockClient, { threshold: 101 })
        ).rejects.toThrow("Threshold must be between 0 and 100");
      });

      it("should accept threshold of 0", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Task A", isCompleted: false },
          { id: "2", content: "Task B", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, { threshold: 0 });

        // With 0% threshold, even different tasks should be grouped
        expect(result).toContain("Found 1 group(s)");
      });

      it("should accept threshold of 100", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Exact match", isCompleted: false },
          { id: "2", content: "Exact match", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 100,
        });

        expect(result).toContain("Found 1 group(s)");
      });
    });

    describe("edge cases", () => {
      it("should handle empty task list", async () => {
        mockGetTasks.mockResolvedValue([]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
        });

        expect(result).toBe("Not enough tasks to compare for duplicates.");
      });

      it("should handle single task", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Only task", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
        });

        expect(result).toBe("Not enough tasks to compare for duplicates.");
      });

      it("should filter completed tasks by default", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Same task", isCompleted: false },
          { id: "2", content: "Same task", isCompleted: true },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
        });

        expect(result).toBe("Not enough tasks to compare for duplicates.");
      });

      it("should include completed tasks when include_completed is true", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Same task", isCompleted: false },
          { id: "2", content: "Same task", isCompleted: true },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
          include_completed: true,
        });

        expect(result).toContain("Found 1 group(s)");
      });

      it("should filter by project_id when provided", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Task", isCompleted: false, projectId: "proj1" },
          { id: "2", content: "Task", isCompleted: false, projectId: "proj1" },
        ]);

        await handleFindDuplicates(mockClient, {
          threshold: 80,
          project_id: "proj1",
        });

        expect(mockGetTasks).toHaveBeenCalledWith({ projectId: "proj1" });
      });

      it("should handle API errors gracefully", async () => {
        mockGetTasks.mockRejectedValue(new Error("API error"));

        await expect(
          handleFindDuplicates(mockClient, { threshold: 80 })
        ).rejects.toThrow("Failed to fetch tasks: API error");
      });
    });

    describe("grouping logic", () => {
      it("should group multiple duplicates together", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Buy milk", isCompleted: false },
          { id: "2", content: "Buy milk", isCompleted: false },
          { id: "3", content: "Buy milk", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
        });

        expect(result).toContain("Found 1 group(s)");
        expect(result).toMatch(/ID: 1/);
        expect(result).toMatch(/ID: 2/);
        expect(result).toMatch(/ID: 3/);
      });

      it("should create separate groups for different sets of duplicates", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Buy milk", isCompleted: false },
          { id: "2", content: "Buy milk", isCompleted: false },
          { id: "3", content: "Clean room", isCompleted: false },
          { id: "4", content: "Clean room", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 80,
        });

        expect(result).toContain("Found 2 group(s)");
      });

      it("should sort groups by similarity (highest first)", async () => {
        mockGetTasks.mockResolvedValue([
          { id: "1", content: "Task A slightly different", isCompleted: false },
          { id: "2", content: "Task A slightly differ", isCompleted: false },
          { id: "3", content: "Task B", isCompleted: false },
          { id: "4", content: "Task B", isCompleted: false },
        ]);

        const result = await handleFindDuplicates(mockClient, {
          threshold: 70,
        });

        // Task B duplicates should come first (100% similar)
        const group1Index = result.indexOf("Group 1");
        const group2Index = result.indexOf("Group 2");
        expect(group1Index).toBeLessThan(group2Index);
        expect(result).toMatch(/Group 1 \(100% similar\)/);
      });
    });
  });

  describe("handleMergeDuplicates", () => {
    describe("validation", () => {
      it("should require keep_task_id", async () => {
        await expect(
          handleMergeDuplicates(mockClient, {
            keep_task_id: "",
            duplicate_task_ids: ["2"],
            action: "complete",
          })
        ).rejects.toThrow("keep_task_id is required");
      });

      it("should require at least one duplicate_task_id", async () => {
        await expect(
          handleMergeDuplicates(mockClient, {
            keep_task_id: "1",
            duplicate_task_ids: [],
            action: "complete",
          })
        ).rejects.toThrow(
          "duplicate_task_ids must contain at least one task ID"
        );
      });

      it("should reject invalid action", async () => {
        await expect(
          handleMergeDuplicates(mockClient, {
            keep_task_id: "1",
            duplicate_task_ids: ["2"],
            action: "invalid" as "complete" | "delete",
          })
        ).rejects.toThrow('action must be either "complete" or "delete"');
      });

      it("should throw error when keep_task_id does not exist", async () => {
        mockGetTask.mockRejectedValue(new Error("Task not found"));

        await expect(
          handleMergeDuplicates(mockClient, {
            keep_task_id: "nonexistent",
            duplicate_task_ids: ["2"],
            action: "complete",
          })
        ).rejects.toThrow("Task to keep not found: nonexistent");
      });
    });

    describe("complete action", () => {
      it("should complete duplicate tasks", async () => {
        mockGetTask.mockResolvedValue({ id: "1", content: "Keep this task" });
        mockCloseTask.mockResolvedValue({});

        const result = await handleMergeDuplicates(mockClient, {
          keep_task_id: "1",
          duplicate_task_ids: ["2", "3"],
          action: "complete",
        });

        expect(mockCloseTask).toHaveBeenCalledTimes(2);
        expect(mockCloseTask).toHaveBeenCalledWith("2");
        expect(mockCloseTask).toHaveBeenCalledWith("3");
        expect(result).toContain('kept "Keep this task"');
        expect(result).toContain("2 duplicate(s) completed");
      });

      it("should handle partial failures when completing", async () => {
        mockGetTask.mockResolvedValue({ id: "1", content: "Keep this task" });
        mockCloseTask
          .mockResolvedValueOnce({})
          .mockRejectedValueOnce(new Error("Task locked"));

        const result = await handleMergeDuplicates(mockClient, {
          keep_task_id: "1",
          duplicate_task_ids: ["2", "3"],
          action: "complete",
        });

        expect(result).toContain("1 duplicate(s) completed, 1 failed");
        expect(result).toContain("Task locked");
      });
    });

    describe("delete action", () => {
      it("should delete duplicate tasks", async () => {
        mockGetTask.mockResolvedValue({ id: "1", content: "Keep this task" });
        mockDeleteTask.mockResolvedValue({});

        const result = await handleMergeDuplicates(mockClient, {
          keep_task_id: "1",
          duplicate_task_ids: ["2", "3"],
          action: "delete",
        });

        expect(mockDeleteTask).toHaveBeenCalledTimes(2);
        expect(mockDeleteTask).toHaveBeenCalledWith("2");
        expect(mockDeleteTask).toHaveBeenCalledWith("3");
        expect(result).toContain('kept "Keep this task"');
        expect(result).toContain("2 duplicate(s) deleted");
      });

      it("should handle partial failures when deleting", async () => {
        mockGetTask.mockResolvedValue({ id: "1", content: "Keep this task" });
        mockDeleteTask
          .mockResolvedValueOnce({})
          .mockRejectedValueOnce(new Error("Permission denied"));

        const result = await handleMergeDuplicates(mockClient, {
          keep_task_id: "1",
          duplicate_task_ids: ["2", "3"],
          action: "delete",
        });

        expect(result).toContain("1 duplicate(s) deleted, 1 failed");
        expect(result).toContain("Permission denied");
      });
    });

    describe("edge cases", () => {
      it("should not allow removing the keep_task_id", async () => {
        mockGetTask.mockResolvedValue({ id: "1", content: "Keep this task" });
        mockCloseTask.mockResolvedValue({});

        const result = await handleMergeDuplicates(mockClient, {
          keep_task_id: "1",
          duplicate_task_ids: ["1", "2"],
          action: "complete",
        });

        // Should only close task "2", not "1"
        expect(mockCloseTask).toHaveBeenCalledTimes(1);
        expect(mockCloseTask).toHaveBeenCalledWith("2");
        expect(result).toContain("1 duplicate(s) completed, 1 failed");
        expect(result).toContain("Cannot remove the task you are keeping");
      });

      it("should handle all operations failing", async () => {
        mockGetTask.mockResolvedValue({ id: "1", content: "Keep this task" });
        mockCloseTask.mockRejectedValue(new Error("Network error"));

        const result = await handleMergeDuplicates(mockClient, {
          keep_task_id: "1",
          duplicate_task_ids: ["2"],
          action: "complete",
        });

        expect(result).toContain("0 duplicate(s) completed, 1 failed");
        expect(result).toContain("Network error");
      });

      it("should handle single duplicate task", async () => {
        mockGetTask.mockResolvedValue({ id: "1", content: "Keep this task" });
        mockDeleteTask.mockResolvedValue({});

        const result = await handleMergeDuplicates(mockClient, {
          keep_task_id: "1",
          duplicate_task_ids: ["2"],
          action: "delete",
        });

        expect(mockDeleteTask).toHaveBeenCalledTimes(1);
        expect(result).toContain("1 duplicate(s) deleted, 0 failed");
      });
    });
  });
});
