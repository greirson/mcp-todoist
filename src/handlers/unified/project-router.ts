/**
 * Project Router - Routes todoist_project actions to existing handlers
 */

import { TodoistApi } from "@doist/todoist-api-typescript";
import { ValidationError } from "../../errors.js";
import {
  handleGetProjects,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
  handleArchiveProject,
  handleGetProjectCollaborators,
} from "../project-handlers.js";
import {
  handleReorderProjects,
  handleMoveProjectToParent,
  handleGetArchivedProjects,
} from "../project-operations-handlers.js";
import {
  CreateProjectArgs,
  UpdateProjectArgs,
  ProjectNameArgs,
  GetProjectCollaboratorsArgs,
  ReorderProjectsArgs,
  MoveProjectToParentArgs,
  GetArchivedProjectsArgs,
} from "../../types.js";

export async function handleProjectAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetProjects(api);
    case "create":
      return handleCreateProject(api, args as unknown as CreateProjectArgs);
    case "update":
      return handleUpdateProject(api, args as unknown as UpdateProjectArgs);
    case "delete":
      return handleDeleteProject(api, args as unknown as ProjectNameArgs);
    case "archive":
      return handleArchiveProject(
        api,
        args as unknown as ProjectNameArgs & { archive?: boolean }
      );
    case "collaborators":
      return handleGetProjectCollaborators(
        api,
        args as unknown as GetProjectCollaboratorsArgs
      );
    default:
      throw new ValidationError(`Unknown project action: ${action}`);
  }
}

export async function handleProjectOpsAction(
  api: TodoistApi,
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "reorder":
      return handleReorderProjects(args as unknown as ReorderProjectsArgs);
    case "move_to_parent":
      return handleMoveProjectToParent(
        api,
        args as unknown as MoveProjectToParentArgs
      );
    case "get_archived":
      return handleGetArchivedProjects(
        args as unknown as GetArchivedProjectsArgs
      );
    default:
      throw new ValidationError(`Unknown project operations action: ${action}`);
  }
}
