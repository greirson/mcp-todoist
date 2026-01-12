#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  createTodoistClient,
  type TodoistClient,
} from "./utils/dry-run-wrapper.js";
import { ALL_TOOLS } from "./tools/index.js";
import {
  isCreateTaskArgs,
  isGetTasksArgs,
  isUpdateTaskArgs,
  isTaskNameArgs as isDeleteTaskArgs,
  isTaskNameArgs as isCompleteTaskArgs,
  isGetProjectsArgs,
  isGetSectionsArgs,
  isCreateProjectArgs,
  isCreateSectionArgs,
  isBulkCreateTasksArgs,
  isBulkUpdateTasksArgs,
  isBulkTaskFilterArgs,
  isCreateCommentArgs,
  isGetCommentsArgs,
  isGetLabelsArgs,
  isCreateLabelArgs,
  isUpdateLabelArgs,
  isLabelNameArgs,
  isGetLabelStatsArgs,
  isCreateSubtaskArgs,
  isBulkCreateSubtasksArgs,
  isConvertToSubtaskArgs,
  isPromoteSubtaskArgs,
  isGetTaskHierarchyArgs,
  isGetCompletedTasksArgs,
} from "./type-guards.js";
import {
  handleCreateTask,
  handleGetTasks,
  handleUpdateTask,
  handleDeleteTask,
  handleCompleteTask,
  handleBulkCreateTasks,
  handleBulkUpdateTasks,
  handleBulkDeleteTasks,
  handleBulkCompleteTasks,
  handleGetCompletedTasks,
} from "./handlers/task-handlers.js";
import {
  handleGetProjects,
  handleGetSections,
  handleCreateProject,
  handleCreateSection,
} from "./handlers/project-handlers.js";
import {
  handleCreateComment,
  handleGetComments,
} from "./handlers/comment-handlers.js";
import {
  handleTestConnection,
  handleTestAllFeatures,
  handleTestPerformance,
} from "./handlers/test-handlers.js";
import {
  handleGetLabels,
  handleCreateLabel,
  handleUpdateLabel,
  handleDeleteLabel,
  handleGetLabelStats,
} from "./handlers/label-handlers.js";
import {
  handleCreateSubtask,
  handleBulkCreateSubtasks,
  handleConvertToSubtask,
  handlePromoteSubtask,
  handleGetTaskHierarchy,
} from "./handlers/subtask-handlers.js";
import { handleError } from "./errors.js";
import type { TaskHierarchy, TaskNode } from "./types.js";

// Helper function to format task hierarchy
function formatTaskHierarchy(hierarchy: TaskHierarchy): string {
  function formatNode(node: TaskNode, indent: string = ""): string {
    const status = node.task.isCompleted ? "✓" : "○";
    const completion =
      node.children.length > 0 ? ` [${node.completionPercentage}%]` : "";
    const currentTaskMarker = node.isOriginalTask ? " ← current task" : "";
    let result = `${indent}${status} ${node.task.content} (ID: ${node.task.id})${completion}${currentTaskMarker}\n`;

    for (const child of node.children) {
      result += formatNode(child, indent + "  ");
    }

    return result;
  }

  let result = formatNode(hierarchy.root);
  result += `\nTotal tasks: ${hierarchy.totalTasks}\n`;
  result += `Completed: ${hierarchy.completedTasks} (${hierarchy.overallCompletion}%)`;

  return result;
}

