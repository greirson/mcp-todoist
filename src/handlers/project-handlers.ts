import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateProjectArgs,
  UpdateProjectArgs,
  ProjectNameArgs,
  GetProjectCollaboratorsArgs,
  GetSectionsArgs,
  CreateSectionArgs,
  UpdateSectionArgs,
  SectionIdentifierArgs,
  GetCollaboratorsArgs,
  TodoistProjectData,
  TodoistProject,
  TodoistSection,
  TodoistCollaborator,
} from "../types.js";
import { extractArrayFromResponse } from "../utils/api-helpers.js";
import { ProjectNotFoundError, ValidationError } from "../errors.js";
import { CacheManager } from "../cache.js";

const cacheManager = CacheManager.getInstance();

/**
 * Helper function to find a project by ID or name
 */
async function findProject(
  todoistClient: TodoistApi,
  projectId?: string,
  projectName?: string
): Promise<TodoistProject> {
  // If project_id is provided, use it directly
  if (projectId) {
    const project = await todoistClient.getProject(projectId);
    return project as TodoistProject;
  }

  // Search by name
  if (projectName) {
    const result = await todoistClient.getProjects();
    const projects = extractArrayFromResponse<TodoistProject>(result);
    const searchTerm = projectName.toLowerCase();

    const matchingProject = projects.find(
      (project) =>
        project.name.toLowerCase().includes(searchTerm) ||
        project.name.toLowerCase() === searchTerm
    );

    if (!matchingProject) {
      throw new ProjectNotFoundError(
        `No project found matching "${projectName}"`
      );
    }

    return matchingProject;
  }

  throw new ProjectNotFoundError(
    "Either project_id or project_name is required"
  );
}

export async function handleGetProjects(
  todoistClient: TodoistApi
): Promise<string> {
  const result = await todoistClient.getProjects();

  // Handle the new API response format with 'results' property
  const projects = extractArrayFromResponse<TodoistProject>(result);

  // Build a map of project parents for hierarchy display
  const projectMap = new Map<string, TodoistProject>();
  projects.forEach((p) => projectMap.set(p.id, p));

  const projectList = projects
    .map((project: TodoistProject) => {
      let info = `- ${project.name} (ID: ${project.id})`;
      if (project.parentId) {
        const parent = projectMap.get(project.parentId);
        if (parent) {
          info += ` [Sub-project of: ${parent.name}]`;
        }
      }
      if (project.description) {
        info += `\n  Description: ${project.description}`;
      }
      if (project.viewStyle) {
        info += ` | View: ${project.viewStyle}`;
      }
      if (project.isArchived) {
        info += " [ARCHIVED]";
      }
      if (project.isShared) {
        info += " [SHARED]";
      }
      if (project.isFavorite) {
        info += " [FAVORITE]";
      }
      return info;
    })
    .join("\n");

  return projects.length > 0
    ? `Projects:\n${projectList}`
    : "No projects found";
}

export async function handleGetSections(
  todoistClient: TodoistApi,
  args: GetSectionsArgs
): Promise<string> {
  // Use getSections with proper type handling
  const result = await todoistClient.getSections(
    args as Parameters<typeof todoistClient.getSections>[0]
  );

  // Handle the new API response format with 'results' property
  const sections = extractArrayFromResponse<TodoistSection>(result);

  const sectionList = sections
    .map(
      (section: TodoistSection) =>
        `- ${section.name} (ID: ${section.id}, Project ID: ${section.projectId})`
    )
    .join("\n");

  return sections.length > 0
    ? `Sections:\n${sectionList}`
    : "No sections found";
}

export async function handleCreateProject(
  todoistClient: TodoistApi,
  args: CreateProjectArgs
): Promise<string> {
  const projectData: TodoistProjectData = {
    name: args.name,
  };

  if (args.color) {
    projectData.color = args.color;
  }

  if (args.is_favorite !== undefined) {
    projectData.isFavorite = args.is_favorite;
  }

  if (args.parent_id) {
    projectData.parentId = args.parent_id;
  }

  if (args.view_style) {
    projectData.viewStyle = args.view_style;
  }

  // Note: The Todoist API TypeScript client doesn't directly support description
  // in addProject, but we'll include it in case the API has been updated
  const projectDataWithDescription = {
    ...projectData,
    ...(args.description && { description: args.description }),
  };

  const project = await todoistClient.addProject(projectDataWithDescription);

  // Clear projects cache after creation
  cacheManager.clearAll();

  let response = `Project created:\nName: ${project.name}\nID: ${project.id}`;
  if (project.color) {
    response += `\nColor: ${project.color}`;
  }
  if (project.isFavorite) {
    response += "\nMarked as favorite";
  }
  if (args.parent_id) {
    response += `\nParent Project ID: ${args.parent_id}`;
  }
  if (args.description) {
    response += `\nDescription: ${args.description}`;
  }
  if (args.view_style) {
    response += `\nView Style: ${args.view_style}`;
  }

  return response;
}

