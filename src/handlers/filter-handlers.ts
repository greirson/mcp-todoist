import { v4 as uuidv4 } from "uuid";
import {
  CreateFilterArgs,
  UpdateFilterArgs,
  FilterNameArgs,
  TodoistFilter,
  SyncApiResponse,
} from "../types.js";
import {
  ValidationError,
  FilterNotFoundError,
  FilterFrozenError,
  TodoistAPIError,
} from "../errors.js";
import { validateFilterData, validateFilterUpdate } from "../validation.js";
import { SimpleCache } from "../cache.js";
import { SYNC_API_URL } from "../utils/api-constants.js";

// Cache for filter data (30 second TTL)
const filterCache = new SimpleCache<TodoistFilter[]>(30000);

/**
 * Get the API token from the environment or from the client
 * We need direct access to make Sync API calls
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
 * Check if we're in dry-run mode
 */
function isDryRunMode(): boolean {
  return process.env.DRYRUN === "true";
}

/**
 * Make a Sync API request
 */
async function makeSyncRequest(
  body: Record<string, string>
): Promise<SyncApiResponse> {
  const token = getApiToken();

  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    formData.append(key, value);
  }

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Sync API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json() as Promise<SyncApiResponse>;
}

/**
 * Execute a sync command
 */
async function executeSyncCommand(
  type: string,
  args: Record<string, unknown>,
  tempId?: string
): Promise<SyncApiResponse> {
  const uuid = uuidv4();
  const command = {
    type,
    uuid,
    ...(tempId && { temp_id: tempId }),
    args,
  };

  const response = await makeSyncRequest({
    commands: JSON.stringify([command]),
  });

  // Check if the command succeeded
  if (response.sync_status) {
    const status = response.sync_status[uuid];
    if (status && typeof status === "object" && "error" in status) {
      throw new TodoistAPIError(
        `Filter operation failed: ${status.error} (code: ${status.error_code})`
      );
    }
    if (status !== "ok") {
      throw new TodoistAPIError(
        `Filter operation failed with status: ${status}`
      );
    }
  }

  return response;
}

/**
 * Fetch all filters using Sync API
 */
async function fetchFilters(): Promise<TodoistFilter[]> {
  const response = await makeSyncRequest({
    sync_token: "*",
    resource_types: JSON.stringify(["filters"]),
  });

  // Filter out deleted filters
  const filters = (response.filters || []).filter(
    (filter) => !filter.is_deleted
  );

  return filters;
}

/**
 * Get all filters (with caching)
 */
export async function handleGetFilters(): Promise<string> {
  const cacheKey = "filters:all";
  const cached = filterCache.get(cacheKey);
  let filters: TodoistFilter[];

  if (cached) {
    filters = cached;
  } else {
    try {
      filters = await fetchFilters();
      filterCache.set(cacheKey, filters);
    } catch (error) {
      throw new TodoistAPIError(
        "Failed to fetch filters",
        error instanceof Error ? error : undefined
      );
    }
  }

  if (filters.length === 0) {
    return "No custom filters found. Note: Filters require a Todoist Pro or Business plan.";
  }

  const filterList = filters
    .sort((a, b) => (a.item_order ?? 0) - (b.item_order ?? 0))
    .map((filter) => {
      const attributes: string[] = [`ID: ${filter.id}`];
      if (filter.color) attributes.push(`Color: ${filter.color}`);
      if (filter.is_favorite) attributes.push("Favorite");
      if (filter.is_frozen) attributes.push("Frozen");

      return `- ${filter.name} (${attributes.join(", ")})\n  Query: ${filter.query}`;
    })
    .join("\n");

  return `Found ${filters.length} filters:\n${filterList}`;
}

/**
 * Create a new filter
 */
