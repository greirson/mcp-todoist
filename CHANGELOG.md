# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-26

### Fixed

- Task duration now requires `due_string` with a time component (e.g., "today at 2pm") - Todoist API silently ignores duration without a specific time

### Changed

- Modularized codebase for improved maintainability:
  - Split `types.ts` into 11 domain-specific type modules
  - Split `type-guards.ts` into 8 domain-specific guard modules
  - Split `validation.ts` into 6 focused validation modules
  - Split `cache.ts` into SimpleCache and CacheManager modules
  - Split `task-handlers.ts` into crud, bulk, completed, and quick-add modules
  - Extracted tool routing from `index.ts` into dedicated router module
- All original import paths preserved via re-export files for backwards compatibility

## [1.0.0] - 2026-01-21

### Added

- **Unified Tools Mode**: New streamlined 19-tool interface enabled with `TODOIST_UNIFIED_TOOLS=true`
  - Consolidates 86 individual tools into 19 action-based tools for reduced AI decision overhead
  - Each unified tool supports multiple actions via an `action` parameter
  - All existing functionality preserved - same handlers, same responses
  - See [UNIFIED_TOOLS_REFERENCE.md](UNIFIED_TOOLS_REFERENCE.md) for complete documentation

- **New Unified Tools**:
  | Tool | Actions | Description |
  |------|---------|-------------|
  | `todoist_task` | create, get, update, delete, complete, reopen, quick_add | Complete task management |
  | `todoist_task_bulk` | bulk_create, bulk_update, bulk_delete, bulk_complete | Multi-task operations |
  | `todoist_subtask` | create, bulk_create, convert, promote, hierarchy | Hierarchical task management |
  | `todoist_project` | create, get, update, delete, archive, collaborators | Project CRUD |
  | `todoist_project_ops` | reorder, move_to_parent, get_archived | Advanced project ops |
  | `todoist_section` | create, get, update, delete, move, reorder, archive, unarchive | Section management |
  | `todoist_label` | create, get, update, delete, stats | Label management |
  | `todoist_comment` | create, get, update, delete | Comments |
  | `todoist_reminder` | create, get, update, delete | Reminders (Pro) |
  | `todoist_filter` | create, get, update, delete | Filters (Pro) |
  | `todoist_collaboration` | workspaces, invitations, invite, accept, reject, delete_invite, notifications, mark_read, mark_all_read | Team features |
  | `todoist_user` | info, stats, settings | User profile |
  | `todoist_utility` | test_connection, test_features, test_performance, find_duplicates, merge_duplicates | Testing & utilities |
  | `todoist_activity` | get, by_project, by_date | Activity logs |
  | `todoist_task_ops` | move, reorder, bulk_reorder, close, day_order | Advanced task ops |
  | `todoist_completed` | get | Completed tasks |
  | `todoist_backup` | list, download | Backups |
  | `todoist_notes` | create, get, update, delete | Project notes |
  | `todoist_shared_labels` | get, rename, remove | Shared labels (Business) |

- **Migration Guide**: New [MIGRATION.md](MIGRATION.md) with complete tool mapping from legacy to unified

- **Documentation**:
  - [UNIFIED_TOOLS_REFERENCE.md](UNIFIED_TOOLS_REFERENCE.md) - Complete reference for unified tools
  - Updated README.md with unified tools overview and configuration
  - Updated CLAUDE.md with dual-mode architecture documentation

### Changed

- **Tool Architecture**: Now supports two modes controlled by `TODOIST_UNIFIED_TOOLS` environment variable
  - Legacy mode (default): 86 individual tools for fine-grained control
  - Unified mode: 19 consolidated tools with action-based routing

### Technical Implementation

- **New Files**:
  - `src/tools/unified/*.ts` - 17 unified tool definition files
  - `src/handlers/unified/*.ts` - 16 router handlers dispatching to existing handlers
- **Backward Compatibility**: Legacy 86-tool mode remains the default and is fully supported
- **No Breaking Changes**: All existing functionality preserved in both modes

---

## [0.11.0] - 2026-01-19

### Added

- **Activity Logs (Phase 1)**: Full activity log support via Todoist Sync API for auditing and tracking workspace changes
  - `todoist_activity_get`: Get activity log with flexible filters (object_type, event_type, project, date range, pagination)
  - `todoist_activity_by_project`: Get all activity events for a specific project
  - `todoist_activity_by_date_range`: Get activity events within a date range
  - Supports filtering by: item (tasks), note (comments), project, section, label, filter, reminder
  - Event types: added, updated, deleted, completed, uncompleted, archived, unarchived, shared, left
  - Useful for: audit trails, productivity analysis, change tracking, collaboration monitoring