export async function handleUpdateProject(
  todoistClient: TodoistApi,
  args: UpdateProjectArgs
): Promise<string> {
  // Find the project
  const project = await findProject(
    todoistClient,
    args.project_id,
    args.project_name
  );

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (args.name !== undefined) {
    updateData.name = args.name;
  }
  if (args.color !== undefined) {
    updateData.color = args.color;
  }
  if (args.is_favorite !== undefined) {
    updateData.isFavorite = args.is_favorite;
  }
  if (args.description !== undefined) {
    updateData.description = args.description;
  }
  if (args.view_style !== undefined) {
    updateData.viewStyle = args.view_style;
  }

  if (Object.keys(updateData).length === 0) {
    return `No updates specified for project "${project.name}" (ID: ${project.id})`;
  }

  const updatedProject = await todoistClient.updateProject(
    project.id,
    updateData
  );

  // Clear projects cache after update
  cacheManager.clearAll();

  let response = `Project updated:\nName: ${updatedProject.name}\nID: ${updatedProject.id}`;

  if (args.name) {
    response += `\nNew name: ${args.name}`;
  }
  if (args.color) {
    response += `\nNew color: ${args.color}`;
  }
  if (args.is_favorite !== undefined) {
    response += `\nFavorite: ${args.is_favorite}`;
  }
  if (args.description !== undefined) {
    response += `\nDescription: ${args.description || "(cleared)"}`;
  }
  if (args.view_style) {
    response += `\nView style: ${args.view_style}`;
  }

  return response;
}

export async function handleDeleteProject(
  todoistClient: TodoistApi,
  args: ProjectNameArgs
): Promise<string> {
  // Find the project
  const project = await findProject(
    todoistClient,
    args.project_id,
    args.project_name
  );

  await todoistClient.deleteProject(project.id);

  // Clear projects cache after deletion
  cacheManager.clearAll();

  return `Project deleted:\nName: ${project.name}\nID: ${project.id}`;
}

export async function handleArchiveProject(
  todoistClient: TodoistApi,
  args: ProjectNameArgs & { archive?: boolean }
): Promise<string> {
  // Find the project
  const project = await findProject(
    todoistClient,
    args.project_id,
    args.project_name
  );

  const shouldArchive = args.archive !== false; // Default to true

  if (shouldArchive) {
    // Archive the project
    // The TypeScript client has archiveProject method
    await (
      todoistClient as TodoistApi & {
        archiveProject: (id: string) => Promise<unknown>; // eslint-disable-line no-unused-vars
      }
    ).archiveProject(project.id);

    // Clear projects cache
    cacheManager.clearAll();

    return `Project archived:\nName: ${project.name}\nID: ${project.id}`;
  } else {
    // Unarchive the project
    await (
      todoistClient as TodoistApi & {
        unarchiveProject: (id: string) => Promise<unknown>; // eslint-disable-line no-unused-vars
      }
    ).unarchiveProject(project.id);

    // Clear projects cache
    cacheManager.clearAll();

    return `Project unarchived:\nName: ${project.name}\nID: ${project.id}`;
  }
}

export async function handleGetProjectCollaborators(
  todoistClient: TodoistApi,
  args: GetProjectCollaboratorsArgs
): Promise<string> {
  // Find the project
  const project = await findProject(
    todoistClient,
    args.project_id,
    args.project_name
  );

  // The TypeScript client may have getProjectCollaborators method
  // We need to make a direct API call or use the available method
  try {
    // Try to get collaborators - this endpoint may require the project to be shared
    const collaborators = await (
      todoistClient as TodoistApi & {
        getProjectCollaborators: (projectId: string) => Promise<unknown>; // eslint-disable-line no-unused-vars
      }
    ).getProjectCollaborators(project.id);

    const collaboratorList =
      extractArrayFromResponse<TodoistCollaborator>(collaborators);

    if (collaboratorList.length === 0) {
      return `Project "${project.name}" (ID: ${project.id}) has no collaborators.\nNote: The project may not be shared.`;
    }

    const collaboratorInfo = collaboratorList
      .map(
        (collab) =>
          `- ${collab.name || "Unknown"} (${collab.email || "No email"}) [ID: ${collab.id}]`
      )
      .join("\n");

    return `Collaborators for project "${project.name}" (ID: ${project.id}):\n${collaboratorInfo}`;
  } catch (error) {
    // If the API method doesn't exist or fails, provide a helpful message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return `Unable to retrieve collaborators for project "${project.name}" (ID: ${project.id}).\nThe project may not be shared, or the API endpoint is not available.\nError: ${errorMessage}`;
  }
}

