import {
  handleGetSharedLabels,
  handleRenameSharedLabel,
  handleRemoveSharedLabel,
  clearSharedLabelsCache,
} from "../handlers/shared-label-handlers";
import { ValidationError, TodoistAPIError } from "../errors";

// Store original fetch and env
const originalFetch = global.fetch;
const originalEnv = process.env;

// Mock fetch
let mockFetch: jest.Mock;

describe("Shared Label Handlers", () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv, TODOIST_API_TOKEN: "test-token" };
    delete process.env.DRYRUN;
    // Clear cache before each test
    clearSharedLabelsCache();
    // Create fresh mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Restore original fetch and env
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  describe("handleGetSharedLabels", () => {
    it("should return formatted shared labels on success", async () => {
      const mockLabels = [{ name: "team-urgent" }, { name: "team-review" }];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ labels: mockLabels }),
      });

      const result = await handleGetSharedLabels();

      expect(result).toContain("Found 2 shared labels");
      expect(result).toContain("- team-urgent");
      expect(result).toContain("- team-review");
      expect(result).toContain("Todoist Business");
    });

    it("should return empty message when no shared labels exist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ labels: [] }),
      });

      const result = await handleGetSharedLabels();

      expect(result).toContain("No shared labels found");
      expect(result).toContain("Todoist Business account");
    });

    it("should return Business account required message on 403", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "Forbidden",
      });

      const result = await handleGetSharedLabels();

      expect(result).toContain("Todoist Business account");
      expect(result).toContain("not available on your current plan");
    });

    it("should throw TodoistAPIError on other API errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      });

      await expect(handleGetSharedLabels()).rejects.toThrow(TodoistAPIError);
    });

    it("should use cached labels on subsequent calls", async () => {
      const mockLabels = [{ name: "cached-label" }];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ labels: mockLabels }),
      });

      // First call - should fetch
      await handleGetSharedLabels();
      // Second call - should use cache
      const result = await handleGetSharedLabels();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toContain("cached-label");
    });
  });

  describe("handleRenameSharedLabel", () => {
    it("should rename shared label successfully", async () => {
      // The handler uses uuid internally, so we need to capture the UUID from the request
      // and return it in the sync_status. We'll use a dynamic approach.
      mockFetch.mockImplementation(async () => {
        // Extract the UUID from the commands sent to the API
        const calls = mockFetch.mock.calls;
        const lastCall = calls[calls.length - 1];
        const body = lastCall?.[1]?.body as URLSearchParams;
        const commands = body?.get("commands");
        let uuid = "fallback-uuid";
        if (commands) {
          const parsed = JSON.parse(commands);
          uuid = parsed[0]?.uuid || uuid;
        }
        return {
          ok: true,
          json: async () => ({
            sync_status: { [uuid]: "ok" },
          }),
        };
      });

      const result = await handleRenameSharedLabel({
        name: "old-label",
        new_name: "new-label",
      });

      expect(result).toContain('renamed to "new-label"');
      expect(result).toContain("successfully");
    });

    it("should throw ValidationError when name is empty", async () => {
      await expect(
        handleRenameSharedLabel({ name: "", new_name: "new-label" })
      ).rejects.toThrow(ValidationError);

      await expect(
        handleRenameSharedLabel({ name: "   ", new_name: "new-label" })
      ).rejects.toThrow("Current label name is required");
    });

    it("should throw ValidationError when new_name is empty", async () => {
      await expect(
        handleRenameSharedLabel({ name: "old-label", new_name: "" })
      ).rejects.toThrow(ValidationError);

      await expect(
        handleRenameSharedLabel({ name: "old-label", new_name: "   " })
      ).rejects.toThrow("New label name is required");
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";

      const result = await handleRenameSharedLabel({
        name: "old-label",
        new_name: "new-label",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would rename");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw TodoistAPIError on sync command failure", async () => {
      mockFetch.mockImplementation(async () => {
        const calls = mockFetch.mock.calls;
        const lastCall = calls[calls.length - 1];
        const body = lastCall?.[1]?.body as URLSearchParams;
        const commands = body?.get("commands");
        let uuid = "fallback-uuid";
        if (commands) {
          const parsed = JSON.parse(commands);
          uuid = parsed[0]?.uuid || uuid;
        }
        return {
          ok: true,
          json: async () => ({
            sync_status: {
              [uuid]: { error_code: 40, error: "Label not found" },
            },
          }),
        };
      });

      await expect(
        handleRenameSharedLabel({ name: "nonexistent", new_name: "new-label" })
      ).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("handleRemoveSharedLabel", () => {
    it("should remove shared label successfully", async () => {
      mockFetch.mockImplementation(async () => {
        const calls = mockFetch.mock.calls;
        const lastCall = calls[calls.length - 1];
        const body = lastCall?.[1]?.body as URLSearchParams;
        const commands = body?.get("commands");
        let uuid = "fallback-uuid";
        if (commands) {
          const parsed = JSON.parse(commands);
          uuid = parsed[0]?.uuid || uuid;
        }
        return {
          ok: true,
          json: async () => ({
            sync_status: { [uuid]: "ok" },
          }),
        };
      });

      const result = await handleRemoveSharedLabel({ name: "team-label" });

      expect(result).toContain('"team-label" removed successfully');
      expect(result).toContain("workspace");
    });

    it("should throw ValidationError when name is empty", async () => {
      await expect(handleRemoveSharedLabel({ name: "" })).rejects.toThrow(
        ValidationError
      );

      await expect(handleRemoveSharedLabel({ name: "   " })).rejects.toThrow(
        "Label name is required"
      );
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";

      const result = await handleRemoveSharedLabel({ name: "team-label" });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would remove");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw TodoistAPIError on sync command failure", async () => {
      mockFetch.mockImplementation(async () => {
        const calls = mockFetch.mock.calls;
        const lastCall = calls[calls.length - 1];
        const body = lastCall?.[1]?.body as URLSearchParams;
        const commands = body?.get("commands");
        let uuid = "fallback-uuid";
        if (commands) {
          const parsed = JSON.parse(commands);
          uuid = parsed[0]?.uuid || uuid;
        }
        return {
          ok: true,
          json: async () => ({
            sync_status: {
              [uuid]: { error_code: 40, error: "Label not found" },
            },
          }),
        };
      });

      await expect(
        handleRemoveSharedLabel({ name: "nonexistent" })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should throw TodoistAPIError on HTTP failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid token",
      });

      await expect(
        handleRemoveSharedLabel({ name: "team-label" })
      ).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("API token validation", () => {
    it("should throw TodoistAPIError when TODOIST_API_TOKEN is not set", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetSharedLabels()).rejects.toThrow(TodoistAPIError);
      await expect(handleGetSharedLabels()).rejects.toThrow(
        "TODOIST_API_TOKEN environment variable is not set"
      );
    });
  });
});
