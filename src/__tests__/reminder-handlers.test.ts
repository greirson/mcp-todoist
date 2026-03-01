import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { TodoistApi } from "@doist/todoist-api-typescript";

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Set up environment
process.env.TODOIST_API_TOKEN = "test-token";

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

// Import handlers after setting up mocks
import {
  handleGetReminders,
  handleCreateReminder,
  handleUpdateReminder,
  handleDeleteReminder,
  clearReminderCache,
} from "../handlers/reminder-handlers.js";

// Create typed mock functions
const mockGetTask = jest.fn<() => Promise<{ id: string; content: string }>>();
const mockGetTasks =
  jest.fn<() => Promise<{ id: string; content: string }[]>>();

// Mock TodoistApi
const mockTodoistClient = {
  getTask: mockGetTask,
  getTasks: mockGetTasks,
} as unknown as TodoistApi;

// Helper to create a mock Response
function createMockResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    clone: () => createMockResponse(data, ok, status),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

// Helper to create sync response with dynamic UUID handling
function createSyncResponse(
  status: "ok" | object = "ok",
  tempIdMapping?: Record<string, string>
): unknown {
  return {
    sync_status: new Proxy(
      {},
      {
        get: () => status,
      }
    ),
    temp_id_mapping: tempIdMapping
      ? new Proxy(
          {},
          {
            get: () => Object.values(tempIdMapping)[0],
          }
        )
      : undefined,
  };
}

