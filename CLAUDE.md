# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

- `npm run build` - Compiles TypeScript to JavaScript in the dist/ directory
- `npm run prepare` - Runs build (used by npm automatically)
- `npm run watch` - Watches for TypeScript changes and rebuilds automatically
- `npm run lint` - Lints TypeScript files with ESLint
- `npm run lint:fix` - Auto-fixes linting issues
- `npm run format` - Formats code with Prettier
- `npm run format:check` - Checks code formatting
- `npm run test` - Runs Jest test suite
- `npm run test:watch` - Runs tests in watch mode
- `npm run test:coverage` - Runs tests with coverage report

## Architecture

This is an MCP (Model Context Protocol) server that integrates Claude with the Todoist API. The codebase has been modularized into a well-structured architecture.

### Key Components

- **MCP Server**: Uses `@modelcontextprotocol/sdk` for MCP protocol implementation
- **Todoist Integration**: Uses `@doist/todoist-api-typescript` client library
- **Transport**: Runs on stdio transport for communication with MCP clients

### Modular Architecture

The codebase is organized into focused modules:

- **`src/index.ts`**: Main server entry point with request routing
- **`src/types.ts`**: TypeScript type definitions and interfaces
- **`src/type-guards.ts`**: Runtime type validation functions
- **`src/tools.ts`**: MCP tool definitions and schemas
- **`src/handlers/`**: Business logic handlers separated by domain:
  - `task-handlers.ts` - Task CRUD operations and bulk operations
  - `project-handlers.ts` - Project and section operations
  - `comment-handlers.ts` - Comment creation and retrieval operations
- **`src/errors.ts`**: Custom error types with structured error handling
- **`src/validation.ts`**: Input validation and sanitization
- **`src/cache.ts`**: Simple in-memory caching for API optimization

### Tool Architecture

The server exposes 15 tools organized by entity type with standardized naming convention using underscores (MCP-compliant):

**Task Management:**
- `todoist_task_create` - Creates new tasks with full attribute support
- `todoist_task_get` - Retrieves and filters tasks (with caching)
- `todoist_task_update` - Updates existing tasks found by name search
- `todoist_task_delete` - Deletes tasks found by name search
- `todoist_task_complete` - Marks tasks as complete found by name search

**Bulk Task Operations:**
- `todoist_tasks_bulk_create` - Creates multiple tasks at once for improved efficiency
- `todoist_tasks_bulk_update` - Updates multiple tasks based on search criteria
- `todoist_tasks_bulk_delete` - Deletes multiple tasks based on search criteria
- `todoist_tasks_bulk_complete` - Completes multiple tasks based on search criteria

**Comment Management:**
- `todoist_comment_create` - Adds comments to tasks with optional file attachments
- `todoist_comment_get` - Retrieves comments for tasks or projects

**Project Management:**
- `todoist_project_create` - Creates new projects with optional color and favorite status
- `todoist_project_get` - Lists all projects with their IDs and names

**Section Management:**
- `todoist_section_create` - Creates sections within projects
- `todoist_section_get` - Lists sections within projects

### Error Handling Strategy

Structured error handling with custom error types:
- `ValidationError` - Input validation failures
- `TaskNotFoundError` - Task search failures
- `TodoistAPIError` - Todoist API failures
- `AuthenticationError` - Token validation failures

### Performance Optimizations

- **Caching**: 30-second TTL cache for GET operations to reduce API calls
- **Cache Invalidation**: Automatic cache clearing on mutations (create/update/delete)
- **Type Safety**: Compile-time and runtime type checking

### Search Strategy

For update, delete, and complete operations, the server uses partial string matching against task content (case-insensitive) to find tasks, enabling natural language task identification.

### Bulk Operations Strategy

Bulk operations provide significant efficiency improvements by allowing multiple tasks to be processed in a single API call:

- **Bulk Create**: Accepts an array of task objects and creates them sequentially, providing detailed feedback on successes and failures
- **Bulk Update/Delete/Complete**: Uses flexible search criteria to identify target tasks:
  - `project_id`: Filter by specific project
  - `priority`: Filter by priority level (1-4)
  - `due_before`/`due_after`: Filter by due date ranges (YYYY-MM-DD format)
  - `content_contains`: Filter by text within task content
- **Error Handling**: Each bulk operation reports individual successes and failures for better debugging
- **Cache Management**: Bulk operations automatically clear relevant caches to ensure consistency

### Data Flow Pattern

1. **Request Validation**: Type guards validate incoming parameters
2. **Input Sanitization**: Validation functions check business rules
3. **Cache Check**: GET operations check cache first
4. **API Call**: Execute Todoist API operation
5. **Cache Management**: Update/invalidate cache as needed
6. **Error Handling**: Structured error responses with error codes

### Environment Requirements

- `TODOIST_API_TOKEN` environment variable is required and validated at startup
- Server exits with error code 1 if token is missing

### Testing

- Jest configured for ESM modules with ts-jest
- Type guard unit tests in `src/__tests__/type-guards.test.ts`
- Test imports use TypeScript extensions (not .js)

### Code Quality

- ESLint with TypeScript rules and Prettier integration
- Strict TypeScript configuration with explicit return types
- No `any` types - proper TypeScript interfaces throughout

### Distribution

- Built as ES modules targeting ES2020
- Executable binary at `dist/index.js` with shebang
- Published as `@greirson/mcp-todoist`

### CI/CD and Quality Assurance

- **GitHub Actions**: Automated CI/CD pipeline with multi-Node.js version testing (18.x, 20.x, 22.x)
- **Dependabot Integration**: Automated dependency updates with CI validation
- **Pre-commit Hooks**: Linting and type checking enforced before commits
- **Release Automation**: Automated NPM publishing on version tags

### API Compatibility Handling

Due to evolving Todoist API types, the codebase uses defensive programming patterns:
- **Type Assertions**: Strategic use of `any` types for API compatibility, especially for comment responses
- **Response Handling**: Flexible response parsing that handles both array and object responses
- **Error Recovery**: Try-catch patterns for API signature changes
- **Comment API**: Uses defensive typing since the official Todoist TypeScript types may not include all comment properties like attachments

### Important Notes

- **Tool Names**: All MCP tool names use underscores (e.g., `todoist_task_create`) to comply with MCP naming requirements `^[a-zA-Z0-9_-]{1,64}$`
- **Cache Strategy**: GET operations are cached for 30 seconds; mutation operations (create/update/delete) clear the cache
- **Task Search**: Update/delete/complete operations use case-insensitive partial string matching against task content
- **Bulk Operations**: Use bulk tools (e.g., `todoist_tasks_bulk_create`) when working with multiple tasks to improve efficiency and reduce API calls
- **Bulk Search Criteria**: Bulk operations support flexible filtering by project, priority, due dates, and content matching
- **Linting**: Always run `npm run lint -- --fix` after making changes to auto-fix formatting issues
- **Type Safety**: When TypeScript compilation fails due to API changes, use defensive type assertions rather than disabling strict checking