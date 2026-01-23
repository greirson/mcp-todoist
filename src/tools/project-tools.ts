// Project and section management tools
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_PROJECTS_TOOL: Tool = {
  name: "todoist_project_get",
  description:
    "Get a list of all projects from Todoist with their IDs, names, descriptions, and hierarchy information",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export const GET_SECTIONS_TOOL: Tool = {
  name: "todoist_section_get",
  description:
    "Get a list of sections within a project from Todoist with their IDs and names",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description:
          "Project ID to get sections for (optional - if not provided, gets sections for all projects)",
      },
    },
  },
};

export const CREATE_PROJECT_TOOL: Tool = {
  name: "todoist_project_create",
  description:
    "Create a new project in Todoist with optional sub-project hierarchy, description, and view style",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the project",
      },
      color: {
        type: "string",
        description:
          "Color for the project (optional). Valid colors: berry_red, red, orange, yellow, olive_green, lime_green, green, mint_green, teal, sky_blue, light_blue, blue, grape, violet, lavender, magenta, salmon, charcoal, grey, taupe",
      },
      is_favorite: {
        type: "boolean",
        description: "Whether to mark the project as favorite (optional)",
      },
      parent_id: {
        type: "string",
        description:
          "Parent project ID to create this as a sub-project (optional). Creates a hierarchical relationship.",
      },
      description: {
        type: "string",
        description: "Description of the project (optional)",
      },
      view_style: {
        type: "string",
        description:
          "View style for the project (optional). Options: 'list' (default) or 'board' (kanban-style)",
      },
    },
    required: ["name"],
  },
};

export const UPDATE_PROJECT_TOOL: Tool = {
  name: "todoist_project_update",
  description:
    "Update an existing project in Todoist. Can modify name, color, favorite status, description, or view style.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description:
          "Project ID to update (takes precedence over project_name if both provided)",
      },
      project_name: {
        type: "string",
        description:
          "Project name to search for and update (case-insensitive partial match)",
      },
      name: {
        type: "string",
        description: "New name for the project (optional)",
      },
      color: {
        type: "string",
        description:
          "New color for the project (optional). Valid colors: berry_red, red, orange, yellow, olive_green, lime_green, green, mint_green, teal, sky_blue, light_blue, blue, grape, violet, lavender, magenta, salmon, charcoal, grey, taupe",
      },
      is_favorite: {
        type: "boolean",
        description: "Whether to mark the project as favorite (optional)",
      },
      description: {
        type: "string",
        description: "New description for the project (optional)",
      },
      view_style: {
        type: "string",
        description:
          "New view style for the project (optional). Options: 'list' or 'board'",
      },
    },
  },
};

export const DELETE_PROJECT_TOOL: Tool = {
  name: "todoist_project_delete",
  description:
    "Delete a project from Todoist. This will also delete all tasks and sub-projects within the project.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description:
          "Project ID to delete (takes precedence over project_name if both provided)",
      },
      project_name: {
        type: "string",
        description:
          "Project name to search for and delete (case-insensitive partial match)",
      },
    },
  },
};

export const ARCHIVE_PROJECT_TOOL: Tool = {
  name: "todoist_project_archive",
  description:
    "Archive or unarchive a project in Todoist. Archived projects are hidden from the main view but can be restored.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description:
          "Project ID to archive/unarchive (takes precedence over project_name if both provided)",
      },
      project_name: {
        type: "string",
        description:
          "Project name to search for and archive/unarchive (case-insensitive partial match)",
      },
      archive: {
        type: "boolean",
        description:
          "True to archive the project, false to unarchive it (default: true)",
      },
    },
  },
};

export const GET_PROJECT_COLLABORATORS_TOOL: Tool = {
  name: "todoist_project_collaborators_get",
  description:
    "Get a list of collaborators for a shared project in Todoist. Returns collaborator names and emails.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description:
          "Project ID to get collaborators for (takes precedence over project_name if both provided)",
      },
      project_name: {
        type: "string",
        description:
          "Project name to search for (case-insensitive partial match)",
      },
    },
  },
};

export const CREATE_SECTION_TOOL: Tool = {
  name: "todoist_section_create",
  description: "Create a new section within a project in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the section",
      },
      project_id: {
        type: "string",
        description: "Project ID where the section will be created",
      },
      order: {
        type: "number",
        description:
          "Order of the section within the project (optional, lower values appear first)",
      },
    },
    required: ["name", "project_id"],
  },
};

export const UPDATE_SECTION_TOOL: Tool = {
  name: "todoist_section_update",
  description:
    "Update an existing section in Todoist. Can update name by section ID or section name search.",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description:
          "Section ID to update (takes precedence over section_name if both provided)",
      },
      section_name: {
        type: "string",
        description:
          "Section name to search for (case-insensitive partial match)",
      },
      project_id: {
        type: "string",
        description:
          "Project ID to narrow down section search when using section_name",
      },
      name: {
        type: "string",
        description: "New name for the section",
      },
    },
    required: [],
  },
};

export const DELETE_SECTION_TOOL: Tool = {
  name: "todoist_section_delete",
  description:
    "Delete a section and all its tasks from Todoist. Can delete by section ID or section name search.",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description:
          "Section ID to delete (takes precedence over section_name if both provided)",
      },
      section_name: {
        type: "string",
        description:
          "Section name to search for (case-insensitive partial match)",
      },
      project_id: {
        type: "string",
        description:
          "Project ID to narrow down section search when using section_name",
      },
    },
    required: [],
  },
};

export const GET_COLLABORATORS_TOOL: Tool = {
  name: "todoist_collaborators_get",
  description:
    "Get a list of collaborators for a shared project. Returns user IDs, names, and emails that can be used for task assignment with assignee_id.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description:
          "Project ID to get collaborators for (required, project must be shared)",
      },
    },
    required: ["project_id"],
  },
};

export const PROJECT_TOOLS = [
  GET_PROJECTS_TOOL,
  GET_SECTIONS_TOOL,
  CREATE_PROJECT_TOOL,
  UPDATE_PROJECT_TOOL,
  DELETE_PROJECT_TOOL,
  ARCHIVE_PROJECT_TOOL,
  GET_PROJECT_COLLABORATORS_TOOL,
  CREATE_SECTION_TOOL,
  UPDATE_SECTION_TOOL,
  DELETE_SECTION_TOOL,
  GET_COLLABORATORS_TOOL,
];
