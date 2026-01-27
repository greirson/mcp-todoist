/**
 * Router Module - dispatches tool calls to appropriate router based on configuration
 *
 * This module provides a unified entry point for tool routing, supporting both:
 * - Legacy tools (60+ individual tools) - default
 * - Unified tools (19 consolidated tools) - enabled via TODOIST_UNIFIED_TOOLS=true
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { handleLegacyToolCall } from "./legacy-router.js";
import { handleUnifiedToolCall } from "./unified-router.js";

export interface CallToolResult {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
}

/**
 * Routes a tool call to the appropriate handler based on configuration
 *
 * @param toolName - The name of the tool to execute
 * @param args - The arguments passed to the tool
 * @param client - The Todoist API client
 * @param apiToken - The Todoist API token (needed for some handlers)
 * @param useUnified - Whether to use unified tools (19 consolidated) or legacy (60+ individual)
 * @returns The result string from the tool handler
 * @throws Error if the tool is not found or if arguments are invalid
 */
export async function routeToolCall(
  toolName: string,
  args: unknown,
  client: TodoistApi,
  apiToken: string,
  useUnified: boolean
): Promise<string> {
  let result: string | null = null;

  if (useUnified) {
    // Try unified router first when in unified mode
    result = await handleUnifiedToolCall(toolName, args, client, apiToken);
  } else {
    // Try legacy router first when in legacy mode
    result = await handleLegacyToolCall(toolName, args, client, apiToken);
  }

  // If the primary router didn't handle it, try the other one
  // This allows both tool sets to coexist if needed
  if (result === null) {
    if (useUnified) {
      result = await handleLegacyToolCall(toolName, args, client, apiToken);
    } else {
      result = await handleUnifiedToolCall(toolName, args, client, apiToken);
    }
  }

  // If neither router handled it, throw an error
  if (result === null) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return result;
}

// Re-export individual routers for direct access if needed
export { handleLegacyToolCall } from "./legacy-router.js";
export { handleUnifiedToolCall } from "./unified-router.js";
