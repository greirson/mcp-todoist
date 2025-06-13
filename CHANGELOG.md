# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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