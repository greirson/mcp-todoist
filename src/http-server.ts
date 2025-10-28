#!/usr/bin/env node

/**
 * HTTP Server with SSE Transport for Railway deployment
 *
 * This entry point provides HTTP/SSE transport for the MCP server,
 * enabling deployment on platforms like Railway that require HTTP servers.
 *
 * For local development with Claude Desktop, use the stdio version (src/index.ts)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
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
import express from "express";

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

// Create MCP server instance
function createMCPServer(todoistClient: TodoistApi) {
  const server = new Server(
    {
      name: "todoist-mcp-server",
      version: "0.8.8",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

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
          result = `Created subtask "${subtaskResult.subtask.content}" (ID: ${subtaskResult.subtask.id}) under parent task "${subtaskResult.parent.content}" (ID: ${subtaskResult.parent.id})`;
          break;

        case "todoist_subtasks_bulk_create":
          if (!isBulkCreateSubtasksArgs(args)) {
            throw new Error("Invalid arguments for todoist_subtasks_bulk_create");
          }
          const bulkSubtaskResult = await handleBulkCreateSubtasks(
            todoistClient,
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
          const convertResult = await handleConvertToSubtask(todoistClient, args);
          result = `Converted task "${convertResult.task.content}" (ID: ${convertResult.task.id}) to subtask of "${convertResult.parent.content}" (ID: ${convertResult.parent.id})`;
          break;

        case "todoist_subtask_promote":
          if (!isPromoteSubtaskArgs(args)) {
            throw new Error("Invalid arguments for todoist_subtask_promote");
          }
          const promotedTask = await handlePromoteSubtask(todoistClient, args);
          result = `Promoted subtask "${promotedTask.content}" (ID: ${promotedTask.id}) to main task`;
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
          const featuresResult = await handleTestAllFeatures(
            todoistClient,
            args as { mode?: "basic" | "enhanced" }
          );
          result = JSON.stringify(featuresResult, null, 2);
          break;

        case "todoist_test_performance":
          const performanceResult = await handleTestPerformance(
            todoistClient,
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

  return server;
}

async function runHTTPServer(): Promise<void> {
  // Check for API token
  const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN;
  if (!TODOIST_API_TOKEN) {
    console.error("Error: TODOIST_API_TOKEN environment variable is required");
    process.exit(1);
  }

  // Check for MCP auth token (required for production security)
  const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
  if (!MCP_AUTH_TOKEN) {
    console.error("Error: MCP_AUTH_TOKEN environment variable is required");
    console.error("Generate a secure token with: openssl rand -base64 32");
    process.exit(1);
  }

  // Initialize Todoist client (with optional dry-run wrapper)
  const todoistClient = createTodoistClient(TODOIST_API_TOKEN);
  const apiClient = todoistClient as TodoistApi;

  // Create MCP server
  const mcpServer = createMCPServer(apiClient);

  // Create Express app
  const app = express();

  // Authentication middleware for protected endpoints
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing Authorization header. Use: Authorization: Bearer YOUR_MCP_AUTH_TOKEN'
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (token !== MCP_AUTH_TOKEN) {
      console.error('Authentication failed from:', req.ip);
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid authentication token'
      });
      return;
    }

    next();
  };

  // Health check endpoint for Railway
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'todoist-mcp-server',
      version: '0.8.8',
      transport: 'sse'
    });
  });

  // Root endpoint with info
  app.get('/', (_req, res) => {
    res.json({
      name: 'Todoist MCP Server',
      version: '0.8.8',
      description: 'MCP server for Todoist API over HTTP/SSE',
      endpoints: {
        health: '/health',
        sse: '/sse'
      },
      tools: ALL_TOOLS.length
    });
  });

  // SSE endpoint for MCP (protected with authentication)
  app.get('/sse', authenticate, async (req, res) => {
    console.log('New authenticated SSE connection from:', req.ip);

    const transport = new SSEServerTransport('/message', res);
    await mcpServer.connect(transport);

    console.log('SSE transport connected');
  });

  // Handle SSE messages (protected with authentication)
  app.post('/message', authenticate, async (req, res) => {
    // SSE transport handles this internally
    res.status(200).end();
  });

  // Get port from environment (Railway sets this automatically)
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Todoist MCP Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  });
}

// Run the server
runHTTPServer().catch((error) => {
  console.error("Fatal error running HTTP server:", error);
  process.exit(1);
});
