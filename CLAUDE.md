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

The codebase follows a clean, domain-driven architecture with focused modules for improved maintainability:

#### Core Infrastructure
- **`src/index.ts`**: Main server entry point with request routing
- **`src/types.ts`**: TypeScript type definitions and interfaces
- **`src/type-guards.ts`**: Runtime type validation functions
- **`src/errors.ts`**: Custom error types with structured error handling
- **`src/validation.ts`**: Input validation and sanitization
- **`src/cache.ts`**: Simple in-memory caching for API optimization

#### Modular Tool Organization
- **`src/tools/`**: Domain-specific MCP tool definitions (refactored from single 863-line file):
  - `task-tools.ts` - Task management tools (CREATE, READ, UPDATE, DELETE, COMPLETE + bulk operations)
  - `subtask-tools.ts` - Subtask management tools (hierarchical task operations)
  - `project-tools.ts` - Project and section management tools
  - `comment-tools.ts` - Comment creation and retrieval tools
  - `label-tools.ts` - Label CRUD and statistics tools
  - `test-tools.ts` - Testing and validation tools
  - `index.ts` - Centralized exports with backward compatibility

#### Business Logic Handlers
- **`src/handlers/`**: Domain-separated business logic:
  - `task-handlers.ts` - Task CRUD operations and bulk operations
  - `subtask-handlers.ts` - Hierarchical task management and parent-child relationships
  - `project-handlers.ts` - Project and section operations
  - `comment-handlers.ts` - Comment creation and retrieval operations
  - `label-handlers.ts` - Label CRUD operations and usage statistics
  - `test-handlers.ts` - Testing infrastructure for API validation and performance monitoring

#### Enhanced Testing Framework
- **`src/handlers/test-handlers-enhanced/`**: Modular comprehensive testing (refactored from single 755-line file):
  - `types.ts` - Common test types and utilities
  - `task-tests.ts` - Task CRUD operation tests (5 tests)
  - `subtask-tests.ts` - Subtask management tests (4 tests)
  - `label-tests.ts` - Label operation tests (5 tests)
  - `bulk-tests.ts` - Bulk operation tests (4 tests)
  - `index.ts` - Test orchestrator and exports

#### Utility Modules
- **`src/utils/`**: Shared utility functions:
  - `api-helpers.ts` - API response handling and formatting utilities
  - `error-handling.ts` - Centralized error management with context tracking

### Tool Architecture

The server exposes 28 tools organized by entity type with standardized naming convention using underscores (MCP-compliant):

**Task Management:**
- `todoist_task_create` - Creates new tasks with full attribute support
- `todoist_task_get` - Retrieves and filters tasks (with caching)
- `todoist_task_update` - Updates existing tasks found by name search
- `todoist_task_delete` - Deletes tasks found by name search
- `todoist_task_complete` - Marks tasks as complete found by name search

**Subtask Management:**
- `todoist_subtask_create` - Creates subtasks under parent tasks with full attribute support
- `todoist_subtasks_bulk_create` - Creates multiple subtasks under a parent task efficiently
- `todoist_task_convert_to_subtask` - Converts existing tasks to subtasks of another task
- `todoist_subtask_promote` - Promotes subtasks to main tasks (removes parent relationship)
- `todoist_task_hierarchy_get` - Retrieves task hierarchies with completion percentage tracking

**Bulk Task Operations:**
- `todoist_tasks_bulk_create` - Creates multiple tasks at once for improved efficiency
- `todoist_tasks_bulk_update` - Updates multiple tasks based on search criteria
- `todoist_tasks_bulk_delete` - Deletes multiple tasks based on search criteria
- `todoist_tasks_bulk_complete` - Completes multiple tasks based on search criteria

**Comment Management:**
- `todoist_comment_create` - Adds comments to tasks with optional file attachments
- `todoist_comment_get` - Retrieves comments for tasks or projects

**Label Management:**
- `todoist_label_get` - Lists all labels with IDs, names, and colors
- `todoist_label_create` - Creates new labels with optional color, order, and favorite status
- `todoist_label_update` - Updates existing labels by ID or name (supports all attributes)
- `todoist_label_delete` - Deletes labels by ID or name
- `todoist_label_stats` - Provides detailed usage statistics and analytics

**Project Management:**
- `todoist_project_create` - Creates new projects with optional color and favorite status
- `todoist_project_get` - Lists all projects with their IDs and names

**Section Management:**
- `todoist_section_create` - Creates sections within projects
- `todoist_section_get` - Lists sections within projects

**Testing Infrastructure:**
- `todoist_test_connection` - Quick API token validation and connection test
- `todoist_test_all_features` - Dual-mode testing: basic (read-only) and enhanced (full CRUD with cleanup)
- `todoist_test_performance` - Performance benchmarking with configurable iterations

### Error Handling Strategy

