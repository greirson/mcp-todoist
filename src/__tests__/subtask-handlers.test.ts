import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { TodoistApi, Task } from "@doist/todoist-api-typescript";

// Create mock functions - types inferred from usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAddTask = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetTasks = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDeleteTask = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetTask = jest.fn<any>();

jest.mock("@doist/todoist-api-typescript", () => ({
  TodoistApi: jest.fn().mockImplementation(() => ({
    addTask: mockAddTask,
    getTasks: mockGetTasks,
    deleteTask: mockDeleteTask,
    getTask: mockGetTask,
  })),
}));

// Mock the api-helpers module so fetchAllTasks delegates to mock client
jest.mock("../utils/api-helpers.js", () => {
  const actual = jest.requireActual("../utils/api-helpers.js") as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    fetchAllTasks: jest.fn(
      async (client: { getTasks: () => Promise<unknown> }) => {
        const result = await client.getTasks();
        return Array.isArray(result) ? result : [];
      }
    ),
  };
});

// Mock the cache module to prevent caching issues between tests
jest.mock("../cache.js", () => ({
  SimpleCache: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue(null), // Always return cache miss
    set: jest.fn(),
    clear: jest.fn(),
    delete: jest.fn(),
  })),
  CacheManager: {
    getInstance: jest.fn().mockReturnValue({
      clearAll: jest.fn(),
      getOrCreateCache: jest.fn(),
    }),
  },
}));

// Import after mocking
import {
  handleCreateSubtask,
  handleConvertToSubtask,
  handlePromoteSubtask,
  handleGetTaskHierarchy,
  handleBulkCreateSubtasks,
} from "../handlers/subtask-handlers";
import { ValidationError } from "../errors";

// Helper to create a mock TodoistApi instance
function createMockClient(): TodoistApi {
  return {
    addTask: mockAddTask,
    getTasks: mockGetTasks,
    deleteTask: mockDeleteTask,
    getTask: mockGetTask,
  } as unknown as TodoistApi;
}

// Sample task data for tests - cast through unknown
const mockParentTask = {
  id: "parent-123",
  content: "Parent Task",
  projectId: "project-1",
  parentId: null,
  isCompleted: false,
  description: "",
  labels: [] as string[],
  priority: 1,
} as unknown as Task;

const mockSubtask = {
  id: "subtask-456",
  content: "Subtask",
  projectId: "project-1",
  parentId: "parent-123",
  isCompleted: false,
  description: "",
  labels: [] as string[],
  priority: 1,
} as unknown as Task;

const mockMainTask = {
  id: "task-789",
  content: "Main Task",
  projectId: "project-1",
  parentId: null,
  isCompleted: false,
  description: "Task description",
  labels: ["label1"],
  priority: 2,
  due: { string: "tomorrow" },
} as unknown as Task;