- **Completed Tasks Retrieval**: New `todoist_completed_tasks_get` tool for fetching completed tasks via Todoist Sync API
  - Filter by project ID
  - Filter by date range using ISO 8601 datetime format (`since`/`until` parameters)
  - Pagination support with `limit` (max 200) and `offset` parameters
  - Optional notes/comments annotation with `annotate_notes` parameter
  - Returns task content, completion date, project name, and note count
- **Phase 4: Duration & Task Enhancements**: Complete task duration support and reopen capability
  - **Task Duration Support**: Added `duration` and `duration_unit` parameters for time blocking workflows
    - `duration`: Integer value (1-1440) representing task duration
    - `duration_unit`: Either "minute" or "day" (defaults to "minute")
    - Available on: `todoist_task_create`, `todoist_task_update`, `todoist_tasks_bulk_create`, `todoist_tasks_bulk_update`
  - **Task Reopen Tool**: New `todoist_task_reopen` tool to restore completed tasks
    - Supports both `task_id` and `task_name` parameters for flexible task identification
    - Uses Todoist API's native `reopenTask()` method
    - Integrates with dry-run mode for safe testing
  - **Duration Validation**: Comprehensive input validation for duration parameters
    - Integer validation (no decimals)
    - Range validation (1-1440)
    - Unit validation (minute or day only)
    - Pair validation (duration_unit requires duration)
  - **Test Coverage**: Added comprehensive tests for duration validation and reopen functionality
    - Unit tests in `src/__tests__/duration-validation.test.ts`
    - Integration tests in `src/handlers/test-handlers-enhanced/duration-reopen-tests.ts`
- **Quick Add Task (Phase 5)**: New `todoist_task_quick_add` tool for natural language task creation
  - Parses text like the official Todoist app with support for:
    - Due dates in free form text (e.g., "tomorrow", "next Monday", "Jan 23")
    - Project names with `#` prefix (e.g., "#Shopping")
    - Labels with `@` prefix (e.g., "@errands")
    - Assignees with `+` prefix (e.g., "+John")
    - Priority levels (p1 = urgent, p2, p3, p4 = lowest)
    - Deadlines in curly braces (e.g., "{in 3 days}")
    - Descriptions starting with `//` (e.g., "//Don't forget milk")
  - Supports optional `note`, `reminder`, and `auto_reminder` parameters
  - Full dry-run mode support for safe testing

### Fixed

- **ISO 8601 Datetime Validation**: Fixed `validateIsoDatetime` to accept timezone suffixes
  - Now supports `Z` suffix (e.g., `2024-01-01T00:00:00Z`)
  - Now supports timezone offsets (e.g., `2024-01-01T00:00:00+00:00`, `2024-01-01T00:00:00-05:00`)
  - Now supports milliseconds (e.g., `2024-01-01T00:00:00.123Z`)

### Technical Implementation

- **Sync API Integration**: Uses Todoist Sync API v9 endpoint `/sync/v9/completed/get_all`
- **Quick Add API Integration**: Direct integration with `POST /api/v1/tasks/quick`
- **Type Definitions**: Added `GetCompletedTasksArgs`, `CompletedTask`, `CompletedTasksResponse`, `QuickAddTaskArgs`, `QuickAddTaskResult`, `DurationUnit`, `TaskDuration`, `ReopenTaskArgs` interfaces
- **Type Guards**: Added `isGetCompletedTasksArgs`, `isQuickAddTaskArgs`, and `isReopenTaskArgs` validation functions
- **Duration Validation**: Added `validateDuration()`, `validateDurationUnit()`, `validateDurationPair()` functions

### Changed

- Total MCP tools increased from 50 to 53 (added 3 activity log tools)
- Task CREATE, UPDATE, BULK_CREATE, and BULK_UPDATE now support duration parameters
- Enhanced testing infrastructure with Duration & Reopen Operations test suite

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
- # All tests pass with updated dependencies
  - Comprehensive test suite with 5 integration tests
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

- **Tool Count**: Increased from 28 to 31 tools (task reopen + quick add + section update + section delete)
- **Type System**: Extended with `DurationUnit`, `TaskDuration`, `ReopenTaskArgs`, `QuickAddTaskArgs`, `QuickAddTaskResult`, `UpdateSectionArgs`, `DeleteSectionArgs` types
- **Task Tools**: CREATE, UPDATE, BULK_CREATE, and BULK_UPDATE now support duration parameters
- **Enhanced Testing**: Test suite now includes Duration & Reopen Operations, Quick Add tests, and Section tests (5 suites, 28+ tests)
  > > > > > > > d5651c6 (feat: add task duration support and reopen capability (Phase 4) (#57))

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
