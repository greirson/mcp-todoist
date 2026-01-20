import { v4 as uuidv4 } from "uuid";
import {
  ProjectNote,
  GetProjectNotesArgs,
  CreateProjectNoteArgs,
  UpdateProjectNoteArgs,
  DeleteProjectNoteArgs,
  SyncApiResponse,
} from "../types.js";
import { TodoistAPIError, ValidationError } from "../errors.js";
import { SimpleCache } from "../cache.js";

const SYNC_API_URL = "https://api.todoist.com/sync/v9";

const projectNotesCache = new SimpleCache<ProjectNote[]>(30000);

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

async function executeSyncCommand(
  type: string,
  args: Record<string, unknown>
): Promise<SyncApiResponse> {
  const token = getApiToken();
  const uuid = uuidv4();
  const command = { type, uuid, args };

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      commands: JSON.stringify([command]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Sync API request failed: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncApiResponse;

  if (data.sync_status) {
    const status = data.sync_status[uuid];
    if (status && typeof status === "object" && "error" in status) {
      throw new TodoistAPIError(
        `Operation failed: ${status.error} (code: ${status.error_code})`
      );
    }
    if (status !== "ok") {
      throw new TodoistAPIError(`Operation failed with status: ${status}`);
    }
  }

  return data;
}

interface SyncNotesResponse extends SyncApiResponse {
  project_notes?: ProjectNote[];
}

export async function handleGetProjectNotes(
  args: GetProjectNotesArgs
): Promise<string> {
  if (!args.project_id || !args.project_id.trim()) {
    throw new ValidationError("Project ID is required");
  }

  const cacheKey = `project_notes:${args.project_id}`;
  const cached = projectNotesCache.get(cacheKey);

  if (cached) {
    return formatProjectNotes(cached, args.project_id);
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
      resource_types: JSON.stringify(["project_notes"]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Failed to fetch project notes: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncNotesResponse;
  const allNotes = data.project_notes || [];
  const projectNotes = allNotes.filter(
    (note) => note.project_id === args.project_id && !note.is_deleted
  );

  projectNotesCache.set(cacheKey, projectNotes);

  return formatProjectNotes(projectNotes, args.project_id);
}

function formatProjectNotes(notes: ProjectNote[], projectId: string): string {
  if (notes.length === 0) {
    return `No notes found for project ${projectId}. Use todoist_project_note_create to add notes.`;
  }

  const noteList = notes
    .map((note, index) => {
      const date = new Date(note.posted_at);
      const formattedDate = date.toLocaleString();
      const preview =
        note.content.length > 200
          ? note.content.substring(0, 200) + "..."
          : note.content;
      const attachment = note.file_attachment
        ? `\n   Attachment: ${note.file_attachment.file_name}`
        : "";
      return `${index + 1}. [${formattedDate}] ID: ${note.id}\n   ${preview}${attachment}`;
    })
    .join("\n\n");

  return `Found ${notes.length} notes for project ${projectId}:\n\n${noteList}`;
}

export async function handleCreateProjectNote(
  args: CreateProjectNoteArgs
): Promise<string> {
  if (!args.project_id || !args.project_id.trim()) {
    throw new ValidationError("Project ID is required");
  }
  if (!args.content || !args.content.trim()) {
    throw new ValidationError("Note content is required");
  }

  if (isDryRunMode()) {
    const tempId = `temp_${Date.now()}`;
    console.error(
      `[DRY-RUN] Would create project note for project ${args.project_id}`
    );
    return `[DRY-RUN] Would create project note:\nProject: ${args.project_id}\nContent: ${args.content.substring(0, 100)}...\nTemp ID: ${tempId}`;
  }

  const tempId = uuidv4();

  await executeSyncCommand("note_add", {
    project_id: args.project_id,
    content: args.content,
    temp_id: tempId,
  });

  projectNotesCache.clear();

  return `Project note created successfully for project ${args.project_id}:\n\nContent: ${args.content.substring(0, 200)}${args.content.length > 200 ? "..." : ""}`;
}

export async function handleUpdateProjectNote(
  args: UpdateProjectNoteArgs
): Promise<string> {
  if (!args.note_id || !args.note_id.trim()) {
    throw new ValidationError("Note ID is required");
  }
  if (!args.content || !args.content.trim()) {
    throw new ValidationError("Note content is required");
  }

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would update project note ${args.note_id}`);
    return `[DRY-RUN] Would update project note ${args.note_id}:\nNew content: ${args.content.substring(0, 100)}...`;
  }

  await executeSyncCommand("note_update", {
    id: args.note_id,
    content: args.content,
  });

  projectNotesCache.clear();

  return `Project note ${args.note_id} updated successfully:\n\nNew content: ${args.content.substring(0, 200)}${args.content.length > 200 ? "..." : ""}`;
}

export async function handleDeleteProjectNote(
  args: DeleteProjectNoteArgs
): Promise<string> {
  if (!args.note_id || !args.note_id.trim()) {
    throw new ValidationError("Note ID is required");
  }

  if (isDryRunMode()) {
    console.error(`[DRY-RUN] Would delete project note ${args.note_id}`);
    return `[DRY-RUN] Would delete project note ${args.note_id}`;
  }

  await executeSyncCommand("note_delete", {
    id: args.note_id,
  });

  projectNotesCache.clear();

  return `Project note ${args.note_id} deleted successfully`;
}

export function clearProjectNotesCache(): void {
  projectNotesCache.clear();
}
