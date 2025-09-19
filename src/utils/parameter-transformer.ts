// Parameter transformation utility for MCP to Todoist SDK compatibility
// Converts MCP snake_case parameters to Todoist SDK camelCase format

/**
 * Transforms MCP snake_case parameters to Todoist SDK camelCase format
 * This is necessary because MCP protocol requires snake_case while
 * the Todoist TypeScript SDK expects camelCase
 */
export function transformMCPToTodoistParams(args: any): any {
  if (!args || typeof args !== "object") {
    return args;
  }

  const transformed: any = {};

  // Map of MCP snake_case to Todoist SDK camelCase
  const parameterMap: Record<string, string> = {
    // Task parameters
    task_id: "taskId",
    task_name: "taskName",
    project_id: "projectId",
    section_id: "sectionId",
    parent_id: "parentId",
    due_string: "dueString",
    deadline_date: "deadlineDate",
    label_id: "labelId",
    label_name: "labelName",

    // Bulk operation parameters
    search_criteria: "searchCriteria",
    content_contains: "contentContains",
    due_before: "dueBefore",
    due_after: "dueAfter",

    // Comment parameters
    comment_content: "commentContent",
    file_url: "fileUrl",
    file_name: "fileName",
    file_type: "fileType",

    // Label parameters
    is_favorite: "isFavorite",

    // Other parameters (pass through unchanged)
    content: "content",
    description: "description",
    priority: "priority",
    labels: "labels",
    order: "order",
    color: "color",
    name: "name",
    mode: "mode",
    limit: "limit",
    filter: "filter",
    lang: "lang",
    tasks: "tasks",
    updates: "updates",
    attachment: "attachment",
    iterations: "iterations",
  };

  // Transform each parameter
  for (const [key, value] of Object.entries(args)) {
    const transformedKey = parameterMap[key] || key;

    // Handle nested objects (like search_criteria, updates, etc.)
    if (value && typeof value === "object" && !Array.isArray(value)) {
      transformed[transformedKey] = transformMCPToTodoistParams(value);
    }
    // Handle arrays of objects (like tasks array in bulk operations)
    else if (Array.isArray(value)) {
      transformed[transformedKey] = value.map((item) =>
        typeof item === "object" ? transformMCPToTodoistParams(item) : item
      );
    }
    // Pass through primitive values
    else {
      transformed[transformedKey] = value;
    }
  }

  return transformed;
}

/**
 * Extracts task identification parameters with transformation
 * Handles both snake_case and camelCase for backward compatibility
 */
export function extractTaskIdentifiers(args: any): {
  taskId?: string;
  taskName?: string;
} {
  return {
    taskId: args.task_id || args.taskId,
    taskName: args.task_name || args.taskName,
  };
}

/**
 * Transforms bulk filter arguments to internal format
 * Ensures consistent structure for bulk operations
 */
export function transformBulkFilterArgs(args: any): any {
  // Handle both old format (direct properties) and new format (search_criteria)
  if (
    !args.search_criteria &&
    (args.project_id ||
      args.priority ||
      args.content_contains ||
      args.due_before ||
      args.due_after)
  ) {
    // Old format: properties are at root level
    return {
      searchCriteria: {
        projectId: args.project_id,
        priority: args.priority,
        contentContains: args.content_contains,
        dueBefore: args.due_before,
        dueAfter: args.due_after,
      },
    };
  }

  // New format: transform normally
  return transformMCPToTodoistParams(args);
}
