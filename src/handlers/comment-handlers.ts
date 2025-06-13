import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateCommentArgs,
  GetCommentsArgs,
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
} from "../utils/api-helpers.js";
import { ErrorHandler } from "../utils/error-handling.js";

// Cache for comment data (30 second TTL)
const commentCache = new SimpleCache<TodoistComment[]>(30000);

// Using shared utilities from api-helpers.ts

export async function handleCreateComment(
  todoistClient: TodoistApi,
  args: CreateCommentArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("create comment", async () => {
    // Validate and sanitize content
    const sanitizedContent = validateCommentContent(args.content);

    let taskId: string;

    // If task_id is provided, use it directly
    if (args.task_id) {
      taskId = args.task_id;
    } else if (args.task_name) {
      // Search for task by name
      const result = await todoistClient.getTasks();
      const tasks = extractArrayFromResponse<TodoistTask>(result);
      const matchingTask = tasks.find((task: TodoistTask) =>
        task.content.toLowerCase().includes(args.task_name!.toLowerCase())
      );

      if (!matchingTask) {
        ErrorHandler.handleTaskNotFound(args.task_name!);
      }

      taskId = matchingTask.id;
    } else {
      throw new Error("Either task_id or task_name must be provided");
    }

    const commentData: CommentCreationData = {
      content: sanitizedContent,
      taskId: taskId,
    };

    if (args.attachment) {
      commentData.attachment = {
        fileName: args.attachment.file_name,
        fileUrl: args.attachment.file_url,
        fileType: args.attachment.file_type,
      };
    }

    const comment = await todoistClient.addComment(commentData);

    // Clear cache after creating comment
    commentCache.clear();

    // Use defensive typing for comment response
    const commentResponse = comment as CommentResponse;

    return `Comment added to task:\nContent: ${commentResponse.content}${
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
      const taskResult = await todoistClient.getTasks();
      const tasks = extractArrayFromResponse<TodoistTask>(taskResult);
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