describe("Reminder Handlers", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockGetTask.mockClear();
    mockGetTasks.mockClear();
    clearReminderCache();
  });

  describe("handleGetReminders", () => {
    it("should return all reminders when no filter is specified", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          reminders: [
            {
              id: "reminder1",
              item_id: "task1",
              type: "relative",
              minute_offset: 30,
              is_deleted: false,
            },
            {
              id: "reminder2",
              item_id: "task2",
              type: "absolute",
              due: { date: "2025-01-25T10:00:00" },
              is_deleted: false,
            },
          ],
        })
      );

      const result = await handleGetReminders(mockTodoistClient, {});

      expect(result).toContain("Found 2 reminder(s)");
      expect(result).toContain("reminder1");
      expect(result).toContain("reminder2");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should filter reminders by task_id", async () => {
      mockGetTask.mockResolvedValueOnce({
        id: "task1",
        content: "Test Task",
      });

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          reminders: [
            {
              id: "reminder1",
              item_id: "task1",
              type: "relative",
              minute_offset: 30,
              is_deleted: false,
            },
            {
              id: "reminder2",
              item_id: "task2",
              type: "absolute",
              due: { date: "2025-01-25T10:00:00" },
              is_deleted: false,
            },
          ],
        })
      );

      const result = await handleGetReminders(mockTodoistClient, {
        task_id: "task1",
      });

      expect(result).toContain('Found 1 reminder(s) for task "Test Task"');
      expect(result).toContain("reminder1");
      expect(result).not.toContain("reminder2");
    });

    it("should return message when no reminders found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          reminders: [],
        })
      );

      const result = await handleGetReminders(mockTodoistClient, {});

      expect(result).toContain("No reminders found");
      expect(result).toContain("Pro or Business plan");
    });

    it("should filter out deleted reminders", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          reminders: [
            {
              id: "reminder1",
              item_id: "task1",
              type: "relative",
              minute_offset: 30,
              is_deleted: false,
            },
            {
              id: "reminder2",
              item_id: "task2",
              type: "relative",
              minute_offset: 15,
              is_deleted: true,
            },
          ],
        })
      );

      const result = await handleGetReminders(mockTodoistClient, {});

      expect(result).toContain("Found 1 reminder(s)");
      expect(result).toContain("reminder1");
      expect(result).not.toContain("reminder2");
    });
  });

  describe("handleCreateReminder", () => {
    it("should create a relative reminder", async () => {
      mockGetTask.mockResolvedValueOnce({
        id: "task1",
        content: "Test Task",
      });

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          createSyncResponse("ok", { temp: "new-reminder-id" })
        )
      );

      const result = await handleCreateReminder(mockTodoistClient, {
        task_id: "task1",
        type: "relative",
        minute_offset: 30,
      });

      expect(result).toContain("Created relative reminder");
      expect(result).toContain("Test Task");
      expect(result).toContain("30 minutes before due");
    });

    it("should create an absolute reminder", async () => {
      mockGetTask.mockResolvedValueOnce({
        id: "task1",
        content: "Test Task",
      });

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          createSyncResponse("ok", { temp: "new-reminder-id" })
        )
      );

      const result = await handleCreateReminder(mockTodoistClient, {
        task_id: "task1",
        type: "absolute",
        due_date: "2025-01-25T10:00:00",
      });

      expect(result).toContain("Created absolute reminder");
      expect(result).toContain("Test Task");
      expect(result).toContain("at 2025-01-25T10:00:00");
    });

    it("should throw ValidationError for relative reminder without minute_offset", async () => {
      mockGetTask.mockResolvedValueOnce({
        id: "task1",
        content: "Test Task",
      });

      await expect(
        handleCreateReminder(mockTodoistClient, {
          task_id: "task1",
          type: "relative",
        })
      ).rejects.toThrow("minute_offset is required for relative reminders");
    });

    it("should throw ValidationError for absolute reminder without due_date", async () => {
      mockGetTask.mockResolvedValueOnce({
        id: "task1",
        content: "Test Task",
      });

      await expect(
        handleCreateReminder(mockTodoistClient, {
          task_id: "task1",
          type: "absolute",
        })
      ).rejects.toThrow("due_date is required for absolute reminders");
    });

    it("should throw ValidationError for location reminder without coordinates", async () => {
      mockGetTask.mockResolvedValueOnce({
        id: "task1",
        content: "Test Task",
      });

      await expect(
        handleCreateReminder(mockTodoistClient, {
          task_id: "task1",
          type: "location",
        })
      ).rejects.toThrow(
        "latitude and longitude are required for location reminders"
      );
    });

    it("should throw TaskNotFoundError when task does not exist", async () => {
      mockGetTask.mockRejectedValueOnce(new Error("Not found"));

      await expect(
        handleCreateReminder(mockTodoistClient, {
          task_id: "nonexistent",
          type: "relative",
          minute_offset: 30,
        })
      ).rejects.toThrow("Task with ID nonexistent not found");
    });
  });

  describe("handleUpdateReminder", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(createMockResponse(createSyncResponse("ok")));
    });

    it("should update reminder minute_offset", async () => {
      const result = await handleUpdateReminder({
        reminder_id: "reminder1",
        minute_offset: 60,
      });

      expect(result).toContain("Updated reminder (ID: reminder1)");
      expect(result).toContain("minute_offset: 60");
    });

    it("should update reminder type and due_date", async () => {
      const result = await handleUpdateReminder({
        reminder_id: "reminder1",
        type: "absolute",
        due_date: "2025-02-01T09:00:00",
      });

      expect(result).toContain("Updated reminder (ID: reminder1)");
      expect(result).toContain("type: absolute");
      expect(result).toContain("due_date: 2025-02-01T09:00:00");
    });

    it("should throw ValidationError when reminder_id is missing", async () => {
      await expect(
        handleUpdateReminder({} as { reminder_id: string })
      ).rejects.toThrow("reminder_id is required");
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce(
        createMockResponse("Reminder not found", false, 404)
      );

      await expect(
        handleUpdateReminder({
          reminder_id: "nonexistent",
          minute_offset: 30,
        })
      ).rejects.toThrow("Sync API error (404)");
    });
  });

  describe("handleDeleteReminder", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(createMockResponse(createSyncResponse("ok")));
    });

    it("should delete a reminder successfully", async () => {
      const result = await handleDeleteReminder({
        reminder_id: "reminder1",
      });

      expect(result).toBe("Deleted reminder (ID: reminder1)");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError when reminder_id is missing", async () => {
      await expect(
        handleDeleteReminder({} as { reminder_id: string })
      ).rejects.toThrow("reminder_id is required");
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce(
        createMockResponse("Internal server error", false, 500)
      );

      await expect(
        handleDeleteReminder({
          reminder_id: "reminder1",
        })
      ).rejects.toThrow("Sync API error (500)");
    });

    it("should handle sync status error response", async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          createSyncResponse({ error: "Reminder not found", error_code: 404 })
        )
      );

      await expect(
        handleDeleteReminder({
          reminder_id: "nonexistent",
        })
      ).rejects.toThrow("Failed to delete reminder");
    });
  });

  describe("API Error Handling", () => {
    it("should throw TodoistAPIError when TODOIST_API_TOKEN is not set", async () => {
      const originalToken = process.env.TODOIST_API_TOKEN;
      delete process.env.TODOIST_API_TOKEN;

      // Clear cache to ensure fresh fetch
      clearReminderCache();

      await expect(handleGetReminders(mockTodoistClient, {})).rejects.toThrow(
        "TODOIST_API_TOKEN not configured"
      );

      // Restore token
      process.env.TODOIST_API_TOKEN = originalToken;
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(handleGetReminders(mockTodoistClient, {})).rejects.toThrow(
        "Network error"
      );
    });
  });
});
