// Unified project notes tools combining related operations into single tool
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Unified notes tool combining: create, get, update, delete
 */
export const todoistNotesTool: Tool = {
  name: "todoist_notes",
  description: `Manage Todoist project notes - create, read, update, and delete notes attached to projects.

Actions:
- create: Create a new note for a project
  Example: {action: "create", project_id: "123", content: "Project kickoff notes..."}
- get: Get all notes for a project
  Example: {action: "get", project_id: "123"}
- update: Update an existing note's content
  Example: {action: "update", note_id: "456", content: "Updated notes..."}
- delete: Delete a project note
  Example: {action: "delete", note_id: "456"}

Project notes are different from task comments - they are attached to projects rather than tasks.
Useful for storing project documentation, meeting notes, or reference information.`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "get", "update", "delete"],
        description: "The notes operation to perform",
      },
      // Project identification
      project_id: {
        type: "string",
        description:
          "Project ID for the note. Required for create and get actions.",
      },
      // Note identification
      note_id: {
        type: "string",
        description:
          "Note ID to update or delete. Required for update and delete actions.",
      },
      // Note content
      content: {
        type: "string",
        description:
          "Note content text. Required for create action, optional for update action.",
      },
    },
    required: ["action"],
  },
};

// Export all unified notes tools
export const UNIFIED_NOTES_TOOLS = [todoistNotesTool];
