import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateLabelArgs,
  UpdateLabelArgs,
  LabelNameArgs,
  LabelStatistics,
  TodoistLabel,
} from "../types.js";
import {
  ValidationError,
  LabelNotFoundError,
  TodoistAPIError,
} from "../errors.js";
import { validateLabelData, validateLabelUpdate } from "../validation.js";
import { SimpleCache } from "../cache.js";

// Cache for label data (30 second TTL)
const labelCache = new SimpleCache<TodoistLabel[]>(30000);
const labelStatsCache = new SimpleCache<LabelStatistics[]>(30000);

interface ApiResponse {
  results?: unknown[];
  data?: unknown[];
}

function extractArrayFromResponse(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }
  const apiResponse = response as ApiResponse;
  return apiResponse?.results || apiResponse?.data || [];
}

export async function handleGetLabels(
  todoistClient: TodoistApi
): Promise<string> {
  const cacheKey = "labels:all";
  const cached = labelCache.get(cacheKey);
  let labels: TodoistLabel[];

  if (cached) {
    labels = cached;
  } else {
    try {
      const response = await todoistClient.getLabels();
      labels = extractArrayFromResponse(response) as TodoistLabel[];

      labelCache.set(cacheKey, labels);
    } catch (error) {
      throw new TodoistAPIError(
        "Failed to fetch labels",
        error instanceof Error ? error : undefined
      );
    }
  }

  if (labels.length === 0) {
    return "No labels found.";
  }

  const labelList = labels
    .map(
      (label) =>
        `• ${label.name} (ID: ${label.id}${label.color ? `, Color: ${label.color}` : ""})`
    )
    .join("\n");

  return `Found ${labels.length} labels:\n${labelList}`;
}

export async function handleCreateLabel(
  todoistClient: TodoistApi,
  args: CreateLabelArgs
): Promise<string> {
  const validatedData = validateLabelData(args);

  try {
    const label = await todoistClient.addLabel({
      name: validatedData.name,
      color: validatedData.color,
      order: validatedData.order,
      isFavorite: validatedData.is_favorite,
    });

    labelCache.clear();
    labelStatsCache.clear();

    return `Label "${label.name}" created successfully (ID: ${label.id})`;
  } catch (error) {
    throw new TodoistAPIError(
      "Failed to create label",
      error instanceof Error ? error : undefined
    );
  }
}

async function findLabel(
  todoistClient: TodoistApi,
  args: LabelNameArgs
): Promise<TodoistLabel> {
  if (args.label_id) {
    try {
      const label = await todoistClient.getLabel(args.label_id);
      return label as TodoistLabel;
    } catch {
      throw new LabelNotFoundError(`Label with ID ${args.label_id} not found`);
    }
  }

  if (!args.label_name) {
    throw new ValidationError("Either label_id or label_name must be provided");
  }

  const cached = labelCache.get("labels:all");
  let labels: TodoistLabel[];

  if (cached) {
    labels = cached;
  } else {
    try {
      const response = await todoistClient.getLabels();
      labels = extractArrayFromResponse(response) as TodoistLabel[];
      labelCache.set("labels:all", labels);
    } catch (error) {
      throw new TodoistAPIError(
        "Failed to fetch labels for search",
        error instanceof Error ? error : undefined
      );
    }
  }

  const matchingLabel = labels.find(
    (label: TodoistLabel) =>
      label.name.toLowerCase() === args.label_name!.toLowerCase()
  );

  if (!matchingLabel) {
    throw new LabelNotFoundError(
      `No label found with name: "${args.label_name}"`
    );
  }

  return matchingLabel;
}

