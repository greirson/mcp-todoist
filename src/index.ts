#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";
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
    const completion = node.children.length > 0 ? ` [${node.completionPercentage}%]` : "";
    let result = `${indent}${status} ${node.task.content}${completion}\n`;
    
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
    version: "0.8.0",
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

// Initialize Todoist client
const todoistClient = new TodoistApi(TODOIST_API_TOKEN);

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
        result = await handleCreateTask(todoistClient, args);
        break;

      case "todoist_task_get":
        if (!isGetTasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_get");
        }
        result = await handleGetTasks(todoistClient, args);
        break;

      case "todoist_task_update":
        if (!isUpdateTaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_update");
        }
        result = await handleUpdateTask(todoistClient, args);
        break;

      case "todoist_task_delete":
        if (!isDeleteTaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_delete");
        }
        result = await handleDeleteTask(todoistClient, args);
        break;

      case "todoist_task_complete":
        if (!isCompleteTaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_complete");
        }
        result = await handleCompleteTask(todoistClient, args);
        break;

      case "todoist_project_get":
        if (!isGetProjectsArgs(args)) {
          throw new Error("Invalid arguments for todoist_project_get");
        }
        result = await handleGetProjects(todoistClient);
        break;

      case "todoist_section_get":
        if (!isGetSectionsArgs(args)) {
          throw new Error("Invalid arguments for todoist_section_get");
        }
        result = await handleGetSections(todoistClient, args);
        break;

      case "todoist_project_create":
        if (!isCreateProjectArgs(args)) {
          throw new Error("Invalid arguments for todoist_project_create");
        }
        result = await handleCreateProject(todoistClient, args);
        break;

      case "todoist_section_create":
        if (!isCreateSectionArgs(args)) {
          throw new Error("Invalid arguments for todoist_section_create");
        }
        result = await handleCreateSection(todoistClient, args);
        break;

      case "todoist_tasks_bulk_create":
        if (!isBulkCreateTasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_tasks_bulk_create");
        }
        result = await handleBulkCreateTasks(todoistClient, args);
        break;

      case "todoist_tasks_bulk_update":
        if (!isBulkUpdateTasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_tasks_bulk_update");
        }
        result = await handleBulkUpdateTasks(todoistClient, args);
        break;

      case "todoist_tasks_bulk_delete":
        if (!isBulkTaskFilterArgs(args)) {
          throw new Error("Invalid arguments for todoist_tasks_bulk_delete");
        }
        result = await handleBulkDeleteTasks(todoistClient, args);
        break;

      case "todoist_tasks_bulk_complete":
        if (!isBulkTaskFilterArgs(args)) {
          throw new Error("Invalid arguments for todoist_tasks_bulk_complete");
        }
        result = await handleBulkCompleteTasks(todoistClient, args);
        break;

      case "todoist_comment_create":
        if (!isCreateCommentArgs(args)) {
          throw new Error("Invalid arguments for todoist_comment_create");
        }
        result = await handleCreateComment(todoistClient, args);
        break;

      case "todoist_comment_get":
        if (!isGetCommentsArgs(args)) {
          throw new Error("Invalid arguments for todoist_comment_get");
        }
        result = await handleGetComments(todoistClient, args);
        break;

      case "todoist_label_get":
        if (!isGetLabelsArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_get");
        }
        result = await handleGetLabels(todoistClient);
        break;

      case "todoist_label_create":
        if (!isCreateLabelArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_create");
        }
        result = await handleCreateLabel(todoistClient, args);
        break;

      case "todoist_label_update":
        if (!isUpdateLabelArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_update");
        }
        result = await handleUpdateLabel(todoistClient, args);
        break;

      case "todoist_label_delete":
        if (!isLabelNameArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_delete");
        }
        result = await handleDeleteLabel(todoistClient, args);
        break;

      case "todoist_label_stats":
        if (!isGetLabelStatsArgs(args)) {
          throw new Error("Invalid arguments for todoist_label_stats");
        }
        result = await handleGetLabelStats(todoistClient);
        break;

      case "todoist_subtask_create":
        if (!isCreateSubtaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_subtask_create");
        }
        const subtaskResult = await handleCreateSubtask(todoistClient, args);
        result = `Created subtask "${subtaskResult.subtask.content}" under parent task "${subtaskResult.parent.content}"`;
        break;

      case "todoist_subtasks_bulk_create":
        if (!isBulkCreateSubtasksArgs(args)) {
          throw new Error("Invalid arguments for todoist_subtasks_bulk_create");
        }
        const bulkSubtaskResult = await handleBulkCreateSubtasks(todoistClient, args);
        result = `Created ${bulkSubtaskResult.created.length} subtasks under parent "${bulkSubtaskResult.parent.content}"\n` +
                 `Failed: ${bulkSubtaskResult.failed.length}`;
        if (bulkSubtaskResult.failed.length > 0) {
          result += "\nFailed subtasks:\n" + 
                    bulkSubtaskResult.failed.map(f => `- ${f.task.content}: ${f.error}`).join("\n");
        }
        break;

      case "todoist_task_convert_to_subtask":
        if (!isConvertToSubtaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_convert_to_subtask");
        }
        const convertResult = await handleConvertToSubtask(todoistClient, args);
        result = `Converted task "${convertResult.task.content}" to subtask of "${convertResult.parent.content}"`;
        break;

      case "todoist_subtask_promote":
        if (!isPromoteSubtaskArgs(args)) {
          throw new Error("Invalid arguments for todoist_subtask_promote");
        }
        const promotedTask = await handlePromoteSubtask(todoistClient, args);
        result = `Promoted subtask "${promotedTask.content}" to main task`;
        break;

      case "todoist_task_hierarchy_get":
        if (!isGetTaskHierarchyArgs(args)) {
          throw new Error("Invalid arguments for todoist_task_hierarchy_get");
        }
        const hierarchy = await handleGetTaskHierarchy(todoistClient, args);
        result = formatTaskHierarchy(hierarchy);
        break;

      case "todoist_test_connection":
        const connectionResult = await handleTestConnection(todoistClient);
        result = JSON.stringify(connectionResult, null, 2);
        break;

      case "todoist_test_all_features":
        const featuresResult = await handleTestAllFeatures(todoistClient, args as { mode?: "basic" | "enhanced" });
        result = JSON.stringify(featuresResult, null, 2);
        break;

      case "todoist_test_performance":
        const performanceResult = await handleTestPerformance(todoistClient, args as { iterations?: number });
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
