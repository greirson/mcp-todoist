import { describe, expect, test, jest } from "@jest/globals";
import { handleBulkUpdateTasks } from "../handlers/task-handlers";
import type { TodoistApi } from "@doist/todoist-api-typescript";
import type { TodoistTask } from "../types.js";

function createMockTodoistClient(tasks: TodoistTask[]) {
  const getTasks = jest
    .fn<() => Promise<TodoistTask[]>>()
    .mockImplementation(async () => tasks);
  const updateTask = jest
    .fn<(taskId: string, updateData: any) => Promise<TodoistTask>>()
    .mockImplementation(async (taskId: string, updateData: any) => {
      const original = tasks.find((task) => task.id === taskId);
      if (!original) {
        throw new Error(`Task ${taskId} not found`);
      }

      return {
        ...original,
        ...(updateData.content ? { content: updateData.content } : {}),
        ...(updateData.description
          ? { description: updateData.description }
          : {}),
        due: original.due,
        priority:
          updateData.priority !== undefined
            ? updateData.priority
            : original.priority,
        labels: original.labels,
      } satisfies TodoistTask;
    });

  const mockClient = {
    getTasks,
    updateTask,
    getProjects: jest
      .fn<() => Promise<unknown>>()
      .mockImplementation(async () => []),
  } as unknown as TodoistApi;

  return { mockClient, getTasks, updateTask };
}

describe("filterTasksByCriteria", () => {
  test("updates only tasks strictly before due_before date", async () => {
    const tasks: TodoistTask[] = [
      {
        id: "before-cutoff",
        content: "Task before cutoff",
        due: {
          date: "2025-09-04",
          string: "Sep 4, 2025",
        },
        priority: 1,
      },
      {
        id: "on-cutoff",
        content: "Task on cutoff",
        due: {
          date: "2025-09-05",
          string: "Sep 5, 2025",
        },
        priority: 1,
      },
      {
        id: "after-cutoff",
        content: "Task after cutoff",
        due: {
          date: "2025-09-07",
          string: "Sep 7, 2025",
        },
        priority: 1,
      },
      {
        id: "natural-language",
        content: "Natural language due",
        due: {
          string: "Tomorrow",
        },
        priority: 1,
      },
    ];

    const { mockClient, updateTask } = createMockTodoistClient(tasks);

    await handleBulkUpdateTasks(mockClient, {
      search_criteria: {
        due_before: "2025-09-05",
      },
      updates: {
        priority: 3,
      },
    });

    const updatedTaskIds = updateTask.mock.calls.map(([taskId]) => taskId);
    expect(updatedTaskIds).toEqual(["before-cutoff"]);
  });

  test("updates only tasks strictly after due_after date", async () => {
    const tasks: TodoistTask[] = [
      {
        id: "before-window",
        content: "Due before window",
        due: {
          date: "2025-09-04",
          string: "Sep 4, 2025",
        },
        priority: 1,
      },
      {
        id: "at-window",
        content: "Due on boundary",
        due: {
          date: "2025-09-05",
          string: "Sep 5, 2025",
        },
        priority: 1,
      },
      {
        id: "after-window-date",
        content: "Due just after window",
        due: {
          date: "2025-09-06",
          string: "Sep 6, 2025",
        },
        priority: 1,
      },
      {
        id: "after-window-datetime",
        content: "Due after window with time",
        due: {
          datetime: "2025-09-07T10:00:00Z",
          string: "Sep 7, 2025 10:00",
        },
        priority: 1,
      },
    ];

    const { mockClient, updateTask } = createMockTodoistClient(tasks);

    await handleBulkUpdateTasks(mockClient, {
      search_criteria: {
        due_after: "2025-09-05",
      },
      updates: {
        priority: 2,
      },
    });

    const updatedTaskIds = updateTask.mock.calls.map(([taskId]) => taskId);
    expect(updatedTaskIds).toEqual([
      "after-window-date",
      "after-window-datetime",
    ]);
  });

  test("handles combined due_after and due_before window", async () => {
    const tasks: TodoistTask[] = [
      {
        id: "outside-low",
        content: "Before window",
        due: {
          date: "2025-09-01",
          string: "Sep 1, 2025",
        },
        priority: 1,
      },
      {
        id: "inside-window",
        content: "Within window",
        due: {
          date: "2025-09-06",
          string: "Sep 6, 2025",
        },
        priority: 1,
      },
      {
        id: "outside-high",
        content: "After window",
        due: {
          date: "2025-09-10",
          string: "Sep 10, 2025",
        },
        priority: 1,
      },
    ];

    const { mockClient, updateTask } = createMockTodoistClient(tasks);

    await handleBulkUpdateTasks(mockClient, {
      search_criteria: {
        due_after: "2025-09-03",
        due_before: "2025-09-08",
      },
      updates: {
        priority: 4,
      },
    });

    const updatedTaskIds = updateTask.mock.calls.map(([taskId]) => taskId);
    expect(updatedTaskIds).toEqual(["inside-window"]);
  });
});
