import { describe, test, expect, beforeEach, afterAll } from "@jest/globals";
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  handleBulkCreateTasks,
  handleBulkUpdateTasks,
} from "../handlers/task-handlers";
import type { TodoistTask } from "../types";
import { extractArrayFromResponse } from "../utils/api-helpers";
import { fromApiPriority } from "../utils/priority-mapper";

const token = process.env.TODOIST_API_TOKEN;
const describeIfToken = token ? describe : describe.skip;

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

describeIfToken("Bulk operations E2E", () => {
  let todoistClient: TodoistApi;
  const createdTaskIds: string[] = [];
  const now = new Date();
  const beforeDate = formatDate(addDays(now, 1));
  const cutoffDate = formatDate(addDays(now, 2));
  const afterDate = formatDate(addDays(now, 3));
  const suitePrefix = `E2E Bulk ${Date.now()}`;

  beforeEach(() => {
    if (!token) {
      throw new Error(
        "TODOIST_API_TOKEN environment variable is required for E2E tests"
      );
    }

    todoistClient = new TodoistApi(token);
  });

  afterAll(async () => {
    if (!token) return;

    await Promise.all(
      createdTaskIds.map(async (taskId) => {
        try {
          await todoistClient.deleteTask(taskId);
        } catch {
          // Ignore cleanup errors (task might already be deleted)
        }
      })
    );
  });

  test("bulk create followed by due_before bulk update only touches matching tasks", async () => {
    const taskContents = {
      before: `${suitePrefix} - before`,
      onCutoff: `${suitePrefix} - on`,
      after: `${suitePrefix} - after`,
    } as const;

    await handleBulkCreateTasks(todoistClient, {
      tasks: [
        {
          content: taskContents.before,
          due_string: beforeDate,
          priority: 1,
        },
        {
          content: taskContents.onCutoff,
          due_string: cutoffDate,
          priority: 1,
        },
        {
          content: taskContents.after,
          due_string: afterDate,
          priority: 1,
        },
      ],
    });

    // Allow Todoist to index newly created tasks
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const createdTasks = await fetchTestTasks(todoistClient, suitePrefix);
    expect(createdTasks).toHaveLength(3);
    createdTaskIds.push(...createdTasks.map((task) => task.id));

    await handleBulkUpdateTasks(todoistClient, {
      search_criteria: {
        content_contains: suitePrefix,
        due_before: cutoffDate,
      },
      updates: {
        priority: 3,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const refreshedTasks = await fetchTestTasks(todoistClient, suitePrefix);

    const beforeTask = refreshedTasks.find((task) =>
      task.content.includes("before")
    );
    const onTask = refreshedTasks.find((task) => task.content.includes("on"));
    const afterTask = refreshedTasks.find((task) =>
      task.content.includes("after")
    );

    expect(beforeTask?.priority).toBe(3);
    expect(onTask?.priority).toBe(1);
    expect(afterTask?.priority).toBe(1);
  }, 45000);
});

async function fetchTestTasks(
  todoistClient: TodoistApi,
  contentPrefix: string
): Promise<TodoistTask[]> {
  const result = await todoistClient.getTasks();
  const tasks = extractArrayFromResponse<TodoistTask>(result);
  return tasks
    .filter((task) => task.content.startsWith(contentPrefix))
    .map((task) => ({
      ...task,
      priority: fromApiPriority(task.priority) ?? task.priority,
    }));
}
