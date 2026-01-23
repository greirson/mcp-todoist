import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const REORDER_PROJECTS_TOOL: Tool = {
  name: "todoist_projects_reorder",
  description:
    "Reorder projects by specifying their new positions. Controls project ordering in the sidebar.",
  inputSchema: {
    type: "object",
    properties: {
      projects: {
        type: "array",
        description: "Array of project IDs with their new order positions",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The project ID",
            },
            child_order: {
              type: "number",
              description: "The new position for the project",
              minimum: 0,
            },
          },
          required: ["id", "child_order"],
        },
      },
    },
    required: ["projects"],
  },
};

export const MOVE_PROJECT_TO_PARENT_TOOL: Tool = {
  name: "todoist_project_move_to_parent",
  description:
    "Move a project under another project (making it a sub-project) or to root level. Useful for organizing project hierarchies.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The ID of the project to move",
      },
      project_name: {
        type: "string",
        description:
          "The name of the project to move (partial match, case-insensitive)",
      },
      parent_id: {
        type: "string",
        description:
          "The parent project ID. Omit or set to null to move to root level.",
      },
    },
    required: [],
  },
};

export const GET_ARCHIVED_PROJECTS_TOOL: Tool = {
  name: "todoist_archived_projects_get",
  description:
    "Get a list of all archived projects. Useful for reviewing or restoring archived projects.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of projects to return (default: 50)",
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: "number",
        description: "Number of projects to skip for pagination",
        minimum: 0,
      },
    },
    required: [],
  },
};

export const PROJECT_OPERATIONS_TOOLS = [
  REORDER_PROJECTS_TOOL,
  MOVE_PROJECT_TO_PARENT_TOOL,
  GET_ARCHIVED_PROJECTS_TOOL,
];