// Server implementation
const server = new Server(
  {
    name: "todoist-mcp-server",
    version: "0.8.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Check for API token
const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN!;
if (!TODOIST_API_TOKEN) {
  console.error("Error: TODOIST_API_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize Todoist client (with optional dry-run wrapper)
const todoistClient = createTodoistClient(TODOIST_API_TOKEN);

// Cast to TodoistApi for handler compatibility (DryRunWrapper implements the same interface)
const apiClient = todoistClient as TodoistApi;

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    let result: string;

    switch (name) {
      case "todoist_task_create":
        if (!isCreateTaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_create");
        }
        result = await handleCreateTask(apiClient, args);
        break;

      case "todoist_task_get":
        if (!isGetTasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_get");
        }
        result = await handleGetTasks(apiClient, args);
        break;

      case "todoist_task_update":
        if (!isUpdateTaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_update");
        }
        result = await handleUpdateTask(apiClient, args);
        break;

      case "todoist_task_delete":
        if (!isDeleteTaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_delete");
        }
        result = await handleDeleteTask(apiClient, args);
        break;

      case "todoist_task_complete":
        if (!isCompleteTaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_complete");
        }
        result = await handleCompleteTask(apiClient, args);
        break;

      case "todoist_project_get":
        if (!isGetProjectsArgs(args)) {
          throw new Error("Invalid arguments for todoist_project_get");
        }
        result = await handleGetProjects(apiClient);
        break;

      case "todoist_section_get":
        if (!isGetSectionsArgs(args)) {
          throw new Error("Invalid arguments for todoist_section_get");
        }
        result = await handleGetSections(apiClient, args);
        break;

      case "todoist_project_create":
        if (!isCreateProjectArgs(args)) {
          throw new Error("Invalid arguments for todoist_project_create");
        }
        result = await handleCreateProject(apiClient, args);
        break;

      case "todoist_section_create":
        if (!isCreateSectionArgs(args)) {
          throw new Error("Invalid arguments for todoist_section_create");
        }
        result = await handleCreateSection(apiClient, args);
        break;

      case "todoist_tasks_bulk_create":
        if (!isBulkCreateTasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_tasks_bulk_create");
        }
        result = await handleBulkCreateTasks(apiClient, args);
        break;

      case "todoist_tasks_bulk_update":
        if (!isBulkUpdateTasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_tasks_bulk_update");
        }
        result = await handleBulkUpdateTasks(apiClient, args);
        break;

      case "todoist_tasks_bulk_delete":
        if (!isBulkTaskFilterArgs(args)) {
          throw new Error("Invalid arguments for todoist_tasks_bulk_delete");
        }
        result = await handleBulkDeleteTasks(apiClient, args);
        break;

      case "todoist_tasks_bulk_complete":
        if (!isBulkTaskFilterArgs(args)) {
          throw new Error("Invalid arguments for todoist_tasks_bulk_complete");
        }
        result = await handleBulkCompleteTasks(apiClient, args);
        break;

      case "todoist_completed_tasks_get":
        if (!isGetCompletedTasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_completed_tasks_get");
        }
        result = await handleGetCompletedTasks(args, TODOIST_API_TOKEN);
        break;

      case "todoist_comment_create":
        if (!isCreateCommentArgs(args)) {
          throw new Error("Invalid arguments for todoist_comment_create");
        }
        result = await handleCreateComment(apiClient, args);
        break;

      case "todoist_comment_get":
        if (!isGetCommentsArgs(args)) {
          throw new Error("Invalid arguments for todoist_comment_get");
        }
        result = await handleGetComments(apiClient, args);
        break;

      case "todoist_label_get":
        if (!isGetLabelsArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_get");
        }
        result = await handleGetLabels(apiClient);
        break;

      case "todoist_label_create":
        if (!isCreateLabelArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_create");
        }
        result = await handleCreateLabel(apiClient, args);
        break;

      case "todoist_label_update":
        if (!isUpdateLabelArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_update");
        }
        result = await handleUpdateLabel(apiClient, args);
        break;

      case "todoist_label_delete":
        if (!isLabelNameArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_delete");
        }
        result = await handleDeleteLabel(apiClient, args);
        break;

      case "todoist_label_stats":
        if (!isGetLabelStatsArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_stats");
        }
        result = await handleGetLabelStats(apiClient);
        break;

      case "todoist_subtask_create":
        if (!isCreateSubtaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_subtask_create");
        }
        const subtaskResult = await handleCreateSubtask(apiClient, args);
        result = `Created subtask "${subtaskResult.subtask.content}" (ID: ${subtaskResult.subtask.id}) under parent task "${subtaskResult.parent.content}" (ID: ${subtaskResult.parent.id})`;
        break;

      case "todoist_subtasks_bulk_create":
        if (!isBulkCreateSubtasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_subtasks_bulk_create");
        }
        const bulkSubtaskResult = await handleBulkCreateSubtasks(
          apiClient,
          args
        );
        result =
          `Created ${bulkSubtaskResult.created.length} subtasks under parent "${bulkSubtaskResult.parent.content}" (ID: ${bulkSubtaskResult.parent.id})\n` +
          `Failed: ${bulkSubtaskResult.failed.length}`;
        if (bulkSubtaskResult.created.length > 0) {
          result +=
            "\nCreated subtasks:\n" +
            bulkSubtaskResult.created
              .map((t) => `- ${t.content} (ID: ${t.id})`)
              .join("\n");
        }
        if (bulkSubtaskResult.failed.length > 0) {
          result +=
            "\nFailed subtasks:\n" +
            bulkSubtaskResult.failed
              .map((f) => `- ${f.task.content}: ${f.error}`)
              .join("\n");
        }
        break;

      case "todoist_task_convert_to_subtask":
        if (!isConvertToSubtaskArgs(args)) {
          throw new Error(
            "Invalid arguments for todoist_task_convert_to_subtask"
          );
        }
        const convertResult = await handleConvertToSubtask(apiClient, args);
        result = `Converted task "${convertResult.task.content}" (ID: ${convertResult.task.id}) to subtask of "${convertResult.parent.content}" (ID: ${convertResult.parent.id})`;
        break;

      case "todoist_subtask_promote":
        if (!isPromoteSubtaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_subtask_promote");
        }
        const promotedTask = await handlePromoteSubtask(apiClient, args);
        result = `Promoted subtask "${promotedTask.content}" (ID: ${promotedTask.id}) to main task`;
        break;

      case "todoist_task_hierarchy_get":
        if (!isGetTaskHierarchyArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_hierarchy_get");
        }
        const hierarchy = await handleGetTaskHierarchy(apiClient, args);
        result = formatTaskHierarchy(hierarchy);
        break;

      case "todoist_test_connection":
        const connectionResult = await handleTestConnection(apiClient);
        result = JSON.stringify(connectionResult, null, 2);
        break;

      case "todoist_test_all_features":
        const featuresResult = await handleTestAllFeatures(
          apiClient,
          args as { mode?: "basic" | "enhanced" }
        );
        result = JSON.stringify(featuresResult, null, 2);
        break;

      case "todoist_test_performance":
        const performanceResult = await handleTestPerformance(
          apiClient,
          args as { iterations?: number }
        );
        result = JSON.stringify(performanceResult, null, 2);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: result }],
      isError: false,
    };
  } catch (error) {
    const errorInfo = handleError(error);
    return {
      content: [
        {
          type: "text",
          text: `Error [${errorInfo.code}]: ${errorInfo.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todoist MCP Server running on stdio");

  // Optional: Set up cache monitoring (uncomment to enable)
  // const cacheManager = CacheManager.getInstance();
  // setInterval(() => {
  //   const health = cacheManager.getHealthInfo();
  //   if (!health.healthy) {
  //     console.error("Cache health issues:", health.issues);
  //   }
  // }, 60000); // Check every minute
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
