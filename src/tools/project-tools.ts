// Project and section management tools
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_PROJECTS_TOOL: Tool = {
  name: "todoist_project_get",
  description:
    "Get a list of all projects from Todoist with their IDs and names",
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
  description: "Create a new project in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the project",
      },
      color: {
        type: "string",
        description: "Color for the project (optional)",
      },
      is_favorite: {
        type: "boolean",
        description: "Whether to mark the project as favorite (optional)",
      },
    },
    required: ["name"],
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

export const PROJECT_TOOLS = [
  GET_PROJECTS_TOOL,
  GET_SECTIONS_TOOL,
  CREATE_PROJECT_TOOL,
  CREATE_SECTION_TOOL,
  UPDATE_SECTION_TOOL,
  DELETE_SECTION_TOOL,
];
