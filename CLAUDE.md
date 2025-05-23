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
  - `task-handlers.ts` - Task CRUD operations
  - `project-handlers.ts` - Project and section operations
- **`src/errors.ts`**: Custom error types with structured error handling
- **`src/validation.ts`**: Input validation and sanitization
- **`src/cache.ts`**: Simple in-memory caching for API optimization

### Tool Architecture

The server exposes 9 tools organized by entity type with standardized naming convention "Todoist [Entity] [Action]":

**Task Management:**
- `Todoist Task Create` - Creates new tasks with full attribute support
- `Todoist Task Get` - Retrieves and filters tasks (with caching)
- `Todoist Task Update` - Updates existing tasks found by name search
- `Todoist Task Delete` - Deletes tasks found by name search
- `Todoist Task Complete` - Marks tasks as complete found by name search

**Project Management:**
- `Todoist Project Create` - Creates new projects with optional color and favorite status
- `Todoist Project Get` - Lists all projects with their IDs and names

**Section Management:**
- `Todoist Section Create` - Creates sections within projects
- `Todoist Section Get` - Lists sections within projects

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
- Published as `@greirson/todoist-mcp-server`