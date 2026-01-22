// Unified project management tools
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified tool for core project operations: create, get, update, delete, archive, collaborators
 */
export const todoistProjectTool: Tool = {
  name: "todoist_project",
  description: `Manage Todoist projects - create, read, update, delete, archive, or get collaborators.

Actions:
- create: Create a new project with optional hierarchy and styling
  Example: {action: "create", name: "Work Tasks", color: "blue", view_style: "board"}
  Example: {action: "create", name: "Sub-Project", parent_id: "123", description: "A child project"}

- get: List all projects with their IDs, names, descriptions, and hierarchy
  Example: {action: "get"}

- update: Update an existing project's properties
  Example: {action: "update", project_id: "123", name: "New Name", color: "red"}
  Example: {action: "update", project_name: "Work", is_favorite: true, view_style: "list"}

- delete: Delete a project (also deletes all tasks and sub-projects within it)
  Example: {action: "delete", project_id: "123"}
  Example: {action: "delete", project_name: "Old Project"}

- archive: Archive or unarchive a project (archived projects are hidden but can be restored)
  Example: {action: "archive", project_id: "123", archived: true}
  Example: {action: "archive", project_name: "Completed Project", archived: true}
  Example: {action: "archive", project_id: "123", archived: false}  // unarchive

- collaborators: Get collaborators for a shared project (returns IDs, names, emails)
  Example: {action: "collaborators", project_id: "123"}
  Example: {action: "collaborators", project_name: "Team Project"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "get", "update", "delete", "archive", "collaborators"],
        description: "The project operation to perform",
      },
      project_id: {
        type: "string",
        description:
          "Project ID for update/delete/archive/collaborators actions (takes precedence over project_name)",
      },
      project_name: {
        type: "string",
        description:
          "Project name to search for (case-insensitive partial match). Used when project_id is not provided.",
      },
      name: {
        type: "string",
        description:
          "Name of the project (required for create, optional for update)",
      },
      color: {
        type: "string",
        description:
          "Color for the project. Valid colors: berry_red, red, orange, yellow, olive_green, lime_green, green, mint_green, teal, sky_blue, light_blue, blue, grape, violet, lavender, magenta, salmon, charcoal, grey, taupe",
      },
      description: {
        type: "string",
        description: "Description of the project",
      },
      view_style: {
        type: "string",
        enum: ["list", "board"],
        description:
          "View style for the project: 'list' (default) or 'board' (kanban-style)",
      },
      is_favorite: {
        type: "boolean",
        description: "Whether to mark the project as favorite",
      },
      parent_id: {
        type: "string",
        description:
          "Parent project ID to create this as a sub-project (for create action). Creates a hierarchical relationship.",
      },
      archived: {
        type: "boolean",
        description:
          "For archive action: true to archive the project, false to unarchive it (default: true)",
      },
    },
    required: ["action"],
  },
};

/**
 * Unified tool for project operations: reorder, move_to_parent, get_archived
 */
export const todoistProjectOpsTool: Tool = {
  name: "todoist_project_ops",
  description: `Advanced project operations - reorder projects, move to parent, or get archived projects.

Actions:
- reorder: Reorder projects by specifying their new positions in the sidebar
  Example: {action: "reorder", projects: [{id: "123", child_order: 0}, {id: "456", child_order: 1}]}

- move_to_parent: Move a project under another project (making it a sub-project) or to root level
  Example: {action: "move_to_parent", project_id: "123", parent_id: "456"}  // make sub-project
  Example: {action: "move_to_parent", project_name: "My Project", parent_id: "456"}
  Example: {action: "move_to_parent", project_id: "123", parent_id: null}  // move to root level

- get_archived: Get a list of all archived projects for review or restoration
  Example: {action: "get_archived"}
  Example: {action: "get_archived", limit: 20, offset: 0}`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["reorder", "move_to_parent", "get_archived"],
        description: "The project operation to perform",
      },
      project_id: {
        type: "string",
        description:
          "Project ID for move_to_parent action (takes precedence over project_name)",
      },
      project_name: {
        type: "string",
        description:
          "Project name for move_to_parent action (case-insensitive partial match)",
      },
      parent_id: {
        type: ["string", "null"],
        description:
          "For move_to_parent: The parent project ID. Omit or set to null to move to root level.",
      },
      projects: {
        type: "array",
        description:
          "For reorder action: Array of project IDs with their new order positions",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The project ID",
            },
            child_order: {
              type: "number",
              description: "The new position for the project (0 = first)",
              minimum: 0,
            },
          },
          required: ["id", "child_order"],
        },
      },
      limit: {
        type: "number",
        description:
          "For get_archived: Maximum number of projects to return (default: 50, max: 100)",
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: "number",
        description:
          "For get_archived: Number of projects to skip for pagination",
        minimum: 0,
      },
    },
    required: ["action"],
  },
};

export const UNIFIED_PROJECT_TOOLS = [
  todoistProjectTool,
  todoistProjectOpsTool,
];
