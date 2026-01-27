/**
 * Comment type definitions
 */

/**
 * Arguments for creating a comment
 */
export interface CreateCommentArgs {
  task_id?: string;
  task_name?: string;
  project_id?: string;
  content: string;
  attachment?: {
    file_name: string;
    file_url: string;
    file_type: string;
  };
}

/**
 * Arguments for getting comments
 */
export interface GetCommentsArgs {
  task_id?: string;
  task_name?: string;
  project_id?: string;
}

/**
 * Arguments for updating a comment
 */
export interface UpdateCommentArgs {
  comment_id: string;
  content: string;
}

/**
 * Arguments for deleting a comment
 */
export interface DeleteCommentArgs {
  comment_id: string;
}

/**
 * Comment data for API operations
 */
export interface TodoistCommentData {
  content: string;
  taskId?: string;
  projectId?: string;
  attachment?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
}

/**
 * Todoist comment object structure (flexible typing for API compatibility)
 */
export interface TodoistComment {
  id?: string;
  content?: string;
  taskId?: string;
  projectId?: string;
  postedAt?: string;
  attachment?: {
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
  };
}

/**
 * Enhanced comment response interface for API compatibility
 */
export interface CommentResponse {
  content: string;
  attachment?: {
    fileName: string;
    fileType: string;
  };
  postedAt?: string;
  taskId?: string;
  projectId?: string;
}

/**
 * Enhanced comment creation data interface
 */
export interface CommentCreationData {
  content: string;
  taskId: string;
  attachment?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
}
