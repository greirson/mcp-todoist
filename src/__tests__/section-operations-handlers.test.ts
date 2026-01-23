import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { TodoistApi } from "@doist/todoist-api-typescript";

// Mock uuid to return predictable values
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mocked-uuid"),
}));

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Import handlers after mocking
import {
  handleMoveSection,
  handleReorderSections,
  handleArchiveSection,
  handleUnarchiveSection,
} from "../handlers/section-operations-handlers.js";
import { ValidationError, TodoistAPIError } from "../errors.js";

describe("Section Operations Handlers", () => {
  const originalEnv = process.env;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockApi: any;

  // Sample section data (minimal fields needed for handler logic)
  const sampleSections = [
    {
      id: "section-1",
      name: "To Do",
      projectId: "project-1",
      order: 1,
    },
    {
      id: "section-2",
      name: "In Progress",
      projectId: "project-1",
      order: 2,
    },
    {
      id: "section-3",
      name: "Done",
      projectId: "project-1",
      order: 3,
    },
  ];

  // Helper to create mock getSections response
  const createSectionsResponse = () => ({
    results: sampleSections,
    nextCursor: null,
  });

  beforeEach(() => {
    mockFetch.mockClear();
    process.env = { ...originalEnv, TODOIST_API_TOKEN: "test-token" };
    delete process.env.DRYRUN;

    // Create mock TodoistApi with minimal typing
    mockApi = {
      getSections: jest.fn(),
    };
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

  describe("handleMoveSection", () => {
    it("should move a section by ID successfully", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleMoveSection(mockApi as TodoistApi, {
        section_id: "section-1",
        project_id: "project-2",
      });

      expect(result).toContain("Section section-1 moved successfully");
      expect(result).toContain("project-2");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should move a section by name successfully", async () => {
      mockApi.getSections.mockResolvedValueOnce(createSectionsResponse());
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleMoveSection(mockApi as TodoistApi, {
        section_name: "To Do",
        project_id: "project-2",
      });

      expect(result).toContain("Section section-1 moved successfully");
      expect(mockApi.getSections).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should find section by partial name match", async () => {
      mockApi.getSections.mockResolvedValueOnce(createSectionsResponse());
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleMoveSection(mockApi as TodoistApi, {
        section_name: "progress",
        project_id: "project-2",
      });

      expect(result).toContain("Section section-2 moved successfully");
    });

    it("should throw ValidationError when section not found by name", async () => {
      mockApi.getSections.mockResolvedValueOnce(createSectionsResponse());

      await expect(
        handleMoveSection(mockApi as TodoistApi, {
          section_name: "Nonexistent",
          project_id: "project-2",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when project_id is missing", async () => {
      await expect(
        handleMoveSection(mockApi as TodoistApi, {
          section_id: "section-1",
          project_id: "",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when neither section_id nor section_name provided", async () => {
      await expect(
        handleMoveSection(mockApi as TodoistApi, {
          project_id: "project-2",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: "Server error" }, false, 500)
      );

      await expect(
        handleMoveSection(mockApi as TodoistApi, {
          section_id: "section-1",
          project_id: "project-2",
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should handle sync command failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          sync_status: {
            "mocked-uuid": { error: "Invalid section", error_code: 400 },
          },
        })
      );

      await expect(
        handleMoveSection(mockApi as TodoistApi, {
          section_id: "section-1",
          project_id: "project-2",
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";

      const result = await handleMoveSection(mockApi as TodoistApi, {
        section_id: "section-1",
        project_id: "project-2",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would move section");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleReorderSections", () => {
    it("should reorder sections successfully", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleReorderSections({
        project_id: "project-1",
        sections: [
          { id: "section-1", section_order: 3 },
          { id: "section-2", section_order: 1 },
          { id: "section-3", section_order: 2 },
        ],
      });

      expect(result).toContain("Successfully reordered 3 sections");
      expect(result).toContain("project-1");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError when project_id is missing", async () => {
      await expect(
        handleReorderSections({
          project_id: "",
          sections: [{ id: "section-1", section_order: 1 }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when sections array is empty", async () => {
      await expect(
        handleReorderSections({
          project_id: "project-1",
          sections: [],
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when section has invalid id", async () => {
      await expect(
        handleReorderSections({
          project_id: "project-1",
          sections: [{ id: "", section_order: 1 }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when section has negative order", async () => {
      await expect(
        handleReorderSections({
          project_id: "project-1",
          sections: [{ id: "section-1", section_order: -1 }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: "Server error" }, false, 500)
      );

      await expect(
        handleReorderSections({
          project_id: "project-1",
          sections: [{ id: "section-1", section_order: 1 }],
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";

      const result = await handleReorderSections({
        project_id: "project-1",
        sections: [
          { id: "section-1", section_order: 2 },
          { id: "section-2", section_order: 1 },
        ],
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would reorder 2 sections");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleArchiveSection", () => {
    it("should archive a section by ID successfully", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleArchiveSection(mockApi as TodoistApi, {
        section_id: "section-1",
      });

      expect(result).toContain("Section section-1 archived successfully");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should archive a section by name successfully", async () => {
      mockApi.getSections.mockResolvedValueOnce(createSectionsResponse());
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleArchiveSection(mockApi as TodoistApi, {
        section_name: "Done",
      });

      expect(result).toContain("Section section-3 archived successfully");
      expect(mockApi.getSections).toHaveBeenCalled();
    });

    it("should throw ValidationError when section not found by name", async () => {
      mockApi.getSections.mockResolvedValueOnce(createSectionsResponse());

      await expect(
        handleArchiveSection(mockApi as TodoistApi, {
          section_name: "Nonexistent Section",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when neither section_id nor section_name provided", async () => {
      await expect(
        handleArchiveSection(mockApi as TodoistApi, {})
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: "Archive failed" }, false, 500)
      );

      await expect(
        handleArchiveSection(mockApi as TodoistApi, {
          section_id: "section-1",
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";

      const result = await handleArchiveSection(mockApi as TodoistApi, {
        section_id: "section-1",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would archive section");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleUnarchiveSection", () => {
    it("should unarchive a section by ID successfully", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleUnarchiveSection(mockApi as TodoistApi, {
        section_id: "section-1",
      });

      expect(result).toContain("Section section-1 unarchived successfully");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should unarchive a section by name successfully", async () => {
      mockApi.getSections.mockResolvedValueOnce(createSectionsResponse());
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ sync_status: { "mocked-uuid": "ok" } })
      );

      const result = await handleUnarchiveSection(mockApi as TodoistApi, {
        section_name: "To Do",
      });

      expect(result).toContain("Section section-1 unarchived successfully");
      expect(mockApi.getSections).toHaveBeenCalled();
    });

    it("should throw ValidationError when section not found by name", async () => {
      mockApi.getSections.mockResolvedValueOnce(createSectionsResponse());

      await expect(
        handleUnarchiveSection(mockApi as TodoistApi, {
          section_name: "Missing Section",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when neither section_id nor section_name provided", async () => {
      await expect(
        handleUnarchiveSection(mockApi as TodoistApi, {})
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TodoistAPIError on API failure", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: "Unarchive failed" }, false, 500)
      );

      await expect(
        handleUnarchiveSection(mockApi as TodoistApi, {
          section_id: "section-1",
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should return dry-run message when DRYRUN=true", async () => {
      process.env.DRYRUN = "true";

      const result = await handleUnarchiveSection(mockApi as TodoistApi, {
        section_id: "section-1",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("Would unarchive section");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should throw TodoistAPIError when token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(
        handleMoveSection(mockApi as TodoistApi, {
          section_id: "section-1",
          project_id: "project-2",
        })
      ).rejects.toThrow(TodoistAPIError);
    });

    it("should handle non-ok sync status", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          sync_status: { "mocked-uuid": "error" },
        })
      );

      await expect(
        handleArchiveSection(mockApi as TodoistApi, {
          section_id: "section-1",
        })
      ).rejects.toThrow(TodoistAPIError);
    });
  });
});
