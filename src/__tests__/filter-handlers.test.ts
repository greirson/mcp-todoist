import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock uuid to return predictable values
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mocked-uuid"),
}));

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Import handlers after mocking
import {
  handleGetFilters,
  handleCreateFilter,
  handleUpdateFilter,
  handleDeleteFilter,
  clearFilterCache,
} from "../handlers/filter-handlers.js";
import {
  FilterNotFoundError,
  FilterFrozenError,
  TodoistAPIError,
} from "../errors.js";

describe("Filter Handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockFetch.mockClear();
    clearFilterCache();
    process.env = { ...originalEnv, TODOIST_API_TOKEN: "test-token" };
    delete process.env.DRYRUN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Helper to create mock Response
  const createMockResponse = (data: unknown, ok = true, status = 200) => {
    return {
      ok,
      status,
      statusText: ok ? "OK" : "Error",
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response;
  };

  // Sample filter data
  const sampleFilters = [
    {
      id: "filter-1",
      name: "Today's Tasks",
      query: "today",
      color: "red",
      item_order: 1,
      is_favorite: true,
      is_deleted: false,
      is_frozen: false,
    },
    {
      id: "filter-2",
      name: "High Priority",
      query: "p1",
      color: "blue",
      item_order: 2,
      is_favorite: false,
      is_deleted: false,
      is_frozen: false,
    },
  ];

  describe("handleGetFilters", () => {
    it("should return formatted list of filters", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );

      const result = await handleGetFilters();

      expect(result).toContain("Found 2 filters");
      expect(result).toContain("Today's Tasks");
      expect(result).toContain("High Priority");
      expect(result).toContain("Query: today");
      expect(result).toContain("Query: p1");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return message when no filters exist", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ filters: [] }));

      const result = await handleGetFilters();

      expect(result).toContain("No custom filters found");
      expect(result).toContain("Pro or Business plan");
    });

    it("should filter out deleted filters", async () => {
      const filtersWithDeleted = [
        ...sampleFilters,
        { id: "filter-3", name: "Deleted", query: "test", is_deleted: true },
      ];
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: filtersWithDeleted })
      );

      const result = await handleGetFilters();

      expect(result).toContain("Found 2 filters");
      expect(result).not.toContain("Deleted");
    });

    it("should throw TodoistAPIError on fetch failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: "Unauthorized" }, false, 401)
      );

      await expect(handleGetFilters()).rejects.toThrow(TodoistAPIError);
    });

    it("should use cached filters on subsequent calls", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );

      await handleGetFilters();
      await handleGetFilters();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleCreateFilter", () => {
    it("should create a filter successfully", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          sync_status: { "mocked-uuid": "ok" },
          temp_id_mapping: { "mocked-uuid": "new-filter-id" },
        })
      );

      const result = await handleCreateFilter({
        name: "New Filter",
        query: "tomorrow",
      });

      expect(result).toContain("created successfully");
      expect(result).toContain("New Filter");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should include optional parameters when provided", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          sync_status: { "mocked-uuid": "ok" },
          temp_id_mapping: {},
        })
      );

      await handleCreateFilter({
        name: "Colored Filter",
        query: "overdue",
        color: "green",
        is_favorite: true,
        item_order: 5,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callBody = mockFetch.mock.calls[0][1]?.body?.toString();
      expect(callBody).toContain("commands");
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: "Server error" }, false, 500)
      );

      await expect(
        handleCreateFilter({ name: "Test", query: "test" })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should handle sync command failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          sync_status: {
            "mocked-uuid": { error: "Invalid query", error_code: 400 },
          },
        })
      );

      await expect(
        handleCreateFilter({
          name: "Bad Filter",
          query: "invalid query syntax",
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";

      const result = await handleCreateFilter({
        name: "Dry Run Filter",
        query: "today",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would create filter");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleUpdateFilter", () => {
    it("should update a filter by ID", async () => {
      // First call: fetch filters to find the filter
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );
      // Second call: update command
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleUpdateFilter({
        filter_id: "filter-1",
        name: "Updated Name",
      });

      expect(result).toContain("updated successfully");
      expect(result).toContain("name:");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should update a filter by name", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleUpdateFilter({
        filter_name: "Today's Tasks",
        query: "today | overdue",
      });

      expect(result).toContain("updated successfully");
      expect(result).toContain("query:");
    });

    it("should throw FilterNotFoundError when filter not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );

      await expect(
        handleUpdateFilter({
          filter_name: "Nonexistent Filter",
          name: "New Name",
        })
      ).rejects.toThrow(FilterNotFoundError);
    });

    it("should throw FilterFrozenError for frozen filters", async () => {
      const frozenFilters = [
        { ...sampleFilters[0], is_frozen: true },
        sampleFilters[1],
      ];
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: frozenFilters })
      );

      await expect(
        handleUpdateFilter({
          filter_id: "filter-1",
          name: "New Name",
        })
      ).rejects.toThrow(FilterFrozenError);
    });

    it("should return message when no updates specified", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );

      const result = await handleUpdateFilter({
        filter_id: "filter-1",
      });

      expect(result).toContain("No updates specified");
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );

      const result = await handleUpdateFilter({
        filter_id: "filter-1",
        name: "Updated",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would update filter");
      // Only one fetch call (to find filter), no update call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleDeleteFilter", () => {
    it("should delete a filter by ID", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleDeleteFilter({ filter_id: "filter-1" });

      expect(result).toContain("deleted successfully");
      expect(result).toContain("Today's Tasks");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should delete a filter by name", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleDeleteFilter({ filter_name: "High Priority" });

      expect(result).toContain("deleted successfully");
      expect(result).toContain("High Priority");
    });

    it("should throw FilterNotFoundError when filter not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );

      await expect(
        handleDeleteFilter({ filter_name: "Nonexistent" })
      ).rejects.toThrow(FilterNotFoundError);
    });

    it("should throw FilterFrozenError for frozen filters", async () => {
      const frozenFilters = [
        { ...sampleFilters[0], is_frozen: true },
        sampleFilters[1],
      ];
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: frozenFilters })
      );

      await expect(
        handleDeleteFilter({ filter_id: "filter-1" })
      ).rejects.toThrow(FilterFrozenError);
    });

    it("should throw TodoistAPIError on delete failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: "Delete failed" }, false, 500)
      );

      await expect(
        handleDeleteFilter({ filter_id: "filter-2" })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );

      const result = await handleDeleteFilter({ filter_id: "filter-1" });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would delete filter");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("should throw TodoistAPIError when token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetFilters()).rejects.toThrow(TodoistAPIError);
    });

    it("should handle partial match when finding filters by name", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ filters: sampleFilters })
      );
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleDeleteFilter({ filter_name: "Today" });

      expect(result).toContain("Today's Tasks");
    });
  });
});
