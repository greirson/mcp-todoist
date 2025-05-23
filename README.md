# Todoist MCP Server

An MCP (Model Context Protocol) server that connects Claude with Todoist for complete task and project management through natural language.

## Quick Start

1. Install: `npm install -g @greirson/mcp-todoist`
2. Get your [Todoist API token](https://todoist.com/app/settings/integrations)
3. Add to Claude Desktop config with your token
4. Ask Claude: *"Show me my Todoist projects"*

**That's it!** You can now manage your Todoist tasks directly through Claude.

## Table of Contents

- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Tools Overview](#tools-overview)
- [Usage Examples](#usage-examples)
- [Getting Started Workflow](#getting-started-workflow)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## Features

* **Complete Task Management**: Create, read, update, delete, and complete tasks with full attribute support
* **Bulk Operations**: Efficiently create, update, delete, or complete multiple tasks at once
* **Comment System**: Add comments to tasks and retrieve comments with attachment support
* **Project & Section Organization**: Create and manage projects and sections
* **Smart Discovery**: List projects and sections to find IDs for organization
* **Rich Task Attributes**: Support for descriptions, due dates, priorities, labels, deadlines, and project assignment
* **Natural Language Interface**: Use everyday language to manage your Todoist workspace
* **Performance Optimized**: 30-second caching for GET operations to reduce API calls
* **Robust Error Handling**: Structured error responses with custom error types
* **Input Validation**: Comprehensive validation and sanitization of all inputs
* **Type Safety**: Full TypeScript implementation with runtime type checking

## Installation & Setup

### Step 1: Install the Package
```bash
npm install -g @greirson/mcp-todoist
```

### Step 2: Get Your Todoist API Token
1. Log in to your [Todoist account](https://todoist.com)
2. Go to **Settings** → **Integrations**
3. Scroll down to the **Developer** section
4. Copy your **API token** (keep this secure!)

### Step 3: Configure Claude Desktop

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
      "command": "mcp-todoist",
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

**⚠️ Important:** Replace `your_api_token_here` with your actual Todoist API token from Step 2.

### Step 4: Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server.

### Step 5: Verify Installation

In Claude Desktop, try asking:
```
"Show me my Todoist projects"
```

You should see a list of your Todoist projects, confirming the integration is working!

## Tools Overview

The server provides 15 tools organized by entity type:

### Task Management
- **Todoist Task Create**: Create new tasks with full attribute support
- **Todoist Task Get**: Retrieve and filter tasks by various criteria
- **Todoist Task Update**: Update existing tasks (found by name search)
- **Todoist Task Complete**: Mark tasks as complete
- **Todoist Task Delete**: Remove tasks

### Bulk Task Operations
- **Todoist Tasks Bulk Create**: Create multiple tasks at once for improved efficiency
- **Todoist Tasks Bulk Update**: Update multiple tasks based on search criteria
- **Todoist Tasks Bulk Delete**: Delete multiple tasks based on search criteria
- **Todoist Tasks Bulk Complete**: Complete multiple tasks based on search criteria

### Comment Management
- **Todoist Comment Create**: Add comments to tasks with optional file attachments
- **Todoist Comment Get**: Retrieve comments for tasks or projects

### Project Management
- **Todoist Project Create**: Create new projects with optional color and favorite status
- **Todoist Project Get**: List all projects with their IDs and names

### Section Management
- **Todoist Section Create**: Create sections within projects
- **Todoist Section Get**: List sections within projects

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

### Task Discovery
```
"Show all my tasks"
"List high priority tasks due this week"
"Get tasks in project 12345"
```

## Getting Started Workflow

### 1. First Steps
```
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

The codebase is organized into focused modules:

- **`src/index.ts`**: Main server entry point with request routing
- **`src/handlers/`**: Business logic separated by domain (tasks, projects, comments)
- **`src/types.ts`**: TypeScript type definitions
- **`src/type-guards.ts`**: Runtime type validation
- **`src/validation.ts`**: Input validation and sanitization
- **`src/errors.ts`**: Custom error types with structured handling
- **`src/cache.ts`**: In-memory caching for performance optimization
- **`src/tools.ts`**: MCP tool definitions and schemas

## Changelog

### v0.5.0 (Latest)
- **Bulk Operations**: Added 4 new bulk tools for efficient multi-task operations (create, update, delete, complete)
- **Comment System**: Full comment support with create and retrieve functionality, including file attachments
- **Enhanced Search**: Flexible search criteria for bulk operations (project, priority, date ranges, content matching)
- **Improved Documentation**: Updated README with comprehensive examples for all new features

### v0.4.0
- **Modular Architecture**: Refactored monolithic code into focused modules
- **Performance Optimization**: Added 30-second caching for GET operations
- **Robust Error Handling**: Custom error types with structured error responses
- **Input Validation**: Comprehensive validation and sanitization
- **Code Quality**: Added ESLint, Prettier, and Jest testing framework
- **Type Safety**: Eliminated all `any` types, full TypeScript implementation

### v0.3.0
- **Complete Project Management**: Added project and section creation tools
- **Enhanced Organization**: Full support for project_id and section_id in task operations
- **Improved Tool Names**: Cleaner naming convention (e.g., "Todoist Task Create")
- **Discovery Tools**: Added tools to list projects and sections for ID discovery

### v0.2.0
- **Enhanced Task Creation**: Added support for labels and deadline parameters
- **Improved API Compliance**: Better alignment with Todoist API v2 specification

### v0.1.0 (Initial Release)
- Basic task management (create, read, update, delete, complete)
- Natural language task search and filtering
- Support for descriptions, due dates, and priority levels

## Contributing
Contributions are welcome! Feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues and Support
If you encounter any issues or need support, please file an issue on the [GitHub repository](https://github.com/greirson/mcp-todoist/issues).