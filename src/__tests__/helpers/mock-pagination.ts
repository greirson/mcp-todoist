/**
 * Shared test helpers for mocking paginated Todoist API responses.
 *
 * The Todoist API v1 returns cursor-based paginated responses with shape:
 *   { results: T[], nextCursor: string | null }
 *
 * These helpers create properly-shaped mock functions for getTasks()
 * and getTasksByFilter() that return paginated responses.
 */

import { jest } from "@jest/globals";
import type { TodoistApi } from "@doist/todoist-api-typescript";
import type { TodoistTask } from "../../types.js";

type ApiTasksResponse = Awaited<ReturnType<TodoistApi["getTasks"]>>;
type ApiFilterResponse = Awaited<ReturnType<TodoistApi["getTasksByFilter"]>>;

/**
 * Creates a mock getTasks function that returns tasks in paginated format.
 */
export function mockPaginatedGetTasks(
  tasks: TodoistTask[]
): jest.Mock<TodoistApi["getTasks"]> {
  return jest
    .fn<TodoistApi["getTasks"]>()
    .mockResolvedValue({
      results: tasks,
      nextCursor: null,
    } as unknown as ApiTasksResponse);
}

/**
 * Creates a mock getTasksByFilter function that returns tasks in paginated format.
 */
export function mockPaginatedGetTasksByFilter(
  tasks: TodoistTask[]
): jest.Mock<TodoistApi["getTasksByFilter"]> {
  return jest
    .fn<TodoistApi["getTasksByFilter"]>()
    .mockResolvedValue({
      results: tasks,
      nextCursor: null,
    } as unknown as ApiFilterResponse);
}
