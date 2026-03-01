# Todoist MCP Server

An MCP (Model Context Protocol) server that connects Claude with Todoist for complete task and project management through natural language.

## Installation

### Claude Desktop (One-Click Install)

1. Download **[todoist-mcp.mcpb](https://github.com/greirson/mcp-todoist/releases/latest)** from the latest release
2. Double-click the file (or drag onto Claude Desktop)
3. Enter your [Todoist API token](https://todoist.com/app/settings/integrations/developer) when prompted
4. Start chatting: _"Show me my Todoist projects"_

### Claude Code / Other MCP Clients

```bash
claude mcp add todoist -e TODOIST_API_TOKEN=your_token -- npx @greirson/mcp-todoist
```

<details>
<summary>Manual JSON configuration</summary>

Add to your MCP client config (`claude_desktop_config.json`, `~/.claude.json`, etc.):

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

**Config locations:**

- Claude Desktop (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`
- Claude Desktop (Windows): `%APPDATA%\Claude\claude_desktop_config.json`
- Claude Code: `~/.claude.json`

</details>

## Features

- **19 MCP Tools** for complete Todoist management
- **Task Management**: Create, update, delete, complete, reopen tasks with priorities, due dates, labels
- **Bulk Operations**: Process multiple tasks efficiently
- **Subtasks**: Hierarchical task management with completion tracking
- **Projects & Sections**: Full organization support
- **Labels, Filters, Reminders**: Pro/Business features supported
- **Natural Language**: Quick add with Todoist's natural language parsing
- **Dry-Run Mode**: Test operations without making changes

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
Priority: 4 (P4/Normal)
```

### Supported Operations

All 19 MCP tools support dry-run mode:

- Task creation, updates, completion, and deletion
- Subtask operations and hierarchy changes
- Bulk operations across multiple tasks
- Project and section creation
- Label management operations
- Reminder CRUD operations
- Comment creation

### Disabling Dry-Run Mode

Remove the `DRYRUN` environment variable or set it to `false`, then restart Claude Desktop to return to normal operation mode.

## Tools Overview

The server provides **19 MCP tools** for complete Todoist management:

| Tool                    | Actions                                                                 | Description                     |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| `todoist_task`          | create, get, update, delete, complete, reopen, quick_add                | Complete task management        |
| `todoist_task_bulk`     | bulk_create, bulk_update, bulk_delete, bulk_complete                    | Efficient multi-task operations |
| `todoist_subtask`       | create, bulk_create, convert, promote, hierarchy                        | Hierarchical task management    |
| `todoist_project`       | create, get, update, delete, archive, collaborators                     | Project CRUD and sharing        |
| `todoist_project_ops`   | reorder, move_to_parent, get_archived                                   | Advanced project operations     |
| `todoist_section`       | create, get, update, delete, move, reorder, archive                     | Section management              |
| `todoist_label`         | create, get, update, delete, stats                                      | Label management with analytics |
| `todoist_comment`       | create, get, update, delete                                             | Task/project comments           |
| `todoist_reminder`      | create, get, update, delete                                             | Reminder management (Pro)       |
| `todoist_filter`        | create, get, update, delete                                             | Custom filters (Pro)            |
| `todoist_collaboration` | invitations, notifications, workspace operations                        | Team collaboration features     |
| `todoist_user`          | info, productivity_stats, karma_history                                 | User profile and stats          |
| `todoist_utility`       | test_connection, test_features, test_performance, find/merge duplicates | Testing and utilities           |
| `todoist_activity`      | get_log, get_events, get_summary                                        | Activity audit trail            |
| `todoist_task_ops`      | move, reorder, close                                                    | Advanced task operations        |
| `todoist_completed`     | get, get_all, get_stats                                                 | Completed task retrieval        |
| `todoist_backup`        | list, download                                                          | Automatic backup access         |
| `todoist_notes`         | create, get, update, delete                                             | Project notes (collaborators)   |
| `todoist_shared_labels` | create, get, rename, remove                                             | Workspace labels (Business)     |

For detailed tool documentation with parameters and examples, see **[TOOLS_REFERENCE.md](TOOLS_REFERENCE.md)**.

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

# Task duration for time blocking
"Create task 'Deep work session' with 90 minute duration"
"Update task 'Meeting' to have a 2 day duration"

# Task identification by ID (more reliable than name search)
"Get task with ID 1234567890"
"Update task ID 1234567890 to priority 4"
"Complete task with ID 1234567890"
"Reopen task with ID 1234567890"
"Delete task ID 1234567890"
```

### Quick Add

The Quick Add tool parses natural language text like the Todoist app, supporting multiple features in a single command:

```
"Quick add: Buy groceries tomorrow #Shopping @errands p1"
"Quick add: Review PR next Monday #Work @code-review p2 //Check error handling"
"Quick add: Call mom {deadline in 3 days}"
"Quick add: Team meeting today at 2pm #Work @meetings with reminder 1 hour before"
```

**Quick Add Syntax:**

- **Due dates**: Natural language dates like "tomorrow", "next Friday", "Jan 23", "in 3 days"
- **Projects**: `#ProjectName` (no spaces in project names)
- **Labels**: `@label` (e.g., "@urgent", "@work")
- **Assignees**: `+name` (for shared projects)
- **Priority**: `p1` (urgent/highest), `p2` (high), `p3` (medium), `p4` (normal/lowest)
- **Deadlines**: `{in 3 days}` or `{March 15}`
- **Descriptions**: `//your description here` (must be at the end)

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

### Reminder Management (Pro/Business)

```
"Show me all my reminders"
"Get reminders for task 'Team Meeting'"
"Create a reminder for task 'Review PR' 30 minutes before due"
"Create an absolute reminder for task 12345 at 2024-12-25T09:00:00Z"
"Update reminder 67890 to trigger at 10:00 instead"
"Delete reminder 67890"
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
  - `reminder-tools.ts` - Reminder operations (4 tools)
  - `test-tools.ts` - Testing and validation (3 tools)
  - `index.ts` - Centralized exports

#### Business Logic Handlers

- **`src/handlers/`**: Domain-separated business logic modules:
  - `task-handlers.ts` - Task CRUD and bulk operations
  - `subtask-handlers.ts` - Hierarchical task management
  - `project-handlers.ts` - Project and section operations
  - `comment-handlers.ts` - Comment creation and retrieval
  - `label-handlers.ts` - Label CRUD and statistics
  - `reminder-handlers.ts` - Reminder CRUD via Sync API
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
