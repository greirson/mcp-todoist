# Todoist MCP Server Development PRD & Implementation Guide

## 🎯 Project Goal
Enhance the Todoist MCP server (v0.5.3) with label management, subtask handling, duplicate detection, and comprehensive testing capabilities.

## 📋 Development Todo List

### Phase 1: Testing Infrastructure ✅ COMPLETED
- [x] Create `src/handlers/test-handlers.ts`
  - [x] Implement `handleTestConnection()` - Verify API token validity
  - [x] Implement `handleTestAllFeatures()` - Test each tool with minimal API calls
  - [x] Implement `handleTestPerformance()` - Measure response times
  - [x] Add test result formatting with success/failure indicators
- [x] Add test tools to `src/tools.ts`
  - [x] Define `TEST_CONNECTION_TOOL` (`todoist_test_connection`)
  - [x] Define `TEST_ALL_FEATURES_TOOL` (`todoist_test_all_features`)
  - [x] Define `TEST_PERFORMANCE_TOOL` (`todoist_test_performance`)
- [x] Update `src/index.ts` with test handlers
- [x] Create `src/__tests__/integration.test.ts` for automated testing

**Implementation Notes:**
- Fixed API response handling to support multiple formats (array, result.results, result.data)
- All test functions return properly formatted JSON with detailed metrics
- Performance test supports configurable iterations

### Phase 2: Label Management System
- [ ] Create `src/handlers/label-handlers.ts`
  - [ ] Implement `handleGetLabels()` - List all labels
  - [ ] Implement `handleCreateLabel()` - Create new label
  - [ ] Implement `handleUpdateLabel()` - Update label name/color
  - [ ] Implement `handleDeleteLabel()` - Delete label
  - [ ] Implement `handleGetLabelStats()` - Get usage statistics
- [ ] Update `src/types.ts` with label interfaces
  ```typescript
  interface TodoistLabel {
    id: string;
    name: string;
    color?: string;
    order?: number;
    is_favorite?: boolean;
  }
  ```
- [ ] Add label tools to `src/tools.ts`
- [ ] Update type guards in `src/type-guards.ts`
- [ ] Add label validation in `src/validation.ts`

### Phase 3: Subtask Management
- [ ] Create `src/handlers/subtask-handlers.ts`
  - [ ] Implement `handleCreateSubtask()` - Add subtask to parent
  - [ ] Implement `handleConvertToSubtask()` - Convert task to subtask
  - [ ] Implement `handlePromoteSubtask()` - Make subtask a main task
  - [ ] Implement `handleGetTaskHierarchy()` - Get task with all subtasks
  - [ ] Implement `handleBulkCreateSubtasks()` - Create multiple subtasks
- [ ] Update task handlers to include parent_id handling
- [ ] Add subtask-specific caching logic
- [ ] Create subtask validation functions

### Phase 4: Duplicate Detection & Merging
- [ ] Create `src/utils/similarity.ts`
  - [ ] Implement Levenshtein distance algorithm
  - [ ] Create `calculateSimilarity()` function
  - [ ] Add configurable similarity thresholds
- [ ] Create `src/handlers/intelligence-handlers.ts`
  - [ ] Implement `handleFindDuplicates()` - Find similar tasks
  - [ ] Implement `handleMergeTasks()` - Merge duplicate tasks
  - [ ] Implement `handleFindSimilar()` - Find related tasks
  - [ ] Implement `handleAutoDeduplication()` - Automatic cleanup
- [ ] Create `src/utils/task-merger.ts`
  - [ ] Merge logic preserving all metadata
  - [ ] Conflict resolution for different fields
  - [ ] Comment consolidation

### Phase 5: Project Analytics
- [ ] Create `src/handlers/analytics-handlers.ts`
  - [ ] Implement `handleProjectSummary()` - Comprehensive stats
  - [ ] Implement `handleProjectHealth()` - Health score calculation
  - [ ] Implement `handlePortfolioOverview()` - All projects summary
- [ ] Create `src/utils/analytics.ts`
  - [ ] Task completion rate calculations
  - [ ] Overdue task analysis
  - [ ] Productivity trends
  - [ ] Health score algorithm

## 🏗️ Implementation Details

### 1. Test Handler Implementation ✅ COMPLETED

The test handlers have been fully implemented with the following tools:

**Available Test Tools:**
- `todoist_test_connection` - Quick API token validation
- `todoist_test_all_features` - Comprehensive feature testing (tasks, projects, labels, sections, comments)
- `todoist_test_performance` - Performance benchmarking with configurable iterations

**Key Implementation Details:**
```typescript
// Handles multiple API response formats
const result = await todoistClient.getProjects();
const projectArray = Array.isArray(result)
  ? result
  : (result as any)?.results || (result as any)?.data || [];

// Comprehensive test result format
interface ComprehensiveTestResult {
  overallStatus: "success" | "partial" | "error";
  totalTests: number;
  passed: number;
  failed: number;
  features: FeatureTestResult[];
  totalResponseTime: number;
  timestamp: string;
}
```

### 2. Similarity Detection Implementation

```typescript
// src/utils/similarity.ts
export function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Quick exact match check
  if (s1 === s2) return 1.0;
  
  // Levenshtein distance calculation
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  // Convert to similarity score (0-1)
  return 1 - (distance / maxLength);
}

export function findDuplicateTasks(
  tasks: TodoistTask[],
  threshold: number = 0.8
): DuplicateGroup[] {
  const duplicates: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < tasks.length; i++) {
    if (processed.has(tasks[i].id)) continue;
    
    const group: TodoistTask[] = [tasks[i]];
    
    for (let j = i + 1; j < tasks.length; j++) {
      if (processed.has(tasks[j].id)) continue;
      
      const similarity = calculateSimilarity(
        tasks[i].content,
        tasks[j].content
      );
      
      if (similarity >= threshold) {
        group.push(tasks[j]);
        processed.add(tasks[j].id);
      }
    }
    
    if (group.length > 1) {
      duplicates.push({
        tasks: group,
        similarity: calculateGroupSimilarity(group),
        suggestedMaster: selectMasterTask(group)
      });
    }
  }
  
  return duplicates;
}
```

