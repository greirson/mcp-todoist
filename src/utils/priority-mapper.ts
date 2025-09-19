const PRIORITY_MIN = 1;
const PRIORITY_MAX = 4;

function isValidPriority(value: number | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= PRIORITY_MIN &&
    value <= PRIORITY_MAX
  );
}

/**
 * Converts user-facing priority (1 highest) to Todoist API priority (4 highest).
 */
export function toApiPriority(priority?: number): number | undefined {
  if (!isValidPriority(priority)) {
    return undefined;
  }

  return PRIORITY_MAX + PRIORITY_MIN - priority;
}

/**
 * Converts Todoist API priority (4 highest) to user-facing priority (1 highest).
 */
export function fromApiPriority(priority?: number | null): number | undefined {
  if (!isValidPriority(priority ?? undefined)) {
    return undefined;
  }

  return PRIORITY_MAX + PRIORITY_MIN - (priority as number);
}

/**
 * Maps a task priority received from Todoist API for display purposes.
 * Falls back to the original value if it is outside the expected range.
 */
