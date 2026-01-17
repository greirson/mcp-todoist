# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2026-01-16

### Added
- **Phase 10: Reminder Management** - Full CRUD operations for task reminders via Todoist Sync API
  - `todoist_reminder_get`: List all reminders, optionally filtered by task ID or name
  - `todoist_reminder_create`: Create reminders with three types supported:
    - `relative`: Minutes before task due date (e.g., 30 minutes before)
    - `absolute`: Specific date/time in ISO 8601 format
    - `location`: Geofenced reminders with lat/long and trigger conditions (on_enter/on_leave)
  - `todoist_reminder_update`: Update existing reminder settings (type, timing, location)
  - `todoist_reminder_delete`: Remove reminders from tasks
  - Note: Reminders require Todoist Pro or Business plan

### Technical Implementation
- **Sync API Integration**: Uses Todoist Sync API v9 directly since REST API does not support reminders
- **New Files**:
  - `src/tools/reminder-tools.ts` - MCP tool definitions for 4 reminder operations
  - `src/handlers/reminder-handlers.ts` - Business logic with Sync API integration
  - `src/handlers/test-handlers-enhanced/reminder-tests.ts` - Comprehensive test suite
- **Type Definitions**: Added `TodoistReminder`, `ReminderType`, `ReminderDue`, and related interfaces in `src/types.ts`
- **Type Guards**: Added `isGetRemindersArgs`, `isCreateReminderArgs`, `isUpdateReminderArgs`, `isDeleteReminderArgs`
- **Cache Integration**: 30-second TTL cache for reminder queries
- **Task Resolution**: Supports both task ID and partial task name lookup for attaching reminders
- **Error Handling**: Graceful handling of premium tier restrictions with informative messages

### Changed
- Total MCP tools increased from 32 to 36
- Updated all documentation to reflect new tool count
- Enhanced test framework to include reminder operations in comprehensive testing

## [0.9.1] - 2026-01-16

### Added
- **Phase 8: Full Comment Management**: Complete CRUD operations for comments
  - `todoist_comment_update` - Update existing comment content by ID
  - `todoist_comment_delete` - Delete comments by ID
  - **Project Comments**: Extended `todoist_comment_create` to support project-level comments via `project_id` parameter
  - **Enhanced Testing**: Added comprehensive comment management test suite (6 tests)
    - Create task for testing, create comment, get comments, update comment, delete comment, cleanup
- **Tool Count**: Increased from 30 to 32 total MCP tools

### Changed
- **Comment Tool Descriptions**: Updated to reflect support for both task and project comments
- **Type System**: Added `UpdateCommentArgs` and `DeleteCommentArgs` interfaces
- **Type Guards**: Added `isUpdateCommentArgs()` and `isDeleteCommentArgs()` validation functions
- **Test Infrastructure**: Enhanced test suite now includes comment management operations (6 suites, 29+ tests)

### Technical Implementation
- **Handler Functions**: Added `handleUpdateComment()` and `handleDeleteComment()` in `comment-handlers.ts`
- **Dry-Run Support**: Comment update and delete operations already supported by existing DryRunWrapper
- **Cache Integration**: Comment operations properly invalidate cache on mutations

## [0.9.0] - 2026-01-15

### Added
- **Full Section Management (Phase 7)**: Complete CRUD operations for sections
  - **todoist_section_update**: Update section names with support for both ID and name-based lookup
  - **todoist_section_delete**: Delete sections (and all contained tasks) by ID or name search
  - **Section ordering**: Added `order` parameter to `todoist_section_create` for controlling section position
  - **Name-based operations**: Both update and delete support case-insensitive partial name matching with optional project filtering
  - **Ambiguity handling**: Clear error messages when multiple sections match a search term
- **Section Test Suite**: Comprehensive tests in `src/handlers/test-handlers-enhanced/section-tests.ts` covering:
  - Section creation with ordering
  - Section retrieval by project
  - Section update by ID
  - Section update by name
  - Section deletion with cleanup

### Changed
- Total MCP tools increased from 28 to 30
- Enhanced testing infrastructure: 5 test suites (Task, Subtask, Label, Section, Bulk Operations) with 23+ tests
- **Dependency Updates**: Updated all dependencies to latest versions
  - Core dependencies:
    - `@doist/todoist-api-typescript`: 5.1.1 -> 5.5.1 (new Todoist API features)
    - `@modelcontextprotocol/sdk`: 1.17.1 -> 1.18.2 (MCP protocol improvements)
  - TypeScript tooling:
    - `typescript`: 5.7.2 -> 5.9.3
    - `@types/node`: 22.10.1 -> 24.6.1
  - Linting:
    - `@typescript-eslint/eslint-plugin`: 8.32.1 -> 8.48.0
    - `@typescript-eslint/parser`: 8.32.1 -> 8.48.0
  - Testing:
    - `jest`: 30.0.5 -> 30.2.0
- All tests pass with updated dependencies
- No breaking changes or deprecated API calls detected

