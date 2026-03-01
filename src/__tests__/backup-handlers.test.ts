import {
  handleGetBackups,
  handleDownloadBackup,
  clearBackupsCache,
} from "../handlers/backup-handlers.js";
import { TodoistAPIError, ValidationError } from "../errors.js";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Backup Handlers", () => {
  let originalEnv: string | undefined;

  const mockBackups = [
    {
      version: "2024-01-15T10:30:00Z",
      url: "https://todoist.com/backups/backup1.zip",
    },
    {
      version: "2024-01-14T10:30:00Z",
      url: "https://todoist.com/backups/backup2.zip",
    },
    {
      version: "2024-01-13T10:30:00Z",
      url: "https://todoist.com/backups/backup3.zip",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clearBackupsCache();
    originalEnv = process.env.TODOIST_API_TOKEN;
    process.env.TODOIST_API_TOKEN = "test-api-token";
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.TODOIST_API_TOKEN = originalEnv;
    } else {
      delete process.env.TODOIST_API_TOKEN;
    }
  });

  describe("handleGetBackups", () => {
    it("should return formatted backup list on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackups,
      });

      const result = await handleGetBackups();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.todoist.com/api/v1/backups",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer test-api-token",
          },
        }
      );
      expect(result).toContain("Found 3 backups");
      expect(result).toContain("Version: 2024-01-15T10:30:00Z");
      expect(result).toContain("todoist_backup_download");
    });

    it("should return message when no backups found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await handleGetBackups();

      expect(result).toContain("No backups found");
    });

    it("should use cached backups on subsequent calls", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackups,
      });

      await handleGetBackups();
      await handleGetBackups();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw TodoistAPIError when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      await expect(handleGetBackups()).rejects.toThrow(
        "Failed to fetch backups: 500 - Internal Server Error"
      );
    });

    it("should throw TodoistAPIError when API token is not set", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetBackups()).rejects.toThrow(TodoistAPIError);
      await expect(handleGetBackups()).rejects.toThrow(
        "TODOIST_API_TOKEN environment variable is not set"
      );
    });
  });

  describe("handleDownloadBackup", () => {
    it("should return download URL for valid backup version", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackups,
      });

      const result = await handleDownloadBackup({
        version: "2024-01-15T10:30:00Z",
      });

      expect(result).toContain("Backup Download URL");
      expect(result).toContain("https://todoist.com/backups/backup1.zip");
      expect(result).toContain("2024-01-15T10:30:00Z");
    });

    it("should use cached backups when available", async () => {
      // First call to populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackups,
      });
      await handleGetBackups();

      // Second call should use cache
      const result = await handleDownloadBackup({
        version: "2024-01-14T10:30:00Z",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toContain("https://todoist.com/backups/backup2.zip");
    });

    it("should throw ValidationError when version is empty", async () => {
      await expect(handleDownloadBackup({ version: "" })).rejects.toThrow(
        ValidationError
      );
      await expect(handleDownloadBackup({ version: "   " })).rejects.toThrow(
        "Backup version is required"
      );
    });

    it("should throw ValidationError when backup version not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackups,
      });

      await expect(
        handleDownloadBackup({ version: "non-existent-version" })
      ).rejects.toThrow(ValidationError);
      await expect(
        handleDownloadBackup({ version: "non-existent-version" })
      ).rejects.toThrow('Backup version "non-existent-version" not found');
    });

    it("should throw TodoistAPIError when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      await expect(
        handleDownloadBackup({ version: "2024-01-15T10:30:00Z" })
      ).rejects.toThrow("Failed to fetch backups: 401 - Unauthorized");
    });

    it("should throw TodoistAPIError when API token is not set", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(
        handleDownloadBackup({ version: "2024-01-15T10:30:00Z" })
      ).rejects.toThrow(TodoistAPIError);
      await expect(
        handleDownloadBackup({ version: "2024-01-15T10:30:00Z" })
      ).rejects.toThrow("TODOIST_API_TOKEN environment variable is not set");
    });
  });

  describe("clearBackupsCache", () => {
    it("should clear cached backups", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockBackups,
      });

      await handleGetBackups();
      clearBackupsCache();
      await handleGetBackups();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
