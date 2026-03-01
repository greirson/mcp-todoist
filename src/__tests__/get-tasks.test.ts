import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import type { TodoistApi } from "@doist/todoist-api-typescript";
import { CacheManager } from "../cache.js";
import type { TodoistTask } from "../types.js";

// Mock the api-helpers module so fetchAllTasks/fetchAllTasksByFilter delegate to mock client
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
        if (Array.isArray(result)) return result;
        const obj = result as { results?: unknown[] };
        return obj?.results || [];
      }
    ),
    fetchAllTasksByFilter: jest.fn(
      async (
        client: {
          getTasksByFilter: (args: unknown) => Promise<unknown>;
        },
        query: string,
        lang?: string
      ) => {
        const result = await client.getTasksByFilter({ query, lang });
        if (Array.isArray(result)) return result;
        const obj = result as { results?: unknown[] };
        return obj?.results || [];
      }
    ),
  };
});

import { handleGetTasks } from "../handlers/task-handlers";

type ApiTasksResponse = Awaited<ReturnType<TodoistApi["getTasks"]>>;
type ApiFilterResponse = Awaited<ReturnType<TodoistApi["getTasksByFilter"]>>;

describe("handleGetTasks", () => {
  beforeEach(() => {
    const cache = CacheManager.getInstance().getCache<TodoistTask[]>("tasks");
    cache?.clear();
  });

  test("uses Todoist filter endpoint for natural language filters", async () => {
    const tasks: TodoistTask[] = [
      {
        id: "filter-1",
        content: "Filtered task",
        due: {
          date: "2025-09-18",
          string: "today",
          timezone: "America/New_York",
        },
        priority: 1,
      },
    ];

    const getTasksByFilter = jest
      .fn<TodoistApi["getTasksByFilter"]>()
      .mockResolvedValue({ results: tasks } as unknown as ApiFilterResponse);
    const getTasks = jest
      .fn<TodoistApi["getTasks"]>()
      .mockResolvedValue([] as unknown as ApiTasksResponse);

    const client = {
      getTasksByFilter,
      getTasks,
      getTask: jest.fn(),
    } as unknown as TodoistApi;

    const response = await handleGetTasks(client, {
      filter: "today",
      lang: "en",
    });

    expect(getTasksByFilter).toHaveBeenCalledWith({
      query: "today",
      lang: "en",
    });
    expect(getTasks).not.toHaveBeenCalled();
    expect(response).toContain("date=2025-09-18");
    expect(response).toContain("timezone=America/New_York");
  });

  test("applies due_before and due_after filters to API results", async () => {
    const tasks: TodoistTask[] = [
      {
        id: "before",
        content: "Due before threshold",
        due: {
          date: "2025-09-10",
          string: "Sep 10",
        },
        priority: 1,
      },
      {
        id: "inside",
        content: "Inside window",
        due: {
          date: "2025-09-15",
          string: "Sep 15",
        },
        priority: 1,
      },
      {
        id: "after",
        content: "Due after threshold",
        due: {
          date: "2025-09-22",
          string: "Sep 22",
        },
        priority: 1,
      },
      {
        id: "no-due",
        content: "No due info",
        priority: 1,
      },
    ];

    const getTasks = jest
      .fn<TodoistApi["getTasks"]>()
      .mockResolvedValue(tasks as unknown as ApiTasksResponse);

    const client = {
      getTasks,
      getTasksByFilter: jest.fn(),
      getTask: jest.fn(),
    } as unknown as TodoistApi;

    const response = await handleGetTasks(client, {
      due_after: "2025-09-12",
      due_before: "2025-09-20",
    });

    expect(getTasks).toHaveBeenCalledTimes(1);
    expect(response).toContain("Inside window");
    expect(response).not.toContain("Due before threshold");
    expect(response).not.toContain("Due after threshold");
    expect(response).not.toContain("No due info");
  });

  test("treats due filters consistently across timezones", async () => {
    const tasks: TodoistTask[] = [
      {
        id: "nyc",
        content: "New York task",
        due: {
          date: "2025-09-18",
          string: "Sep 18",
          timezone: "America/New_York",
        },
        priority: 1,
      },
      {
        id: "tokyo",
        content: "Tokyo task",
        due: {
          date: "2025-09-18",
          string: "Sep 18",
          timezone: "Asia/Tokyo",
        },
        priority: 1,
      },
      {
        id: "future",
        content: "Future task",
        due: {
          date: "2025-09-19",
          string: "Sep 19",
          timezone: "America/New_York",
        },
        priority: 1,
      },
    ];

    const getTasks = jest
      .fn<TodoistApi["getTasks"]>()
      .mockResolvedValue(tasks as unknown as ApiTasksResponse);

    const client = {
      getTasks,
      getTasksByFilter: jest.fn(),
      getTask: jest.fn(),
    } as unknown as TodoistApi;

    const beforeResponse = await handleGetTasks(client, {
      due_before: "2025-09-19",
    });

    expect(beforeResponse).toContain("New York task");
    expect(beforeResponse).toContain("Tokyo task");
    expect(beforeResponse).not.toContain("Future task");

    const afterResponse = await handleGetTasks(client, {
      due_after: "2025-09-18",
    });

    expect(afterResponse).toContain("Future task");
    expect(afterResponse).not.toContain("New York task");
    expect(afterResponse).not.toContain("Tokyo task");
  });
});
