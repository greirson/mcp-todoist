import { v4 as uuidv4 } from "uuid";
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  ReorderProjectsArgs,
  MoveProjectToParentArgs,
  GetArchivedProjectsArgs,
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

interface ProjectInfo {
  id: string;
  name: string;
}

async function findProjectByName(
  api: TodoistApi,
  projectName: string
): Promise<string> {
  const response = await api.getProjects();
  const projects = extractArrayFromResponse(response) as ProjectInfo[];
  const normalizedSearch = projectName.toLowerCase();

  const exactMatch = projects.find(
    (p) => p.name.toLowerCase() === normalizedSearch
  );
  if (exactMatch) return exactMatch.id;

  const partialMatch = projects.find((p) =>
    p.name.toLowerCase().includes(normalizedSearch)
  );
  if (partialMatch) return partialMatch.id;

  throw new ValidationError(`No project found matching: "${projectName}"`);
}

async function resolveProjectId(
  api: TodoistApi,
  projectId?: string,
  projectName?: string
): Promise<string> {
  if (projectId) return projectId;
  if (projectName) return findProjectByName(api, projectName);
  throw new ValidationError(
    "Either project_id or project_name must be provided"
  );
}

export async function handleReorderProjects(
  args: ReorderProjectsArgs
): Promise<string> {
  if (!args.projects || args.projects.length === 0) {
    throw new ValidationError(
      "At least one project must be provided for reordering"
    );
  }

  for (const project of args.projects) {
    if (!project.id || project.child_order < 0) {
      throw new ValidationError(
        "Each project must have a valid id and non-negative child_order"
      );
    }
  }

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would reorder ${args.projects.length} projects`);
    return `[DRY-RUN] Would reorder ${args.projects.length} projects: ${args.projects.map((p) => `${p.id}=>${p.child_order}`).join(", ")}`;
  }

  await executeSyncCommand("project_reorder", { projects: args.projects });

  return `Successfully reordered ${args.projects.length} projects`;
}

export async function handleMoveProjectToParent(
  api: TodoistApi,
  args: MoveProjectToParentArgs
): Promise<string> {
  const projectId = await resolveProjectId(
    api,
    args.project_id,
    args.project_name
  );

  if (isDryRunMode()) {
    const parentInfo = args.parent_id
      ? `under parent ${args.parent_id}`
      : "to root level";
    console.error(`[DRY-RUN] Would move project ${projectId} ${parentInfo}`);
    return `[DRY-RUN] Would move project ${projectId} ${parentInfo}`;
  }

  const commandArgs: Record<string, unknown> = { id: projectId };
  if (args.parent_id) {
    commandArgs.parent_id = args.parent_id;
  } else {
    commandArgs.parent_id = null;
  }

  await executeSyncCommand("project_move", commandArgs);

  const parentInfo = args.parent_id
    ? `under parent ${args.parent_id}`
    : "to root level";
  return `Project ${projectId} moved successfully ${parentInfo}`;
}

interface ArchivedProject {
  id: string;
  name: string;
  color?: string;
  is_archived?: boolean;
}

interface SyncFullResponse {
  projects?: ArchivedProject[];
}

export async function handleGetArchivedProjects(
  args: GetArchivedProjectsArgs
): Promise<string> {
  const token = getApiToken();

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sync_token: "*",
      resource_types: JSON.stringify(["projects"]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Failed to fetch projects: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncFullResponse;
  const allProjects = data.projects || [];

  const archivedProjects = allProjects.filter((p) => p.is_archived === true);

  if (archivedProjects.length === 0) {
    return "No archived projects found.";
  }

  let projects = archivedProjects;
  const offset = args.offset || 0;
  const limit = args.limit || 50;

  if (offset > 0) {
    projects = projects.slice(offset);
  }
  projects = projects.slice(0, limit);

  const projectList = projects
    .map(
      (p) => `- ${p.name} (ID: ${p.id}${p.color ? `, Color: ${p.color}` : ""})`
    )
    .join("\n");

  return `Found ${archivedProjects.length} archived projects (showing ${projects.length}):\n${projectList}`;
}