export async function handleCreateSection(
  todoistClient: TodoistApi,
  args: CreateSectionArgs
): Promise<string> {
  const sectionData: { name: string; projectId: string; order?: number } = {
    name: args.name,
    projectId: args.project_id,
  };

  if (args.order !== undefined) {
    sectionData.order = args.order;
  }

  const section = await todoistClient.addSection(sectionData);

  return `Section created:\nName: ${section.name}\nID: ${section.id}\nProject ID: ${section.projectId}${
    section.sectionOrder !== undefined ? `\nOrder: ${section.sectionOrder}` : ""
  }`;
}

/**
 * Helper function to find a section by ID or name
 */
async function findSection(
  todoistClient: TodoistApi,
  args: SectionIdentifierArgs
): Promise<TodoistSection> {
  // If section_id is provided, fetch directly
  if (args.section_id) {
    const section = await todoistClient.getSection(args.section_id);
    return {
      id: section.id,
      name: section.name,
      projectId: section.projectId,
    };
  }

  // Otherwise, search by name
  if (!args.section_name) {
    throw new ValidationError(
      "Either section_id or section_name must be provided"
    );
  }

  // Get sections, optionally filtered by project
  const getSectionsArgs = args.project_id ? { projectId: args.project_id } : {};
  const result = await todoistClient.getSections(
    getSectionsArgs as Parameters<typeof todoistClient.getSections>[0]
  );
  const sections = extractArrayFromResponse<TodoistSection>(result);

  // Case-insensitive partial match
  const searchTerm = args.section_name.toLowerCase();
  const matchingSections = sections.filter((section: TodoistSection) =>
    section.name.toLowerCase().includes(searchTerm)
  );

  if (matchingSections.length === 0) {
    const projectContext = args.project_id
      ? ` in project ${args.project_id}`
      : "";
    throw new ValidationError(
      `No section found matching "${args.section_name}"${projectContext}`
    );
  }

  if (matchingSections.length > 1) {
    const sectionList = matchingSections
      .map(
        (s: TodoistSection) =>
          `- ${s.name} (ID: ${s.id}, Project ID: ${s.projectId})`
      )
      .join("\n");
    throw new ValidationError(
      `Multiple sections found matching "${args.section_name}". Please be more specific or use section_id:\n${sectionList}`
    );
  }

  return matchingSections[0];
}

export async function handleUpdateSection(
  todoistClient: TodoistApi,
  args: UpdateSectionArgs
): Promise<string> {
  // Find the section
  const section = await findSection(todoistClient, args);

  // Build update data - API only supports updating name
  if (!args.name) {
    throw new ValidationError("No updates provided. 'name' is required.");
  }

  const updatedSection = await todoistClient.updateSection(section.id, {
    name: args.name,
  });

  // Clear cache after section update
  cacheManager.clearAll();

  return `Section updated:\nID: ${updatedSection.id}\nOld Name: ${section.name}\nNew Name: ${updatedSection.name}\nProject ID: ${updatedSection.projectId}`;
}

export async function handleDeleteSection(
  todoistClient: TodoistApi,
  args: SectionIdentifierArgs
): Promise<string> {
  // Find the section
  const section = await findSection(todoistClient, args);

  // Delete the section
  await todoistClient.deleteSection(section.id);

  // Clear cache after section deletion
  cacheManager.clearAll();

  return `Section deleted:\nName: ${section.name}\nID: ${section.id}\nProject ID: ${section.projectId}\n\nNote: All tasks in this section have also been deleted.`;
}

export async function handleGetCollaborators(
  todoistClient: TodoistApi,
  args: GetCollaboratorsArgs
): Promise<string> {
  const result = await todoistClient.getProjectCollaborators(args.project_id);

  // Handle the API response format with 'results' property
  const collaborators = extractArrayFromResponse<TodoistCollaborator>(result);

  if (collaborators.length === 0) {
    return `No collaborators found for project ${args.project_id}.\n\nNote: Only shared projects have collaborators. If this is a personal project, it won't have any collaborators listed.`;
  }

  const collaboratorList = collaborators
    .map(
      (collab: TodoistCollaborator) =>
        `- ${collab.name} (ID: ${collab.id}, Email: ${collab.email})`
    )
    .join("\n");

  return `Collaborators for project ${args.project_id}:\n${collaboratorList}\n\nUse these User IDs with assignee_id when creating or updating tasks to assign them to collaborators.`;
}