export async function handleUpdateLabel(
  todoistClient: TodoistApi,
  args: UpdateLabelArgs
): Promise<string> {
  const label = await findLabel(todoistClient, {
    label_id: args.label_id,
    label_name: args.label_name,
  });

  const validatedUpdates = validateLabelUpdate(args);

  try {
    await todoistClient.updateLabel(label.id, {
      name: validatedUpdates.name,
      color: validatedUpdates.color,
      order: validatedUpdates.order,
      isFavorite: validatedUpdates.is_favorite,
    });

    labelCache.clear();
    labelStatsCache.clear();

    const changes: string[] = [];
    if (validatedUpdates.name) changes.push(`name: "${validatedUpdates.name}"`);
    if (validatedUpdates.color)
      changes.push(`color: "${validatedUpdates.color}"`);
    if (validatedUpdates.order !== undefined)
      changes.push(`order: ${validatedUpdates.order}`);
    if (validatedUpdates.is_favorite !== undefined)
      changes.push(`favorite: ${validatedUpdates.is_favorite}`);

    return `Label "${label.name}" updated successfully${changes.length > 0 ? ` (${changes.join(", ")})` : ""}`;
  } catch (error) {
    throw new TodoistAPIError(
      `Failed to update label "${label.name}"`,
      error instanceof Error ? error : undefined
    );
  }
}

export async function handleDeleteLabel(
  todoistClient: TodoistApi,
  args: LabelNameArgs
): Promise<string> {
  const label = await findLabel(todoistClient, args);

  try {
    await todoistClient.deleteLabel(label.id);

    labelCache.clear();
    labelStatsCache.clear();

    return `Label "${label.name}" deleted successfully`;
  } catch (error) {
    throw new TodoistAPIError(
      `Failed to delete label "${label.name}"`,
      error instanceof Error ? error : undefined
    );
  }
}

export async function handleGetLabelStats(
  todoistClient: TodoistApi
): Promise<string> {
  const cacheKey = "labels:stats";
  const cached = labelStatsCache.get(cacheKey);
  let sortedStats: LabelStatistics[];

  if (cached) {
    sortedStats = cached;
  } else {
    try {
      const [labelsResponse, tasksResponse] = await Promise.all([
        todoistClient.getLabels(),
        todoistClient.getTasks(),
      ]);

      const labels = extractArrayFromResponse(labelsResponse) as TodoistLabel[];
      const tasks = extractArrayFromResponse(tasksResponse) as Array<{
        labels?: string[];
        isCompleted?: boolean;
        createdAt?: string;
      }>;

      const stats = labels.map((label) => {
        const tasksWithLabel = tasks.filter((task) =>
          task.labels?.includes(label.name)
        );

        const completedTasks = tasksWithLabel.filter(
          (task) => task.isCompleted
        ).length;

        const mostRecentTask = tasksWithLabel
          .filter((task) => task.createdAt)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt!).getTime();
            const dateB = new Date(b.createdAt!).getTime();
            return dateB - dateA;
          })[0];

        return {
          label: label.name,
          totalTasks: tasksWithLabel.length,
          completedTasks,
          completionRate:
            tasksWithLabel.length > 0
              ? Math.round((completedTasks / tasksWithLabel.length) * 100)
              : 0,
          color: label.color,
          mostRecentUse: mostRecentTask?.createdAt || null,
        };
      });

      sortedStats = stats.sort((a, b) => b.totalTasks - a.totalTasks);

      labelStatsCache.set(cacheKey, sortedStats);
    } catch (error) {
      throw new TodoistAPIError(
        "Failed to fetch label statistics",
        error instanceof Error ? error : undefined
      );
    }
  }

  if (sortedStats.length === 0) {
    return "No labels found to generate statistics.";
  }

  const statsReport = sortedStats
    .map((stat) => {
      const lastUsed = stat.mostRecentUse
        ? new Date(stat.mostRecentUse).toLocaleDateString()
        : "Never";

      return `• ${stat.label} (${stat.color || "default"})
  - Total tasks: ${stat.totalTasks}
  - Completed: ${stat.completedTasks} (${stat.completionRate}%)
  - Last used: ${lastUsed}`;
    })
    .join("\n\n");

  return `Label Usage Statistics:\n\n${statsReport}`;
}
