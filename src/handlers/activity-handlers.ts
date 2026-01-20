import {
  GetActivityArgs,
  GetActivityByProjectArgs,
  GetActivityByDateRangeArgs,
  ActivityLogEvent,
  ActivityResponse,
} from "../types.js";
import { TodoistAPIError } from "../errors.js";
import { SimpleCache } from "../cache.js";

// Cache for activity data (30 second TTL)
const activityCache = new SimpleCache<ActivityResponse>(30000);

// Base URL for Todoist Sync API
const SYNC_API_URL = "https://api.todoist.com/sync/v9";

/**
 * Get the API token from the environment
 */
function getApiToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new TodoistAPIError(
      "TODOIST_API_TOKEN environment variable is not set"
    );
  }
  return token;
}

/**
 * Make an activity log API request
 */
async function fetchActivity(
  params: Record<string, string | number | undefined>
): Promise<ActivityLogEvent[]> {
  const token = getApiToken();

  // Build query parameters, filtering out undefined values
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  }

  const url = `${SYNC_API_URL}/activity/get?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Activity API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  // The API returns an object with "events" array or directly an array
  if (Array.isArray(data)) {
    return data as ActivityLogEvent[];
  }
  if (data && Array.isArray(data.events)) {
    return data.events as ActivityLogEvent[];
  }

  return [];
}

/**
 * Format activity events for display
 */
function formatActivityEvents(events: ActivityLogEvent[]): string {
  if (events.length === 0) {
    return "No activity events found matching the criteria.";
  }

  const formatted = events.map((event) => {
    const parts: string[] = [
      `- [${event.event_date}] ${event.event_type.toUpperCase()} ${event.object_type}`,
      `  ID: ${event.id}, Object ID: ${event.object_id}`,
    ];

    if (event.parent_project_id) {
      parts.push(`  Project: ${event.parent_project_id}`);
    }
    if (event.parent_item_id) {
      parts.push(`  Parent Item: ${event.parent_item_id}`);
    }
    if (event.initiator_id) {
      parts.push(`  Initiated by: ${event.initiator_id}`);
    }
    if (event.extra_data && Object.keys(event.extra_data).length > 0) {
      parts.push(`  Extra: ${JSON.stringify(event.extra_data)}`);
    }

    return parts.join("\n");
  });

  return `Found ${events.length} activity events:\n\n${formatted.join("\n\n")}`;
}

/**
 * Get activity log with optional filters
 */
export async function handleGetActivity(
  args: GetActivityArgs
): Promise<string> {
  const cacheKey = `activity:${JSON.stringify(args)}`;
  const cached = activityCache.get(cacheKey);

  if (cached) {
    return formatActivityEvents(cached.events);
  }

  try {
    const events = await fetchActivity({
      object_type: args.object_type,
      object_id: args.object_id,
      event_type: args.event_type,
      parent_project_id: args.parent_project_id,
      parent_item_id: args.parent_item_id,
      initiator_id: args.initiator_id,
      since: args.since,
      until: args.until,
      limit: args.limit,
      offset: args.offset,
    });

    const response: ActivityResponse = { events, count: events.length };
    activityCache.set(cacheKey, response);

    return formatActivityEvents(events);
  } catch (error) {
    throw new TodoistAPIError(
      "Failed to fetch activity log",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get activity log for a specific project
 */
export async function handleGetActivityByProject(
  args: GetActivityByProjectArgs
): Promise<string> {
  const cacheKey = `activity:project:${JSON.stringify(args)}`;
  const cached = activityCache.get(cacheKey);

  if (cached) {
    return formatActivityEvents(cached.events);
  }

  try {
    const events = await fetchActivity({
      parent_project_id: args.project_id,
      event_type: args.event_type,
      object_type: args.object_type,
      since: args.since,
      until: args.until,
      limit: args.limit,
      offset: args.offset,
    });

    const response: ActivityResponse = { events, count: events.length };
    activityCache.set(cacheKey, response);

    return formatActivityEvents(events);
  } catch (error) {
    throw new TodoistAPIError(
      `Failed to fetch activity log for project ${args.project_id}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get activity log within a date range
 */
export async function handleGetActivityByDateRange(
  args: GetActivityByDateRangeArgs
): Promise<string> {
  const cacheKey = `activity:daterange:${JSON.stringify(args)}`;
  const cached = activityCache.get(cacheKey);

  if (cached) {
    return formatActivityEvents(cached.events);
  }

  try {
    const events = await fetchActivity({
      since: args.since,
      until: args.until,
      object_type: args.object_type,
      event_type: args.event_type,
      parent_project_id: args.project_id,
      limit: args.limit,
      offset: args.offset,
    });

    const response: ActivityResponse = { events, count: events.length };
    activityCache.set(cacheKey, response);

    return formatActivityEvents(events);
  } catch (error) {
    throw new TodoistAPIError(
      `Failed to fetch activity log for date range ${args.since} to ${args.until}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Clear the activity cache (useful for testing)
 */
export function clearActivityCache(): void {
  activityCache.clear();
}
