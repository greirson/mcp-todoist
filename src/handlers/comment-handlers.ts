import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateCommentArgs,
  GetCommentsArgs,
  UpdateCommentArgs,
  DeleteCommentArgs,
  TodoistComment,
  TodoistTask,
  CommentResponse,
  CommentCreationData,
} from "../types.js";
import { SimpleCache } from "../cache.js";
// Removed unused imports - now using ErrorHandler utility
import { validateCommentContent } from "../validation.js";
import {
  extractArrayFromResponse,
  createCacheKey,
  fetchAllTasks,
} from "../utils/api-helpers.js";
import { ErrorHandler } from "../utils/error-handling.js";

// Cache for comment data (30 second TTL)
const commentCache = new SimpleCache<TodoistComment[]>(30000);

// Using shared utilities from api-helpers.ts

// Extended interface to support project comments
interface ExtendedCommentCreationData {
  content: string;
  taskId?: string;
  projectId?: string;
  attachment?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
}

export async function handleCreateComment(
  todoistClient: TodoistApi,
  args: CreateCommentArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("create comment", async () => {
    // Validate and sanitize content
    const sanitizedContent = validateCommentContent(args.content);

    const commentData: ExtendedCommentCreationData = {
      content: sanitizedContent,
    };

    // Determine if this is a project comment or task comment
    if (args.project_id) {
      // Project-level comment
      commentData.projectId = args.project_id;
    } else if (args.task_id) {
      // Task comment by ID
      commentData.taskId = args.task_id;
    } else if (args.task_name) {
      // Search for task by name
      const tasks = await fetchAllTasks(todoistClient);
      const matchingTask = tasks.find((task: TodoistTask) =>
        task.content.toLowerCase().includes(args.task_name!.toLowerCase())
      );

      if (!matchingTask) {
        ErrorHandler.handleTaskNotFound(args.task_name!);
      }

      commentData.taskId = matchingTask.id;
    } else {
      throw new Error(
        "Either task_id, task_name, or project_id must be provided"
      );
    }

    if (args.attachment) {
      commentData.attachment = {
        fileName: args.attachment.file_name,
        fileUrl: args.attachment.file_url,
        fileType: args.attachment.file_type,
      };
    }

    const comment = await todoistClient.addComment(
      commentData as CommentCreationData
    );

    // Clear cache after creating comment
    commentCache.clear();

    // Use defensive typing for comment response
    const commentResponse = comment as CommentResponse;

    const targetType = args.project_id ? "project" : "task";
    return `Comment added to ${targetType}:\nContent: ${commentResponse.content}${
      commentResponse.attachment
        ? `\nAttachment: ${commentResponse.attachment.fileName} (${commentResponse.attachment.fileType})`
        : ""
    }\nPosted at: ${commentResponse.postedAt || new Date().toISOString()}`;
  });
}

export async function handleGetComments(
  todoistClient: TodoistApi,
  args: GetCommentsArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("get comments", async () => {
    let comments: TodoistComment[] = [];
    if (args.task_id) {
      // Get comments for specific task
      const cacheKey = createCacheKey("comments", { task_id: args.task_id });
      const cached = commentCache.get(cacheKey);

      if (cached) {
        comments = cached;
      } else {
        const result = await todoistClient.getComments({
          taskId: args.task_id,
        });
        comments = extractArrayFromResponse<TodoistComment>(result);
        commentCache.set(cacheKey, comments);
      }
    } else if (args.task_name) {
      // Search for task by name, then get comments
      const tasks = await fetchAllTasks(todoistClient);
      const matchingTask = tasks.find((task: TodoistTask) =>
        task.content.toLowerCase().includes(args.task_name!.toLowerCase())
      );

      if (!matchingTask) {
        ErrorHandler.handleTaskNotFound(args.task_name!);
      }

      const cacheKey = createCacheKey("comments", {
        task_id: matchingTask!.id,
      });
      const cached = commentCache.get(cacheKey);

      if (cached) {
        comments = cached;
      } else {
        const result = await todoistClient.getComments({
          taskId: matchingTask.id,
        });
        comments = extractArrayFromResponse<TodoistComment>(result);
        commentCache.set(cacheKey, comments);
      }
    } else if (args.project_id) {
      // Get comments for specific project
      const cacheKey = createCacheKey("comments", {
        project_id: args.project_id,
      });
      const cached = commentCache.get(cacheKey);

      if (cached) {
        comments = cached;
      } else {
        const result = await todoistClient.getComments({
          projectId: args.project_id,
        });
        comments = extractArrayFromResponse<TodoistComment>(result);
        commentCache.set(cacheKey, comments);
      }
    } else {
      // Get all comments (this might not be supported by all Todoist API versions)
      const cacheKey = createCacheKey("comments", { scope: "all" });
      const cached = commentCache.get(cacheKey);

      if (cached) {
        comments = cached;
      } else {
        // Getting all comments might not be supported, so we return empty
        comments = [];
        commentCache.set(cacheKey, comments);
      }
    }

    if (comments.length === 0) {
      return "No comments found.";
    }

    const commentList = comments
      .map((comment) => {
        // Use defensive typing for comment properties
        const commentData = comment as CommentResponse;
        return `- ${commentData.content}${
          commentData.attachment
            ? `\n  Attachment: ${commentData.attachment.fileName} (${commentData.attachment.fileType})`
            : ""
        }\n  Posted: ${commentData.postedAt || "Unknown"}${
          commentData.taskId ? `\n  Task ID: ${commentData.taskId}` : ""
        }${commentData.projectId ? `\n  Project ID: ${commentData.projectId}` : ""}`;
      })
      .join("\n\n");

    return `Found ${comments.length} comment${comments.length > 1 ? "s" : ""}:\n\n${commentList}`;
  });
}

export async function handleUpdateComment(
  todoistClient: TodoistApi,
  args: UpdateCommentArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("update comment", async () => {
    // Validate and sanitize content
    const sanitizedContent = validateCommentContent(args.content);

    // Update the comment using the TypeScript SDK
    const updatedComment = await todoistClient.updateComment(args.comment_id, {
      content: sanitizedContent,
    });

    // Clear cache after updating comment
    commentCache.clear();

    // Use defensive typing for comment response
    const commentResponse = updatedComment as CommentResponse;

    return `Comment updated successfully:\nID: ${args.comment_id}\nNew content: ${commentResponse.content}\nUpdated at: ${new Date().toISOString()}`;
  });
}

export async function handleDeleteComment(
  todoistClient: TodoistApi,
  args: DeleteCommentArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("delete comment", async () => {
    // First get the comment to display what was deleted
    let commentContent = "Unknown";
    try {
      const existingComment = await todoistClient.getComment(args.comment_id);
      commentContent =
        (existingComment as CommentResponse).content || "Unknown";
    } catch {
      // Comment might not exist or we can't retrieve it
    }

    // Delete the comment
    const success = await todoistClient.deleteComment(args.comment_id);

    // Clear cache after deleting comment
    commentCache.clear();

    if (success) {
      return `Comment deleted successfully:\nID: ${args.comment_id}\nContent: ${commentContent}`;
    } else {
      throw new Error(`Failed to delete comment with ID: ${args.comment_id}`);
    }
  });
}
