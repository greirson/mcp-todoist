# MCP Todoist Feature Gap Analysis & Roadmap

## Current State Summary

**Current Version**: 0.8.9
**MCP SDK**: @modelcontextprotocol/sdk v1.17.1
**Todoist API Client**: @doist/todoist-api-typescript v5.1.1
**Current Tools**: 28 MCP tools (29 with active PR)

---

## Active PR: Completed Tasks Reporting (JayToltTech/feature/completed-tasks-reporting)

**New Tool**: `todoist_completed_tasks_get` - Retrieves completed tasks using Sync API
- Filter by project, date range (since/until in ISO 8601)
- Pagination support (limit, offset)
- Optional notes annotation

---

## FEATURE GAP ANALYSIS

### Legend
- [x] **Implemented** - Currently available
- [~] **In PR** - Available in active pull request
- [ ] **Not Implemented** - API supports but we don't have it
- [/] **Partial** - Some functionality implemented

---

## 1. TASK FEATURES

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| Create task | [x] | Yes | Full support |
| Get active tasks | [x] | Yes | With filtering |
| Update task | [x] | Yes | By ID or name search |
| Delete task | [x] | Yes | By ID or name search |
| Complete task | [x] | Yes | By ID or name search |
| **Reopen task** | [ ] | `reopenTask()` | SDK has this method |
| Bulk create | [x] | Yes | Sequential processing |
| Bulk update/delete/complete | [x] | Yes | Flexible criteria |
| Get completed tasks | [~] | Sync API | In active PR |
| **Duration** | [ ] | `duration`, `durationUnit` | Amount + unit (minute/day) |
| **Quick Add** | [ ] | `POST /tasks/quick` | Natural language parsing |
| **Assignee** | [ ] | `responsible_uid` | For shared projects |
| **Assigned by** | [ ] | `assigned_by_uid` | For shared projects |
| Child order | [ ] | `child_order` | Sibling ordering |
| Day order | [ ] | `day_order` | Today view ordering |
| Is collapsed | [ ] | `is_collapsed` | Subtask visibility |
| Added at timestamp | [x] | Yes | Read-only from API |
| Updated at timestamp | [x] | Yes | Read-only from API |

### Task Fields - Current vs Available

**Currently Supported (Create/Update)**:
- content, description, priority, due_string, deadline_date, labels, project_id, section_id

**Missing Fields**:
- `duration` (object: amount + unit)
- `durationUnit` (minute or day)
- `responsible_uid` (assignee)
- `child_order` (task ordering)
- `day_order` (today view order)
- `is_collapsed` (subtask visibility)

---

## 2. PROJECT FEATURES

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| List projects | [x] | Yes | Full support |
| Create project | [x] | Yes | Name, color, favorite |
| **Update project** | [ ] | `updateProject()` | SDK has this method |
| **Delete project** | [ ] | `deleteProject()` | SDK has this method |
| **Archive project** | [ ] | Sync API | Archive/unarchive |
| **Project description** | [ ] | `description` | API supports it |
| **Sub-projects** | [ ] | `parent_id` | Hierarchical projects |
| **View style** | [ ] | `view_style` | list/board view |
| **Collaborators** | [ ] | `getProjectCollaborators()` | SDK method available |

### Project Fields - Current vs Available

**Currently Supported**:
- name, color, is_favorite

**Missing Fields**:
- `description` (project description)
- `parent_id` (sub-projects)
- `view_style` (list/board)
- `is_archived` (archive status)

---

## 3. SECTION FEATURES

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| List sections | [x] | Yes | By project or all |
| Create section | [x] | Yes | Name + project_id |
| **Update section** | [ ] | `updateSection()` | SDK has this method |
| **Delete section** | [ ] | `deleteSection()` | SDK has this method |
| **Section order** | [ ] | `section_order` | Ordering within project |

---

## 4. LABEL FEATURES

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| List labels | [x] | Yes | Full support |
| Create label | [x] | Yes | Name, color, order, favorite |
| Update label | [x] | Yes | All attributes |
| Delete label | [x] | Yes | By ID or name |
| Label stats | [x] | Yes | Usage analytics |
| **Shared labels** | [ ] | `getSharedLabels()` | Workspace labels |

---

## 5. COMMENT FEATURES

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| Create task comment | [x] | Yes | With attachments |
| Get task comments | [x] | Yes | Full support |
| **Update comment** | [ ] | `updateComment()` | SDK has this method |
| **Delete comment** | [ ] | `deleteComment()` | SDK has this method |
| Project comments | [/] | Yes | Get only, not create |

---

## 6. REMINDER FEATURES (Not Implemented)

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| **List reminders** | [ ] | Sync API | `resource_types: ["reminders"]` |
| **Create reminder** | [ ] | Sync API | `reminder_add` command |
| **Update reminder** | [ ] | Sync API | `reminder_update` command |
| **Delete reminder** | [ ] | Sync API | `reminder_delete` command |
| **Auto-reminder** | [ ] | Quick Add API | `auto_reminder` param |