## [0.8.9] - 2025-11-25

### Fixed
- **Claude Code Compatibility (Issues #47, #48)**: Fixed critical bug where MCP server was completely unusable with Claude Code
  - Claude Code's API rejects tool schemas using `oneOf`, `allOf`, or `anyOf` at the top level
  - Removed 9 instances of `anyOf` from tool schemas across 3 files:
    - `label-tools.ts`: UPDATE_LABEL_TOOL, DELETE_LABEL_TOOL
    - `comment-tools.ts`: CREATE_COMMENT_TOOL
    - `subtask-tools.ts`: CREATE_SUBTASK_TOOL, BULK_CREATE_SUBTASKS_TOOL, CONVERT_TO_SUBTASK_TOOL, PROMOTE_SUBTASK_TOOL, GET_TASK_HIERARCHY_TOOL
  - Runtime validation via existing type guards still enforces "at least one identifier required"
  - Updated property descriptions to clarify "provide this OR [alternative]" pattern
  - Server now works with both Claude Desktop and Claude Code

## [0.8.8] - 2025-01-24

### Fixed
- **Hierarchy Parent Display (Issue #37)**: Fixed missing parent task information in `todoist_task_hierarchy_get`
- **Label Filter Fix (Issue #35)**: Fixed label filtering inconsistency in `todoist_task_get` tool

### Added
- **Dry-Run Mode**: Complete simulation framework for safe testing and validation

### Security
- **Critical Fix**: Fixed vulnerability in bulk operations where empty `content_contains` string matched ALL tasks instead of none (Issue #34)

## [0.8.7] - 2025-01-21

### Added
- **Task Name Search**: New `task_name` parameter for `todoist_task_get` tool enables partial text search in task content (case-insensitive)
- **Enhanced Error Messages**: Filter parameter now returns helpful error messages for invalid Todoist filter syntax

## [0.8.6] - 2025-09-19

### Added
- `todoist_task_get` now supports `due_before` and `due_after` parameters for strict date window filtering

## [0.8.5] - 2025-09-17

### Added
- **Enhanced Task Filtering**: Comprehensive due date filtering capabilities for bulk operations
- **Priority Mapping System**: Intelligent priority conversion between user-facing and API formats
- **Comprehensive Testing Infrastructure**: Extensive test coverage for new filtering and priority features

## [0.8.4] - 2025-08-14

### Fixed
- **Parameter Format Compatibility**: Resolved systematic mismatch between MCP protocol (snake_case) and Todoist SDK (camelCase)

## [0.8.3] - 2024-12-27

### Changed
- **Project Name Support in Bulk Updates**: The `todoist_tasks_bulk_update` tool now supports project names in addition to project IDs

## [0.8.2] - 2024-12-07

### Added
- **Task ID Display**: All operations now include task IDs in their output for improved usability (fixes #13)
- **Task ID Support**: All task operations now support querying by task ID in addition to task name
- **Enhanced Filtering**: `todoist_task_get` now supports `priority` and `limit` parameters for better task filtering

## [0.8.1] - 2024-12-07

### Changed
- **Major Architectural Refactoring**: Significantly improved codebase maintainability and organization

## [0.8.0] - 2024-12-07

### Added
- **Phase 3: Subtask Management System**: Complete hierarchical task management with parent-child relationships
- **Enhanced Testing Infrastructure**: Comprehensive CRUD testing with automatic cleanup

## [0.7.0] - 2024-12-06

### Added
- **Code Quality Improvement Phase**: Major architectural enhancements and security improvements
- **Label Management System**: Complete CRUD operations for Todoist labels (Phase 2 completion)

## [0.6.0] - 2024-12-06

### Added
- **Testing Infrastructure**: Comprehensive testing system with 3 new MCP tools
- **Integration Test Suite**: Full API integration testing

## [0.5.3] - 2024-11-XX

### Fixed
- **Dependency Updates**: Updated linting and TypeScript dependencies via Dependabot
- **CI/CD**: Improved automated testing and release pipeline

## [0.5.1] - 2024-11-XX

### Fixed
- **Deadline Parameter**: Changed `deadline` to `deadline_date` parameter (YYYY-MM-DD format)

## [0.5.0] - 2024-11-XX

### Added
- **Bulk Operations**: 4 new bulk tools for efficient multi-task operations
- **Comment System**: Full comment support with file attachments

## [0.4.0] - 2024-10-XX

### Added
- **Modular Architecture**: Refactored monolithic code into focused modules
- **Performance Optimization**: 30-second caching for GET operations

## [0.3.0] - 2024-10-XX

### Added
- **Complete Project Management**: Project and section creation tools

## [0.2.0] - 2024-09-XX

### Added
- **Enhanced Task Creation**: Support for labels and deadline parameters

## [0.1.0] - 2024-09-XX

### Added
- **Initial Release**: Basic Todoist MCP server functionality
- **Core Task Management**: Create, read, update, delete, and complete tasks
