import { TASK_TOOLS } from "./task-tools.js";
import { SUBTASK_TOOLS } from "./subtask-tools.js";
import { PROJECT_TOOLS } from "./project-tools.js";
import { COMMENT_TOOLS } from "./comment-tools.js";
import { LABEL_TOOLS } from "./label-tools.js";
import { REMINDER_TOOLS } from "./reminder-tools.js";
import { FILTER_TOOLS } from "./filter-tools.js";
import { DUPLICATE_TOOLS } from "./duplicate-tools.js";
import { ACTIVITY_TOOLS } from "./activity-tools.js";
import { ITEM_OPERATIONS_TOOLS } from "./item-operations-tools.js";
import { SECTION_OPERATIONS_TOOLS } from "./section-operations-tools.js";
import { PROJECT_OPERATIONS_TOOLS } from "./project-operations-tools.js";
import { USER_TOOLS } from "./user-tools.js";
import { SHARED_LABEL_TOOLS } from "./shared-label-tools.js";
import { TEST_TOOLS } from "./test-tools.js";

export { TASK_TOOLS } from "./task-tools.js";
export { SUBTASK_TOOLS } from "./subtask-tools.js";
export { PROJECT_TOOLS } from "./project-tools.js";
export { COMMENT_TOOLS } from "./comment-tools.js";
export { LABEL_TOOLS } from "./label-tools.js";
export { REMINDER_TOOLS } from "./reminder-tools.js";
export { FILTER_TOOLS } from "./filter-tools.js";
export { DUPLICATE_TOOLS } from "./duplicate-tools.js";
export { ACTIVITY_TOOLS } from "./activity-tools.js";
export { ITEM_OPERATIONS_TOOLS } from "./item-operations-tools.js";
export { SECTION_OPERATIONS_TOOLS } from "./section-operations-tools.js";
export { PROJECT_OPERATIONS_TOOLS } from "./project-operations-tools.js";
export { USER_TOOLS } from "./user-tools.js";
export { SHARED_LABEL_TOOLS } from "./shared-label-tools.js";
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
  GET_COMPLETED_TASKS_TOOL,
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
  GET_COLLABORATORS_TOOL,
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

export {
  GET_REMINDERS_TOOL,
  CREATE_REMINDER_TOOL,
  UPDATE_REMINDER_TOOL,
  DELETE_REMINDER_TOOL,
} from "./reminder-tools.js";

export {
  GET_FILTERS_TOOL,
  CREATE_FILTER_TOOL,
  UPDATE_FILTER_TOOL,
  DELETE_FILTER_TOOL,
} from "./filter-tools.js";

export {
  FIND_DUPLICATES_TOOL,
  MERGE_DUPLICATES_TOOL,
} from "./duplicate-tools.js";

export {
  GET_ACTIVITY_TOOL,
  GET_ACTIVITY_BY_PROJECT_TOOL,
  GET_ACTIVITY_BY_DATE_RANGE_TOOL,
} from "./activity-tools.js";

export {
  MOVE_TASK_TOOL,
  REORDER_TASK_TOOL,
  BULK_REORDER_TASKS_TOOL,
  CLOSE_TASK_TOOL,
  UPDATE_DAY_ORDER_TOOL,
} from "./item-operations-tools.js";

export {
  MOVE_SECTION_TOOL,
  REORDER_SECTIONS_TOOL,
  ARCHIVE_SECTION_TOOL,
  UNARCHIVE_SECTION_TOOL,
} from "./section-operations-tools.js";

export {
  REORDER_PROJECTS_TOOL,
  MOVE_PROJECT_TO_PARENT_TOOL,
  GET_ARCHIVED_PROJECTS_TOOL,
} from "./project-operations-tools.js";

export {
  GET_USER_TOOL,
  GET_PRODUCTIVITY_STATS_TOOL,
  GET_USER_SETTINGS_TOOL,
} from "./user-tools.js";

export {
  GET_SHARED_LABELS_TOOL,
  RENAME_SHARED_LABEL_TOOL,
  REMOVE_SHARED_LABEL_TOOL,
} from "./shared-label-tools.js";

export const ALL_TOOLS = [
  ...TASK_TOOLS,
  ...PROJECT_TOOLS,
  ...COMMENT_TOOLS,
  ...LABEL_TOOLS,
  ...FILTER_TOOLS,
  ...SUBTASK_TOOLS,
  ...REMINDER_TOOLS,
  ...DUPLICATE_TOOLS,
  ...ACTIVITY_TOOLS,
  ...ITEM_OPERATIONS_TOOLS,
  ...SECTION_OPERATIONS_TOOLS,
  ...PROJECT_OPERATIONS_TOOLS,
  ...USER_TOOLS,
  ...SHARED_LABEL_TOOLS,
  ...TEST_TOOLS,
];
