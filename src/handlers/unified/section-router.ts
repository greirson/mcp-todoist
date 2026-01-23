/**
 * Section Router - Routes todoist_section actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleGetSections,
  handleCreateSection,
  handleUpdateSection,
  handleDeleteSection,
} from "../project-handlers.js";
import {
  handleMoveSection,
  handleReorderSections,
  handleArchiveSection,
  handleUnarchiveSection,
} from "../section-operations-handlers.js";
import {
  GetSectionsArgs,
  CreateSectionArgs,
  UpdateSectionArgs,
  SectionIdentifierArgs,
  MoveSectionArgs,
  ReorderSectionsArgs,
  ArchiveSectionArgs,
  UnarchiveSectionArgs,
} from "../../types.js";

export async function handleSectionAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetSections(api, args as unknown as GetSectionsArgs);
    case "create":
      return handleCreateSection(api, args as unknown as CreateSectionArgs);
    case "update":
      return handleUpdateSection(api, args as unknown as UpdateSectionArgs);
    case "delete":
      return handleDeleteSection(api, args as unknown as SectionIdentifierArgs);
    case "move":
      return handleMoveSection(api, args as unknown as MoveSectionArgs);
    case "reorder":
      return handleReorderSections(args as unknown as ReorderSectionsArgs);
    case "archive":
      return handleArchiveSection(api, args as unknown as ArchiveSectionArgs);
    case "unarchive":
      return handleUnarchiveSection(
        api,
        args as unknown as UnarchiveSectionArgs
      );
    default:
      throw new ValidationError(`Unknown section action: ${action}`);
  }
}
