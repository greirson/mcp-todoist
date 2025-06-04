import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  CreateProjectArgs,
  GetSectionsArgs,
  CreateSectionArgs,
  TodoistProjectData,
  TodoistProject,
  TodoistSection,
} from "../types.js";

export async function handleGetProjects(
  todoistClient: TodoistApi
): Promise<string> {
  const result = await todoistClient.getProjects();

  // Handle the new API response format with 'results' property
  const projects = Array.isArray(result)
    ? result
    : (result as any)?.results || (result as any)?.data || [];

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
  const result = await todoistClient.getSections(args as any);

  // Handle the new API response format with 'results' property
  const sections = Array.isArray(result)
    ? result
    : (result as any)?.results || (result as any)?.data || [];

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
  const section = await todoistClient.addSection({
    name: args.name,
    projectId: args.project_id,
  });

  return `Section created:\nName: ${section.name}\nID: ${section.id}\nProject ID: ${section.projectId}`;
}
