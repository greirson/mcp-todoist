import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleMoveTask,
  handleReorderTask,
  handleBulkReorderTasks,
  handleCloseTask,
  handleUpdateDayOrders,
} from "../handlers/item-operations-handlers";
import { ValidationError, TaskNotFoundError } from "../errors";

// Mock uuid to return predictable values
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-1234"),
}));

// Mock the api-helpers module so fetchAllTasks delegates to mock client
jest.mock("../utils/api-helpers.js", () => {
  const actual = jest.requireActual("../utils/api-helpers.js") as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    fetchAllTasks: jest.fn(
      async (client: { getTasks: () => Promise<unknown> }) => {
        const result = await client.getTasks();
        return Array.isArray(result) ? result : [];
      }
    ),
  };
});

// Store original env
const originalEnv = process.env;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Create a mock TodoistApi
function createMockApi(tasks: { id: string; content: string }[] = []) {
  return {
    getTasks: jest.fn().mockResolvedValue(tasks),
  } as unknown as TodoistApi;
}

describe("Item Operations Handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, TODOIST_API_TOKEN: "test-token" };
    delete process.env.DRYRUN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("handleMoveTask", () => {
    it("should move a task by ID to a project", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const api = createMockApi();
      const result = await handleMoveTask(api, {
        task_id: "task-123",
        project_id: "project-456",
      });

      expect(result).toBe(
        "Task task-123 moved successfully to project project-456"
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.todoist.com/api/v1/sync",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("should move a task by name to a section", async () => {
      const api = createMockApi([
        { id: "task-789", content: "My Important Task" },
      ]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const result = await handleMoveTask(api, {
        task_name: "important",
        section_id: "section-123",
      });

      expect(result).toBe(
        "Task task-789 moved successfully to section section-123"
      );
      expect(api.getTasks).toHaveBeenCalled();
    });

    it("should move a task to multiple destinations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const api = createMockApi();
      const result = await handleMoveTask(api, {
        task_id: "task-123",
        project_id: "project-456",
        section_id: "section-789",
        parent_id: "parent-111",
      });

      expect(result).toContain("project project-456");
      expect(result).toContain("section section-789");
      expect(result).toContain("parent task parent-111");
    });

    it("should throw ValidationError when no destination is provided", async () => {
      const api = createMockApi();

      await expect(
        handleMoveTask(api, { task_id: "task-123" })
      ).rejects.toThrow(ValidationError);
      await expect(
        handleMoveTask(api, { task_id: "task-123" })
      ).rejects.toThrow(
        "At least one destination must be provided: project_id, section_id, or parent_id"
      );
    });

    it("should throw ValidationError when no task identifier is provided", async () => {
      const api = createMockApi();

      await expect(
        handleMoveTask(api, { project_id: "project-456" })
      ).rejects.toThrow(ValidationError);
      await expect(
        handleMoveTask(api, { project_id: "project-456" })
      ).rejects.toThrow("Either task_id or task_name must be provided");
    });

    it("should throw TaskNotFoundError when task name does not match", async () => {
      const api = createMockApi([{ id: "task-1", content: "Unrelated Task" }]);

      await expect(
        handleMoveTask(api, {
          task_name: "nonexistent",
          project_id: "project-456",
        })
      ).rejects.toThrow(TaskNotFoundError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";
      const api = createMockApi();

      const result = await handleMoveTask(api, {
        task_id: "task-123",
        project_id: "project-456",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would move task task-123");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleReorderTask", () => {
    it("should reorder a task by ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const api = createMockApi();
      const result = await handleReorderTask(api, {
        task_id: "task-123",
        child_order: 5,
      });

      expect(result).toBe("Task task-123 reordered to position 5");
    });

    it("should reorder a task by name", async () => {
      const api = createMockApi([{ id: "task-456", content: "Test Task" }]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const result = await handleReorderTask(api, {
        task_name: "test",
        child_order: 3,
      });

      expect(result).toBe("Task task-456 reordered to position 3");
    });

    it("should throw ValidationError for negative child_order", async () => {
      const api = createMockApi();

      await expect(
        handleReorderTask(api, { task_id: "task-123", child_order: -1 })
      ).rejects.toThrow(ValidationError);
      await expect(
        handleReorderTask(api, { task_id: "task-123", child_order: -1 })
      ).rejects.toThrow("child_order must be a non-negative integer");
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";
      const api = createMockApi();

      const result = await handleReorderTask(api, {
        task_id: "task-123",
        child_order: 5,
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would set task task-123 order to 5");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleBulkReorderTasks", () => {
    it("should reorder multiple tasks", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const result = await handleBulkReorderTasks({
        items: [
          { id: "task-1", child_order: 0 },
          { id: "task-2", child_order: 1 },
          { id: "task-3", child_order: 2 },
        ],
      });

      expect(result).toBe("Successfully reordered 3 tasks");
    });

    it("should throw ValidationError when items array is empty", async () => {
      await expect(handleBulkReorderTasks({ items: [] })).rejects.toThrow(
        ValidationError
      );
      await expect(handleBulkReorderTasks({ items: [] })).rejects.toThrow(
        "At least one item must be provided for reordering"
      );
    });

    it("should throw ValidationError for invalid item structure", async () => {
      await expect(
        handleBulkReorderTasks({
          items: [{ id: "", child_order: 0 }],
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        handleBulkReorderTasks({
          items: [{ id: "", child_order: 0 }],
        })
      ).rejects.toThrow(
        "Each item must have a valid id and non-negative child_order"
      );
    });

    it("should throw ValidationError for negative child_order in items", async () => {
      await expect(
        handleBulkReorderTasks({
          items: [{ id: "task-1", child_order: -5 }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleBulkReorderTasks({
        items: [
          { id: "task-1", child_order: 0 },
          { id: "task-2", child_order: 1 },
        ],
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would reorder 2 tasks");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleCloseTask", () => {
    it("should close a task by ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const api = createMockApi();
      const result = await handleCloseTask(api, { task_id: "task-123" });

      expect(result).toBe(
        "Task task-123 closed successfully (for recurring tasks, this completes the current occurrence)"
      );
    });

    it("should close a task by name", async () => {
      const api = createMockApi([{ id: "task-999", content: "Close This" }]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const result = await handleCloseTask(api, { task_name: "close this" });

      expect(result).toContain("Task task-999 closed successfully");
    });

    it("should throw ValidationError when no task identifier is provided", async () => {
      const api = createMockApi();

      await expect(handleCloseTask(api, {})).rejects.toThrow(ValidationError);
      await expect(handleCloseTask(api, {})).rejects.toThrow(
        "Either task_id or task_name must be provided"
      );
    });

    it("should throw TaskNotFoundError when task name does not match", async () => {
      const api = createMockApi([{ id: "task-1", content: "Something Else" }]);

      await expect(
        handleCloseTask(api, { task_name: "nonexistent" })
      ).rejects.toThrow(TaskNotFoundError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";
      const api = createMockApi();

      const result = await handleCloseTask(api, { task_id: "task-123" });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would close task task-123");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleUpdateDayOrders", () => {
    it("should update day orders for multiple tasks", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "test-uuid-1234": "ok" } }),
      });

      const result = await handleUpdateDayOrders({
        items: [
          { id: "task-1", day_order: 1 },
          { id: "task-2", day_order: 2 },
          { id: "task-3", day_order: 3 },
        ],
      });

      expect(result).toBe(
        "Successfully updated day order for 3 tasks in Today view"
      );
    });

    it("should throw ValidationError when items array is empty", async () => {
      await expect(handleUpdateDayOrders({ items: [] })).rejects.toThrow(
        ValidationError
      );
      await expect(handleUpdateDayOrders({ items: [] })).rejects.toThrow(
        "At least one item must be provided"
      );
    });

    it("should throw ValidationError for missing id in items", async () => {
      await expect(
        handleUpdateDayOrders({
          items: [{ id: "", day_order: 1 }],
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        handleUpdateDayOrders({
          items: [{ id: "", day_order: 1 }],
        })
      ).rejects.toThrow("Each item must have a valid id and day_order");
    });

    it("should throw ValidationError for invalid day_order type", async () => {
      await expect(
        handleUpdateDayOrders({
          items: [{ id: "task-1", day_order: undefined as unknown as number }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleUpdateDayOrders({
        items: [
          { id: "task-1", day_order: 1 },
          { id: "task-2", day_order: 2 },
        ],
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would update day order for 2 tasks");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("API Error Handling", () => {
    it("should handle Sync API HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "Access denied",
      });

      const api = createMockApi();

      await expect(
        handleMoveTask(api, { task_id: "task-123", project_id: "project-456" })
      ).rejects.toThrow(
        "Sync API request failed: 403 Forbidden - Access denied"
      );
    });

    it("should handle Sync API command errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "test-uuid-1234": {
              error_code: 32,
              error: "Item not found",
            },
          },
        }),
      });

      const api = createMockApi();

      await expect(
        handleMoveTask(api, { task_id: "task-123", project_id: "project-456" })
      ).rejects.toThrow("Operation failed: Item not found (code: 32)");
    });

    it("should handle missing API token", async () => {
      delete process.env.TODOIST_API_TOKEN;

      const api = createMockApi();

      await expect(
        handleMoveTask(api, { task_id: "task-123", project_id: "project-456" })
      ).rejects.toThrow("TODOIST_API_TOKEN environment variable is not set");
    });
  });
});
