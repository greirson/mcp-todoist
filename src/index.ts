#!/usr/bin/env node

/**
 * Todoist MCP Server - Main Entry Point
 *
 * This is the main server file that initializes the MCP server and routes
 * tool requests to the appropriate handlers via the router module.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";
import { createTodoistClient } from "./utils/dry-run-wrapper.js";
import { ALL_TOOLS } from "./tools/index.js";
import { ALL_UNIFIED_TOOLS } from "./tools/unified/index.js";
import { routeToolCall } from "./router/index.js";
import { handleError } from "./errors.js";

// Server implementation
const server = new Server(
  {
    name: "todoist-mcp-server",
    version: "1.0.0",
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

// Determine which tool set to use based on environment variable
// Set TODOIST_UNIFIED_TOOLS=true to use the new consolidated tools (19 tools)
// Default uses legacy tools (60+ tools) for backward compatibility
const USE_UNIFIED_TOOLS = process.env.TODOIST_UNIFIED_TOOLS === "true";
const TOOLS = USE_UNIFIED_TOOLS ? ALL_UNIFIED_TOOLS : ALL_TOOLS;

if (USE_UNIFIED_TOOLS) {
  console.error("Using unified tools (19 consolidated tools)");
} else {
  console.error("Using legacy tools (60+ individual tools)");
}

// List available tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool calls by routing to appropriate handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    // Route the tool call to the appropriate handler
    const result = await routeToolCall(
      name,
      args,
      apiClient,
      TODOIST_API_TOKEN,
      USE_UNIFIED_TOOLS
    );

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

// Run the server
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
