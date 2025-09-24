import { handleGetTasks } from "../handlers/task-handlers.js";
import { TodoistApi } from "@doist/todoist-api-typescript";
import { GetTasksArgs } from "../types.js";

// Mock the TodoistApi
jest.mock("@doist/todoist-api-typescript");

const mockLabels: any[] = [
  { id: "123", name: "urgent", color: "red", order: 1, is_favorite: false },
  {
    id: "456",
    name: "test-label",
    color: "blue",
    order: 2,
    is_favorite: false,
  },
];

const mockTasks = [
  {
    id: "task1",
    content: "Task with urgent label",
    labels: ["urgent"],
    projectId: "project1",
    priority: 1,
  },
  {
    id: "task2",
    content: "Task with test-label",
    labels: ["test-label"],
    projectId: "project1",
    priority: 2,
  },
  {
    id: "task3",
    content: "Task with both labels",
    labels: ["urgent", "test-label"],
    projectId: "project1",
    priority: 3,
  },
  {
    id: "task4",
    content: "Task without labels",
    labels: [],
    projectId: "project1",
    priority: 4,
  },
];

describe("Label Filter Fix (Issue #35)", () => {
  let mockTodoistClient: jest.Mocked<TodoistApi>;

  beforeEach(() => {
    mockTodoistClient = new TodoistApi("test-token") as jest.Mocked<TodoistApi>;
    mockTodoistClient.getTasks = jest.fn().mockResolvedValue(mockTasks);
    mockTodoistClient.getTasksByFilter = jest.fn().mockResolvedValue(mockTasks);
    mockTodoistClient.getLabels = jest.fn().mockResolvedValue(mockLabels);
  });

  describe("label_id parameter", () => {
    it("should filter by numeric label ID", async () => {
      const args: GetTasksArgs = {
        label_id: "123",
      };

      const result = await handleGetTasks(mockTodoistClient, args);
      expect(result).toContain("2 tasks found");
      expect(result).toContain("Task with urgent label");
      expect(result).toContain("Task with both labels");
      expect(result).not.toContain("Task with test-label");
      expect(result).not.toContain("Task without labels");
    });

    it("should filter by label name", async () => {
      const args: GetTasksArgs = {
        label_id: "test-label",
      };

      const result = await handleGetTasks(mockTodoistClient, args);
      expect(result).toContain("2 tasks found");
      expect(result).toContain("Task with test-label");
      expect(result).toContain("Task with both labels");
      expect(result).not.toContain("Task with urgent label");
      expect(result).not.toContain("Task without labels");
    });

    it("should filter by label name with @ prefix", async () => {
      const args: GetTasksArgs = {
        label_id: "@urgent",
      };

      const result = await handleGetTasks(mockTodoistClient, args);
      expect(result).toContain("2 tasks found");
      expect(result).toContain("Task with urgent label");
      expect(result).toContain("Task with both labels");
    });

    it("should handle hyphenated label names", async () => {
      const args: GetTasksArgs = {
        label_id: "test-label",
      };

      const result = await handleGetTasks(mockTodoistClient, args);
      expect(result).toContain("2 tasks found");
      expect(result).toContain("Task with test-label");
    });

    it("should return no tasks for non-existent label", async () => {
      const args: GetTasksArgs = {
        label_id: "nonexistent",
      };

      const result = await handleGetTasks(mockTodoistClient, args);
      expect(result).toContain("No tasks found");
    });
  });

  describe("filter parameter with @label syntax", () => {
    it("should filter by @label in filter string", async () => {
      const args: GetTasksArgs = {
        filter: "@urgent",
      };

      // Mock the filter response to return only tasks with "urgent" label
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(mockTasks);

      const result = await handleGetTasks(mockTodoistClient, args);
      // After client-side filtering for @urgent
      expect(result).toContain("2 tasks found");
      expect(result).toContain("Task with urgent label");
      expect(result).toContain("Task with both labels");
    });

    it("should handle hyphenated labels in filter", async () => {
      const args: GetTasksArgs = {
        filter: "@test-label",
      };

      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(mockTasks);

      const result = await handleGetTasks(mockTodoistClient, args);
      expect(result).toContain("2 tasks found");
      expect(result).toContain("Task with test-label");
      expect(result).toContain("Task with both labels");
    });

    it("should handle multiple labels in filter", async () => {
      const args: GetTasksArgs = {
        filter: "@urgent & @test-label",
      };

      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(mockTasks);

      const result = await handleGetTasks(mockTodoistClient, args);
      // Should only return tasks that have both labels
      expect(result).toContain("1 task found");
      expect(result).toContain("Task with both labels");
    });
  });

  describe("edge cases", () => {
    it("should handle tasks with undefined labels array", async () => {
      const tasksWithUndefinedLabels = [
        {
          id: "task5",
          content: "Task with undefined labels",
          projectId: "project1",
          priority: 1,
          // labels is undefined
        },
      ];

      mockTodoistClient.getTasks = jest
        .fn()
        .mockResolvedValue(tasksWithUndefinedLabels);

      const args: GetTasksArgs = {
        label_id: "urgent",
      };

      const result = await handleGetTasks(mockTodoistClient, args);
      expect(result).toContain("No tasks found");
    });
  });
});
