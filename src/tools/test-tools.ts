// Testing and validation tools
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const TEST_CONNECTION_TOOL: Tool = {
  name: "todoist_test_connection",
  description:
    "Test the connection to Todoist API and verify API token validity",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export const TEST_ALL_FEATURES_TOOL: Tool = {
  name: "todoist_test_all_features",
  description:
    "Run comprehensive tests on all Todoist MCP features to verify functionality",
  inputSchema: {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["basic", "enhanced"],
        description:
          "Test mode: 'basic' for read-only API tests, 'enhanced' for full CRUD testing (default: basic)",
        default: "basic",
      },
    },
  },
};

export const TEST_PERFORMANCE_TOOL: Tool = {
  name: "todoist_test_performance",
  description:
    "Measure performance and response times of Todoist API operations",
  inputSchema: {
    type: "object",
    properties: {
      iterations: {
        type: "number",
        description: "Number of iterations to run for each test (default: 5)",
        default: 5,
      },
    },
  },
};

export const TEST_TOOLS = [
  TEST_CONNECTION_TOOL,
  TEST_ALL_FEATURES_TOOL,
  TEST_PERFORMANCE_TOOL,
];
