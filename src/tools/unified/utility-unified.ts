// Unified utility tools combining testing and duplicate detection operations
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified utility tool combining: test_connection, test_features, test_performance, find_duplicates, merge_duplicates
 */
export const todoistUtilityTool: Tool = {
  name: "todoist_utility",
  description: `Todoist utility operations for testing API connectivity and finding/merging duplicate tasks.

Actions:
- test_connection: Quick API token validation and connection test
  Example: {action: "test_connection"}
- test_features: Run feature tests (basic read-only or enhanced with CRUD)
  Example: {action: "test_features", mode: "basic"}
  Example: {action: "test_features", mode: "enhanced"}
- test_performance: Benchmark API response times
  Example: {action: "test_performance", iterations: 5}
- find_duplicates: Find similar/duplicate tasks using Levenshtein distance
  Example: {action: "find_duplicates", threshold: 80}
  Example: {action: "find_duplicates", project_id: "123", include_completed: true}
- merge_duplicates: Merge duplicate tasks by keeping one and completing/deleting others
  Example: {action: "merge_duplicates", keep_task_id: "123", duplicate_task_ids: ["456", "789"], merge_action: "complete"}

Duplicate detection uses Levenshtein distance algorithm with configurable similarity threshold (0-100%).`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "test_connection",
          "test_features",
          "test_performance",
          "find_duplicates",
          "merge_duplicates",
        ],
        description: "The utility operation to perform",
      },
      // Test parameters
      mode: {
        type: "string",
        enum: ["basic", "enhanced"],
        description:
          "Test mode: 'basic' (read-only) or 'enhanced' (full CRUD with cleanup). For test_features action.",
      },
      iterations: {
        type: "number",
        description:
          "Number of iterations for performance benchmark. For test_performance action.",
        minimum: 1,
        default: 3,
      },
      // Find duplicates parameters
      threshold: {
        type: "number",
        description:
          "Similarity threshold 0-100% for duplicate detection. Default: 80. For find_duplicates action.",
        minimum: 0,
        maximum: 100,
      },
      project_id: {
        type: "string",
        description:
          "Filter to specific project ID. For find_duplicates action.",
      },
      include_completed: {
        type: "boolean",
        description:
          "Include completed tasks in duplicate search. Default: false. For find_duplicates action.",
      },
      // Merge duplicates parameters
      keep_task_id: {
        type: "string",
        description:
          "ID of the task to keep as the primary task. Required for merge_duplicates action.",
      },
      duplicate_task_ids: {
        type: "array",
        items: { type: "string" },
        description:
          "Array of task IDs to merge (will be completed or deleted). Required for merge_duplicates action.",
      },
      merge_action: {
        type: "string",
        enum: ["complete", "delete"],
        description:
          "Action for duplicate tasks: 'complete' (default, safer) or 'delete' (permanent). For merge_duplicates action.",
      },
    },
    required: ["action"],
  },
};

// Export all unified utility tools
export const UNIFIED_UTILITY_TOOLS = [todoistUtilityTool];
