import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CREATE_TASK_TOOL: Tool = {
  name: "todoist_task_create",
  description:
    "Create a new task in Todoist with optional description, due date, priority, labels, deadline, project, and section",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content/title of the task",
      },
      description: {
        type: "string",
        description: "Detailed description of the task (optional)",
      },
      due_string: {
        type: "string",
        description:
          "Natural language due date like 'tomorrow', 'next Monday', 'Jan 23' (optional)",
      },
      priority: {
        type: "number",
        description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4],
      },
      labels: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of label names to assign to the task (optional)",
      },
      deadline: {
        type: "string",
        description: "Deadline date in YYYY-MM-DD format (optional)",
      },
      project_id: {
        type: "string",
        description: "Project ID to assign the task to (optional)",
      },
      section_id: {
        type: "string",
        description:
          "Section ID within the project to assign the task to (optional)",
      },
    },
    required: ["content"],
  },
};

export const GET_TASKS_TOOL: Tool = {
  name: "todoist_task_get",
  description: "Get a list of tasks from Todoist with various filters",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Filter tasks by project ID (optional)",
      },
      filter: {
        type: "string",
        description:
          "Natural language filter like 'today', 'tomorrow', 'next week', 'priority 1', 'overdue' (optional)",
      },
      priority: {
        type: "number",
        description: "Filter by priority level (1-4) (optional)",
        enum: [1, 2, 3, 4],
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (optional)",
        default: 10,
      },
    },
  },
};

export const UPDATE_TASK_TOOL: Tool = {
  name: "todoist_task_update",
  description:
    "Update an existing task in Todoist by searching for it by name and then updating it",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and update",
      },
      content: {
        type: "string",
        description: "New content/title for the task (optional)",
      },
      description: {
        type: "string",
        description: "New description for the task (optional)",
      },
      due_string: {
        type: "string",
        description:
          "New due date in natural language like 'tomorrow', 'next Monday' (optional)",
      },
      priority: {
        type: "number",
        description: "New priority level from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4],
      },
      project_id: {
        type: "string",
        description: "New project ID to move the task to (optional)",
      },
      section_id: {
        type: "string",
        description:
          "New section ID within the project to move the task to (optional)",
      },
    },
    required: ["task_name"],
  },
};

export const DELETE_TASK_TOOL: Tool = {
  name: "todoist_task_delete",
  description: "Delete a task from Todoist by searching for it by name",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and delete",
      },
    },
    required: ["task_name"],
  },
};

export const COMPLETE_TASK_TOOL: Tool = {
  name: "todoist_task_complete",
  description: "Mark a task as complete by searching for it by name",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and complete",
      },
    },
    required: ["task_name"],
  },
};

export const GET_PROJECTS_TOOL: Tool = {
  name: "todoist_project_get",
  description: "Get a list of all projects from Todoist with their IDs and names",
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
    },
    required: ["name", "project_id"],
  },
};

export const ALL_TOOLS = [
  CREATE_TASK_TOOL,
  GET_TASKS_TOOL,
  UPDATE_TASK_TOOL,
  DELETE_TASK_TOOL,
  COMPLETE_TASK_TOOL,
  GET_PROJECTS_TOOL,
  GET_SECTIONS_TOOL,
  CREATE_PROJECT_TOOL,
  CREATE_SECTION_TOOL,
];