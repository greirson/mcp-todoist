import {
  handleGetProjectNotes,
  handleCreateProjectNote,
  handleUpdateProjectNote,
  handleDeleteProjectNote,
  clearProjectNotesCache,
} from "../handlers/project-notes-handlers";
import { ValidationError, TodoistAPIError } from "../errors";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-1234"),
}));

describe("Project Notes Handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    clearProjectNotesCache();
    process.env = { ...originalEnv, TODOIST_API_TOKEN: "test-token" };
    delete process.env.DRYRUN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("handleGetProjectNotes", () => {
    it("should return project notes successfully", async () => {
      const mockNotes = [
        {
          id: "note-1",
          project_id: "project-123",
          content: "Test note content",
          posted_at: "2024-01-15T10:00:00Z",
          is_deleted: false,
        },
        {
          id: "note-2",
          project_id: "project-123",
          content: "Another note",
          posted_at: "2024-01-16T11:00:00Z",
          is_deleted: false,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project_notes: mockNotes }),
      });

      const result = await handleGetProjectNotes({ project_id: "project-123" });

      expect(result).toContain("Found 2 notes");
      expect(result).toContain("Test note content");
      expect(result).toContain("Another note");
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

    it("should return message when no notes found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project_notes: [] }),
      });

      const result = await handleGetProjectNotes({ project_id: "project-456" });

      expect(result).toContain("No notes found for project project-456");
    });

    it("should filter out deleted notes", async () => {
      const mockNotes = [
        {
          id: "note-1",
          project_id: "project-123",
          content: "Active note",
          posted_at: "2024-01-15T10:00:00Z",
          is_deleted: false,
        },
        {
          id: "note-2",
          project_id: "project-123",
          content: "Deleted note",
          posted_at: "2024-01-16T11:00:00Z",
          is_deleted: true,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project_notes: mockNotes }),
      });

      const result = await handleGetProjectNotes({ project_id: "project-123" });

      expect(result).toContain("Found 1 notes");
      expect(result).toContain("Active note");
      expect(result).not.toContain("Deleted note");
    });

    it("should throw ValidationError when project_id is missing", async () => {
      await expect(handleGetProjectNotes({ project_id: "" })).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw TodoistAPIError when API request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Project not found",
      });

      await expect(
        handleGetProjectNotes({ project_id: "nonexistent-project" })
      ).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("handleCreateProjectNote", () => {
    it("should create a project note successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleCreateProjectNote({
        project_id: "project-123",
        content: "New note content",
      });

      expect(result).toContain("Project note created successfully");
      expect(result).toContain("New note content");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.todoist.com/api/v1/sync",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleCreateProjectNote({
        project_id: "project-123",
        content: "Dry run note",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would create project note");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when project_id is missing", async () => {
      await expect(
        handleCreateProjectNote({ project_id: "", content: "Test" })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when content is missing", async () => {
      await expect(
        handleCreateProjectNote({ project_id: "project-123", content: "" })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TodoistAPIError when API returns error status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "mock-uuid-1234": {
              error: "Invalid project_id",
              error_code: 24,
            },
          },
        }),
      });

      await expect(
        handleCreateProjectNote({
          project_id: "invalid-project",
          content: "Test content",
        })
      ).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("handleUpdateProjectNote", () => {
    it("should update a project note successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleUpdateProjectNote({
        note_id: "note-123",
        content: "Updated content",
      });

      expect(result).toContain("Project note note-123 updated successfully");
      expect(result).toContain("Updated content");
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleUpdateProjectNote({
        note_id: "note-123",
        content: "Updated dry run content",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would update project note note-123");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when note_id is missing", async () => {
      await expect(
        handleUpdateProjectNote({ note_id: "", content: "Test" })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when content is missing", async () => {
      await expect(
        handleUpdateProjectNote({ note_id: "note-123", content: "" })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TodoistAPIError when note not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "mock-uuid-1234": {
              error: "Note not found",
              error_code: 25,
            },
          },
        }),
      });

      await expect(
        handleUpdateProjectNote({
          note_id: "nonexistent-note",
          content: "Test content",
        })
      ).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("handleDeleteProjectNote", () => {
    it("should delete a project note successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleDeleteProjectNote({ note_id: "note-123" });

      expect(result).toContain("Project note note-123 deleted successfully");
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleDeleteProjectNote({ note_id: "note-123" });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would delete project note note-123");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when note_id is missing", async () => {
      await expect(handleDeleteProjectNote({ note_id: "" })).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw TodoistAPIError when note not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "mock-uuid-1234": {
              error: "Note not found",
              error_code: 25,
            },
          },
        }),
      });

      await expect(
        handleDeleteProjectNote({ note_id: "nonexistent-note" })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should throw TodoistAPIError when API request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal server error",
      });

      await expect(
        handleDeleteProjectNote({ note_id: "note-123" })
      ).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("API Token Validation", () => {
    it("should throw TodoistAPIError when API token is not set", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(
        handleGetProjectNotes({ project_id: "project-123" })
      ).rejects.toThrow(TodoistAPIError);
    });
  });
});
