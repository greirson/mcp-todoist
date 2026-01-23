/**
 * Notes Router - Routes todoist_project_notes actions to existing handlers
 */

import { ValidationError } from "../../errors.js";
import {
  handleGetProjectNotes,
  handleCreateProjectNote,
  handleUpdateProjectNote,
  handleDeleteProjectNote,
} from "../project-notes-handlers.js";
import {
  GetProjectNotesArgs,
  CreateProjectNoteArgs,
  UpdateProjectNoteArgs,
  DeleteProjectNoteArgs,
} from "../../types.js";

export async function handleNotesAction(
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetProjectNotes(args as unknown as GetProjectNotesArgs);
    case "create":
      return handleCreateProjectNote(args as unknown as CreateProjectNoteArgs);
    case "update":
      return handleUpdateProjectNote(args as unknown as UpdateProjectNoteArgs);
    case "delete":
      return handleDeleteProjectNote(args as unknown as DeleteProjectNoteArgs);
    default:
      throw new ValidationError(`Unknown project notes action: ${action}`);
  }
}
