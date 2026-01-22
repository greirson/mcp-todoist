import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const todoistSectionTool: Tool = {
  name: "todoist_section",
  description: `Manage Todoist sections within projects.

Actions:
- create: Create a new section in a project
  Example: {action: "create", project_id: "123", name: "In Progress"}
  Example with order: {action: "create", project_id: "123", name: "Done", order: 2}
- get: List sections in a project (or all projects if project_id omitted)
  Example: {action: "get", project_id: "123"}
  Example all: {action: "get"}
- update: Rename a section (by ID or name search)
  Example: {action: "update", section_id: "456", name: "Completed"}
  Example by name: {action: "update", section_name: "Done", project_id: "123", name: "Completed"}
- delete: Delete a section and all its tasks
  Example: {action: "delete", section_id: "456"}
  Example by name: {action: "delete", section_name: "Old Section", project_id: "123"}
- move: Move a section to a different project (tasks move with it)
  Example: {action: "move", section_id: "456", project_id: "789"}
  Example by name: {action: "move", section_name: "Backlog", project_id: "789"}
- reorder: Reorder sections within a project
  Example: {action: "reorder", project_id: "123", sections: [{id: "1", section_order: 1}, {id: "2", section_order: 2}]}
- archive: Archive a section (hides it and its tasks)
  Example: {action: "archive", section_id: "456"}
  Example by name: {action: "archive", section_name: "Old Work", project_id: "123"}
- unarchive: Restore an archived section
  Example: {action: "unarchive", section_id: "456"}
  Example by name: {action: "unarchive", section_name: "Old Work", project_id: "123"}`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "create",
          "get",
          "update",
          "delete",
          "move",
          "reorder",
          "archive",
          "unarchive",
        ],
        description: "The action to perform on sections",
      },
      section_id: {
        type: "string",
        description:
          "Section ID (takes precedence over section_name if both provided)",
      },
      section_name: {
        type: "string",
        description:
          "Section name to search for (case-insensitive partial match)",
      },
      project_id: {
        type: "string",
        description:
          "Project ID - required for create/move/reorder, optional for get/update/delete/archive/unarchive to narrow search",
      },
      name: {
        type: "string",
        description: "Section name - required for create, new name for update",
      },
      order: {
        type: "number",
        description:
          "Order of section within project (for create, lower values appear first)",
      },
      sections: {
        type: "array",
        description:
          "Array of section ordering objects for reorder action. Each object needs id and section_order.",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The section ID",
            },
            section_order: {
              type: "number",
              description: "The new position for the section",
              minimum: 0,
            },
          },
          required: ["id", "section_order"],
        },
      },
    },
    required: ["action"],
  },
};
