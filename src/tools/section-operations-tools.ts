import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const MOVE_SECTION_TOOL: Tool = {
  name: "todoist_section_move",
  description:
    "Move a section to a different project. All tasks in the section will move with it.",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description: "The ID of the section to move",
      },
      section_name: {
        type: "string",
        description:
          "The name of the section to move (partial match, case-insensitive)",
      },
      project_id: {
        type: "string",
        description: "The destination project ID (required)",
      },
    },
    required: ["project_id"],
  },
};

export const REORDER_SECTIONS_TOOL: Tool = {
  name: "todoist_sections_reorder",
  description:
    "Reorder sections within a project by specifying their new positions.",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID containing the sections",
      },
      sections: {
        type: "array",
        description: "Array of section IDs with their new order positions",
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
    required: ["project_id", "sections"],
  },
};

export const ARCHIVE_SECTION_TOOL: Tool = {
  name: "todoist_section_archive",
  description:
    "Archive a section. Archived sections are hidden but not deleted. Tasks in the section are also archived.",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description: "The ID of the section to archive",
      },
      section_name: {
        type: "string",
        description:
          "The name of the section to archive (partial match, case-insensitive)",
      },
      project_id: {
        type: "string",
        description: "Optional project ID to narrow section search",
      },
    },
    required: [],
  },
};

export const UNARCHIVE_SECTION_TOOL: Tool = {
  name: "todoist_section_unarchive",
  description:
    "Unarchive a previously archived section. Restores the section and its tasks to active status.",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description: "The ID of the section to unarchive",
      },
      section_name: {
        type: "string",
        description:
          "The name of the section to unarchive (partial match, case-insensitive)",
      },
      project_id: {
        type: "string",
        description: "Optional project ID to narrow section search",
      },
    },
    required: [],
  },
};

export const SECTION_OPERATIONS_TOOLS = [
  MOVE_SECTION_TOOL,
  REORDER_SECTIONS_TOOL,
  ARCHIVE_SECTION_TOOL,
  UNARCHIVE_SECTION_TOOL,
];