describe("Subtask Handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleCreateSubtask", () => {
    it("should create a subtask under a parent task by ID", async () => {
      const client = createMockClient();
      const createdSubtask = {
        id: "new-subtask-1",
        content: "New Subtask",
        parentId: "parent-123",
        projectId: "project-1",
      } as unknown as Task;

      mockGetTask.mockResolvedValue(mockParentTask);
      mockAddTask.mockResolvedValue(createdSubtask);

      const result = await handleCreateSubtask(client, {
        parent_task_id: "parent-123",
        content: "New Subtask",
      });

      expect(result.subtask).toEqual(createdSubtask);
      expect(result.parent).toEqual(mockParentTask);
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "New Subtask",
          parentId: "parent-123",
          projectId: "project-1",
        })
      );
    });

    it("should create a subtask with optional fields", async () => {
      const client = createMockClient();
      const createdSubtask = {
        id: "new-subtask-2",
        content: "Detailed Subtask",
        parentId: "parent-123",
        projectId: "project-1",
        description: "A description",
        priority: 4,
        labels: ["urgent"],
      } as unknown as Task;

      mockGetTask.mockResolvedValue(mockParentTask);
      mockAddTask.mockResolvedValue(createdSubtask);

      const result = await handleCreateSubtask(client, {
        parent_task_id: "parent-123",
        content: "Detailed Subtask",
        description: "A description",
        priority: 1, // User priority 1 = API priority 4
        labels: ["urgent"],
        due_string: "tomorrow",
      });

      expect(result.subtask).toEqual(createdSubtask);
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Detailed Subtask",
          description: "A description",
          priority: 4,
          labels: ["urgent"],
          dueString: "tomorrow",
        })
      );
    });

    it("should find parent task by name", async () => {
      const client = createMockClient();
      const createdSubtask = {
        id: "new-subtask-3",
        content: "Subtask by Name",
        parentId: "parent-123",
        projectId: "project-1",
      } as unknown as Task;

      mockGetTasks.mockResolvedValue([mockParentTask, mockMainTask]);
      mockAddTask.mockResolvedValue(createdSubtask);

      const result = await handleCreateSubtask(client, {
        parent_task_name: "Parent Task",
        content: "Subtask by Name",
      });

      expect(result.subtask).toEqual(createdSubtask);
      expect(result.parent.id).toBe("parent-123");
    });

    it("should throw when parent task not found", async () => {
      const client = createMockClient();

      mockGetTask.mockRejectedValue(new Error("Task not found"));

      await expect(
        handleCreateSubtask(client, {
          parent_task_id: "nonexistent-id",
          content: "Orphan Subtask",
        })
      ).rejects.toThrow();
    });

    it("should throw ValidationError for empty content", async () => {
      const client = createMockClient();

      await expect(
        handleCreateSubtask(client, {
          parent_task_id: "parent-123",
          content: "",
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("handleConvertToSubtask", () => {
    it("should convert a main task to a subtask", async () => {
      const client = createMockClient();
      const convertedTask = {
        ...mockMainTask,
        id: "converted-task-1",
        parentId: "parent-123",
      } as unknown as Task;

      mockGetTask
        .mockResolvedValueOnce(mockMainTask)
        .mockResolvedValueOnce(mockParentTask);
      mockDeleteTask.mockResolvedValue(true);
      mockAddTask.mockResolvedValue(convertedTask);

      const result = await handleConvertToSubtask(client, {
        task_id: "task-789",
        parent_task_id: "parent-123",
      });

      expect(result.task.parentId).toBe("parent-123");
      expect(mockDeleteTask).toHaveBeenCalledWith("task-789");
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Main Task",
          parentId: "parent-123",
        })
      );
    });

    it("should preserve task properties when converting", async () => {
      const client = createMockClient();
      const taskWithProperties = {
        ...mockMainTask,
        description: "Keep this",
        priority: 3,
        labels: ["work", "important"],
        deadline: { date: "2024-12-31" },
      } as unknown as Task;
      const convertedTask = {
        ...taskWithProperties,
        id: "converted-task-2",
        parentId: "parent-123",
      } as unknown as Task;

      mockGetTask
        .mockResolvedValueOnce(taskWithProperties)
        .mockResolvedValueOnce(mockParentTask);
      mockDeleteTask.mockResolvedValue(true);
      mockAddTask.mockResolvedValue(convertedTask);

      await handleConvertToSubtask(client, {
        task_id: "task-789",
        parent_task_id: "parent-123",
      });

      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Keep this",
          priority: 3,
          labels: ["work", "important"],
          deadline: { date: "2024-12-31" },
        })
      );
    });

    it("should throw if task is already a subtask", async () => {
      const client = createMockClient();

      mockGetTask
        .mockResolvedValueOnce(mockSubtask) // Task is already a subtask
        .mockResolvedValueOnce(mockParentTask);

      await expect(
        handleConvertToSubtask(client, {
          task_id: "subtask-456",
          parent_task_id: "parent-123",
        })
      ).rejects.toThrow();
    });

    it("should throw when task not found", async () => {
      const client = createMockClient();

      mockGetTask.mockRejectedValue(new Error("Task not found"));

      await expect(
        handleConvertToSubtask(client, {
          task_id: "nonexistent-id",
          parent_task_id: "parent-123",
        })
      ).rejects.toThrow();
    });
  });

  describe("handlePromoteSubtask", () => {
    it("should promote a subtask to a main task", async () => {
      const client = createMockClient();
      const promotedTask = {
        ...mockSubtask,
        id: "promoted-task-1",
        parentId: null,
      } as unknown as Task;

      mockGetTask.mockResolvedValue(mockSubtask);
      mockDeleteTask.mockResolvedValue(true);
      mockAddTask.mockResolvedValue(promotedTask);

      const result = await handlePromoteSubtask(client, {
        subtask_id: "subtask-456",
      });

      expect(result.parentId).toBeNull();
      expect(mockDeleteTask).toHaveBeenCalledWith("subtask-456");
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Subtask",
          projectId: "project-1",
        })
      );
    });

    it("should promote subtask to a specific project", async () => {
      const client = createMockClient();
      const promotedTask = {
        ...mockSubtask,
        id: "promoted-task-2",
        parentId: null,
        projectId: "new-project",
      } as unknown as Task;

      mockGetTask.mockResolvedValue(mockSubtask);
      mockDeleteTask.mockResolvedValue(true);
      mockAddTask.mockResolvedValue(promotedTask);

      await handlePromoteSubtask(client, {
        subtask_id: "subtask-456",
        project_id: "new-project",
      });

      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "new-project",
        })
      );
    });

    it("should throw if task is not a subtask", async () => {
      const client = createMockClient();

      mockGetTask.mockResolvedValue(mockMainTask); // Not a subtask

      await expect(
        handlePromoteSubtask(client, {
          subtask_id: "task-789",
        })
      ).rejects.toThrow();
    });

    it("should throw when subtask not found", async () => {
      const client = createMockClient();

      mockGetTask.mockRejectedValue(new Error("Task not found"));

      await expect(
        handlePromoteSubtask(client, {
          subtask_id: "nonexistent-id",
        })
      ).rejects.toThrow();
    });
  });

  describe("handleGetTaskHierarchy", () => {
    it("should return task hierarchy for a parent task", async () => {
      const client = createMockClient();
      // Use unique IDs to avoid conflicts with other tests
      const hierarchyParent = {
        id: "hier-parent-1",
        content: "Hierarchy Parent",
        projectId: "project-1",
        parentId: null,
        isCompleted: false,
      } as unknown as Task;
      const childTask1 = {
        id: "hier-child-1",
        content: "Child 1",
        parentId: "hier-parent-1",
        projectId: "project-1",
        isCompleted: false,
      } as unknown as Task;
      const childTask2 = {
        id: "hier-child-2",
        content: "Child 2",
        parentId: "hier-parent-1",
        projectId: "project-1",
        isCompleted: true,
      } as unknown as Task;

      mockGetTask.mockResolvedValue(hierarchyParent);
      mockGetTasks.mockResolvedValue([hierarchyParent, childTask1, childTask2]);

      const result = await handleGetTaskHierarchy(client, {
        task_id: "hier-parent-1",
        include_completed: true, // Include completed tasks in hierarchy
      });

      expect(result.root.task.id).toBe("hier-parent-1");
      expect(result.root.children).toHaveLength(2);
      // Note: totalTasks includes each task + counts children in subtotal calculation
      // Parent: 1 + (children.length + sum of child.totalTasks) = 1 + (2 + 1 + 1) = 5
      expect(result.totalTasks).toBe(5);
      // completedTasks: (parent.isCompleted ? 1 : 0) + completedSubtasks
      // where completedSubtasks = childNodes.filter(completed).length + sum(child.completedTasks)
      // = 1 (one child completed) + 1 (child1.completedTasks=1) + 0 (child2.completedTasks=0) = 2
      expect(result.completedTasks).toBe(2);
    });

    it("should find topmost parent when starting from a subtask", async () => {
      const client = createMockClient();
      const grandparentTask = {
        id: "grandparent-1",
        content: "Grandparent",
        parentId: null,
        projectId: "project-1",
        isCompleted: false,
      } as unknown as Task;
      const parentTask = {
        id: "parent-1",
        content: "Parent",
        parentId: "grandparent-1",
        projectId: "project-1",
        isCompleted: false,
      } as unknown as Task;
      const childTask = {
        id: "child-1",
        content: "Child",
        parentId: "parent-1",
        projectId: "project-1",
        isCompleted: false,
      } as unknown as Task;

      mockGetTask.mockResolvedValue(childTask);
      mockGetTasks.mockResolvedValue([grandparentTask, parentTask, childTask]);

      const result = await handleGetTaskHierarchy(client, {
        task_id: "child-1",
      });

      expect(result.root.task.id).toBe("grandparent-1");
      expect(result.originalTaskId).toBe("child-1");
    });

    it("should calculate completion percentage correctly", async () => {
      const client = createMockClient();
      // Use unique IDs to avoid conflicts with other tests
      const calcParent = {
        id: "calc-parent-1",
        content: "Calc Parent",
        parentId: null,
        projectId: "project-1",
        isCompleted: false,
      } as unknown as Task;
      const completedChild = {
        id: "calc-child-1",
        content: "Completed Child",
        parentId: "calc-parent-1",
        projectId: "project-1",
        isCompleted: true,
      } as unknown as Task;
      const incompleteChild = {
        id: "calc-child-2",
        content: "Incomplete Child",
        parentId: "calc-parent-1",
        projectId: "project-1",
        isCompleted: false,
      } as unknown as Task;

      mockGetTask.mockResolvedValue(calcParent);
      mockGetTasks.mockResolvedValue([
        calcParent,
        completedChild,
        incompleteChild,
      ]);

      const result = await handleGetTaskHierarchy(client, {
        task_id: "calc-parent-1",
        include_completed: true, // Include completed tasks for percentage calculation
      });

      // Note: totalTasks = 1 + (children.length + sum of child.totalTasks) = 1 + (2 + 1 + 1) = 5
      expect(result.totalTasks).toBe(5);
      // completedTasks = (parent.isCompleted ? 1 : 0) + completedSubtasks
      // where completedSubtasks = childNodes.filter(completed).length + sum(child.completedTasks)
      // = 1 (one child completed) + 1 (completedChild.completedTasks=1) + 0 = 2
      expect(result.completedTasks).toBe(2);
      // overallCompletion = (2 / 5) * 100 = 40%
      expect(result.overallCompletion).toBe(40);
    });

    it("should throw when task not found", async () => {
      const client = createMockClient();

      mockGetTask.mockRejectedValue(new Error("Task not found"));

      await expect(
        handleGetTaskHierarchy(client, {
          task_id: "nonexistent-id",
        })
      ).rejects.toThrow();
    });
  });

  describe("handleBulkCreateSubtasks", () => {
    it("should create multiple subtasks under a parent", async () => {
      const client = createMockClient();
      const createdSubtask1 = {
        id: "bulk-subtask-1",
        content: "Bulk Subtask 1",
        parentId: "parent-123",
      } as unknown as Task;
      const createdSubtask2 = {
        id: "bulk-subtask-2",
        content: "Bulk Subtask 2",
        parentId: "parent-123",
      } as unknown as Task;

      mockGetTask.mockResolvedValue(mockParentTask);
      mockAddTask
        .mockResolvedValueOnce(createdSubtask1)
        .mockResolvedValueOnce(createdSubtask2);

      const result = await handleBulkCreateSubtasks(client, {
        parent_task_id: "parent-123",
        subtasks: [
          { content: "Bulk Subtask 1" },
          { content: "Bulk Subtask 2" },
        ],
      });

      expect(result.parent.id).toBe("parent-123");
      expect(result.created).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it("should handle partial failures in bulk creation", async () => {
      const client = createMockClient();
      const createdSubtask = {
        id: "bulk-subtask-1",
        content: "Success Subtask",
        parentId: "parent-123",
      } as unknown as Task;

      mockGetTask.mockResolvedValue(mockParentTask);
      mockAddTask
        .mockResolvedValueOnce(createdSubtask)
        .mockRejectedValueOnce(new Error("API Error"));

      const result = await handleBulkCreateSubtasks(client, {
        parent_task_id: "parent-123",
        subtasks: [{ content: "Success Subtask" }, { content: "Fail Subtask" }],
      });

      expect(result.created).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].task.content).toBe("Fail Subtask");
      expect(result.failed[0].error).toBe("API Error");
    });

    it("should throw ValidationError for empty subtasks array", async () => {
      const client = createMockClient();

      await expect(
        handleBulkCreateSubtasks(client, {
          parent_task_id: "parent-123",
          subtasks: [],
        })
      ).rejects.toThrow(); // Error is wrapped by ErrorHandler
    });

    it("should throw when parent task not found", async () => {
      const client = createMockClient();

      mockGetTask.mockRejectedValue(new Error("Task not found"));

      await expect(
        handleBulkCreateSubtasks(client, {
          parent_task_id: "nonexistent-id",
          subtasks: [{ content: "Orphan Subtask" }],
        })
      ).rejects.toThrow();
    });

    it("should validate each subtask content", async () => {
      const client = createMockClient();
      const createdSubtask = {
        id: "bulk-subtask-1",
        content: "Valid Subtask",
        parentId: "parent-123",
      } as unknown as Task;

      mockGetTask.mockResolvedValue(mockParentTask);
      mockAddTask.mockResolvedValue(createdSubtask);

      const result = await handleBulkCreateSubtasks(client, {
        parent_task_id: "parent-123",
        subtasks: [
          { content: "Valid Subtask" },
          { content: "" }, // Invalid empty content
        ],
      });

      expect(result.created).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain("content");
    });
  });
});
