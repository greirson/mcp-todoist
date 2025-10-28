# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Railway Deployment Support**: Cloud deployment capabilities for HTTP/SSE access
  - Created `src/http-server.ts` - HTTP server with SSE transport for Railway deployment
  - Added Express.js dependency for HTTP endpoint handling
  - Implemented health check endpoint at `/health` for Railway monitoring
  - Created server info endpoint at `/` with service details
  - SSE endpoint at `/sse` for MCP protocol over HTTP
  - Comprehensive deployment guide in `RAILWAY.md`
  - Railway configuration in `railway.json` with health checks and restart policies
  - Added `Procfile` for Railway process configuration
  - Created `.railwayignore` for optimized deployments
  - Created `.env.example` with all environment variables and security best practices
  - Updated `Dockerfile` to support both stdio (Smithery) and HTTP (Railway) modes
  - New npm scripts:
    - `npm start` - launches HTTP server for Railway
    - `npm run start:stdio` - launches stdio server for local Claude Desktop

### Security
- **HTTP Authentication**: Added bearer token authentication for HTTP/SSE endpoints
  - New required environment variable: `MCP_AUTH_TOKEN`
  - All MCP endpoints (`/sse`, `/message`) require `Authorization: Bearer TOKEN` header
  - Public endpoints (`/health`, `/`) remain accessible without authentication
  - Prevents unauthorized access to MCP server in cloud deployments
  - Returns 401 Unauthorized for missing auth header
  - Returns 403 Forbidden for invalid tokens
- **Environment Protection**: `.env` files already in `.gitignore` (line 8)
- **Token Generation**: Documentation includes secure token generation commands

### Changed
- **Dual Transport Support**: Server now supports both stdio (local) and HTTP/SSE (cloud) transports
- **Updated README.md**: Added Railway deployment section with security notes
- **Updated RAILWAY.md**: Comprehensive security and authentication documentation
- **Updated Dockerfile**: Changed default CMD to `npm start` for Railway compatibility
- **Updated tsconfig.json**: Changed include from `src/index.ts` to `src/**/*.ts` for full compilation

### Technical Implementation
- **HTTP/SSE Architecture**: Express server wrapping MCP Server with SSE transport
- **Authentication Middleware**: Express middleware for bearer token validation
- **Environment Variables**: Supports `PORT` (Railway), `MCP_AUTH_TOKEN` (security), `TODOIST_API_TOKEN`, `DRYRUN`
- **Health Monitoring**: `/health` endpoint returns service status and version
- **Multi-client Support**: HTTP/SSE allows multiple concurrent MCP clients
- **Backward Compatibility**: Stdio mode still available via `npm run start:stdio`

## [0.8.8] - 2025-01-24

