export class TodoistMCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "TodoistMCPError";
  }
}

export class ValidationError extends TodoistMCPError {
  constructor(message: string, field?: string) {
    super(
      field ? `Validation error for field '${field}': ${message}` : message,
      "VALIDATION_ERROR",
      400
    );
    this.name = "ValidationError";
  }
}

export class TaskNotFoundError extends TodoistMCPError {
  constructor(taskName: string) {
    super(
      `Could not find a task matching "${taskName}"`,
      "TASK_NOT_FOUND",
      404
    );
    this.name = "TaskNotFoundError";
  }
}

export class ProjectNotFoundError extends TodoistMCPError {
  constructor(projectId: string) {
    super(
      `Could not find project with ID "${projectId}"`,
      "PROJECT_NOT_FOUND",
      404
    );
    this.name = "ProjectNotFoundError";
  }
}

export class SectionNotFoundError extends TodoistMCPError {
  constructor(sectionId: string) {
    super(
      `Could not find section with ID "${sectionId}"`,
      "SECTION_NOT_FOUND",
      404
    );
    this.name = "SectionNotFoundError";
  }
}

export class TodoistAPIError extends TodoistMCPError {
  constructor(message: string, originalError?: Error) {
    super(
      `Todoist API error: ${message}`,
      "TODOIST_API_ERROR",
      500
    );
    this.name = "TodoistAPIError";
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class AuthenticationError extends TodoistMCPError {
  constructor() {
    super(
      "Invalid or missing Todoist API token",
      "AUTHENTICATION_ERROR",
      401
    );
    this.name = "AuthenticationError";
  }
}

export class LabelNotFoundError extends TodoistMCPError {
  constructor(labelIdentifier: string) {
    super(
      `Could not find label "${labelIdentifier}"`,
      "LABEL_NOT_FOUND",
      404
    );
    this.name = "LabelNotFoundError";
  }
}

export class SubtaskError extends TodoistMCPError {
  constructor(message: string) {
    super(
      `Subtask operation error: ${message}`,
      "SUBTASK_ERROR",
      400
    );
    this.name = "SubtaskError";
  }
}

export function handleError(error: unknown): { message: string; code: string } {
  if (error instanceof TodoistMCPError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
    };
  }

  return {
    message: String(error),
    code: "UNKNOWN_ERROR",
  };
}