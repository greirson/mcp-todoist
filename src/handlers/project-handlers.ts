import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateProjectArgs,
  GetSectionsArgs,
  CreateSectionArgs,
  UpdateSectionArgs,
  SectionIdentifierArgs,
  TodoistProjectData,
  TodoistProject,
  TodoistSection,
} from "../types.js";
import { extractArrayFromResponse } from "../utils/api-helpers.js";
import { ValidationError } from "../errors.js";

export async function handleGetProjects(
  todoistClient: TodoistApi
): Promise<string> {
  const result = await todoistClient.getProjects();

  // Handle the new API response format with 'results' property
  const projects = extractArrayFromResponse<TodoistProject>(result);

  const projectList = projects
    .map((project: TodoistProject) => `- ${project.name} (ID: ${project.id})`)
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

  const project = await todoistClient.addProject(projectData);

  return `Project created:\nName: ${project.name}\nID: ${project.id}${
    project.color ? `\nColor: ${project.color}` : ""
  }${project.isFavorite ? "\nMarked as favorite" : ""}`;
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

  return `Section deleted:\nName: ${section.name}\nID: ${section.id}\nProject ID: ${section.projectId}\n\nNote: All tasks in this section have also been deleted.`;
}
