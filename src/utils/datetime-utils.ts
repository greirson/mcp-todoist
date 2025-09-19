import { TodoistTask, TodoistTaskDueData } from "../types.js";

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date);
  const lookup = new Map(parts.map((part) => [part.type, part.value]));

  const year = Number(lookup.get("year"));
  const month = Number(lookup.get("month"));
  const day = Number(lookup.get("day"));
  const hour = Number(lookup.get("hour"));
  const minute = Number(lookup.get("minute"));
  const second = Number(lookup.get("second"));

  if (
    [year, month, day, hour, minute, second].some((value) =>
      Number.isNaN(value)
    )
  ) {
    throw new Error("Invalid timezone conversion parts");
  }

  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return asUtc - date.getTime();
}

/**
 * Returns a Date object set to UTC midnight for the provided YYYY-MM-DD string.
 * Applies timezone conversion when a Todoist timezone value is supplied.
 */
export function startOfDayUtc(
  dateString: string,
  timeZone?: string | null
): Date | null {
  const [year, month, day] = dateString.split("-").map(Number);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  if (!timeZone) {
    return new Date(utcMidnight);
  }

  try {
    const baseline = new Date(utcMidnight);
    const offset = getTimeZoneOffset(baseline, timeZone);
    return new Date(utcMidnight - offset);
  } catch {
    // Fallback to plain UTC midnight if the timezone conversion fails
    return new Date(utcMidnight);
  }
}

/**
 * Creates a new Date that is `days` days after the provided date (UTC).
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Attempts to convert a Todoist due object into an absolute JavaScript Date.
 * Falls back to null when the due information cannot be parsed.
 */
export function getTaskDueDate(task: Pick<TodoistTask, "due">): Date | null {
  return parseDueDate(task.due);
}

/**
 * Safely parses Todoist due metadata to a JavaScript Date (UTC).
 */
export function parseDueDate(
  due: TodoistTaskDueData | null | undefined
): Date | null {
  if (!due) return null;

  if (due.datetime) {
    const datetime = new Date(due.datetime);
    if (!Number.isNaN(datetime.getTime())) {
      return datetime;
    }
  }

  if (due.date) {
    const dateOnly = startOfDayUtc(due.date, due.timezone);
    if (dateOnly) {
      return dateOnly;
    }
  }

  if (due.string) {
    const parsed = new Date(due.string);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Extracts a YYYY-MM-DD representation from the Todoist due metadata.
 */
export function getDueDateOnly(
  due: TodoistTaskDueData | null | undefined
): string | null {
  if (!due) return null;

  if (due.date) {
    return due.date;
  }

  if (due.datetime) {
    const datetime = new Date(due.datetime);
    if (!Number.isNaN(datetime.getTime())) {
      return datetime.toISOString().split("T")[0] || null;
    }
  }

  if (due.string) {
    const parsed = new Date(due.string);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0] || null;
    }
  }

  return null;
}

/**
 * Formats Todoist due information with full context for human-friendly display.
 */
export function formatDueDetails(
  due: TodoistTaskDueData | null | undefined
): string | null {
  if (!due) {
    return null;
  }

  const parts: string[] = [];

  if (due.date) {
    parts.push(`date=${due.date}`);
  }

  if (due.datetime) {
    parts.push(`datetime=${due.datetime}`);
  }

  if (due.timezone) {
    parts.push(`timezone=${due.timezone}`);
  }

  if (due.string) {
    parts.push(`phrase="${due.string}"`);
  }

  return parts.length > 0 ? parts.join(", ") : null;
}
