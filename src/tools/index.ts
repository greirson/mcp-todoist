// Centralized exports for all MCP tools organized by domain
import { TASK_TOOLS } from "./task-tools.js";
import { SUBTASK_TOOLS } from "./subtask-tools.js";
import { PROJECT_TOOLS } from "./project-tools.js";
import { COMMENT_TOOLS } from "./comment-tools.js";
import { LABEL_TOOLS } from "./label-tools.js";
import { TEST_TOOLS } from "./test-tools.js";

// Export individual tool categories
export { TASK_TOOLS } from "./task-tools.js";
export { SUBTASK_TOOLS } from "./subtask-tools.js";
export { PROJECT_TOOLS } from "./project-tools.js";
export { COMMENT_TOOLS } from "./comment-tools.js";
export { LABEL_TOOLS } from "./label-tools.js";
export { TEST_TOOLS } from "./test-tools.js";

// Export individual tools for backwards compatibility
export {
  CREATE_TASK_TOOL,
  GET_TASKS_TOOL,
  UPDATE_TASK_TOOL,
  DELETE_TASK_TOOL,
  COMPLETE_TASK_TOOL,
  REOPEN_TASK_TOOL,
  BULK_CREATE_TASKS_TOOL,
  BULK_UPDATE_TASKS_TOOL,
  BULK_DELETE_TASKS_TOOL,
  BULK_COMPLETE_TASKS_TOOL,
  QUICK_ADD_TASK_TOOL,
} from "./task-tools.js";

export {
  CREATE_SUBTASK_TOOL,
  BULK_CREATE_SUBTASKS_TOOL,
  CONVERT_TO_SUBTASK_TOOL,
  PROMOTE_SUBTASK_TOOL,
  GET_TASK_HIERARCHY_TOOL,
} from "./subtask-tools.js";

export {
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
} from "./project-tools.js";

export { CREATE_COMMENT_TOOL, GET_COMMENTS_TOOL } from "./comment-tools.js";

export {
  GET_LABELS_TOOL,
  CREATE_LABEL_TOOL,
  UPDATE_LABEL_TOOL,
  DELETE_LABEL_TOOL,
  GET_LABEL_STATS_TOOL,
} from "./label-tools.js";

export {
  TEST_CONNECTION_TOOL,
  TEST_ALL_FEATURES_TOOL,
  TEST_PERFORMANCE_TOOL,
} from "./test-tools.js";

// Combined array of all tools in the same order as the original
export const ALL_TOOLS = [
  ...TASK_TOOLS,
  ...PROJECT_TOOLS,
  ...COMMENT_TOOLS,
  ...LABEL_TOOLS,
  ...SUBTASK_TOOLS,
  ...TEST_TOOLS,
];
