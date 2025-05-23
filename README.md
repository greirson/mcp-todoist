# Todoist MCP Server

An MCP (Model Context Protocol) server that connects Claude with Todoist for complete task and project management through natural language.

## Features

* **Complete Task Management**: Create, read, update, delete, and complete tasks
* **Project & Section Organization**: Create and manage projects and sections
* **Smart Discovery**: List projects and sections to find IDs for organization
* **Rich Task Attributes**: Support for descriptions, due dates, priorities, labels, deadlines, and project assignment
* **Natural Language Interface**: Use everyday language to manage your Todoist workspace
* **Performance Optimized**: 30-second caching for GET operations to reduce API calls
* **Robust Error Handling**: Structured error responses with custom error types
* **Input Validation**: Comprehensive validation and sanitization of all inputs
* **Type Safety**: Full TypeScript implementation with runtime type checking

## Installation

### Manual Installation
```bash
npm install -g @greirson/mcp-todoist
```

## Tools

The server provides 9 tools organized by entity type:

### Task Management
- **Todoist Task Create**: Create new tasks with full attribute support
- **Todoist Task Get**: Retrieve and filter tasks by various criteria
- **Todoist Task Update**: Update existing tasks (found by name search)
- **Todoist Task Complete**: Mark tasks as complete
- **Todoist Task Delete**: Remove tasks

### Project Management
- **Todoist Project Create**: Create new projects with optional color and favorite status
- **Todoist Project Get**: List all projects with their IDs and names

### Section Management
- **Todoist Section Create**: Create sections within projects
- **Todoist Section Get**: List sections within projects

## Setup

### Getting a Todoist API Token
1. Log in to your Todoist account
2. Navigate to Settings → Integrations
3. Find your API token under "Developer"

### Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "todoist": {
      "command": "node",
      "args": ["/path/to/mcp-todoist/dist/index.js"],
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

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

### Task Discovery
```
"Show all my tasks"
"List high priority tasks due this week"
"Get tasks in project 12345"
```

## Workflow

1. **Discover Projects**: Use "Todoist Project Get" to see available projects
2. **Create Organization**: Use "Todoist Project Create" and "Todoist Section Create" as needed
3. **Manage Tasks**: Create, update, and organize tasks using project/section IDs
4. **Track Progress**: Use task filtering and completion tools

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
- **`src/handlers/`**: Business logic separated by domain (tasks, projects)
- **`src/types.ts`**: TypeScript type definitions
- **`src/type-guards.ts`**: Runtime type validation
- **`src/validation.ts`**: Input validation and sanitization
- **`src/errors.ts`**: Custom error types with structured handling
- **`src/cache.ts`**: In-memory caching for performance optimization
- **`src/tools.ts`**: MCP tool definitions and schemas

## Changelog

### v0.4.0 (Latest)
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