Structured error handling with custom error types:
- `ValidationError` - Input validation failures
- `TaskNotFoundError` - Task search failures
- `LabelNotFoundError` - Label search failures
- `SubtaskError` - Subtask operation failures
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
  - `priority`: Filter by priority level (1 highest, 4 lowest)
  - `due_before`/`due_after`: Filter by due date ranges (YYYY-MM-DD format)
  - `content_contains`: Filter by text within task content
- **Error Handling**: Each bulk operation reports individual successes and failures for better debugging
- **Cache Management**: Bulk operations automatically clear relevant caches to ensure consistency

### Subtask Architecture

Hierarchical task management with parent-child relationships:

- **Creation Strategy**: Subtasks are created using the `parent_id` field in the Todoist API
- **API Compatibility**: Uses delete & recreate pattern for converting tasks to subtasks due to API limitations
- **Hierarchy Building**: Recursive algorithm builds task trees with completion percentage calculation
- **Task Conversion**: 
  - `Convert to Subtask`: Deletes original task and recreates with `parent_id`
  - `Promote Subtask`: Deletes subtask and recreates as main task without `parent_id`
- **Completion Tracking**: Calculates completion percentages for parent tasks based on subtask status
- **Bulk Operations**: Efficient creation of multiple subtasks under a single parent
- **Tree Visualization**: `formatTaskHierarchy()` provides hierarchical display with completion indicators
- **Cache Integration**: Subtask operations integrated with 30-second TTL caching system
- **Search Strategy**: Supports both task ID and name-based parent/child identification

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

### Testing Infrastructure

The codebase includes comprehensive testing capabilities:

**Unit Tests:**
- Jest configured for ESM modules with ts-jest
- Type guard unit tests in `src/__tests__/type-guards.test.ts`
- Test imports use TypeScript extensions (not .js)

**Integration Tests:**
- `src/__tests__/integration.test.ts` - Full API integration testing
- Requires `TODOIST_API_TOKEN` environment variable for execution
- Tests skip gracefully when token is not available
- Comprehensive testing of all MCP tools and API operations

**Built-in Testing Tools:**
- `todoist_test_connection` - Validates API token and connection
- `todoist_test_all_features` - Dual-mode testing:
  - Basic mode: Read-only tests for tasks, projects, labels, sections, comments (default)
  - Enhanced mode: Full CRUD testing with automatic cleanup including subtasks
- `todoist_test_performance` - Benchmarks API response times with configurable iterations

**Enhanced Testing Infrastructure:**
- **Comprehensive CRUD Testing**: 18 tests across 4 suites (Task, Subtask, Label, Bulk Operations)
- **Automatic Test Data Management**: Generates unique test data with timestamps
- **Complete Cleanup**: Removes all test data after testing to prevent workspace pollution
- **Detailed Reporting**: Response times, success/failure metrics, and error details
- **Suite Organization**: Grouped tests by functionality for better debugging

**Running Tests:**
- `npm test` - Runs all tests (unit tests always, integration tests if token available)
- `TODOIST_API_TOKEN=your-token npm test` - Runs with integration tests
- `npm run test:watch` - Runs tests in watch mode
- `npm run test:coverage` - Runs tests with coverage report

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
- **Response Format Handling**: Uses `extractArrayFromResponse()` helper to handle multiple API response formats (direct arrays, `result.results`, `result.data`)
- **Type Assertions**: Strategic type assertions for API compatibility while maintaining type safety
- **Error Recovery**: Try-catch patterns for API signature changes
- **Flexible Response Parsing**: Handles both array and object responses gracefully
- **Testing Integration**: Built-in test tools validate API compatibility across different response formats

### Important Notes

- **Tool Names**: All MCP tool names use underscores (e.g., `todoist_task_create`) to comply with MCP naming requirements `^[a-zA-Z0-9_-]{1,64}$`
- **Cache Strategy**: GET operations are cached for 30 seconds; mutation operations (create/update/delete) clear the cache
- **Task Search**: Update/delete/complete operations support both:
  - **Task ID**: Direct lookup by ID (more reliable, takes precedence)
  - **Task Name**: Case-insensitive partial string matching against task content
- **Task Identification**: When both `task_id` and `task_name` are provided, ID takes precedence
- **Due Dates vs Deadlines**: 
  - `due_string`/`due_date`: When the task appears in "Today" (start date)
  - `deadline_date`: Actual deadline for task completion (YYYY-MM-DD format)
- **Bulk Operations**: Use bulk tools (e.g., `todoist_tasks_bulk_create`) when working with multiple tasks to improve efficiency and reduce API calls
- **Bulk Search Criteria**: Bulk operations support flexible filtering by project, priority, due dates, and content matching
- **Project Name Resolution**: The `todoist_tasks_bulk_update` tool supports both project IDs and project names in the `project_id` field. Project names are automatically resolved to IDs
- **Testing**: Use `todoist_test_all_features` after making changes to ensure functionality works correctly
- **Linting**: Always run `npm run lint -- --fix` after making changes to auto-fix formatting issues
- **Type Safety**: When TypeScript compilation fails due to API changes, use defensive type assertions with proper interfaces rather than disabling strict checking
- **Development Workflow**: For API response handling, prefer using `extractArrayFromResponse()` helper function over inline type assertions

