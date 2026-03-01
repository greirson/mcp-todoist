import { describe, expect, test, jest } from "@jest/globals";
import type { TodoistApi } from "@doist/todoist-api-typescript";
import type { TodoistTask } from "../types.js";

// Mock the api-helpers module so fetchAllTasks delegates to mock client
jest.mock("../utils/api-helpers.js", () => {
  const actual = jest.requireActual("../utils/api-helpers.js") as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    fetchAllTasks: jest.fn(
      async (
        client: { getTasks: (params?: unknown) => Promise<unknown> },
        params?: unknown
      ) => {
        const result = await client.getTasks(params);
        if (Array.isArray(result)) return result;
        const obj = result as { results?: unknown[] };
        return obj?.results || [];
      }
    ),
  };
});

import {
  handleUpdateTask,
  handleBulkUpdateTasks,
} from "../handlers/task-handlers";

type ApiTask = Awaited<ReturnType<TodoistApi["getTask"]>>;
type ApiTaskList = Awaited<ReturnType<TodoistApi["moveTasks"]>>;
type ApiTaskUpdate = Awaited<ReturnType<TodoistApi["updateTask"]>>;
type ApiTasksResponse = Awaited<ReturnType<TodoistApi["getTasks"]>>;
type ApiProjectsResponse = Awaited<ReturnType<TodoistApi["getProjects"]>>;

describe("handleUpdateTask section moves", () => {
  test("calls moveTasks when section_id is provided", async () => {
    const task: TodoistTask = {
      id: "123",
      content: "Sample task",
      priority: 1,
      projectId: "proj-1",
      sectionId: "section-old",
    };

    const getTask = jest
      .fn<TodoistApi["getTask"]>()
      .mockResolvedValue(task as unknown as ApiTask);
    const updateTask = jest
      .fn<TodoistApi["updateTask"]>()
      .mockResolvedValue(task as unknown as ApiTaskUpdate);
    const moveTasks = jest.fn<TodoistApi["moveTasks"]>().mockResolvedValue([
      {
        ...task,
        sectionId: "section-new",
      },
    ] as unknown as ApiTaskList);

    const todoistClient = {
      getTask,
      updateTask,
      moveTasks,
    } as unknown as TodoistApi;

    const message = await handleUpdateTask(todoistClient, {
      task_id: "123",
      section_id: "section-new",
    });

    expect(updateTask).not.toHaveBeenCalled();
    expect(moveTasks).toHaveBeenCalledWith(["123"], {
      sectionId: "section-new",
    });
    expect(message).toContain("New Section ID: section-new");
  });

  test("updates content and moves project when both provided", async () => {
    const task: TodoistTask = {
      id: "a1",
      content: "Initial",
      priority: 1,
      projectId: "proj-old",
      sectionId: "section-old",
    };

    const getTask = jest
      .fn<TodoistApi["getTask"]>()
      .mockResolvedValue(task as unknown as ApiTask);
    const updateTask = jest.fn<TodoistApi["updateTask"]>().mockResolvedValue({
      ...task,
      content: "Updated",
    } as unknown as ApiTaskUpdate);
    const moveTasks = jest.fn<TodoistApi["moveTasks"]>().mockResolvedValue([
      {
        ...task,
        content: "Updated",
        projectId: "proj-new",
      },
    ] as unknown as ApiTaskList);

    const todoistClient = {
      getTask,
      updateTask,
      moveTasks,
    } as unknown as TodoistApi;

    const message = await handleUpdateTask(todoistClient, {
      task_id: "a1",
      content: "Updated",
      project_id: "proj-new",
    });

    expect(updateTask).toHaveBeenCalledWith("a1", {
      content: "Updated",
    });
    expect(moveTasks).toHaveBeenCalledWith(["a1"], {
      projectId: "proj-new",
    });
    expect(message).toContain("New Project ID: proj-new");
    expect(message).toContain("New Title: Updated");
  });
});

describe("handleBulkUpdateTasks move support", () => {
  test("uses moveTasks when section updates are requested", async () => {
    const tasks: TodoistTask[] = [
      {
        id: "bulk-1",
        content: "Bulk task",
        priority: 1,
        projectId: "proj-1",
        sectionId: null,
      },
    ];

    const getTasks = jest
      .fn<TodoistApi["getTasks"]>()
      .mockResolvedValue(tasks as unknown as ApiTasksResponse);
    const updateTask = jest
      .fn<TodoistApi["updateTask"]>()
      .mockResolvedValue(tasks[0] as unknown as ApiTaskUpdate);
    const moveTasks = jest.fn<TodoistApi["moveTasks"]>().mockResolvedValue([
      {
        ...tasks[0],
        sectionId: "section-new",
      },
    ] as unknown as ApiTaskList);

    const todoistClient = {
      getTasks,
      updateTask,
      moveTasks,
      getProjects: jest
        .fn<TodoistApi["getProjects"]>()
        .mockResolvedValue([] as unknown as ApiProjectsResponse),
    } as unknown as TodoistApi;

    await handleBulkUpdateTasks(todoistClient, {
      search_criteria: {
        project_id: "proj-1",
      },
      updates: {
        section_id: "section-new",
      },
    });

    expect(updateTask).not.toHaveBeenCalled();
    expect(moveTasks).toHaveBeenCalledWith(["bulk-1"], {
      sectionId: "section-new",
    });
  });
});