### 3. Label Management Implementation

```typescript
// src/handlers/label-handlers.ts
export async function handleGetLabelStats(
  todoistClient: TodoistApi
): Promise<LabelStatistics[]> {
  const [labels, tasks] = await Promise.all([
    todoistClient.getLabels(),
    todoistClient.getTasks()
  ]);
  
  const stats = labels.map(label => {
    const tasksWithLabel = tasks.filter(task => 
      task.labels?.includes(label.name)
    );
    
    const completedTasks = tasksWithLabel.filter(task => 
      task.isCompleted
    ).length;
    
    return {
      label: label.name,
      totalTasks: tasksWithLabel.length,
      completedTasks,
      completionRate: tasksWithLabel.length > 0 
        ? (completedTasks / tasksWithLabel.length) * 100 
        : 0,
      color: label.color,
      mostRecentUse: getMostRecentTaskDate(tasksWithLabel)
    };
  });
  
  return stats.sort((a, b) => b.totalTasks - a.totalTasks);
}
```

### 4. Subtask Hierarchy Implementation

```typescript
// src/handlers/subtask-handlers.ts
export async function handleGetTaskHierarchy(
  todoistClient: TodoistApi,
  args: { task_id?: string; task_name?: string }
): Promise<TaskHierarchy> {
  const rootTask = await findTask(todoistClient, args);
  
  // Recursively build task tree
  async function buildTaskTree(task: TodoistTask): Promise<TaskNode> {
    const subtasks = await todoistClient.getTasks({
      filter: `#${task.projectId} & subtask_of:${task.id}`
    });
    
    const children = await Promise.all(
      subtasks.map(subtask => buildTaskTree(subtask))
    );
    
    return {
      task,
      children,
      depth: calculateDepth(task),
      completionPercentage: calculateCompletion(task, children)
    };
  }
  
  return buildTaskTree(rootTask);
}
```

## 🧪 Testing Strategy

### Unit Tests Required
- [ ] Similarity algorithm tests
- [ ] Label validation tests
- [ ] Subtask hierarchy tests
- [ ] Merge logic tests

### Integration Tests Required
- [ ] Full feature test suite
- [ ] API error handling
- [ ] Cache invalidation
- [ ] Performance benchmarks

## 📊 Success Criteria

1. **Testing Tool** ✅ COMPLETED
   - ✓ Can verify all features work in <5 seconds
   - ✓ Generates readable JSON report with detailed metrics
   - ✓ Identifies configuration issues and API response variations
   - ✓ Supports performance benchmarking with configurable iterations

2. **Label Management**
   - ✓ Full CRUD operations work
   - ✓ Statistics calculated correctly
   - ✓ <200ms response time

3. **Duplicate Detection**
   - ✓ 90%+ accuracy in finding duplicates
   - ✓ Handles 1000+ tasks efficiently
   - ✓ Configurable similarity threshold

4. **Subtask Management**
   - ✓ Maintains proper hierarchy
   - ✓ Bulk operations supported
   - ✓ Progress calculation accurate

## 🚀 Quick Start for Development

1. **Setup Development Environment**
   ```bash
   npm install
   npm run watch  # Start TypeScript compiler in watch mode
   ```

2. **Test Incrementally**
   ```bash
   # After implementing each handler
   npm run test:watch
   ```

3. **Manual Testing**
   ```bash
   # Set test token
   export TODOIST_API_TOKEN="your_test_token"
   
   # Run server
   npm run build && node dist/index.js
   ```

## 📝 Code Style Guidelines

- Use existing error handling patterns from `src/errors.ts`
- Follow the handler pattern from existing handlers
- Add comprehensive JSDoc comments
- Validate all inputs using `src/validation.ts` patterns
- Update README.md with new features

## 🔧 Configuration Updates Needed

### package.json
```json
{
  "dependencies": {
    "string-similarity": "^4.0.4"  // For fuzzy matching
  }
}
```

### New Error Types
```typescript
// src/errors.ts
export class LabelNotFoundError extends TodoistMCPError { }
export class DuplicateTaskError extends TodoistMCPError { }
export class SubtaskError extends TodoistMCPError { }
```

## 🎁 Bonus Features (If Time Permits)

- [ ] Natural language task creation improvements
- [ ] Recurring task pattern optimization
- [ ] Markdown report generation for test results
- [ ] Task template system
- [ ] Batch label operations

## 📚 Reference Documentation

- [Todoist API v2 Docs](https://developer.todoist.com/rest/v2/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- Existing handler patterns in `src/handlers/`
- Type definitions in `@doist/todoist-api-typescript`

---

## 🚀 Next Steps

**Phase 1 (Testing Infrastructure) ✅ COMPLETED**

Now ready to proceed with:
1. **Phase 2: Label Management System** - Full CRUD operations for labels with usage statistics
2. **Phase 3: Subtask Management** - Hierarchical task management with parent-child relationships
3. **Phase 4: Duplicate Detection** - Smart task deduplication using similarity algorithms
4. **Phase 5: Project Analytics** - Comprehensive project health metrics and insights

All future development can now be verified using the testing tools:
- Run `todoist_test_all_features` after implementing each phase
- Use `todoist_test_performance` to ensure response times stay under 200ms
- Validate changes don't break existing functionality