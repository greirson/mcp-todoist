import {
  handleGetWorkspaces,
  handleGetInvitations,
  handleInviteToProject,
  handleAcceptInvitation,
  handleRejectInvitation,
  handleDeleteInvitation,
  handleGetLiveNotifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
  clearCollaborationCache,
} from "../handlers/collaboration-handlers.js";
import { TodoistAPIError, ValidationError } from "../errors.js";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-1234"),
}));

describe("Collaboration Handlers", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.TODOIST_API_TOKEN = "test-token";
    process.env.DRYRUN = "false";
    mockFetch.mockReset();
    clearCollaborationCache();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe("handleGetWorkspaces", () => {
    it("should return workspaces on success", async () => {
      const mockWorkspaces = [
        { id: "ws-1", name: "Workspace 1", is_default: true },
        { id: "ws-2", name: "Workspace 2", is_default: false },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspaces: mockWorkspaces }),
      });

      const result = await handleGetWorkspaces();

      expect(result).toContain("Found 2 workspaces");
      expect(result).toContain("Workspace 1");
      expect(result).toContain("(default)");
      expect(result).toContain("Workspace 2");
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

    it("should return empty message when no workspaces found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspaces: [] }),
      });

      const result = await handleGetWorkspaces();

      expect(result).toContain("No workspaces found");
      expect(result).toContain("Todoist Business accounts");
    });

    it("should return business account required message on 403", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      });

      const result = await handleGetWorkspaces();

      expect(result).toContain("Todoist Business account");
      expect(result).toContain("not available on your current plan");
    });

    it("should throw error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      await expect(handleGetWorkspaces()).rejects.toThrow(TodoistAPIError);
    });

    it("should throw error when token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetWorkspaces()).rejects.toThrow(
        "TODOIST_API_TOKEN environment variable is not set"
      );
    });
  });

  describe("handleGetInvitations", () => {
    it("should return invitations on success", async () => {
      const mockNotifications = [
        {
          id: "inv-1",
          notification_type: "share_invitation_sent",
          from_uid: "user-123",
          project_id: "proj-456",
        },
        {
          id: "inv-2",
          notification_type: "share_invitation_sent",
          from_uid: "user-789",
          project_id: "proj-111",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ live_notifications: mockNotifications }),
      });

      const result = await handleGetInvitations();

      expect(result).toContain("Found 2 pending invitations");
      expect(result).toContain("inv-1");
      expect(result).toContain("user-123");
      expect(result).toContain("proj-456");
    });

    it("should filter only share_invitation_sent notifications", async () => {
      const mockNotifications = [
        {
          id: "inv-1",
          notification_type: "share_invitation_sent",
          from_uid: "user-123",
        },
        {
          id: "other-1",
          notification_type: "item_assigned",
          from_uid: "user-456",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ live_notifications: mockNotifications }),
      });

      const result = await handleGetInvitations();

      expect(result).toContain("Found 1 pending invitations");
      expect(result).toContain("inv-1");
      expect(result).not.toContain("other-1");
    });

    it("should return empty message when no invitations found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ live_notifications: [] }),
      });

      const result = await handleGetInvitations();

      expect(result).toBe("No pending invitations found.");
    });

    it("should throw error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      await expect(handleGetInvitations()).rejects.toThrow(TodoistAPIError);
    });
  });

  describe("handleInviteToProject", () => {
    it("should send invitation successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleInviteToProject({
        project_id: "proj-123",
        email: "test@example.com",
      });

      expect(result).toContain("Invitation sent to test@example.com");
      expect(result).toContain("project proj-123");
    });

    it("should include message in invitation when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleInviteToProject({
        project_id: "proj-123",
        email: "test@example.com",
        message: "Please join my project!",
      });

      expect(result).toContain('with message: "Please join my project!"');
    });

    it("should throw validation error when project_id is missing", async () => {
      await expect(
        handleInviteToProject({
          project_id: "",
          email: "test@example.com",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw validation error when email is missing", async () => {
      await expect(
        handleInviteToProject({
          project_id: "proj-123",
          email: "",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleInviteToProject({
        project_id: "proj-123",
        email: "test@example.com",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("test@example.com");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw error when sync command fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "mock-uuid-1234": {
              error: "Invalid project",
              error_code: 400,
            },
          },
        }),
      });

      await expect(
        handleInviteToProject({
          project_id: "invalid-proj",
          email: "test@example.com",
        })
      ).rejects.toThrow("Invalid project");
    });
  });

  describe("handleAcceptInvitation", () => {
    it("should accept invitation successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleAcceptInvitation({
        invitation_id: "inv-123",
        invitation_secret: "secret-abc",
      });

      expect(result).toContain("inv-123 accepted successfully");
    });

    it("should throw validation error when invitation_id is missing", async () => {
      await expect(
        handleAcceptInvitation({
          invitation_id: "",
          invitation_secret: "secret",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw validation error when invitation_secret is missing", async () => {
      await expect(
        handleAcceptInvitation({
          invitation_id: "inv-123",
          invitation_secret: "",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleAcceptInvitation({
        invitation_id: "inv-123",
        invitation_secret: "secret",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("accept invitation inv-123");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw error when invitation not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "mock-uuid-1234": {
              error: "Invitation not found",
              error_code: 404,
            },
          },
        }),
      });

      await expect(
        handleAcceptInvitation({
          invitation_id: "nonexistent",
          invitation_secret: "secret",
        })
      ).rejects.toThrow("Invitation not found");
    });
  });

  describe("handleRejectInvitation", () => {
    it("should reject invitation successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleRejectInvitation({
        invitation_id: "inv-123",
        invitation_secret: "secret-abc",
      });

      expect(result).toContain("inv-123 rejected successfully");
    });

    it("should throw validation error when invitation_id is missing", async () => {
      await expect(
        handleRejectInvitation({
          invitation_id: "",
          invitation_secret: "secret",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw validation error when invitation_secret is missing", async () => {
      await expect(
        handleRejectInvitation({
          invitation_id: "inv-123",
          invitation_secret: "  ",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleRejectInvitation({
        invitation_id: "inv-123",
        invitation_secret: "secret",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("reject invitation inv-123");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleDeleteInvitation", () => {
    it("should delete invitation successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleDeleteInvitation({
        invitation_id: "inv-123",
      });

      expect(result).toContain("inv-123 deleted successfully");
    });

    it("should throw validation error when invitation_id is missing", async () => {
      await expect(
        handleDeleteInvitation({
          invitation_id: "",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleDeleteInvitation({
        invitation_id: "inv-123",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("delete invitation inv-123");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw error when invitation not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: {
            "mock-uuid-1234": {
              error: "Invitation not found",
              error_code: 404,
            },
          },
        }),
      });

      await expect(
        handleDeleteInvitation({
          invitation_id: "nonexistent",
        })
      ).rejects.toThrow("Invitation not found");
    });
  });

  describe("handleGetLiveNotifications", () => {
    it("should return notifications on success", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          notification_type: "item_assigned",
          created_at: "2024-01-15T10:30:00Z",
          is_unread: true,
          from_uid: "user-123",
          project_id: "proj-456",
          item_id: "task-789",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ live_notifications: mockNotifications }),
      });

      const result = await handleGetLiveNotifications({});

      expect(result).toContain("Found 1 notifications");
      expect(result).toContain("item_assigned");
      expect(result).toContain("(unread)");
      expect(result).toContain("user-123");
      expect(result).toContain("proj-456");
    });

    it("should respect limit parameter", async () => {
      const mockNotifications = Array.from({ length: 10 }, (_, i) => ({
        id: `notif-${i}`,
        notification_type: "item_assigned",
        created_at: "2024-01-15T10:30:00Z",
        is_unread: false,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ live_notifications: mockNotifications }),
      });

      const result = await handleGetLiveNotifications({ limit: 5 });

      expect(result).toContain("Found 5 notifications");
    });

    it("should return empty message when no notifications found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ live_notifications: [] }),
      });

      const result = await handleGetLiveNotifications({});

      expect(result).toBe("No live notifications found.");
    });

    it("should throw error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      await expect(handleGetLiveNotifications({})).rejects.toThrow(
        TodoistAPIError
      );
    });
  });

  describe("handleMarkNotificationRead", () => {
    it("should mark notification as read successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleMarkNotificationRead({
        notification_id: "notif-123",
      });

      expect(result).toContain("notif-123 marked as read");
    });

    it("should throw validation error when notification_id is missing", async () => {
      await expect(
        handleMarkNotificationRead({
          notification_id: "",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleMarkNotificationRead({
        notification_id: "notif-123",
      });

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("mark notification notif-123 as read");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("handleMarkAllNotificationsRead", () => {
    it("should mark all notifications as read successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sync_status: { "mock-uuid-1234": "ok" },
        }),
      });

      const result = await handleMarkAllNotificationsRead();

      expect(result).toBe("All notifications marked as read");
    });

    it("should return dry-run message when DRYRUN is enabled", async () => {
      process.env.DRYRUN = "true";

      const result = await handleMarkAllNotificationsRead();

      expect(result).toContain("[DRY-RUN]");
      expect(result).toContain("mark all notifications as read");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      await expect(handleMarkAllNotificationsRead()).rejects.toThrow(
        TodoistAPIError
      );
    });
  });

  describe("Caching behavior", () => {
    it("should use cached workspaces on subsequent calls", async () => {
      const mockWorkspaces = [{ id: "ws-1", name: "Workspace 1" }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspaces: mockWorkspaces }),
      });

      const result1 = await handleGetWorkspaces();
      const result2 = await handleGetWorkspaces();

      expect(result1).toBe(result2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should clear cache after invitation operations", async () => {
      // First, populate the cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ live_notifications: [] }),
      });
      await handleGetInvitations();

      // Invite to project (should clear cache)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_status: { "mock-uuid-1234": "ok" } }),
      });
      await handleInviteToProject({
        project_id: "proj-123",
        email: "test@example.com",
      });

      // Next call should hit API again
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ live_notifications: [] }),
      });
      await handleGetInvitations();

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
