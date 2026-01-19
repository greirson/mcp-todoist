import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const FIND_DUPLICATES_TOOL: Tool = {
  name: "todoist_duplicates_find",
  description:
    "Find duplicate or similar tasks using content similarity analysis. Returns grouped tasks that have similar titles, sorted by similarity percentage.",
  inputSchema: {
    type: "object",
    properties: {
      threshold: {
        type: "number",
        description:
          "Similarity threshold (0-100). Tasks with similarity >= threshold are considered duplicates. Default: 80",
        minimum: 0,
        maximum: 100,
      },
      project_id: {
        type: "string",
        description: "Limit duplicate search to a specific project ID",
      },
      include_completed: {
        type: "boolean",
        description: "Include completed tasks in the search. Default: false",
      },
    },
  },
};

export const MERGE_DUPLICATES_TOOL: Tool = {
  name: "todoist_duplicates_merge",
  description:
    "Merge duplicate tasks by keeping one task and completing or deleting the others. Use after todoist_duplicates_find to clean up duplicates.",
  inputSchema: {
    type: "object",
    properties: {
      keep_task_id: {
        type: "string",
        description: "ID of the task to keep (the primary task)",
      },
      duplicate_task_ids: {
        type: "array",
        items: { type: "string" },
        description: "IDs of duplicate tasks to remove",
      },
      action: {
        type: "string",
        enum: ["complete", "delete"],
        description:
          'What to do with duplicate tasks: "complete" marks them done, "delete" removes them permanently',
      },
    },
    required: ["keep_task_id", "duplicate_task_ids", "action"],
  },
};

export const DUPLICATE_TOOLS = [FIND_DUPLICATES_TOOL, MERGE_DUPLICATES_TOOL];
