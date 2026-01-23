import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  FindDuplicatesArgs,
  MergeDuplicatesArgs,
  DuplicateGroup,
  DuplicateTask,
  TodoistTask,
  TodoistProject,
} from "../types.js";
import { ValidationError, TaskNotFoundError } from "../errors.js";
import { CacheManager } from "../cache.js";
import { extractArrayFromResponse } from "../utils/api-helpers.js";

const cacheManager = CacheManager.getInstance();

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity * 10) / 10;
}

function taskToDuplicateTask(
  task: TodoistTask,
  projectName?: string
): DuplicateTask {
  return {
    id: task.id,
    content: task.content,
    description: task.description,
    projectId: task.projectId ?? undefined,
    projectName,
    due: task.due?.string ?? task.due?.date ?? undefined,
    priority: task.priority,
    labels: task.labels,
    isCompleted: task.isCompleted,
  };
}

export async function handleFindDuplicates(
  todoistClient: TodoistApi,
  args: FindDuplicatesArgs
): Promise<string> {
  const threshold = args.threshold ?? 80;

  if (threshold < 0 || threshold > 100) {
    throw new ValidationError("Threshold must be between 0 and 100");
  }

  const projectMap = new Map<string, string>();
  try {
    const projectsResponse = await todoistClient.getProjects();
    const projects = extractArrayFromResponse<TodoistProject>(projectsResponse);
    projects.forEach((p) => projectMap.set(p.id, p.name));
  } catch {
    /* intentionally empty - project name lookup is optional */
  }

  let tasks: TodoistTask[];
  try {
    const params: { projectId?: string } = {};
    if (args.project_id) {
      params.projectId = args.project_id;
    }
    const response = await todoistClient.getTasks(params);
    tasks = extractArrayFromResponse<TodoistTask>(response);
  } catch (error) {
    throw new ValidationError(
      `Failed to fetch tasks: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  if (!args.include_completed) {
    tasks = tasks.filter((t) => !t.isCompleted);
  }

  if (tasks.length < 2) {
    return "Not enough tasks to compare for duplicates.";
  }

  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < tasks.length; i++) {
    if (processed.has(tasks[i].id)) continue;

    const group: DuplicateTask[] = [
      taskToDuplicateTask(tasks[i], projectMap.get(tasks[i].projectId || "")),
    ];
    let maxSimilarity = 0;

    for (let j = i + 1; j < tasks.length; j++) {
      if (processed.has(tasks[j].id)) continue;

      const similarity = calculateSimilarity(
        tasks[i].content,
        tasks[j].content
      );

      if (similarity >= threshold) {
        group.push(
          taskToDuplicateTask(
            tasks[j],
            projectMap.get(tasks[j].projectId || "")
          )
        );
        processed.add(tasks[j].id);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    if (group.length > 1) {
      processed.add(tasks[i].id);
      duplicateGroups.push({
        similarity: maxSimilarity,
        tasks: group,
      });
    }
  }

  if (duplicateGroups.length === 0) {
    return `No duplicate tasks found with similarity threshold of ${threshold}%.`;
  }

  duplicateGroups.sort((a, b) => b.similarity - a.similarity);

  const lines: string[] = [
    `Found ${duplicateGroups.length} group(s) of potential duplicates (threshold: ${threshold}%):`,
    "",
  ];

  duplicateGroups.forEach((group, idx) => {
    lines.push(`--- Group ${idx + 1} (${group.similarity}% similar) ---`);
    group.tasks.forEach((task) => {
      const projectInfo = task.projectName ? ` [${task.projectName}]` : "";
      const dueInfo = task.due ? ` (due: ${task.due})` : "";
      lines.push(
        `  - "${task.content}" (ID: ${task.id})${projectInfo}${dueInfo}`
      );
    });
    lines.push("");
  });

  lines.push(
    "Use todoist_duplicates_merge to combine duplicates by keeping one and completing/deleting the others."
  );

  return lines.join("\n");
}

export async function handleMergeDuplicates(
  todoistClient: TodoistApi,
  args: MergeDuplicatesArgs
): Promise<string> {
  if (!args.keep_task_id) {
    throw new ValidationError("keep_task_id is required");
  }
  if (!args.duplicate_task_ids || args.duplicate_task_ids.length === 0) {
    throw new ValidationError(
      "duplicate_task_ids must contain at least one task ID"
    );
  }
  if (!["complete", "delete"].includes(args.action)) {
    throw new ValidationError('action must be either "complete" or "delete"');
  }

  let keepTask: TodoistTask;
  try {
    keepTask = (await todoistClient.getTask(args.keep_task_id)) as TodoistTask;
  } catch {
    throw new TaskNotFoundError(`Task to keep not found: ${args.keep_task_id}`);
  }

  const results: { id: string; success: boolean; error?: string }[] = [];
  const taskCache = cacheManager.getOrCreateCache<TodoistTask[]>(
    "tasks",
    30000
  );

  for (const taskId of args.duplicate_task_ids) {
    if (taskId === args.keep_task_id) {
      results.push({
        id: taskId,
        success: false,
        error: "Cannot remove the task you are keeping",
      });
      continue;
    }

    try {
      if (args.action === "complete") {
        await todoistClient.closeTask(taskId);
      } else {
        await todoistClient.deleteTask(taskId);
      }
      results.push({ id: taskId, success: true });
    } catch (error) {
      results.push({
        id: taskId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  taskCache.clear();

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const actionVerb = args.action === "complete" ? "completed" : "deleted";

  const lines: string[] = [
    `Merge complete: kept "${keepTask.content}" (ID: ${keepTask.id})`,
    `${successful} duplicate(s) ${actionVerb}, ${failed} failed`,
  ];

  if (failed > 0) {
    lines.push("\nFailed operations:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        lines.push(`  - ID ${r.id}: ${r.error}`);
      });
  }

  return lines.join("\n");
}
