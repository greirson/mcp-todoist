import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateCommentArgs,
  GetCommentsArgs,
  TodoistComment,
  TodoistTask,
} from "../types.js";
import { SimpleCache } from "../cache.js";
import { TaskNotFoundError, TodoistAPIError } from "../errors.js";
import { validateTaskContent } from "../validation.js";

// Cache for comment data (30 second TTL)
const commentCache = new SimpleCache<TodoistComment[]>(30000);

// Helper function to handle API response format changes
function extractCommentsArray(result: unknown): TodoistComment[] {
  if (Array.isArray(result)) {
    return result as TodoistComment[];
  }

  const responseObj = result as {
    results?: TodoistComment[];
    data?: TodoistComment[];
  };
  // Handle both 'results' and 'data' properties
  return responseObj?.results || responseObj?.data || [];
}

// Helper function to extract tasks array (reused from task-handlers)
function extractTasksArray(result: unknown): TodoistTask[] {
  if (Array.isArray(result)) {
    return result as TodoistTask[];
  }

  const responseObj = result as {
    results?: TodoistTask[];
    data?: TodoistTask[];
  };
  // Handle both 'results' and 'data' properties
  return responseObj?.results || responseObj?.data || [];
}

export async function handleCreateComment(
  todoistClient: TodoistApi,
  args: CreateCommentArgs
): Promise<string> {
  try {
    // Validate content
    validateTaskContent(args.content);

    let taskId: string;

    // If task_id is provided, use it directly
    if (args.task_id) {
      taskId = args.task_id;
    } else if (args.task_name) {
      // Search for task by name
      const result = await todoistClient.getTasks();
      const tasks = extractTasksArray(result);
      const matchingTask = tasks.find((task: TodoistTask) =>
        task.content.toLowerCase().includes(args.task_name!.toLowerCase())
      );

      if (!matchingTask) {
        throw new TaskNotFoundError(args.task_name);
      }

      taskId = matchingTask.id;
    } else {
      throw new Error("Either task_id or task_name must be provided");
    }

    const commentData: {
      content: string;
      taskId: string;
      attachment?: {
        fileName: string;
        fileUrl: string;
        fileType: string;
      };
    } = {
      content: args.content,
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
    const commentResponse = comment as {
      content: string;
      attachment?: {
        fileName: string;
        fileType: string;
      };
      postedAt?: string;
    };

    return `Comment added to task:\nContent: ${commentResponse.content}${
      commentResponse.attachment
        ? `\nAttachment: ${commentResponse.attachment.fileName} (${commentResponse.attachment.fileType})`
        : ""
    }\nPosted at: ${commentResponse.postedAt || new Date().toISOString()}`;
  } catch (error) {
    throw new TodoistAPIError("Failed to create comment", error as Error);
  }
}

export async function handleGetComments(
  todoistClient: TodoistApi,
  args: GetCommentsArgs
): Promise<string> {
  let cacheKey = "comments_";
  let comments: TodoistComment[] = [];

  try {
    if (args.task_id) {
      // Get comments for specific task
      cacheKey += `task_${args.task_id}`;
      const cached = commentCache.get(cacheKey);

      if (cached) {
        comments = cached;
      } else {
        const result = await todoistClient.getComments({
          taskId: args.task_id,
        });
        comments = extractCommentsArray(result);
        commentCache.set(cacheKey, comments);
      }
    } else if (args.task_name) {
      // Search for task by name, then get comments
      const taskResult = await todoistClient.getTasks();
      const tasks = extractTasksArray(taskResult);
      const matchingTask = tasks.find((task: TodoistTask) =>
        task.content.toLowerCase().includes(args.task_name!.toLowerCase())
      );

      if (!matchingTask) {
        throw new TaskNotFoundError(args.task_name);
      }

      cacheKey += `task_${matchingTask.id}`;
      const cached = commentCache.get(cacheKey);

      if (cached) {
        comments = cached;
      } else {
        const result = await todoistClient.getComments({
          taskId: matchingTask.id,
        });
        comments = extractCommentsArray(result);
        commentCache.set(cacheKey, comments);
      }
    } else if (args.project_id) {
      // Get comments for specific project
      cacheKey += `project_${args.project_id}`;
      const cached = commentCache.get(cacheKey);

      if (cached) {
        comments = cached;
      } else {
        const result = await todoistClient.getComments({
          projectId: args.project_id,
        });
        comments = extractCommentsArray(result);
        commentCache.set(cacheKey, comments);
      }
    } else {
      // Get all comments (this might not be supported by all Todoist API versions)
      cacheKey += "all";
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
        const commentData = comment as {
          content: string;
          attachment?: {
            fileName: string;
            fileType: string;
          };
          postedAt?: string;
          taskId?: string;
          projectId?: string;
        };
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
  } catch (error) {
    throw new TodoistAPIError("Failed to get comments", error as Error);
  }
}
