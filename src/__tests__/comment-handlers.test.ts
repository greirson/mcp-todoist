/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { TodoistApi } from "@doist/todoist-api-typescript";

// Create mock functions
const mockAddComment = jest.fn() as jest.MockedFunction<any>;
const mockGetComments = jest.fn() as jest.MockedFunction<any>;
const mockGetComment = jest.fn() as jest.MockedFunction<any>;
const mockUpdateComment = jest.fn() as jest.MockedFunction<any>;
const mockDeleteComment = jest.fn() as jest.MockedFunction<any>;
const mockGetTasks = jest.fn() as jest.MockedFunction<any>;

// Mock the Todoist API
jest.mock("@doist/todoist-api-typescript", () => ({
  TodoistApi: jest.fn().mockImplementation(() => ({
    addComment: mockAddComment,
    getComments: mockGetComments,
    getComment: mockGetComment,
    updateComment: mockUpdateComment,
    deleteComment: mockDeleteComment,
    getTasks: mockGetTasks,
  })),
}));

// Mock the cache module
jest.mock("../cache.js", () => ({
  SimpleCache: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    clear: jest.fn(),
  })),
}));

import {
  handleCreateComment,
  handleGetComments,
  handleUpdateComment,
  handleDeleteComment,
} from "../handlers/comment-handlers.js";

