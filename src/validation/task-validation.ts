import { ValidationError } from "../errors.js";
import {
  VALIDATION_LIMITS,
  validateAndSanitizeContent,
} from "./sanitization.js";

export function validateTaskContent(content: string): string {
  return validateAndSanitizeContent(content, "content", {
    maxLength: VALIDATION_LIMITS.TASK_CONTENT_MAX,
    allowHtml: false,
    required: true,
  });
}

/**
 * Validates task duration amount
 * @param duration - Duration amount in minutes or days
 */
export function validateDuration(duration?: number): void {
  if (duration !== undefined) {
    if (typeof duration !== "number" || !Number.isFinite(duration)) {
      throw new ValidationError("Duration must be a finite number", "duration");
    }

    if (!Number.isInteger(duration)) {
      throw new ValidationError("Duration must be an integer", "duration");
    }

    if (duration < 1) {
      throw new ValidationError("Duration must be at least 1", "duration");
    }

    // Todoist allows up to 24 hours (1440 minutes) or 365 days
    if (duration > 1440) {
      throw new ValidationError(
        "Duration cannot exceed 1440 (24 hours in minutes or 365 days)",
        "duration"
      );
    }
  }
}

/**
 * Validates task duration unit
 * @param unit - Duration unit ('minute' or 'day')
 */
export function validateDurationUnit(unit?: string): void {
  if (unit !== undefined) {
    if (typeof unit !== "string") {
      throw new ValidationError(
        "Duration unit must be a string",
        "duration_unit"
      );
    }

    const validUnits = ["minute", "day"];
    if (!validUnits.includes(unit)) {
      throw new ValidationError(
        `Duration unit must be one of: ${validUnits.join(", ")}`,
        "duration_unit"
      );
    }
  }
}

/**
 * Checks if a due_string contains a time component (required for duration/time blocking)
 * Time patterns: "at HH:MM", "HH:MM", "H:MM", "Ham", "Hpm", etc.
 */
export function hasTimeComponent(dueString?: string): boolean {
  if (!dueString) return false;

  // Common patterns that indicate a time is included:
  // - "at 14:00", "at 2pm", "at 10:30am"
  // - "tomorrow 3pm", "monday 10:00"
  // - ISO datetime format "2024-01-15T14:00:00"
  const timePatterns = [
    /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?/i, // "at 2pm", "at 14:00"
    /\d{1,2}:\d{2}\s*(am|pm)?/i, // "14:00", "2:30pm"
    /\d{1,2}\s*(am|pm)/i, // "2pm", "10am"
    /T\d{2}:\d{2}/, // ISO format "T14:00"
  ];

  return timePatterns.some((pattern) => pattern.test(dueString));
}

/**
 * Validates duration and duration_unit together
 * If one is provided, the other must also be provided (or use defaults)
 * Duration requires a due time (not just a date) for time blocking to work
 */
export function validateDurationPair(
  duration?: number,
  durationUnit?: string,
  dueString?: string
): void {
  validateDuration(duration);
  validateDurationUnit(durationUnit);

  // If duration is provided without unit, we'll default to 'minute' in the handler
  // If unit is provided without duration, it's invalid
  if (durationUnit !== undefined && duration === undefined) {
    throw new ValidationError(
      "Duration unit requires a duration amount to be specified",
      "duration_unit"
    );
  }

  // Duration requires a due time for time blocking to work
  if (duration !== undefined) {
    if (!dueString) {
      throw new ValidationError(
        "Duration requires a due_string with a time for time blocking. " +
          'Use a due_string like "tomorrow at 2pm" or "monday 10:00"',
        "duration"
      );
    }
    if (!hasTimeComponent(dueString)) {
      throw new ValidationError(
        "Duration requires a due time (not just a date) for time blocking. " +
          'Use a due_string with a time like "tomorrow at 2pm" or "monday 10:00"',
        "duration"
      );
    }
  }
}

export function validatePriority(priority?: number): void {
  if (priority !== undefined) {
    if (!Number.isInteger(priority) || priority < 1 || priority > 4) {
      throw new ValidationError(
        "Priority must be an integer between 1 and 4",
        "priority"
      );
    }
  }
}

export function validateTaskName(taskName: string): string {
  return validateAndSanitizeContent(taskName, "task_name", {
    maxLength: VALIDATION_LIMITS.TASK_NAME_MAX,
    allowHtml: false,
    required: true,
  });
}

export function validateProjectName(name: string): string {
  return validateAndSanitizeContent(name, "name", {
    maxLength: VALIDATION_LIMITS.PROJECT_NAME_MAX,
    allowHtml: false,
    required: true,
  });
}

export function validateSectionName(name: string): string {
  return validateAndSanitizeContent(name, "name", {
    maxLength: VALIDATION_LIMITS.SECTION_NAME_MAX,
    allowHtml: false,
    required: true,
  });
}

export function validateLimit(limit?: number, max: number = 100): void {
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > max) {
      throw new ValidationError(
        `Limit must be an integer between 1 and ${max}`,
        "limit"
      );
    }
  }
}

export function validateOffset(offset?: number): void {
  if (offset !== undefined) {
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError(
        "Offset must be a non-negative integer",
        "offset"
      );
    }
  }
}
