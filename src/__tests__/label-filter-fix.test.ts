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
    // NOTE: When using the filter parameter, we rely entirely on the Todoist API's
    // getTasksByFilter() endpoint to handle complex filter syntax including labels,
    // boolean operators, and parentheses. No client-side filtering is applied.

    it("should pass @label filter to API and return results directly", async () => {
      const args: GetTasksArgs = {
        filter: "@urgent",
      };

      // Mock the API to return pre-filtered results (as the real API would)
      const filteredTasks = mockTasks.filter((t) =>
        t.labels.includes("urgent")
      );
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(filteredTasks);

      const result = await handleGetTasks(mockTodoistClient, args);
      expect(mockTodoistClient.getTasksByFilter).toHaveBeenCalledWith({
        query: "@urgent",
        lang: undefined,
        limit: undefined,
      });
      expect(result).toContain("2 tasks found");
      expect(result).toContain("Task with urgent label");
      expect(result).toContain("Task with both labels");
    });

    it("should pass complex filter syntax to API without client-side processing", async () => {
      const args: GetTasksArgs = {
        filter: "(@urgent | @test-label) & today",
      };

      // Mock API returning tasks that match the complex filter
      const filteredTasks = [mockTasks[0], mockTasks[1]]; // API correctly evaluates OR logic
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(filteredTasks);

      const result = await handleGetTasks(mockTodoistClient, args);
      // Verify the complex filter is passed directly to the API
      expect(mockTodoistClient.getTasksByFilter).toHaveBeenCalledWith({
        query: "(@urgent | @test-label) & today",
        lang: undefined,
        limit: undefined,
      });
      expect(result).toContain("2 tasks found");
    });

    it("should not apply additional client-side label filtering to API results", async () => {
      const args: GetTasksArgs = {
        filter: "@urgent & @test-label",
      };

      // Mock API returning the correctly filtered result
      const filteredTasks = [mockTasks[2]]; // Only "Task with both labels"
      mockTodoistClient.getTasksByFilter = jest
        .fn()
        .mockResolvedValue(filteredTasks);

      const result = await handleGetTasks(mockTodoistClient, args);
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
