import { v4 as uuidv4 } from "uuid";
import { TodoistApi, Section } from "@doist/todoist-api-typescript";
import {
  MoveSectionArgs,
  ReorderSectionsArgs,
  ArchiveSectionArgs,
  UnarchiveSectionArgs,
  SyncApiResponse,
} from "../types.js";
import { ValidationError, TodoistAPIError } from "../errors.js";
import { extractArrayFromResponse } from "../utils/api-helpers.js";
import { SYNC_API_URL } from "../utils/api-constants.js";

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

async function findSectionByName(
  api: TodoistApi,
  sectionName: string,
  projectId?: string
): Promise<string> {
  const getSectionsArgs = projectId ? { projectId } : {};
  const response = await api.getSections(
    getSectionsArgs as Parameters<typeof api.getSections>[0]
  );
  const sections = extractArrayFromResponse(response) as Section[];

  const normalizedSearch = sectionName.toLowerCase();

  const exactMatch = sections.find(
    (s) => s.name.toLowerCase() === normalizedSearch
  );
  if (exactMatch) return exactMatch.id;

  const partialMatch = sections.find((s) =>
    s.name.toLowerCase().includes(normalizedSearch)
  );
  if (partialMatch) return partialMatch.id;

  throw new ValidationError(`No section found matching: "${sectionName}"`);
}

async function resolveSectionId(
  api: TodoistApi,
  sectionId?: string,
  sectionName?: string,
  projectId?: string
): Promise<string> {
  if (sectionId) return sectionId;
  if (sectionName) return findSectionByName(api, sectionName, projectId);
  throw new ValidationError(
    "Either section_id or section_name must be provided"
  );
}

export async function handleMoveSection(
  api: TodoistApi,
  args: MoveSectionArgs
): Promise<string> {
  const sectionId = await resolveSectionId(
    api,
    args.section_id,
    args.section_name
  );

  if (!args.project_id) {
    throw new ValidationError("project_id is required for moving a section");
  }

  if (isDryRunMode()) {
    console.error(
      `[DRY-RUN] Would move section ${sectionId} to project ${args.project_id}`
    );
    return `[DRY-RUN] Would move section ${sectionId} to project ${args.project_id}`;
  }

  await executeSyncCommand("section_move", {
    id: sectionId,
    project_id: args.project_id,
  });

  return `Section ${sectionId} moved successfully to project ${args.project_id}`;
}

export async function handleReorderSections(
  args: ReorderSectionsArgs
): Promise<string> {
  if (!args.project_id) {
    throw new ValidationError("project_id is required for reordering sections");
  }

  if (!args.sections || args.sections.length === 0) {
    throw new ValidationError(
      "At least one section must be provided for reordering"
    );
  }

  for (const section of args.sections) {
    if (!section.id || section.section_order < 0) {
      throw new ValidationError(
        "Each section must have a valid id and non-negative section_order"
      );
    }
  }

  if (isDryRunMode()) {
    console.error(
      `[DRY-RUN] Would reorder ${args.sections.length} sections in project ${args.project_id}`
    );
    return `[DRY-RUN] Would reorder ${args.sections.length} sections: ${args.sections.map((s) => `${s.id}=>${s.section_order}`).join(", ")}`;
  }

  await executeSyncCommand("section_reorder", {
    sections: args.sections,
  });

  return `Successfully reordered ${args.sections.length} sections in project ${args.project_id}`;
}

export async function handleArchiveSection(
  api: TodoistApi,
  args: ArchiveSectionArgs
): Promise<string> {
  const sectionId = await resolveSectionId(
    api,
    args.section_id,
    args.section_name,
    args.project_id
  );

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would archive section ${sectionId}`);
    return `[DRY-RUN] Would archive section ${sectionId}`;
  }

  await executeSyncCommand("section_archive", { id: sectionId });

  return `Section ${sectionId} archived successfully`;
}

export async function handleUnarchiveSection(
  api: TodoistApi,
  args: UnarchiveSectionArgs
): Promise<string> {
  const sectionId = await resolveSectionId(
    api,
    args.section_id,
    args.section_name,
    args.project_id
  );

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would unarchive section ${sectionId}`);
    return `[DRY-RUN] Would unarchive section ${sectionId}`;
  }

  await executeSyncCommand("section_unarchive", { id: sectionId });

  return `Section ${sectionId} unarchived successfully`;
}