## Development Roadmap

The codebase includes a comprehensive development plan in `todoist-mcp-dev-prd.md`:

**Completed Phases:**
- ✅ **Phase 1**: Testing Infrastructure (v0.6.0) - Comprehensive testing tools and integration tests
- ✅ **Phase 2**: Label Management System (v0.7.0) - Full CRUD operations for labels with usage statistics and analytics
- ✅ **Code Quality Improvement Phase (v0.7.0)**: Major architectural enhancements and security improvements
  - ✅ **Shared API Utilities**: Created `src/utils/api-helpers.ts` with unified helper functions eliminating code duplication
    - Added `resolveProjectIdentifier()` function to resolve project names to IDs
  - ✅ **Standardized Error Handling**: Built `src/utils/error-handling.ts` with ErrorHandler class and context-aware error management
  - ✅ **Enhanced Type Safety**: Replaced all `unknown` types with proper `TodoistAPIResponse<T>` interfaces
  - ✅ **Input Validation & Sanitization**: Comprehensive security protection with XSS prevention and injection attack blocking
  - ✅ **Centralized Cache Management**: Advanced caching system with CacheManager singleton and performance monitoring
  - ✅ **Refactored All Handlers**: Updated all handlers to use shared utilities and standardized patterns
- ✅ **Phase 3**: Subtask Management (v0.8.0) - Hierarchical task management with parent-child relationships
  - ✅ **Subtask Handlers**: Created `src/handlers/subtask-handlers.ts` with full CRUD operations for hierarchical tasks
  - ✅ **Enhanced Testing**: Built `src/handlers/test-handlers-enhanced.ts` with comprehensive CRUD testing and automatic cleanup
  - ✅ **New MCP Tools**: Added 5 subtask management tools (total: 28 tools)
  - ✅ **Type System Enhancement**: Extended type definitions for subtask operations and hierarchy management
  - ✅ **API Compatibility**: Implemented workarounds for Todoist API limitations using delete & recreate patterns

**Planned Future Phases:**
- **Phase 4**: Duplicate Detection - Smart task deduplication using similarity algorithms
- **Phase 5**: Project Analytics - Comprehensive project health metrics and insights

All future development should use the testing infrastructure to validate changes and ensure compatibility.

## Documentation Maintenance Requirements

**CRITICAL: Always keep documentation files updated when making changes to the codebase.**

### Required Documentation Updates

When making ANY changes to the codebase, you MUST update the following files:

#### 1. CHANGELOG.md Updates
**ALWAYS update CHANGELOG.md for every significant change:**
- Add new entries following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- Use semantic versioning for version numbers
- Categorize changes as: Added, Changed, Deprecated, Removed, Fixed, Security
- Include specific details about new tools, API changes, or breaking changes
- Update the unreleased section or create new version entries
- **Never skip this step** - releases reference "See CHANGELOG.md for full details"

#### 2. README.md Updates
**Update README.md when:**
- Adding new MCP tools (update tool count and add to Tools Overview section)
- Adding new features (update Features section and Usage Examples)
- Changing installation or setup procedures
- Adding new usage patterns or best practices
- Modifying architecture or key components

#### 3. CLAUDE.md Updates
**Update CLAUDE.md when:**
- Adding new handlers, modules, or architectural components
- Changing build commands, testing procedures, or development workflow
- Adding new important notes, patterns, or best practices
- Updating tool counts, capabilities, or technical details
- Modifying the development roadmap or completed phases

### Documentation Update Checklist

For every commit that adds features or changes functionality:

- [ ] **CHANGELOG.md**: Added entry with proper categorization and version
- [ ] **README.md**: Updated relevant sections (features, tools, examples)
- [ ] **CLAUDE.md**: Updated technical details and architectural information
- [ ] **Version consistency**: All files reflect the same tool counts and capabilities
- [ ] **Cross-references**: Links between files are accurate and up-to-date

### Documentation Standards

- **Be specific**: "Added 3 new testing tools" not "Added testing"
- **Include examples**: Show usage patterns for new features
- **Maintain consistency**: Tool counts, version numbers, and feature lists must match across all files
- **Use proper formatting**: Follow established markdown patterns and structures
- **Link appropriately**: Ensure cross-references between README.md and CHANGELOG.md work

### Consequences of Not Updating Documentation

- Release notes will be incomplete or inaccurate
- Users won't know about new features or changes
- Future developers will have outdated guidance
- Tool counts and capability descriptions will be wrong
- Installation and setup instructions may become obsolete

**Remember: Documentation is not optional - it's a required part of every change.**
