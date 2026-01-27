import { QuickAddTaskArgs, QuickAddTaskResult } from "../../types/index.js";
import { CacheManager } from "../../cache/index.js";
import { ValidationError } from "../../errors.js";
import { formatDueDetails } from "../../utils/datetime-utils.js";
import { fromApiPriority } from "../../utils/priority-mapper.js";
import { ErrorHandler } from "../../utils/error-handling.js";
import type { TodoistTask } from "../../types/index.js";

// Get centralized cache manager and register task cache
const cacheManager = CacheManager.getInstance();
const taskCache = cacheManager.getOrCreateCache<TodoistTask[]>("tasks", 30000, {
  maxSize: 1000,
  enableStats: true,
  enableAccessTracking: true,
});

interface QuickAddRequestBody {
  text: string;
  note?: string;
  reminder?: string;
  auto_reminder?: boolean;
  meta?: boolean;
}

/**
 * Parses quick add text to extract components.
 * This is used for dry-run mode to show what would be parsed.
 */
export function parseQuickAddText(text: string): {
  content: string;
  project: string | null;
  labels: string[];
  priority: number | null;
  description: string | null;
} {
  let content = text;
  let project: string | null = null;
  const labels: string[] = [];
  let priority: number | null = null;
  let description: string | null = null;

  const descMatch = content.match(/\/\/(.*)$/);
  if (descMatch) {
    description = descMatch[1].trim();
    content = content.replace(/\/\/.*$/, "").trim();
  }

  const priorityMatch = content.match(/\bp([1-4])\b/i);
  if (priorityMatch) {
    priority = parseInt(priorityMatch[1], 10);
    content = content.replace(/\bp[1-4]\b/gi, "").trim();
  }

  const projectMatch = content.match(/#(\S+)/);
  if (projectMatch) {
    project = projectMatch[1];
    content = content.replace(/#\S+/g, "").trim();
  }

  const labelMatches = content.match(/@(\S+)/g);
  if (labelMatches) {
    labelMatches.forEach((match) => {
      labels.push(match.substring(1));
    });
    content = content.replace(/@\S+/g, "").trim();
  }

  content = content.replace(/\{[^}]+\}/g, "").trim();
  content = content.replace(/\+\S+/g, "").trim();
  content = content.replace(/\s+/g, " ").trim();

  return { content, project, labels, priority, description };
}

/**
 * Handles quick add task using natural language parsing.
 */
export async function handleQuickAddTask(
  apiToken: string,
  args: QuickAddTaskArgs
): Promise<string> {
  return ErrorHandler.wrapAsync("quick add task", async () => {
    if (!args.text || args.text.trim().length === 0) {
      throw new ValidationError("Task text cannot be empty", "text");
    }

    const isDryRun = process.env.DRYRUN === "true";

    if (isDryRun) {
      console.error(`[DRY-RUN] Would quick add task: "${args.text}"`);
      if (args.note) {
        console.error(`[DRY-RUN]   with note: "${args.note}"`);
      }
      if (args.reminder) {
        console.error(`[DRY-RUN]   with reminder: "${args.reminder}"`);
      }
      if (args.auto_reminder) {
        console.error(`[DRY-RUN]   with auto_reminder enabled`);
      }

      const parsed = parseQuickAddText(args.text);

      return (
        `[DRY-RUN] Task would be created:\n` +
        `Text: ${args.text}\n` +
        `Parsed content: ${parsed.content}\n` +
        (parsed.project ? `Project: #${parsed.project}\n` : "") +
        (parsed.labels.length > 0
          ? `Labels: ${parsed.labels.map((l) => `@${l}`).join(", ")}\n`
          : "") +
        (parsed.priority ? `Priority: p${parsed.priority}\n` : "") +
        (parsed.description ? `Description: ${parsed.description}\n` : "") +
        (args.note ? `Note: ${args.note}\n` : "") +
        (args.reminder ? `Reminder: ${args.reminder}\n` : "")
      );
    }

    const requestBody: QuickAddRequestBody = {
      text: args.text.trim(),
    };

    if (args.note) {
      requestBody.note = args.note;
    }
    if (args.reminder) {
      requestBody.reminder = args.reminder;
    }
    if (args.auto_reminder !== undefined) {
      requestBody.auto_reminder = args.auto_reminder;
    }

    const response = await fetch("https://api.todoist.com/api/v1/tasks/quick", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.error || errorJson.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      throw new Error(`Quick Add API error: ${errorMessage}`);
    }

    const responseText = await response.text();
    let taskResult: QuickAddTaskResult | null = null;

    if (responseText && responseText !== "{}") {
      try {
        taskResult = JSON.parse(responseText);
      } catch {
        // Response was not valid JSON, continue without task details
      }
    }

    taskCache.clear();

    let result = "Task created via Quick Add:\n";
    result += `Input: "${args.text}"\n`;

    if (taskResult && taskResult.id) {
      result += `\nCreated Task:\n`;
      result += `ID: ${taskResult.id}\n`;
      if (taskResult.content) {
        result += `Content: ${taskResult.content}\n`;
      }
      if (taskResult.description) {
        result += `Description: ${taskResult.description}\n`;
      }
      if (taskResult.project_name) {
        result += `Project: ${taskResult.project_name}\n`;
      } else if (taskResult.project_id) {
        result += `Project ID: ${taskResult.project_id}\n`;
      }
      if (taskResult.labels && taskResult.labels.length > 0) {
        result += `Labels: ${taskResult.labels.join(", ")}\n`;
      }
      if (taskResult.priority && taskResult.priority !== 1) {
        const displayPriority = fromApiPriority(taskResult.priority);
        if (displayPriority) {
          result += `Priority: ${displayPriority}\n`;
        }
      }
      if (taskResult.due) {
        const dueDetails = formatDueDetails(taskResult.due);
        if (dueDetails) {
          result += `Due: ${dueDetails}\n`;
        }
      }
      if (taskResult.deadline) {
        result += `Deadline: ${taskResult.deadline.date}\n`;
      }
      if (taskResult.url) {
        result += `URL: ${taskResult.url}\n`;
      }
    } else {
      result += "\nTask created successfully (details not returned by API)";
    }

    if (args.note) {
      result += `\nNote added: ${args.note}`;
    }
    if (args.reminder) {
      result += `\nReminder set: ${args.reminder}`;
    }

    return result.trim();
  });
}
