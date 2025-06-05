# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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