---

## 7. FILTER FEATURES (Not Implemented)

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| **List filters** | [ ] | Sync API | `resource_types: ["filters"]` |
| **Create filter** | [ ] | Sync API | `filter_add` command |
| **Update filter** | [ ] | Sync API | `filter_update` command |
| **Delete filter** | [ ] | Sync API | `filter_delete` command |

---

## 8. COLLABORATION FEATURES (Not Implemented)

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| **Get project collaborators** | [ ] | `getProjectCollaborators()` | SDK method |
| **Task assignment** | [ ] | `responsible_uid` | Assign tasks |
| **Workspace management** | [ ] | Sync API | Workspace features |

---

## 9. SYNC API FEATURES (Partially Implemented)

| Feature | Status | API Support | Notes |
|---------|--------|-------------|-------|
| **Full sync** | [ ] | `POST /sync` | Get all resources |
| **Incremental sync** | [ ] | `sync_token` | Delta updates |
| Activity log | [ ] | Sync API | User activity |
| User stats | [ ] | Sync API | Productivity stats |

---

## PRIORITY FEATURE RECOMMENDATIONS

### High Priority (Common User Needs)

1. **Duration Support** - Task time estimates
   - Add `duration` and `duration_unit` to task create/update
   - Very common for time blocking workflows

2. **Reopen Task** - Uncomplete tasks
   - SDK has `reopenTask()` method
   - Users sometimes complete tasks accidentally

3. **Quick Add** - Natural language task creation
   - `POST /api/v1/tasks/quick`
   - Powerful NLP parsing for dates, projects, labels

4. **Project CRUD** - Full project management
   - Update and delete projects
   - Sub-project support (parent_id)

5. **Section CRUD** - Full section management
   - Update and delete sections

### Medium Priority (Power User Features)

6. **Task Assignment** - Collaboration
   - `responsible_uid` for shared projects
   - Get project collaborators

7. **Comment CRUD** - Full comment management
   - Update and delete comments

8. **Reminders** - Reminder management
   - Create, update, delete reminders

### Lower Priority (Advanced Features)

9. **Filters** - Custom filter management
10. **Task Ordering** - child_order, day_order
11. **Workspace Features** - Team/workspace management
12. **Full Sync API** - Incremental sync support

---

## DEPENDABOT UPDATES AVAILABLE

Recent dependency updates detected:
- `@doist/todoist-api-typescript` -> 5.5.1 (from 5.1.1)
- `@modelcontextprotocol/sdk` -> 1.18.2 (from 1.17.1)

**Note**: Updating the Todoist API client may add new methods/features.

---

## SUMMARY TABLE

| Category | Implemented | In PR | Not Implemented |
|----------|-------------|-------|-----------------|
| Tasks | 9 tools | 1 tool | 6+ features |
| Projects | 2 tools | - | 4+ features |
| Sections | 2 tools | - | 2+ features |
| Labels | 5 tools | - | 1 feature |
| Comments | 2 tools | - | 2 features |
| Subtasks | 5 tools | - | - |
| Reminders | - | - | 4 features |
| Filters | - | - | 4 features |
| Collaboration | - | - | 3+ features |
| Testing | 3 tools | - | - |

**Total Current**: 28 tools
**Total with PR**: 29 tools
**Potential New Features**: 25+ features/tools

---

## IMPLEMENTATION ROADMAP

### Phase 4: Duration & Task Enhancements (Next)

**Goal**: Add task duration support and reopen capability

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| Duration (create) | Add `duration`, `duration_unit` params | `src/tools/task-tools.ts`, `src/handlers/task-handlers.ts`, `src/types.ts` |
| Duration (update) | Add `duration`, `duration_unit` params | Same as above |
| Duration (bulk) | Add to bulk create/update | Same as above |
| Reopen task | New `todoist_task_reopen` tool | Same + new handler function |

**API Details**:
- `duration`: `{ amount: number, unit: 'minute' | 'day' }`
- SDK method: `api.addTask({ duration: 60, durationUnit: 'minute' })`
- SDK method: `api.reopenTask(taskId)`

---

### Phase 5: Quick Add & Natural Language

**Goal**: Natural language task creation like the Todoist app

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| Quick Add | New `todoist_task_quick_add` tool | `src/tools/task-tools.ts`, `src/handlers/task-handlers.ts` |

**API Details**:
- Endpoint: `POST /api/v1/tasks/quick`
- Parses: "Buy milk tomorrow #Shopping @errands p1 {deadline in 3 days} //description"
- Optional: `note`, `reminder`, `auto_reminder`

---

### Phase 6: Full Project Management

**Goal**: Complete CRUD operations for projects

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| Update project | New `todoist_project_update` tool | `src/tools/project-tools.ts`, `src/handlers/project-handlers.ts` |
| Delete project | New `todoist_project_delete` tool | Same as above |
| Sub-projects | Add `parent_id` to create | Same as above |
| Project description | Add `description` param | Same as above |
| Archive project | New `todoist_project_archive` tool | Same as above |
| Get collaborators | New `todoist_project_collaborators_get` | Same as above |