describe("Comment Handlers", () => {
  let mockClient: TodoistApi;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a mock client object
    mockClient = {
      addComment: mockAddComment,
      getComments: mockGetComments,
      getComment: mockGetComment,
      updateComment: mockUpdateComment,
      deleteComment: mockDeleteComment,
      getTasks: mockGetTasks,
    } as unknown as TodoistApi;
  });

  describe("handleCreateComment", () => {
    it("should create a comment on a task by task_id", async () => {
      const mockComment = {
        id: "comment-123",
        content: "Test comment",
        taskId: "task-456",
        postedAt: "2024-01-01T12:00:00Z",
      };

      mockAddComment.mockResolvedValue(mockComment);

      const result = await handleCreateComment(mockClient, {
        task_id: "task-456",
        content: "Test comment",
      });

      expect(mockAddComment).toHaveBeenCalledWith({
        taskId: "task-456",
        content: "Test comment",
      });
      expect(result).toContain("Comment added to task");
      expect(result).toContain("Test comment");
    });

    it("should create a comment on a project by project_id", async () => {
      const mockComment = {
        id: "comment-123",
        content: "Project comment",
        projectId: "project-789",
        postedAt: "2024-01-01T12:00:00Z",
      };

      mockAddComment.mockResolvedValue(mockComment);

      const result = await handleCreateComment(mockClient, {
        project_id: "project-789",
        content: "Project comment",
      });

      expect(mockAddComment).toHaveBeenCalledWith({
        projectId: "project-789",
        content: "Project comment",
      });
      expect(result).toContain("Comment added to project");
      expect(result).toContain("Project comment");
    });

    it("should create a comment on a task found by task_name", async () => {
      const mockTasks = [
        { id: "task-123", content: "Buy groceries" },
        { id: "task-456", content: "Call mom" },
      ];
      const mockComment = {
        id: "comment-789",
        content: "Remember milk",
        taskId: "task-123",
        postedAt: "2024-01-01T12:00:00Z",
      };

      mockGetTasks.mockResolvedValue(mockTasks);
      mockAddComment.mockResolvedValue(mockComment);

      const result = await handleCreateComment(mockClient, {
        task_name: "groceries",
        content: "Remember milk",
      });

      expect(mockGetTasks).toHaveBeenCalled();
      expect(mockAddComment).toHaveBeenCalledWith({
        taskId: "task-123",
        content: "Remember milk",
      });
      expect(result).toContain("Comment added to task");
    });

    it("should throw error when task_name not found", async () => {
      const mockTasks = [{ id: "task-123", content: "Buy groceries" }];

      mockGetTasks.mockResolvedValue(mockTasks);

      await expect(
        handleCreateComment(mockClient, {
          task_name: "nonexistent",
          content: "Test",
        })
      ).rejects.toThrow();
    });

    it("should throw error when no task_id, task_name, or project_id provided", async () => {
      await expect(
        handleCreateComment(mockClient, {
          content: "Test comment",
        } as any)
      ).rejects.toThrow();
    });

    it("should create a comment with attachment", async () => {
      const mockComment = {
        id: "comment-123",
        content: "See attached",
        taskId: "task-456",
        postedAt: "2024-01-01T12:00:00Z",
        attachment: {
          fileName: "doc.pdf",
          fileType: "application/pdf",
          fileUrl: "https://example.com/doc.pdf",
        },
      };

      mockAddComment.mockResolvedValue(mockComment);

      const result = await handleCreateComment(mockClient, {
        task_id: "task-456",
        content: "See attached",
        attachment: {
          file_name: "doc.pdf",
          file_type: "application/pdf",
          file_url: "https://example.com/doc.pdf",
        },
      });

      expect(mockAddComment).toHaveBeenCalledWith({
        taskId: "task-456",
        content: "See attached",
        attachment: {
          fileName: "doc.pdf",
          fileType: "application/pdf",
          fileUrl: "https://example.com/doc.pdf",
        },
      });
      expect(result).toContain("Attachment: doc.pdf");
    });
  });

  describe("handleGetComments", () => {
    it("should get comments by task_id", async () => {
      const mockComments = [
        {
          id: "comment-1",
          content: "First comment",
          taskId: "task-123",
          postedAt: "2024-01-01T12:00:00Z",
        },
        {
          id: "comment-2",
          content: "Second comment",
          taskId: "task-123",
          postedAt: "2024-01-02T12:00:00Z",
        },
      ];

      mockGetComments.mockResolvedValue(mockComments);

      const result = await handleGetComments(mockClient, {
        task_id: "task-123",
      });

      expect(mockGetComments).toHaveBeenCalledWith({
        taskId: "task-123",
      });
      expect(result).toContain("Found 2 comments");
      expect(result).toContain("First comment");
      expect(result).toContain("Second comment");
    });

    it("should get comments by project_id", async () => {
      const mockComments = [
        {
          id: "comment-1",
          content: "Project comment",
          projectId: "project-456",
          postedAt: "2024-01-01T12:00:00Z",
        },
      ];

      mockGetComments.mockResolvedValue(mockComments);

      const result = await handleGetComments(mockClient, {
        project_id: "project-456",
      });

      expect(mockGetComments).toHaveBeenCalledWith({
        projectId: "project-456",
      });
      expect(result).toContain("Found 1 comment");
      expect(result).toContain("Project comment");
    });

    it("should get comments by task_name", async () => {
      const mockTasks = [{ id: "task-123", content: "Buy groceries" }];
      const mockComments = [
        {
          id: "comment-1",
          content: "Don't forget eggs",
          taskId: "task-123",
          postedAt: "2024-01-01T12:00:00Z",
        },
      ];

      mockGetTasks.mockResolvedValue(mockTasks);
      mockGetComments.mockResolvedValue(mockComments);

      const result = await handleGetComments(mockClient, {
        task_name: "groceries",
      });

      expect(mockGetTasks).toHaveBeenCalled();
      expect(mockGetComments).toHaveBeenCalledWith({
        taskId: "task-123",
      });
      expect(result).toContain("Don't forget eggs");
    });

    it("should return 'No comments found' when empty", async () => {
      mockGetComments.mockResolvedValue([]);

      const result = await handleGetComments(mockClient, {
        task_id: "task-123",
      });

      expect(result).toBe("No comments found.");
    });

    it("should throw error when task_name not found", async () => {
      const mockTasks = [{ id: "task-123", content: "Buy groceries" }];

      mockGetTasks.mockResolvedValue(mockTasks);

      await expect(
        handleGetComments(mockClient, {
          task_name: "nonexistent",
        })
      ).rejects.toThrow();
    });

    it("should return empty when no filter provided", async () => {
      const result = await handleGetComments(mockClient, {});

      expect(result).toBe("No comments found.");
    });
  });

  describe("handleUpdateComment", () => {
    it("should update comment content", async () => {
      const mockUpdatedComment = {
        id: "comment-123",
        content: "Updated content",
        taskId: "task-456",
        postedAt: "2024-01-01T12:00:00Z",
      };

      mockUpdateComment.mockResolvedValue(mockUpdatedComment);

      const result = await handleUpdateComment(mockClient, {
        comment_id: "comment-123",
        content: "Updated content",
      });

      expect(mockUpdateComment).toHaveBeenCalledWith("comment-123", {
        content: "Updated content",
      });
      expect(result).toContain("Comment updated successfully");
      expect(result).toContain("comment-123");
      expect(result).toContain("Updated content");
    });

    it("should throw error when update fails", async () => {
      mockUpdateComment.mockRejectedValue(new Error("Comment not found"));

      await expect(
        handleUpdateComment(mockClient, {
          comment_id: "invalid-id",
          content: "Updated content",
        })
      ).rejects.toThrow();
    });
  });

  describe("handleDeleteComment", () => {
    it("should delete comment successfully", async () => {
      const mockExistingComment = {
        id: "comment-123",
        content: "Comment to delete",
        taskId: "task-456",
      };

      mockGetComment.mockResolvedValue(mockExistingComment);
      mockDeleteComment.mockResolvedValue(true);

      const result = await handleDeleteComment(mockClient, {
        comment_id: "comment-123",
      });

      expect(mockDeleteComment).toHaveBeenCalledWith("comment-123");
      expect(result).toContain("Comment deleted successfully");
      expect(result).toContain("comment-123");
      expect(result).toContain("Comment to delete");
    });

    it("should handle delete when comment cannot be retrieved first", async () => {
      mockGetComment.mockRejectedValue(new Error("Not found"));
      mockDeleteComment.mockResolvedValue(true);

      const result = await handleDeleteComment(mockClient, {
        comment_id: "comment-123",
      });

      expect(result).toContain("Comment deleted successfully");
      expect(result).toContain("Unknown");
    });

    it("should throw error when delete returns false", async () => {
      mockGetComment.mockResolvedValue({
        id: "comment-123",
        content: "Test",
      });
      mockDeleteComment.mockResolvedValue(false);

      await expect(
        handleDeleteComment(mockClient, {
          comment_id: "comment-123",
        })
      ).rejects.toThrow("Failed to delete comment");
    });

    it("should throw error when delete fails", async () => {
      mockGetComment.mockResolvedValue({
        id: "comment-123",
        content: "Test",
      });
      mockDeleteComment.mockRejectedValue(new Error("API error"));

      await expect(
        handleDeleteComment(mockClient, {
          comment_id: "comment-123",
        })
      ).rejects.toThrow();
    });
  });
});
