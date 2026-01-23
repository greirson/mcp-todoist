import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GET_PROJECT_NOTES_TOOL: Tool = {
  name: "todoist_project_notes_get",
  description:
    "Get all notes for a specific project. Project notes are shared with all project collaborators.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The ID of the project to get notes for",
      },
    },
    required: ["project_id"],
  },
};

export const CREATE_PROJECT_NOTE_TOOL: Tool = {
  name: "todoist_project_note_create",
  description:
    "Create a new note for a project. Project notes are visible to all project collaborators.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The ID of the project to add the note to",
      },
      content: {
        type: "string",
        description: "The content of the note (supports markdown)",
      },
    },
    required: ["project_id", "content"],
  },
};

export const UPDATE_PROJECT_NOTE_TOOL: Tool = {
  name: "todoist_project_note_update",
  description: "Update an existing project note's content.",
  inputSchema: {
    type: "object",
    properties: {
      note_id: {
        type: "string",
        description: "The ID of the note to update",
      },
      content: {
        type: "string",
        description: "The new content for the note",
      },
    },
    required: ["note_id", "content"],
  },
};

export const DELETE_PROJECT_NOTE_TOOL: Tool = {
  name: "todoist_project_note_delete",
  description: "Delete a project note by ID.",
  inputSchema: {
    type: "object",
    properties: {
      note_id: {
        type: "string",
        description: "The ID of the note to delete",
      },
    },
    required: ["note_id"],
  },
};

export const PROJECT_NOTES_TOOLS = [
  GET_PROJECT_NOTES_TOOL,
  CREATE_PROJECT_NOTE_TOOL,
  UPDATE_PROJECT_NOTE_TOOL,
  DELETE_PROJECT_NOTE_TOOL,
];
