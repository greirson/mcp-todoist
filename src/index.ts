#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";
import { ALL_TOOLS } from "./tools.js";
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
import { handleError } from "./errors.js";

// Server implementation
const server = new Server(
  {
    name: "todoist-mcp-server",
    version: "0.1.0",
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

      case "todoist_test_connection":
        const connectionResult = await handleTestConnection(todoistClient);
        result = JSON.stringify(connectionResult, null, 2);
        break;

      case "todoist_test_all_features":
        const featuresResult = await handleTestAllFeatures(todoistClient);
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
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