export async function handleCreateFilter(
  args: CreateFilterArgs
): Promise<string> {
  const validatedData = validateFilterData(args);

  if (isDryRunMode()) {
    const mockId = `mock-filter-${Date.now()}`;
    console.error(
      `[DRY-RUN] Would create filter "${validatedData.name}" with query "${validatedData.query}"`
    );
    return `[DRY-RUN] Would create filter "${validatedData.name}" with query "${validatedData.query}" (mock ID: ${mockId})`;
  }

  try {
    const tempId = uuidv4();
    const commandArgs: Record<string, unknown> = {
      name: validatedData.name,
      query: validatedData.query,
    };

    if (validatedData.color) commandArgs.color = validatedData.color;
    if (validatedData.item_order !== undefined)
      commandArgs.item_order = validatedData.item_order;
    if (validatedData.is_favorite !== undefined)
      commandArgs.is_favorite = validatedData.is_favorite;

    const response = await executeSyncCommand(
      "filter_add",
      commandArgs,
      tempId
    );

    // Clear cache after mutation
    filterCache.clear();

    // Get the new filter ID from temp_id_mapping
    const newFilterId = response.temp_id_mapping?.[tempId] || tempId;

    return `Filter "${validatedData.name}" created successfully (ID: ${newFilterId})`;
  } catch (error) {
    throw new TodoistAPIError(
      "Failed to create filter",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Find a filter by ID or name
 */
async function findFilter(args: FilterNameArgs): Promise<TodoistFilter> {
  // If filter_id is provided, search for it directly
  if (args.filter_id) {
    const filters = await fetchFilters();
    const filter = filters.find((f) => f.id === args.filter_id);
    if (!filter) {
      throw new FilterNotFoundError(
        `Filter with ID ${args.filter_id} not found`
      );
    }
    return filter;
  }

  if (!args.filter_name) {
    throw new ValidationError(
      "Either filter_id or filter_name must be provided"
    );
  }

  const cached = filterCache.get("filters:all");
  let filters: TodoistFilter[];

  if (cached) {
    filters = cached;
  } else {
    try {
      filters = await fetchFilters();
      filterCache.set("filters:all", filters);
    } catch (error) {
      throw new TodoistAPIError(
        "Failed to fetch filters for search",
        error instanceof Error ? error : undefined
      );
    }
  }

  // Case-insensitive exact match first
  let matchingFilter = filters.find(
    (filter) => filter.name.toLowerCase() === args.filter_name!.toLowerCase()
  );

  // If no exact match, try partial match
  if (!matchingFilter) {
    matchingFilter = filters.find((filter) =>
      filter.name.toLowerCase().includes(args.filter_name!.toLowerCase())
    );
  }

  if (!matchingFilter) {
    throw new FilterNotFoundError(
      `No filter found with name: "${args.filter_name}"`
    );
  }

  return matchingFilter;
}

/**
 * Update an existing filter
 */
export async function handleUpdateFilter(
  args: UpdateFilterArgs
): Promise<string> {
  const filter = await findFilter({
    filter_id: args.filter_id,
    filter_name: args.filter_name,
  });

  // Check if filter is frozen
  if (filter.is_frozen) {
    throw new FilterFrozenError(filter.name);
  }

  const validatedUpdates = validateFilterUpdate(args);

  // Check if there are any updates to make
  const hasUpdates =
    validatedUpdates.name !== undefined ||
    validatedUpdates.query !== undefined ||
    validatedUpdates.color !== undefined ||
    validatedUpdates.item_order !== undefined ||
    validatedUpdates.is_favorite !== undefined;

  if (!hasUpdates) {
    return `No updates specified for filter "${filter.name}"`;
  }

  if (isDryRunMode()) {
    const changes: string[] = [];
    if (validatedUpdates.name) changes.push(`name: "${validatedUpdates.name}"`);
    if (validatedUpdates.query)
      changes.push(`query: "${validatedUpdates.query}"`);
    if (validatedUpdates.color)
      changes.push(`color: "${validatedUpdates.color}"`);
    if (validatedUpdates.item_order !== undefined)
      changes.push(`order: ${validatedUpdates.item_order}`);
    if (validatedUpdates.is_favorite !== undefined)
      changes.push(`favorite: ${validatedUpdates.is_favorite}`);

    console.error(
      `[DRY-RUN] Would update filter "${filter.name}" (ID: ${filter.id}) with: ${changes.join(", ")}`
    );
    return `[DRY-RUN] Would update filter "${filter.name}" (ID: ${filter.id})${changes.length > 0 ? ` (${changes.join(", ")})` : ""}`;
  }

  try {
    const commandArgs: Record<string, unknown> = {
      id: filter.id,
    };

    if (validatedUpdates.name !== undefined)
      commandArgs.name = validatedUpdates.name;
    if (validatedUpdates.query !== undefined)
      commandArgs.query = validatedUpdates.query;
    if (validatedUpdates.color !== undefined)
      commandArgs.color = validatedUpdates.color;
    if (validatedUpdates.item_order !== undefined)
      commandArgs.item_order = validatedUpdates.item_order;
    if (validatedUpdates.is_favorite !== undefined)
      commandArgs.is_favorite = validatedUpdates.is_favorite;

    await executeSyncCommand("filter_update", commandArgs);

    // Clear cache after mutation
    filterCache.clear();

    const changes: string[] = [];
    if (validatedUpdates.name) changes.push(`name: "${validatedUpdates.name}"`);
    if (validatedUpdates.query)
      changes.push(`query: "${validatedUpdates.query}"`);
    if (validatedUpdates.color)
      changes.push(`color: "${validatedUpdates.color}"`);
    if (validatedUpdates.item_order !== undefined)
      changes.push(`order: ${validatedUpdates.item_order}`);
    if (validatedUpdates.is_favorite !== undefined)
      changes.push(`favorite: ${validatedUpdates.is_favorite}`);

    return `Filter "${filter.name}" updated successfully${changes.length > 0 ? ` (${changes.join(", ")})` : ""}`;
  } catch (error) {
    throw new TodoistAPIError(
      `Failed to update filter "${filter.name}"`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Delete a filter
 */
export async function handleDeleteFilter(
  args: FilterNameArgs
): Promise<string> {
  const filter = await findFilter(args);

  // Check if filter is frozen
  if (filter.is_frozen) {
    throw new FilterFrozenError(filter.name);
  }

  if (isDryRunMode()) {
    console.error(
      `[DRY-RUN] Would delete filter "${filter.name}" (ID: ${filter.id})`
    );
    return `[DRY-RUN] Would delete filter "${filter.name}" (ID: ${filter.id})`;
  }

  try {
    await executeSyncCommand("filter_delete", { id: filter.id });

    // Clear cache after mutation
    filterCache.clear();

    return `Filter "${filter.name}" deleted successfully`;
  } catch (error) {
    throw new TodoistAPIError(
      `Failed to delete filter "${filter.name}"`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Clear the filter cache (useful for testing)
 */
export function clearFilterCache(): void {
  filterCache.clear();
}
