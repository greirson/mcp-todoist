# Todoist MCP Server
[![smithery badge](https://smithery.ai/badge/@greirson/mcp-todoist)](https://smithery.ai/server/@greirson/mcp-todoist)

An MCP (Model Context Protocol) server that connects Claude with Todoist for complete task and project management through natural language.

<a href="https://glama.ai/mcp/servers/@greirson/mcp-todoist">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@greirson/mcp-todoist/badge" alt="Todoist Server MCP server" />
</a>

## Quick Start

1. Get your [Todoist API token](https://todoist.com/app/settings/integrations)
2. Add to Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "todoist": {
         "command": "npx",
         "args": ["@greirson/mcp-todoist"],
         "env": {
           "TODOIST_API_TOKEN": "your_api_token_here"
         }
       }
     }
   }
   ```
3. Restart Claude Desktop
4. Ask Claude: *"Show me my Todoist projects"*

**That's it!** You can now manage your Todoist tasks directly through Claude.

## Table of Contents

- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Railway Deployment](#railway-deployment)
- [Dry-Run Mode](#dry-run-mode)
- [Tools Overview](#tools-overview)
- [Usage Examples](#usage-examples)
- [Getting Started Workflow](#getting-started-workflow)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Changelog](#changelog)

## Features

* **Complete Task Management**: Create, read, update, delete, and complete tasks with full attribute support
* **Hierarchical Subtasks**: Create subtasks, convert tasks to subtasks, promote subtasks, and view task hierarchies with completion tracking
* **Bulk Operations**: Efficiently create, update, delete, or complete multiple tasks at once
* **Comment System**: Add comments to tasks and retrieve comments with attachment support
* **Label Management**: Full CRUD operations for labels with usage statistics and analytics
* **Project & Section Organization**: Create and manage projects and sections
* **Dry-Run Mode**: Test automations and operations without making real changes
* **Enhanced Testing**: Basic API validation and comprehensive CRUD testing with automatic cleanup
* **Smart Discovery**: List projects and sections to find IDs for organization
* **Rich Task Attributes**: Support for descriptions, due dates, priorities, labels, deadlines, and project assignment
* **Natural Language Interface**: Use everyday language to manage your Todoist workspace
* **Performance Optimized**: 30-second caching for GET operations to reduce API calls
* **Robust Error Handling**: Structured error responses with custom error types
* **Input Validation**: Comprehensive validation and sanitization of all inputs
* **Type Safety**: Full TypeScript implementation with runtime type checking

## Installation & Setup

### Installing via Smithery

To install mcp-todoist for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@greirson/mcp-todoist):

```bash
npx -y @smithery/cli install @greirson/mcp-todoist --client claude
```

### Option 1: Using npx (Recommended - No Installation Required)

This is the easiest method as it doesn't require installing anything globally.

#### Step 1: Get Your Todoist API Token
1. Log in to your [Todoist account](https://todoist.com)
2. Go to **Settings** → **Integrations**
3. Scroll down to the **Developer** section
4. Copy your **API token** (keep this secure!)

#### Step 2: Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**On macOS/Linux:**
- File location: `~/.config/claude_desktop_config.json`

**On Windows:**
- File location: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "todoist": {
      "command": "npx",
      "args": ["@greirson/mcp-todoist"],
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

**⚠️ Important:** Replace `your_api_token_here` with your actual Todoist API token from Step 1.

### Option 2: Global npm Installation

If you prefer to install the package globally:

#### Step 1: Install the Package
```bash
npm install -g @greirson/mcp-todoist
```

#### Step 2: Get Your Todoist API Token
(Same as Option 1, Step 1)

#### Step 3: Configure Claude Desktop

Use this configuration for global installation:

```json
{
  "mcpServers": {
    "todoist": {
      "command": "mcp-todoist",
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

### Step 4: Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server.

### Step 5: Verify Installation

In Claude Desktop, try asking:
```
"Show me my Todoist projects"
```

You should see a list of your Todoist projects, confirming the integration is working!

## Railway Deployment

You can deploy this MCP server to Railway for cloud-based access via HTTP/SSE transport.

**Quick Deploy:**
1. Create a new project on [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables:
   - `TODOIST_API_TOKEN=your_todoist_token`
   - `MCP_AUTH_TOKEN=your_secure_token` (generate with `openssl rand -base64 32`)
4. Deploy automatically

**Features:**
- HTTP/SSE transport for remote MCP clients
- Secure authentication with bearer tokens
- Health check endpoint at `/health`
- Auto-scaling and monitoring
- Easy environment variable management

**Security:** All MCP endpoints require authentication via `Authorization: Bearer YOUR_TOKEN` header.

For detailed instructions, see [RAILWAY.md](RAILWAY.md).

## Dry-Run Mode

Dry-run mode allows you to test operations and automations without making any real changes to your Todoist workspace. This is perfect for testing, debugging, learning the API, or validating automation scripts before running them for real.

### How to Enable Dry-Run Mode

Add `DRYRUN=true` to your environment configuration:

```json
{
  "mcpServers": {
    "todoist": {
      "command": "npx",
      "args": ["@greirson/mcp-todoist"],
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here",
        "DRYRUN": "true"
      }
    }
  }
}
```

### What Dry-Run Mode Does

- **Validates Operations**: Uses real API data to validate that operations would succeed
- **Simulates Mutations**: Create, update, delete, and complete operations are simulated (not executed)
- **Real Data Queries**: Read operations (get tasks, projects, labels) use the real API
- **Detailed Logging**: Shows exactly what would happen with clear `[DRY-RUN]` prefixes
- **Error Detection**: Catches the same errors that would occur in real execution

### Use Cases

- **Testing Automations**: Validate complex bulk operations before executing
- **Learning the API**: Explore functionality without fear of making unwanted changes
- **Debugging Issues**: Understand what operations would be performed
- **Safe Experimentation**: Try new workflows without affecting your actual tasks
- **Training and Demos**: Show how operations work without modifying real data

### Example Usage

With dry-run mode enabled, operations show what would happen:

```
You: "Create a task called 'Test Task' in my Work project"

Response:
[DRY-RUN] Dry-run mode enabled - mutations will be simulated
[DRY-RUN] Would create task: "Test Task" in project 2203306141, section none

Task created successfully (simulated):
ID: 100001
Title: Test Task
Project: Work (2203306141)
Priority: 4 (Normal)
```

### Supported Operations

All 28 MCP tools support dry-run mode:
- Task creation, updates, completion, and deletion
- Subtask operations and hierarchy changes
- Bulk operations across multiple tasks
- Project and section creation
- Label management operations
- Comment creation

### Disabling Dry-Run Mode

Remove the `DRYRUN` environment variable or set it to `false`, then restart Claude Desktop to return to normal operation mode.

## Tools Overview

The server provides 28 tools organized by entity type:

### Task Management
- **Todoist Task Create**: Create new tasks with full attribute support
- **Todoist Task Get**: Retrieve tasks by ID or combine priority, label, natural-language filters, and strict `due_before`/`due_after` windows with timezone-aware due details
- **Todoist Task Update**: Update existing tasks (found by ID or partial name search)
- **Todoist Task Complete**: Mark tasks as complete (found by ID or partial name search)
- **Todoist Task Delete**: Remove tasks (found by ID or partial name search)

### Subtask Management
- **Todoist Subtask Create**: Create subtasks under parent tasks with full attribute support
- **Todoist Subtasks Bulk Create**: Create multiple subtasks under a parent task efficiently
- **Todoist Task Convert to Subtask**: Convert existing tasks to subtasks of another task
- **Todoist Subtask Promote**: Promote subtasks to main tasks (remove parent relationship)
- **Todoist Task Hierarchy Get**: View task hierarchies with subtasks and completion tracking

### Bulk Task Operations
- **Todoist Tasks Bulk Create**: Create multiple tasks at once for improved efficiency
- **Todoist Tasks Bulk Update**: Update multiple tasks based on search criteria with the same strict `due_before`/`due_after` filtering used by single-task queries
- **Todoist Tasks Bulk Delete**: Delete multiple tasks based on search criteria with timezone-aware due comparisons
- **Todoist Tasks Bulk Complete**: Complete multiple tasks based on search criteria with timezone-aware due comparisons

### Comment Management
- **Todoist Comment Create**: Add comments to tasks with optional file attachments
- **Todoist Comment Get**: Retrieve comments for tasks or projects

### Label Management
- **Todoist Label Get**: List all labels with their IDs and colors
- **Todoist Label Create**: Create new labels with optional color and ordering
- **Todoist Label Update**: Update existing labels (name, color, order, favorite status)
- **Todoist Label Delete**: Remove labels from your workspace
- **Todoist Label Stats**: Get detailed usage statistics for all labels

### Project Management
- **Todoist Project Create**: Create new projects with optional color and favorite status
- **Todoist Project Get**: List all projects with their IDs and names

### Section Management
- **Todoist Section Create**: Create sections within projects
- **Todoist Section Get**: List sections within projects

### Testing & Validation
- **Todoist Test Connection**: Validate API token and test connectivity
- **Todoist Test All Features**: Two modes - basic (read-only API tests) and enhanced (full CRUD testing with cleanup)
- **Todoist Test Performance**: Benchmark API response times with configurable iterations

## Troubleshooting

### Common Issues

**"No Todoist projects found" or connection errors:**
- Verify your API token is correct
- Check that the token is properly set in your claude_desktop_config.json
- Ensure there are no extra spaces or quotes around your token

**MCP server not loading:**
- Confirm the package is installed globally: `npm list -g @greirson/mcp-todoist`
- Restart Claude Desktop completely
- Check the configuration file path is correct for your operating system
- Try the full path to the `mcp-todoist` binary: `/Users/USERNAME/.npm-global/bin/mcp-todoist`

**Permission errors:**
- On macOS/Linux, you may need to create the config directory: `mkdir -p ~/.config`
- Ensure Claude Desktop has permission to read the config file

## Usage Examples

### Project & Section Setup
```
"Show me all my projects"
"Create a new project called 'Work Tasks'"
"Create a section called 'In Progress' in project 12345"
"Show me sections in the Work Tasks project"
```

### Task Creation & Management
```
"Create task 'Team Meeting' in project 12345"
"Add task 'Review PR' due tomorrow with labels ['Code Review', 'Urgent']"
"Create high priority task with deadline 2024-12-25"
"Update meeting task to be in section 67890"
"Mark the PR review task as complete"

# Task identification by ID (more reliable than name search)
"Get task with ID 1234567890"
"Update task ID 1234567890 to priority 4"
"Complete task with ID 1234567890"
"Delete task ID 1234567890"
```

### Subtask Management
```
"Create subtask 'Prepare agenda' under task 'Team Meeting'"
"Create multiple subtasks for 'Launch Project': 'Design UI', 'Write tests', 'Deploy'"
"Convert task 'Code Review' to a subtask of 'Release v2.0'"
"Promote subtask 'Bug Fix' to a main task"
"Show me the task hierarchy for 'Launch Project' with completion tracking"
```

### Bulk Operations
```
"Create multiple tasks for project launch: 'Design mockups', 'Write documentation', 'Set up CI/CD'"
"Update all high priority tasks to be due next week"
"Complete all tasks containing 'review' in project 12345"
"Delete all tasks with priority 1 that are overdue"
```

### Comment Management
```
"Add comment 'This needs urgent attention' to task 'Review PR'"
"Add comment with attachment to task 67890"
"Show all comments for task 'Team Meeting'"
"Get comments for project 12345"
```

### Label Management
```
"Show me all my labels"
"Create a new label called 'Urgent' with red color"
"Update the 'Work' label to be blue and mark as favorite"
"Delete the unused 'Old Project' label"
"Get usage statistics for all my labels"
```

### Task Discovery
```
"Show all my tasks"
"List high priority tasks due this week"
"Get tasks in project 12345"
```

### Testing & Validation
```
"Test my Todoist connection"
"Run basic tests on all Todoist features" // Default: read-only API tests
"Run enhanced tests on all Todoist features" // Full CRUD testing with cleanup
"Benchmark Todoist API performance with 10 iterations"
"Validate that all MCP tools are working correctly"
```

### Dry-Run Testing
When dry-run mode is enabled (DRYRUN=true), use normal commands - they'll automatically be simulated:
```
"Create a test task with priority 1"
"Update all overdue tasks to be due tomorrow"
"Delete all completed tasks in project 12345"
"Create 5 subtasks under task 'Project Planning'"
```
All these operations will validate against your real data but won't make any changes.

## Getting Started Workflow

### 1. First Steps
```
"Test my Todoist connection"
"Show me all my Todoist projects"
"Create a new project called 'Claude Integration Test'"
```

### 2. Basic Task Management
```
"Create a task 'Try out MCP integration' in my Inbox"
"Add a high priority task 'Review project setup' due tomorrow"
"Show me all my tasks"
```

### 3. Advanced Organization
```
"Create a section called 'In Progress' in my work project"
"Move the setup task to the In Progress section"
"Add a comment 'This is working great!' to my test task"
```

### 4. Bulk Operations
```
"Create multiple tasks: 'Plan meeting agenda', 'Prepare slides', 'Send invites'"
"Complete all tasks containing 'test' in the Claude project"
"Update all high priority tasks to be due next week"
```

## Best Practices

- **Start Simple**: Begin with basic task creation and project viewing
- **Use Natural Language**: Ask questions as you normally would
- **Test with Dry-Run**: Use dry-run mode to validate complex operations before executing
- **Leverage Bulk Operations**: Use bulk tools when working with multiple tasks
- **Organize First**: Set up projects and sections before creating many tasks
- **Regular Cleanup**: Use bulk operations to clean up completed or outdated tasks

## Development

### Building from source
```bash
# Clone the repository
git clone https://github.com/greirson/mcp-todoist.git

# Navigate to directory
cd mcp-todoist

# Install dependencies
npm install

# Build the project
npm run build
```

### Development Commands
```bash
# Watch for changes and rebuild
npm run watch

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Architecture

The codebase follows a clean, modular architecture designed for maintainability and scalability:

#### Core Structure
- **`src/index.ts`**: Main server entry point with request routing
- **`src/types.ts`**: TypeScript type definitions and interfaces
- **`src/type-guards.ts`**: Runtime type validation functions
- **`src/validation.ts`**: Input validation and sanitization
- **`src/errors.ts`**: Custom error types with structured handling
- **`src/cache.ts`**: In-memory caching for performance optimization

#### Modular Tool Organization
- **`src/tools/`**: Domain-specific MCP tool definitions organized by functionality:
  - `task-tools.ts` - Task management (9 tools)
  - `subtask-tools.ts` - Subtask operations (5 tools)
  - `project-tools.ts` - Project/section management (4 tools)
  - `comment-tools.ts` - Comment operations (2 tools)
  - `label-tools.ts` - Label management (5 tools)
  - `test-tools.ts` - Testing and validation (3 tools)
  - `index.ts` - Centralized exports

#### Business Logic Handlers
- **`src/handlers/`**: Domain-separated business logic modules:
  - `task-handlers.ts` - Task CRUD and bulk operations
  - `subtask-handlers.ts` - Hierarchical task management
  - `project-handlers.ts` - Project and section operations
  - `comment-handlers.ts` - Comment creation and retrieval
  - `label-handlers.ts` - Label CRUD and statistics
  - `test-handlers.ts` - API testing infrastructure
  - `test-handlers-enhanced/` - Comprehensive CRUD testing framework

#### Utility Modules
- **`src/utils/`**: Shared utility functions:
  - `api-helpers.ts` - API response handling utilities
  - `error-handling.ts` - Centralized error management
  - `parameter-transformer.ts` - MCP to Todoist SDK parameter format conversion
  - `dry-run-wrapper.ts` - Dry-run mode implementation

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of all changes.

For migration guides and breaking changes, see the full changelog.

## Contributing
Contributions are welcome! Feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues and Support
If you encounter any issues or need support, please file an issue on the [GitHub repository](https://github.com/greirson/mcp-todoist/issues).