---

### Phase 7: Full Section Management

**Goal**: Complete CRUD operations for sections

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| Update section | New `todoist_section_update` tool | `src/tools/project-tools.ts`, `src/handlers/project-handlers.ts` |
| Delete section | New `todoist_section_delete` tool | Same as above |
| Section ordering | Add `order` param | Same as above |

---

### Phase 8: Full Comment Management

**Goal**: Complete CRUD operations for comments

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| Update comment | New `todoist_comment_update` tool | `src/tools/comment-tools.ts`, `src/handlers/comment-handlers.ts` |
| Delete comment | New `todoist_comment_delete` tool | Same as above |
| Project comments create | Extend `todoist_comment_create` | Same as above |

---

### Phase 9: Task Assignment & Collaboration

**Goal**: Support shared project workflows

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| Task assignee | Add `assignee_id`/`responsible_uid` to task tools | `src/tools/task-tools.ts`, `src/handlers/task-handlers.ts` |
| Assigned by | Read-only field exposure | Same as above |
| Collaborator list | New `todoist_collaborators_get` tool | New files or extend project handlers |

---

### Phase 10: Reminder Management

**Goal**: Full reminder CRUD (requires Sync API)

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| List reminders | New `todoist_reminder_get` tool | New `src/tools/reminder-tools.ts`, `src/handlers/reminder-handlers.ts` |
| Create reminder | New `todoist_reminder_create` tool | Same as above |
| Update reminder | New `todoist_reminder_update` tool | Same as above |
| Delete reminder | New `todoist_reminder_delete` tool | Same as above |

**Note**: Requires Sync API integration

---

### Phase 11: Filter Management

**Goal**: Custom filter CRUD (requires Sync API)

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| List filters | New `todoist_filter_get` tool | New `src/tools/filter-tools.ts`, `src/handlers/filter-handlers.ts` |
| Create filter | New `todoist_filter_create` tool | Same as above |
| Update filter | New `todoist_filter_update` tool | Same as above |
| Delete filter | New `todoist_filter_delete` tool | Same as above |

---

### Phase 12: Advanced Task Features

**Goal**: Task ordering and visibility controls

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| Child order | Add `child_order` param | Task tools/handlers |
| Day order | Add `day_order` param | Task tools/handlers |
| Is collapsed | Add `is_collapsed` param | Task tools/handlers |

---

### Phase 13: Sync API Integration

**Goal**: Full sync capabilities for advanced workflows

| Feature | Tool Changes | Files to Modify |
|---------|--------------|-----------------|
| Full sync | New `todoist_sync` tool | New utility module |
| Incremental sync | Extend sync tool | Same as above |
| Activity log | New `todoist_activity_get` tool | Same as above |
| User stats | New `todoist_stats_get` tool | Same as above |

---

## TOOL COUNT PROJECTION

| Phase | New Tools | Running Total |
|-------|-----------|---------------|
| Current | 28 | 28 |
| PR (completed tasks) | 1 | 29 |
| Phase 4 (Duration) | 1 | 30 |
| Phase 5 (Quick Add) | 1 | 31 |
| Phase 6 (Projects) | 4-5 | 35-36 |
| Phase 7 (Sections) | 2 | 37-38 |
| Phase 8 (Comments) | 2 | 39-40 |
| Phase 9 (Collaboration) | 1-2 | 40-42 |
| Phase 10 (Reminders) | 4 | 44-46 |
| Phase 11 (Filters) | 4 | 48-50 |
| Phase 12 (Advanced Tasks) | 0 (params only) | 48-50 |
| Phase 13 (Sync API) | 3-4 | 51-54 |

**Final Target**: ~50-54 MCP tools

---

## IMMEDIATE NEXT STEPS (Phase 4)

1. **Update types.ts**: Add duration types
   ```typescript
   interface TaskDuration {
     amount: number;
     unit: 'minute' | 'day';
   }
   ```

2. **Update task-tools.ts**: Add duration params to CREATE_TASK_TOOL, UPDATE_TASK_TOOL, bulk tools

3. **Update task-handlers.ts**: Pass duration to API calls

4. **Add reopen handler**: Implement `handleReopenTask()` using `api.reopenTask()`

5. **Add new tool**: `REOPEN_TASK_TOOL` definition

6. **Update validation.ts**: Add duration validation

7. **Update tests**: Add duration and reopen test cases

8. **Update documentation**: README.md, CHANGELOG.md, CLAUDE.md

---

## VERIFICATION

After Phase 4 implementation:
1. Run `npm run build` - verify no TypeScript errors
2. Run `npm test` - verify all tests pass
3. Run `npm run lint` - verify code quality
4. Test with MCP client:
   - Create task with duration
   - Update task duration
   - Reopen a completed task
5. Verify dry-run mode works with new features
