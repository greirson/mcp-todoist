import { describe, expect, test, jest } from "@jest/globals";
import {
  handleUpdateTask,
  handleBulkUpdateTasks,
} from "../handlers/task-handlers";
import type { TodoistApi } from "@doist/todoist-api-typescript";
import type { TodoistTask } from "../types.js";

describe("handleUpdateTask section moves", () => {
  test("calls moveTasks when section_id is provided", async () => {
    const task: TodoistTask = {
      id: "123",
      content: "Sample task",
      priority: 1,
      projectId: "proj-1",
      sectionId: "section-old",
    };

    const getTask = jest.fn(async () => task);
    const updateTask = jest.fn(async () => task);
    const moveTasks = jest.fn(
      async () =>
        [
          {
            ...task,
            sectionId: "section-new",
          },
        ] as TodoistTask[]
    );

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

    const getTask = jest.fn(async () => task);
    const updateTask = jest.fn(async () => ({
      ...task,
      content: "Updated",
    }));
    const moveTasks = jest.fn(
      async () =>
        [
          {
            ...task,
            content: "Updated",
            projectId: "proj-new",
          },
        ] as TodoistTask[]
    );

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

    const getTasks = jest.fn(async () => tasks);
    const updateTask = jest.fn(async () => tasks[0]);
    const moveTasks = jest.fn(
      async () =>
        [
          {
            ...tasks[0],
            sectionId: "section-new",
          },
        ] as TodoistTask[]
    );

    const todoistClient = {
      getTasks,
      updateTask,
      moveTasks,
      getProjects: jest.fn(async () => []),
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
