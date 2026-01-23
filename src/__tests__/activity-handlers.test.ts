import {
  handleGetActivity,
  handleGetActivityByProject,
  handleGetActivityByDateRange,
  clearActivityCache,
} from "../handlers/activity-handlers";
import { TodoistAPIError } from "../errors";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Sample activity log events for testing
const sampleActivityEvents = [
  {
    id: "event1",
    object_type: "item",
    object_id: "task123",
    event_type: "added",
    event_date: "2024-01-15T10:30:00Z",
    parent_project_id: "project456",
    initiator_id: "user789",
  },
  {
    id: "event2",
    object_type: "item",
    object_id: "task124",
    event_type: "completed",
    event_date: "2024-01-15T11:00:00Z",
    parent_project_id: "project456",
    parent_item_id: "task123",
    extra_data: { content: "Subtask completed" },
  },
];

describe("Activity Handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, TODOIST_API_TOKEN: "test-token-123" };
    mockFetch.mockReset();
    clearActivityCache();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("handleGetActivity", () => {
    it("should fetch and format activity events successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: sampleActivityEvents }),
      });

      const result = await handleGetActivity({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.todoist.com/sync/v9/activity/get"),
        expect.objectContaining({
          method: "GET",
          headers: { Authorization: "Bearer test-token-123" },
        })
      );
      expect(result).toContain("Found 2 activity events");
      expect(result).toContain("ADDED item");
      expect(result).toContain("COMPLETED item");
      expect(result).toContain("task123");
    });

    it("should handle API response with direct array format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleActivityEvents,
      });

      const result = await handleGetActivity({});

      expect(result).toContain("Found 2 activity events");
    });

    it("should return empty message when no events found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      const result = await handleGetActivity({});

      expect(result).toBe("No activity events found matching the criteria.");
    });

    it("should pass filter parameters to the API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      await handleGetActivity({
        object_type: "item",
        event_type: "added",
        limit: 10,
        offset: 5,
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("object_type=item");
      expect(calledUrl).toContain("event_type=added");
      expect(calledUrl).toContain("limit=10");
      expect(calledUrl).toContain("offset=5");
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "Access denied",
      });

      await expect(handleGetActivity({})).rejects.toThrow(TodoistAPIError);
    });

    it("should throw TodoistAPIError when API token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetActivity({})).rejects.toThrow(TodoistAPIError);
    });

    it("should use cached results on subsequent calls", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: sampleActivityEvents }),
      });

      // First call - should hit API
      const result1 = await handleGetActivity({});
      // Second call - should use cache
      const result2 = await handleGetActivity({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
  });

  describe("handleGetActivityByProject", () => {
    it("should fetch activity for a specific project", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: sampleActivityEvents }),
      });

      const result = await handleGetActivityByProject({
        project_id: "project456",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("parent_project_id=project456");
      expect(result).toContain("Found 2 activity events");
    });

    it("should pass optional filters to the API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      await handleGetActivityByProject({
        project_id: "project456",
        event_type: "completed",
        object_type: "item",
        since: "2024-01-01",
        until: "2024-01-31",
        limit: 20,
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("parent_project_id=project456");
      expect(calledUrl).toContain("event_type=completed");
      expect(calledUrl).toContain("object_type=item");
      expect(calledUrl).toContain("since=2024-01-01");
      expect(calledUrl).toContain("until=2024-01-31");
      expect(calledUrl).toContain("limit=20");
    });

    it("should return empty message for project with no activity", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      const result = await handleGetActivityByProject({
        project_id: "empty-project",
      });

      expect(result).toBe("No activity events found matching the criteria.");
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      });

      await expect(
        handleGetActivityByProject({ project_id: "project456" })
      ).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("handleGetActivityByDateRange", () => {
    it("should fetch activity within a date range", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: sampleActivityEvents }),
      });

      const result = await handleGetActivityByDateRange({
        since: "2024-01-01",
        until: "2024-01-31",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("since=2024-01-01");
      expect(calledUrl).toContain("until=2024-01-31");
      expect(result).toContain("Found 2 activity events");
    });

    it("should pass optional filters to the API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      await handleGetActivityByDateRange({
        since: "2024-01-01",
        until: "2024-01-31",
        object_type: "project",
        event_type: "added",
        project_id: "project789",
        limit: 50,
        offset: 10,
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("since=2024-01-01");
      expect(calledUrl).toContain("until=2024-01-31");
      expect(calledUrl).toContain("object_type=project");
      expect(calledUrl).toContain("event_type=added");
      expect(calledUrl).toContain("parent_project_id=project789");
      expect(calledUrl).toContain("limit=50");
      expect(calledUrl).toContain("offset=10");
    });

    it("should return empty message for date range with no activity", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      });

      const result = await handleGetActivityByDateRange({
        since: "2020-01-01",
        until: "2020-01-02",
      });

      expect(result).toBe("No activity events found matching the criteria.");
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid token",
      });

      await expect(
        handleGetActivityByDateRange({
          since: "2024-01-01",
          until: "2024-01-31",
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should format events with extra_data correctly", async () => {
      const eventsWithExtraData = [
        {
          id: "event1",
          object_type: "item",
          object_id: "task123",
          event_type: "updated",
          event_date: "2024-01-15T12:00:00Z",
          extra_data: { old_content: "Old name", new_content: "New name" },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: eventsWithExtraData }),
      });

      const result = await handleGetActivityByDateRange({
        since: "2024-01-01",
        until: "2024-01-31",
      });

      expect(result).toContain("Extra:");
      expect(result).toContain("old_content");
      expect(result).toContain("new_content");
    });
  });

  describe("clearActivityCache", () => {
    it("should clear cached results forcing fresh API calls", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ events: sampleActivityEvents }),
      });

      // First call - hits API
      await handleGetActivity({});
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - uses cache
      await handleGetActivity({});
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      clearActivityCache();

      // Third call - should hit API again
      await handleGetActivity({});
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