### Fixed
- **Hierarchy Parent Display (Issue #37)**: Fixed missing parent task information in `todoist_task_hierarchy_get`
  - The hierarchy function now traverses upward to find parent tasks, not just children
  - When called on a subtask, it now shows the complete hierarchy from the topmost parent
  - Added visual indicator (`← current task`) to mark the originally requested task in the hierarchy
  - Enhanced `TaskNode` and `TaskHierarchy` types with `isOriginalTask` and `originalTaskId` fields
  - **Root Cause**: The function only built the tree downward from the given task, never checking for parents
  - **Solution**: First traverse upward to find the topmost parent, then build complete tree from there

- **Label Filter Fix (Issue #35)**: Fixed label filtering inconsistency in `todoist_task_get` tool
  - The `label_id` parameter now correctly filters tasks by label, supporting:
    - Numeric label IDs (e.g., "123")
    - Label names (e.g., "trigger")
    - Label names with @ prefix (e.g., "@trigger")
  - Fixed issue where the Todoist TypeScript client's `label` parameter doesn't actually filter results
  - Implemented client-side filtering for both `label_id` parameter and `@label` syntax in filters
  - Added comprehensive validation for non-existent labels (returns no tasks instead of all tasks)
  - Enhanced handling of tasks with undefined or missing labels array
  - Added comprehensive test suite with 9 tests covering all edge cases
  - **Root Cause**: The Todoist TypeScript client's `getTasks()` method ignores the `label` parameter due to API mismatch (expects `label_id` not `label`)
  - **Solution**: Implemented proper client-side filtering with label resolution and caching

### Added
- **Dry-Run Mode**: Complete simulation framework for safe testing and validation
  - Added `DryRunWrapper` class in `src/utils/dry-run-wrapper.ts` for operation simulation
  - Enabled via `DRYRUN=true` environment variable
  - All 28 MCP tools support dry-run mode with comprehensive validation
  - Uses real API data for validation while simulating mutations (create, update, delete, complete)
  - UI responses clearly show `[DRY-RUN]` prefix when operations are simulated
  - All logging output to stderr to maintain MCP protocol compliance (stdout for JSON-RPC only)
  - Perfect for testing automations, learning the API, debugging, and safe experimentation
  - Comprehensive test coverage in `src/__tests__/dry-run-wrapper.test.ts`

### Technical Implementation
- **DryRunWrapper Architecture**: Intercepts TodoistApi mutations when dry-run mode is enabled
- **Real Data Validation**: Uses actual API calls to validate projects, tasks, sections, and labels exist
- **Simulated Responses**: Returns realistic mock data with generated IDs for mutation operations
- **Factory Pattern**: `createTodoistClient()` function automatically wraps client based on environment
- **Type Safety**: Full TypeScript support with proper type definitions for all dry-run operations
- **UI Indicators**: All handler responses prepend `[DRY-RUN]` when in dry-run mode for clear user feedback

### Security
- **Critical Fix**: Fixed vulnerability in bulk operations where empty `content_contains` string matched ALL tasks instead of none (Issue #34)
  - Empty or whitespace-only strings in `content_contains` now correctly match no tasks
  - Added validation to reject empty strings with clear error messages
  - Bulk operations now require at least one valid search criterion

### Added
- Comprehensive test suite for bulk operations empty string handling
- Edge case tests for various whitespace characters and Unicode handling
- Security tests for malicious input attempts

### Changed
- Enhanced `filterTasksByCriteria` to explicitly handle empty strings as "no match"
- Improved `validateBulkSearchCriteria` with stricter validation rules
- Better error messages guiding users on proper bulk operation usage

## [0.8.7] - 2025-01-21

### Added
- **Task Name Search**: New `task_name` parameter for `todoist_task_get` tool enables partial text search in task content (case-insensitive)
- **Enhanced Error Messages**: Filter parameter now returns helpful error messages for invalid Todoist filter syntax, guiding users to correct usage

### Fixed
- **Filter Parameter**: Fixed 400 errors when using plain text in `filter` parameter - now provides educational error messages explaining proper Todoist filter syntax
- **Task Search**: Resolved issue where task search functionality was missing, preventing users from finding tasks by content

## [0.8.6] - 2025-09-19

### Added
- `todoist_task_get` now supports `due_before` and `due_after` parameters for strict date window filtering

### Changed
- Task responses now surface full due context (date, datetime, timezone, natural phrase) to keep Claude timezone-aware
- Bulk task operations reuse the same due-date normalization so search/update/delete/complete produce consistent results across timezones

### Fixed
- Natural-language filters (`today`, `overdue`, etc.) now route through Todoist's filter endpoint and no longer ignore date constraints
- Explicit date filters (`due_before`, `due_after`) and label filters are respected during task retrieval
- Bulk task filters now validate date input and honour the same strict before/after semantics as single-task queries

## [0.8.5] - 2025-09-17

### Added
- **Enhanced Task Filtering**: Comprehensive due date filtering capabilities for bulk operations
  - Added `due_before` and `due_after` parameters to bulk update operations for precise date range filtering
  - Supports ISO date format (YYYY-MM-DD) filtering with strict date boundary validation
  - Enhanced `filterTasksByCriteria()` function with robust date parsing and comparison logic
- **Priority Mapping System**: Intelligent priority conversion between user-facing and API formats
  - Added `priority-mapper.ts` utility with `toApiPriority()` and `fromApiPriority()` functions
  - Converts user-friendly priority scale (1 = highest, 4 = lowest) to Todoist API scale (4 = highest, 1 = lowest)
  - Integrated priority mapping across all task creation, update, and retrieval operations
  - Ensures consistent priority handling throughout the entire system
- **Comprehensive Testing Infrastructure**: Extensive test coverage for new filtering and priority features
  - Added `task-filter.test.ts` with 203+ lines of comprehensive due date filtering tests
  - Added `priority-mapper.test.ts` with complete priority conversion validation
  - Added `bulk-e2e.test.ts` end-to-end testing for bulk operations with real API integration
  - Enhanced Jest configuration for improved test execution and coverage

### Enhanced
- **Task Handlers**: Updated task creation, update, and bulk operations to use priority mapping
- **Subtask Handlers**: Integrated priority mapping for consistent subtask priority handling
- **Tool Definitions**: Updated task and subtask tool descriptions to reflect priority mapping
- **API Helpers**: Enhanced response formatting to include priority mapping for display
- **Cache Integration**: Improved cache invalidation and management for filtered operations

### Technical Implementation
- **Date Filtering**: Robust date boundary checking with `due_before` (strict less-than) and `due_after` (strict greater-than) logic
- **Priority Consistency**: Automatic bi-directional priority conversion ensuring user-facing and API consistency
- **Type Safety**: Enhanced TypeScript interfaces for new filtering parameters and priority handling
- **Test Coverage**: Added 25+ new tests covering edge cases, boundary conditions, and error scenarios
- **Performance**: Optimized filtering operations with improved date parsing and validation

### Fixed
- **Priority Display**: Tasks now consistently show priorities on user-friendly scale (1-4) regardless of API source
- **Date Range Filtering**: Bulk operations now properly handle inclusive/exclusive date boundaries
- **Type Validation**: Enhanced input validation for date formats and priority ranges

## [0.8.4] - 2025-08-14

### Fixed
- **Parameter Format Compatibility**: Resolved systematic mismatch between MCP protocol (snake_case) and Todoist SDK (camelCase)
  - Added `parameter-transformer.ts` utility for automatic parameter format conversion
  - Fixed subtask handlers to use proper camelCase field names (parentId, projectId, dueString, sectionId)
  - Updated task handlers to use parameter extraction helpers for both snake_case and camelCase support
  - Removed debug logging from production code
  - Ensures compatibility with both parameter formats for backward compatibility

## [0.8.3] - 2024-12-27

### Changed
- **Project Name Support in Bulk Updates**: The `todoist_tasks_bulk_update` tool now supports project names in addition to project IDs
  - Added `resolveProjectIdentifier()` helper function to resolve project names to IDs
  - Users can now move tasks to projects using either the project ID or project name (e.g., "Backlog")
  - The tool description has been updated to indicate that `project_id` accepts "project ID or name"

### Fixed
- Fixed error when bulk updating tasks with project names instead of IDs

## [0.8.2] - 2024-12-07

### Added
- **Task ID Display**: All operations now include task IDs in their output for improved usability (fixes #13)
  - `formatTaskForDisplay()` now shows tasks as: `- Task content (ID: 123456)`
  - Task creation responses include: `Task created:\nID: 123456\nTitle: Task content...`
  - Bulk operations show IDs in success lists: `- Task content (ID: 123456)`
  - Task hierarchy displays include IDs: `○ Task content (ID: 123456) [50%]`
  - Subtask operations show both task and parent IDs in responses
- **Task ID Support**: All task operations now support querying by task ID in addition to task name
  - `todoist_task_get` - Added `task_id` parameter to fetch specific task by ID (takes precedence over filtering)
  - `todoist_task_update` - Added `task_id` parameter (takes precedence over `task_name`)
  - `todoist_task_delete` - Added `task_id` parameter (takes precedence over `task_name`)
  - `todoist_task_complete` - Added `task_id` parameter (takes precedence over `task_name`)
- **Enhanced Filtering**: `todoist_task_get` now supports `priority` and `limit` parameters for better task filtering

### Changed
- **Output Format**: Standardized task ID display format across all operations
- **Tool Parameters**: Made `task_name` optional in update/delete/complete operations (either `task_id` or `task_name` required)
- **Tool Descriptions**: Updated to reflect ID-based querying capabilities
- **Error Messages**: Updated to show whether search was by ID or name for better debugging

### Fixed
- **Issue #13**: Task IDs are now visible in all get operations and create/update responses

## [0.8.1] - 2024-12-07

### Changed
- **Major Architectural Refactoring**: Significantly improved codebase maintainability and organization
  - **Modular Tool Organization**: Broke out monolithic `src/tools.ts` (863 lines) into focused domain modules:
    - `src/tools/task-tools.ts` - Task management tools (9 tools)
    - `src/tools/subtask-tools.ts` - Subtask management tools (5 tools)
    - `src/tools/project-tools.ts` - Project and section tools (4 tools)
    - `src/tools/comment-tools.ts` - Comment management tools (2 tools)
    - `src/tools/label-tools.ts` - Label management tools (5 tools)
    - `src/tools/test-tools.ts` - Testing and validation tools (3 tools)
    - `src/tools/index.ts` - Centralized exports with backward compatibility
  - **Enhanced Test Modularization**: Broke out `src/handlers/test-handlers-enhanced.ts` (755 lines) into focused test suites:
    - `src/handlers/test-handlers-enhanced/types.ts` - Common types and test utilities
    - `src/handlers/test-handlers-enhanced/task-tests.ts` - Task CRUD operation tests
    - `src/handlers/test-handlers-enhanced/subtask-tests.ts` - Subtask management tests
    - `src/handlers/test-handlers-enhanced/label-tests.ts` - Label operation tests
    - `src/handlers/test-handlers-enhanced/bulk-tests.ts` - Bulk operation tests
    - `src/handlers/test-handlers-enhanced/index.ts` - Test orchestrator and exports

### Improved
- **Code Organization**: Each module now focuses on a single domain for better maintainability
- **Developer Experience**: Easier navigation and reduced cognitive load with smaller, focused files
- **Type Safety**: All TypeScript compilation errors resolved during refactoring
- **Code Quality**: All ESLint issues resolved with clean, consistent formatting
- **Backward Compatibility**: All existing imports and functionality preserved

### Technical Benefits
- **Maintainability**: Reduced largest files from 863 and 755 lines to focused modules under 400 lines each
- **Testability**: Individual modules can be tested and modified in isolation
- **Scalability**: Clear separation of concerns enables easier feature additions
- **Code Discovery**: Developers can quickly locate relevant functionality by domain

## [0.8.0] - 2024-12-07

### Added
- **Phase 3: Subtask Management System**: Complete hierarchical task management with parent-child relationships
  - **Subtask Operations** (`src/handlers/subtask-handlers.ts`): Full CRUD operations for hierarchical tasks
    - `handleCreateSubtask()` - Create subtasks under parent tasks with full attribute support
    - `handleBulkCreateSubtasks()` - Create multiple subtasks efficiently under a parent task
    - `handleConvertToSubtask()` - Convert existing tasks to subtasks (delete & recreate pattern)
    - `handlePromoteSubtask()` - Promote subtasks to main tasks (remove parent relationship)
    - `handleGetTaskHierarchy()` - Retrieve task trees with completion percentage tracking
  - **New MCP Tools**: 5 additional tools for subtask management (total: 28 tools)
    - `todoist_subtask_create` - Create individual subtasks
    - `todoist_subtasks_bulk_create` - Create multiple subtasks at once
    - `todoist_task_convert_to_subtask` - Convert tasks to subtasks
    - `todoist_subtask_promote` - Promote subtasks to main tasks
    - `todoist_task_hierarchy_get` - View task hierarchies with completion tracking
  - **Enhanced Type System**: New interfaces for subtask operations and hierarchy management
    - `CreateSubtaskArgs`, `BulkCreateSubtasksArgs`, `ConvertToSubtaskArgs`, `PromoteSubtaskArgs`
    - `GetTaskHierarchyArgs`, `TaskNode`, `TaskHierarchy`, `ExtendedTaskNode`
    - Updated `TodoistTask` with `parentId` and `isCompleted` properties
    - Updated `CreateTaskArgs` with `parent_id` support

- **Enhanced Testing Infrastructure**: Comprehensive CRUD testing with automatic cleanup
  - **Robust Test Handlers** (`src/handlers/test-handlers-enhanced.ts`): Full tool validation
    - Task Operations Suite: CREATE, READ, UPDATE, COMPLETE, DELETE (5 tests)
    - Subtask Operations Suite: CREATE, HIERARCHY, BULK_CREATE, PROMOTE (4 tests)
    - Label Operations Suite: CREATE, READ, UPDATE, STATS, DELETE (5 tests)
    - Bulk Operations Suite: BULK_CREATE, BULK_UPDATE, BULK_COMPLETE, BULK_DELETE (4 tests)
  - **Dual Testing Modes**: Basic (read-only) and Enhanced (full CRUD with cleanup)
    - Enhanced mode parameter: `{ "mode": "enhanced" }` for comprehensive testing
    - Automatic test data generation with timestamps for uniqueness
    - Complete cleanup of all test data after testing
    - Detailed test reporting with response times and success/failure metrics

### Changed
- **Tool Count**: Increased from 23 to 28 tools with new subtask management capabilities
- **Test Coverage**: Enhanced `todoist_test_all_features` now supports both basic and enhanced testing modes
- **API Compatibility**: Implemented workaround for Todoist API parent_id limitations using delete & recreate pattern
- **Error Handling**: Extended error handling to support subtask-specific operations and validation
- **Type Guards**: Added comprehensive type validation for all subtask operation parameters

### Technical Implementation
- **Hierarchical Task Building**: Recursive algorithm for building task trees with completion percentage calculation
- **Cache Integration**: Subtask operations integrated with existing 30-second TTL caching system
- **Validation & Security**: All subtask inputs validated using existing security framework
- **API Response Handling**: Robust handling of various Todoist API response formats for subtask data
- **Performance Optimization**: Efficient bulk subtask creation with sequential processing and error reporting

### Documentation
- **README Updates**: Added subtask management examples and updated tool count to 28
- **Usage Examples**: New subtask workflow examples for natural language interaction
- **Architecture Documentation**: Updated technical specifications in CLAUDE.md

## [0.7.0] - 2024-12-06

### Added
- **Code Quality Improvement Phase**: Major architectural enhancements and security improvements
  - **Shared API Utilities** (`src/utils/api-helpers.ts`): Eliminated code duplication with centralized helper functions
    - `extractArrayFromResponse<T>()` - Handles multiple API response formats
    - `createCacheKey()` - Standardized cache key generation
    - `formatTaskForDisplay()` - Consistent task formatting
    - Safe type extraction utilities and API response validation
  - **Standardized Error Handling** (`src/utils/error-handling.ts`): Unified error management across all operations
    - `ErrorHandler` class with context-aware error processing
    - Specialized handlers for task/label not found errors
    - `wrapAsync()` utility for automatic error handling
    - Enhanced error context tracking and operation monitoring
  - **Enhanced Input Validation & Sanitization** (`src/validation.ts`): Comprehensive security protection
    - XSS protection through HTML escaping and script tag removal
    - SQL injection pattern detection and prevention
    - File upload security with MIME type restrictions
    - URL validation with protocol restrictions (HTTP/HTTPS only)
    - `VALIDATION_LIMITS` constants for consistent validation rules
    - `sanitizeInput()`, `validateAndSanitizeContent()`, `validateAndSanitizeURL()` functions
  - **Centralized Cache Management** (`src/cache.ts`): Advanced caching system with monitoring
    - `CacheManager` singleton for coordinating multiple cache instances
    - Cache statistics tracking with hit rates and memory usage monitoring
    - LRU eviction with configurable size limits
    - Automatic cleanup intervals and cache warming capabilities
    - Health monitoring with actionable performance recommendations

### Changed
- **Enhanced Type Safety**: Replaced all `unknown` types with proper `TodoistAPIResponse<T>` interfaces
- **Refactored Handlers**: All handlers now use shared utilities and standardized error handling
- **Input Processing**: All user inputs are now sanitized before processing to prevent security vulnerabilities
- **Validation Functions**: Enhanced to return sanitized values instead of void for better data flow
- **Cache Architecture**: Task handlers migrated to use centralized cache management

### Fixed
- **Type Safety**: Resolved all TypeScript build errors and type mismatches
- **Code Duplication**: Eliminated repeated `extractArrayFromResponse` functions across handlers
- **Error Handling**: Standardized error patterns across all operations
- **Linting**: Resolved all ESLint warnings and formatting issues

### Security
- **XSS Protection**: HTML entity escaping and malicious script detection
- **Injection Prevention**: SQL injection pattern blocking and dangerous protocol filtering
- **File Security**: MIME type validation and malicious filename detection
- **Input Sanitization**: Control character removal and content length validation

## [0.6.0] - 2024-12-06

### Added
- **Label Management System**: Complete CRUD operations for Todoist labels (Phase 2 completion)
  - `todoist_label_get` - List all labels with IDs, names, and colors
  - `todoist_label_create` - Create new labels with optional color, order, and favorite status
  - `todoist_label_update` - Update existing labels by ID or name (supports all label attributes)
  - `todoist_label_delete` - Delete labels by ID or name with confirmation
  - `todoist_label_stats` - Advanced usage statistics with completion rates and last usage dates
- **Enhanced Type System**: New interfaces for label operations with full TypeScript support
  - `TodoistLabel`, `CreateLabelArgs`, `UpdateLabelArgs`, `LabelNameArgs`, `LabelStatistics`
  - Runtime type validation with dedicated type guards for all label operations
- **Label Validation**: Comprehensive input validation and sanitization
  - Supports all Todoist color names and hex codes
  - Label name length validation and trimming
  - Order position validation for label organization
- **Caching Integration**: Label operations use intelligent caching for optimal performance
  - 30-second TTL for label data with automatic cache invalidation
  - Separate cache management for label statistics

### Changed
- **Tool Count**: Increased from 18 to 23 total MCP tools
- **Test Coverage**: Updated `todoist_test_all_features` to include comprehensive label testing
- **Error Handling**: Added `LabelNotFoundError` for specific label operation failures

### Enhanced
- **Performance**: Label operations leverage existing caching infrastructure
- **Documentation**: Updated README.md with label management examples and usage patterns

## [0.6.0] - 2024-12-06

### Added
- **Testing Infrastructure**: Comprehensive testing system with 3 new MCP tools
  - `todoist_test_connection` - Quick API token validation and connection test
  - `todoist_test_all_features` - Comprehensive testing of all MCP tools and API operations
  - `todoist_test_performance` - Performance benchmarking with configurable iterations
- **Integration Test Suite**: Full API integration testing in `src/__tests__/integration.test.ts`
  - Graceful handling when `TODOIST_API_TOKEN` environment variable is not available
  - Comprehensive testing of tasks, projects, labels, sections, and comments
  - Performance validation and error handling tests
- **API Response Handling**: Robust support for multiple Todoist API response formats
  - Added `extractArrayFromResponse()` helper function for defensive API parsing
  - Handles direct arrays, `result.results`, and `result.data` response patterns
- **Development Documentation**: Added comprehensive development PRD (`todoist-mcp-dev-prd.md`)
  - Detailed roadmap for future phases (label management, subtask handling, duplicate detection, analytics)
  - Implementation guides and architectural patterns

### Changed
- **Enhanced Type Safety**: Replaced `any` types with proper TypeScript interfaces
- **Code Quality**: Improved linting compliance and formatting consistency
- **Tool Count**: Updated from 15 to 18 total MCP tools

### Fixed
- **API Compatibility**: Fixed handling of evolving Todoist API response formats
- **Test Infrastructure**: Resolved issues with API response parsing in test functions
- **Linting Errors**: Fixed all ESLint and Prettier formatting issues

### Developer Experience
- **Testing**: Run `TODOIST_API_TOKEN=your-token npm test` for full integration testing
- **Validation**: Use `todoist_test_all_features` tool to verify functionality after changes
- **Documentation**: Updated CLAUDE.md with comprehensive testing guidance

## [0.5.3] - 2024-11-XX

### Fixed
- **Dependency Updates**: Updated linting and TypeScript dependencies via Dependabot
- **CI/CD**: Improved automated testing and release pipeline

## [0.5.1] - 2024-11-XX

### Fixed
- **Deadline Parameter**: Changed `deadline` to `deadline_date` parameter (YYYY-MM-DD format) for proper Todoist API compatibility
- **Deadline Display**: Task retrieval now properly displays deadline information alongside due dates

### Changed
- **Documentation**: Updated CLAUDE.md with clarification on due dates vs deadlines
  - `due_string`/`due_date`: When the task appears in "Today" (start date)
  - `deadline_date`: Actual deadline for task completion (YYYY-MM-DD format)

## [0.5.0] - 2024-11-XX

### Added
- **Bulk Operations**: 4 new bulk tools for efficient multi-task operations
  - `todoist_tasks_bulk_create` - Create multiple tasks at once
  - `todoist_tasks_bulk_update` - Update multiple tasks based on search criteria
  - `todoist_tasks_bulk_delete` - Delete multiple tasks based on search criteria
  - `todoist_tasks_bulk_complete` - Complete multiple tasks based on search criteria
- **Comment System**: Full comment support with file attachments
  - `todoist_comment_create` - Add comments to tasks with optional file attachments
  - `todoist_comment_get` - Retrieve comments for tasks or projects
- **Enhanced Search**: Flexible search criteria for bulk operations
  - Filter by project, priority, date ranges, and content matching

### Changed
- **Documentation**: Updated README with comprehensive examples for all new features
- **Performance**: Improved efficiency for multi-task operations

## [0.4.0] - 2024-10-XX

### Added
- **Modular Architecture**: Refactored monolithic code into focused modules
- **Performance Optimization**: 30-second caching for GET operations to reduce API calls
- **Robust Error Handling**: Custom error types with structured error responses
- **Input Validation**: Comprehensive validation and sanitization of all inputs
- **Code Quality**: ESLint, Prettier, and Jest testing framework integration
- **Type Safety**: Full TypeScript implementation with runtime type checking

### Changed
- **Architecture**: Organized codebase into domain-specific handlers
  - `src/handlers/task-handlers.ts` - Task CRUD operations
  - `src/handlers/project-handlers.ts` - Project and section operations
  - `src/handlers/comment-handlers.ts` - Comment operations
- **Error Management**: Eliminated all `any` types for better type safety

## [0.3.0] - 2024-10-XX

### Added
- **Complete Project Management**: Project and section creation tools
  - `todoist_project_create` - Create new projects with color and favorite options
  - `todoist_section_create` - Create sections within projects
- **Enhanced Organization**: Full support for `project_id` and `section_id` in task operations
- **Discovery Tools**: List projects and sections for ID discovery
  - `todoist_project_get` - List all projects with IDs and names
  - `todoist_section_get` - List sections within projects

### Changed
- **Tool Names**: Cleaner naming convention with proper MCP compliance (e.g., "Todoist Task Create")
- **Organization**: Better support for hierarchical task organization

## [0.2.0] - 2024-09-XX

### Added
- **Enhanced Task Creation**: Support for labels and deadline parameters
- **Label Support**: Assign multiple labels to tasks during creation
- **Deadline Management**: Set actual deadlines separate from due dates

### Changed
- **API Compliance**: Better alignment with Todoist API v2 specification
- **Parameter Handling**: Improved handling of optional task attributes

## [0.1.0] - 2024-09-XX

### Added
- **Initial Release**: Basic Todoist MCP server functionality
- **Core Task Management**: Create, read, update, delete, and complete tasks
- **Natural Language Interface**: Task search and filtering using everyday language
- **Task Attributes**: Support for descriptions, due dates, and priority levels
- **MCP Integration**: Full Model Context Protocol compliance for Claude Desktop

### Features
- 5 core task management tools
- Natural language task identification
- Basic error handling and validation
- TypeScript implementation with proper types