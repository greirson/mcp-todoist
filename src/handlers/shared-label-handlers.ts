import { v4 as uuidv4 } from "uuid";
import {
  SharedLabel,
  RenameSharedLabelArgs,
  RemoveSharedLabelArgs,
  SyncApiResponse,
} from "../types.js";
import { ValidationError, TodoistAPIError } from "../errors.js";
import { SimpleCache } from "../cache.js";
import { SYNC_API_URL } from "../utils/api-constants.js";

const sharedLabelsCache = new SimpleCache<SharedLabel[]>(30000);

function getApiToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new TodoistAPIError(
      "TODOIST_API_TOKEN environment variable is not set"
    );
  }
  return token;
}

function isDryRunMode(): boolean {
  return process.env.DRYRUN === "true";
}

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

async function executeSyncCommand(
  type: string,
  args: Record<string, unknown>
): Promise<SyncApiResponse> {
  const uuid = uuidv4();
  const command = {
    type,
    uuid,
    args,
  };

  const response = await makeSyncRequest({
    commands: JSON.stringify([command]),
  });

  if (response.sync_status) {
    const status = response.sync_status[uuid];
    if (status && typeof status === "object" && "error" in status) {
      throw new TodoistAPIError(
        `Operation failed: ${status.error} (code: ${status.error_code})`
      );
    }
    if (status !== "ok") {
      throw new TodoistAPIError(`Operation failed with status: ${status}`);
    }
  }

  return response;
}

interface SyncLabelsResponse extends SyncApiResponse {
  labels?: SharedLabel[];
}

export async function handleGetSharedLabels(): Promise<string> {
  const cacheKey = "shared_labels:all";
  const cached = sharedLabelsCache.get(cacheKey);

  if (cached) {
    return formatSharedLabels(cached);
  }

  const token = getApiToken();

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sync_token: "*",
      resource_types: JSON.stringify(["labels"]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 403) {
      return "Shared labels require a Todoist Business account. This feature is not available on your current plan.";
    }
    throw new TodoistAPIError(
      `Failed to fetch shared labels: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncLabelsResponse;
  const labels = data.labels || [];

  sharedLabelsCache.set(cacheKey, labels);

  return formatSharedLabels(labels);
}

function formatSharedLabels(labels: SharedLabel[]): string {
  if (labels.length === 0) {
    return "No shared labels found. Shared labels require a Todoist Business account and are used for team collaboration.";
  }

  const labelList = labels.map((label) => `- ${label.name}`).join("\n");

  return `Found ${labels.length} shared labels:\n${labelList}\n\nNote: Shared labels are available in Todoist Business accounts for team collaboration.`;
}

export async function handleRenameSharedLabel(
  args: RenameSharedLabelArgs
): Promise<string> {
  if (!args.name || !args.name.trim()) {
    throw new ValidationError("Current label name is required");
  }
  if (!args.new_name || !args.new_name.trim()) {
    throw new ValidationError("New label name is required");
  }

  if (isDryRunMode()) {
    console.error(
      `[DRY-RUN] Would rename shared label "${args.name}" to "${args.new_name}"`
    );
    return `[DRY-RUN] Would rename shared label "${args.name}" to "${args.new_name}"`;
  }

  await executeSyncCommand("label_update_orders", {
    name_mappings: { [args.name]: args.new_name },
  });

  sharedLabelsCache.clear();

  return `Shared label "${args.name}" renamed to "${args.new_name}" successfully`;
}

export async function handleRemoveSharedLabel(
  args: RemoveSharedLabelArgs
): Promise<string> {
  if (!args.name || !args.name.trim()) {
    throw new ValidationError("Label name is required");
  }

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would remove shared label "${args.name}"`);
    return `[DRY-RUN] Would remove shared label "${args.name}"`;
  }

  await executeSyncCommand("delete_shared_label", { name: args.name });

  sharedLabelsCache.clear();

  return `Shared label "${args.name}" removed successfully from all items in the workspace`;
}

export function clearSharedLabelsCache(): void {
  sharedLabelsCache.clear();
}
