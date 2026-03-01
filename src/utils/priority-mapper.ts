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
 * Converts user-facing priority (1=P1 highest/urgent) to Todoist API priority (4=P1 highest/urgent).
 *
 * User Priority -> API Priority -> Todoist UI
 * 1 (P1 urgent) -> 4 -> P1 (red flag)
 * 2 (P2 high)   -> 3 -> P2 (orange flag)
 * 3 (P3 medium) -> 2 -> P3 (yellow flag)
 * 4 (P4 normal) -> 1 -> P4 (no flag)
 */
export function toApiPriority(priority?: number): number | undefined {
  if (!isValidPriority(priority)) {
    return undefined;
  }

  return PRIORITY_MAX + PRIORITY_MIN - priority;
}

/**
 * Converts Todoist API priority (4=P1 highest) to user-facing priority (1=P1 highest).
 *
 * API Priority -> User Priority -> Todoist UI
 * 4 -> 1 (P1 urgent) -> P1 (red flag)
 * 3 -> 2 (P2 high)   -> P2 (orange flag)
 * 2 -> 3 (P3 medium) -> P3 (yellow flag)
 * 1 -> 4 (P4 normal) -> P4 (no flag)
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
