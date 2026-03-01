import {
  handleReorderProjects,
  handleMoveProjectToParent,
  handleGetArchivedProjects,
} from "../handlers/project-operations-handlers";
import { ValidationError, TodoistAPIError } from "../errors";
import { TodoistApi } from "@doist/todoist-api-typescript";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock uuid to return predictable values
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-1234"),
}));

// Mock TodoistApi
const mockGetProjects = jest.fn();
const mockApi = {
  getProjects: mockGetProjects,
} as unknown as TodoistApi;

// Sample project data for testing
const sampleProjects = [
  { id: "project1", name: "Work Tasks", color: "blue" },
  { id: "project2", name: "Personal", color: "green" },
  { id: "project3", name: "Shopping List", color: "red" },
];

const sampleArchivedProjects = [
  { id: "archived1", name: "Old Project", color: "gray", is_archived: true },
  { id: "archived2", name: "Completed Work", color: "blue", is_archived: true },
  {
    id: "project1",
    name: "Active Project",
    color: "green",
    is_archived: false,
  },
];

describe("Project Operations Handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, TODOIST_API_TOKEN: "test-token-123" };
    delete process.env.DRYRUN;
    mockFetch.mockReset();
    mockGetProjects.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("handleReorderProjects", () => {
    it("should reorder projects successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "test-uuid-1234": "ok" },
        }),
      });

      const result = await handleReorderProjects({
        projects: [
          { id: "project1", child_order: 0 },
          { id: "project2", child_order: 1 },
          { id: "project3", child_order: 2 },
        ],
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.todoist.com/api/v1/sync",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-token-123",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );
      expect(result).toBe("Successfully reordered 3 projects");
    });

    it("should throw ValidationError when projects array is empty", async () => {
      await expect(handleReorderProjects({ projects: [] })).rejects.toThrow(
        ValidationError
      );
      await expect(handleReorderProjects({ projects: [] })).rejects.toThrow(
        "At least one project must be provided for reordering"
      );
    });

    it("should throw ValidationError when project id is missing", async () => {
      await expect(
        handleReorderProjects({
          projects: [{ id: "", child_order: 0 }],
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        handleReorderProjects({
          projects: [{ id: "", child_order: 0 }],
        })
      ).rejects.toThrow(
        "Each project must have a valid id and non-negative child_order"
      );
    });

    it("should throw ValidationError when child_order is negative", async () => {
      await expect(
        handleReorderProjects({
          projects: [{ id: "project1", child_order: -1 }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TodoistAPIError when API returns error status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "test-uuid-1234": {
              error: "Invalid project id",
              error_code: 35,
            },
          },
        }),
      });

      await expect(
        handleReorderProjects({
          projects: [{ id: "invalid-id", child_order: 0 }],
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should throw TodoistAPIError when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      });

      await expect(
        handleReorderProjects({
          projects: [{ id: "project1", child_order: 0 }],
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleReorderProjects({
        projects: [
          { id: "project1", child_order: 0 },
          { id: "project2", child_order: 1 },
        ],
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would reorder 2 projects");
    });

    it("should throw TodoistAPIError when API token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(
        handleReorderProjects({
          projects: [{ id: "project1", child_order: 0 }],
        })
      ).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("handleMoveProjectToParent", () => {
    it("should move project to parent using project_id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "test-uuid-1234": "ok" },
        }),
      });

      const result = await handleMoveProjectToParent(mockApi, {
        project_id: "project1",
        parent_id: "parent-project",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toContain("Project project1 moved successfully");
      expect(result).toContain("under parent parent-project");
    });

    it("should move project to root level when parent_id is not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "test-uuid-1234": "ok" },
        }),
      });

      const result = await handleMoveProjectToParent(mockApi, {
        project_id: "project1",
      });

      expect(result).toContain("to root level");
    });

    it("should resolve project by name when project_name is provided", async () => {
      mockGetProjects.mockResolvedValueOnce(sampleProjects);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "test-uuid-1234": "ok" },
        }),
      });

      const result = await handleMoveProjectToParent(mockApi, {
        project_name: "Work Tasks",
        parent_id: "parent-project",
      });

      expect(mockGetProjects).toHaveBeenCalledTimes(1);
      expect(result).toContain("Project project1 moved successfully");
    });

    it("should throw ValidationError when project is not found by name", async () => {
      mockGetProjects.mockResolvedValueOnce(sampleProjects);

      await expect(
        handleMoveProjectToParent(mockApi, {
          project_name: "Non-existent Project",
          parent_id: "parent-project",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when neither project_id nor project_name is provided", async () => {
      await expect(
        handleMoveProjectToParent(mockApi, {
          parent_id: "parent-project",
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        handleMoveProjectToParent(mockApi, {
          parent_id: "parent-project",
        })
      ).rejects.toThrow("Either project_id or project_name must be provided");
    });

    it("should throw TodoistAPIError when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "test-uuid-1234": {
              error: "Parent not found",
              error_code: 36,
            },
          },
        }),
      });

      await expect(
        handleMoveProjectToParent(mockApi, {
          project_id: "project1",
          parent_id: "invalid-parent",
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleMoveProjectToParent(mockApi, {
        project_id: "project1",
        parent_id: "parent-project",
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would move project project1");
    });

    it("should find project by partial name match (case-insensitive)", async () => {
      mockGetProjects.mockResolvedValueOnce(sampleProjects);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "test-uuid-1234": "ok" },
        }),
      });

      const result = await handleMoveProjectToParent(mockApi, {
        project_name: "shopping",
        parent_id: "parent-project",
      });

      expect(result).toContain("Project project3 moved successfully");
    });
  });

  describe("handleGetArchivedProjects", () => {
    it("should fetch and format archived projects successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: sampleArchivedProjects }),
      });

      const result = await handleGetArchivedProjects({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.todoist.com/api/v1/sync",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-token-123",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );
      expect(result).toContain("Found 2 archived projects");
      expect(result).toContain("Old Project");
      expect(result).toContain("Completed Work");
      expect(result).not.toContain("Active Project");
    });

    it("should return message when no archived projects found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          projects: [{ id: "project1", name: "Active", is_archived: false }],
        }),
      });

      const result = await handleGetArchivedProjects({});

      expect(result).toBe("No archived projects found.");
    });

    it("should return message when projects array is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: [] }),
      });

      const result = await handleGetArchivedProjects({});

      expect(result).toBe("No archived projects found.");
    });

    it("should respect limit parameter", async () => {
      const manyArchivedProjects = Array.from({ length: 10 }, (_, i) => ({
        id: `archived${i}`,
        name: `Archived Project ${i}`,
        is_archived: true,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: manyArchivedProjects }),
      });

      const result = await handleGetArchivedProjects({ limit: 3 });

      expect(result).toContain("Found 10 archived projects (showing 3)");
    });

    it("should respect offset parameter", async () => {
      const manyArchivedProjects = Array.from({ length: 10 }, (_, i) => ({
        id: `archived${i}`,
        name: `Archived Project ${i}`,
        is_archived: true,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: manyArchivedProjects }),
      });

      const result = await handleGetArchivedProjects({ offset: 5, limit: 3 });

      expect(result).toContain("showing 3");
      expect(result).toContain("Archived Project 5");
      expect(result).toContain("Archived Project 6");
      expect(result).toContain("Archived Project 7");
      expect(result).not.toContain("Archived Project 4");
    });

    it("should throw TodoistAPIError when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid token",
      });

      await expect(handleGetArchivedProjects({})).rejects.toThrow(
        TodoistAPIError
      );
    });

    it("should throw TodoistAPIError when API token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetArchivedProjects({})).rejects.toThrow(
        TodoistAPIError
      );
    });

    it("should include color information when available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: sampleArchivedProjects }),
      });

      const result = await handleGetArchivedProjects({});

      expect(result).toContain("Color: gray");
      expect(result).toContain("Color: blue");
    });

    it("should handle projects without color property", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          projects: [
            { id: "archived1", name: "No Color Project", is_archived: true },
          ],
        }),
      });

      const result = await handleGetArchivedProjects({});

      expect(result).toContain("No Color Project");
      expect(result).toContain("ID: archived1");
      expect(result).not.toContain("Color:");
    });
  });
});
