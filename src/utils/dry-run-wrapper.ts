import { TodoistApi } from "@doist/todoist-api-typescript";
import type {
  Task,
  Label,
  Section,
  Comment,
  PersonalProject,
  WorkspaceProject,
} from "@doist/todoist-api-typescript";
import type {
  AddTaskArgs,
  UpdateTaskArgs,
  AddProjectArgs,
  UpdateProjectArgs,
  AddSectionArgs,
  UpdateSectionArgs,
  AddCommentArgs,
  UpdateCommentArgs,
  AddLabelArgs,
  UpdateLabelArgs,
} from "@doist/todoist-api-typescript";

/**
 * DryRunWrapper class that wraps TodoistApi to provide dry-run functionality.
 * When process.env.DRYRUN === 'true', mutation operations are intercepted and simulated,
 * while read operations pass through to the real API unchanged.
 */
export class DryRunWrapper {
  private client: TodoistApi;
  private isDryRun: boolean;
  private taskIdCounter: number = 100000;
  private projectIdCounter: number = 200000;
  private sectionIdCounter: number = 300000;
  private commentIdCounter: number = 400000;
  private labelIdCounter: number = 500000;

  constructor(client: TodoistApi) {
    this.client = client;
    this.isDryRun = process.env.DRYRUN === "true";
  }

  /**
   * Logs dry-run actions with consistent formatting
   */
  private logDryRunAction(
    action: string,
    entity: string,
    details: string
  ): void {
    console.error(`[DRY-RUN] Would ${action} ${entity}: ${details}`);
  }

  /**
   * Generates a unique ID for mocked entities
   */
  private generateId(
    type: "task" | "project" | "section" | "comment" | "label"
  ): string {
    switch (type) {
      case "task":
        return (++this.taskIdCounter).toString();
      case "project":
        return (++this.projectIdCounter).toString();
      case "section":
        return (++this.sectionIdCounter).toString();
      case "comment":
        return (++this.commentIdCounter).toString();
      case "label":
        return (++this.labelIdCounter).toString();
      default:
        return Math.random().toString(36).substr(2, 9);
    }
  }

  /**
   * Validates that a project exists (used in dry-run validation)
   */
  private async validateProjectExists(projectId?: string): Promise<void> {
    if (projectId) {
      try {
        await this.client.getProject(projectId);
      } catch {
        throw new Error(`Project with ID ${projectId} does not exist`);
      }
    }
  }

  /**
   * Validates that a task exists (used in dry-run validation)
   */
  private async validateTaskExists(taskId: string): Promise<Task> {
    try {
      return await this.client.getTask(taskId);
    } catch {
      throw new Error(`Task with ID ${taskId} does not exist`);
    }
  }

  /**
   * Validates that a section exists (used in dry-run validation)
   */
  private async validateSectionExists(sectionId?: string): Promise<void> {
    if (sectionId) {
      try {
        await this.client.getSection(sectionId);
      } catch {
        throw new Error(`Section with ID ${sectionId} does not exist`);
      }
    }
  }

  /**
   * Validates that a label exists (used in dry-run validation)
   */
  private async validateLabelExists(labelId: string): Promise<Label> {
    try {
      return await this.client.getLabel(labelId);
    } catch {
      throw new Error(`Label with ID ${labelId} does not exist`);
    }
  }

  // Task methods
  async addTask(args: AddTaskArgs, requestId?: string): Promise<Task> {
    if (!this.isDryRun) {
      if (requestId) {
        return this.client.addTask(args, requestId);
      } else {
        return this.client.addTask(args);
      }
    }

    // Validate project exists if specified
    await this.validateProjectExists(args.projectId);
    await this.validateSectionExists(args.sectionId);

    // Validate parent task exists if specified
    if (args.parentId) {
      await this.validateTaskExists(args.parentId);
    }

    this.logDryRunAction(
      "create",
      "task",
      `"${args.content}" in project ${args.projectId || "default"}, section ${args.sectionId || "none"}`
    );

    // Return mock task with generated ID and merged input data
    const taskId = this.generateId("task");
    const mockTask: Task & { __dryRun?: boolean } = {
      url: `https://todoist.com/showTask?id=${taskId}`,
      id: taskId,
      __dryRun: true,
      userId: "mock-user",
      projectId: args.projectId || "inbox",
      sectionId: args.sectionId || null,
      parentId: args.parentId || null,
      addedByUid: "mock-user",
      assignedByUid: null,
      responsibleUid: null,
      labels: args.labels || [],
      deadline: null,
      duration: null,
      checked: false,
      isDeleted: false,
      addedAt: new Date().toISOString(),
      completedAt: null,
      updatedAt: null,
      due: args.dueString
        ? {
            string: args.dueString,
            date: args.dueString,
            isRecurring: false,
            datetime: null,
            timezone: null,
          }
        : null,
      priority: args.priority || 4,
      childOrder: args.order || 1,
      content: args.content,
      description: args.description || "",
      noteCount: 0,
      dayOrder: 1,
      isCollapsed: false,
    };

    return mockTask;
  }

  async updateTask(
    id: string,
    args: UpdateTaskArgs,
    requestId?: string
  ): Promise<Task> {
    if (!this.isDryRun) {
      if (requestId) {
        return this.client.updateTask(id, args, requestId);
      } else {
        return this.client.updateTask(id, args);
      }
    }

    // Fetch the real task to validate it exists and get current data
    const existingTask = await this.validateTaskExists(id);

    // Note: UpdateTaskArgs doesn't include projectId/sectionId - these are handled via moveTasks
    // For dry-run purposes, we'll skip project/section validation in updateTask

    this.logDryRunAction(
      "update",
      "task",
      `ID ${id} - "${existingTask.content}" → changes: ${JSON.stringify(args)}`
    );

    // Return merged task with updates
    const updatedTask: Task & { __dryRun?: boolean } = {
      ...existingTask,
      ...(args.content && { content: args.content }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.priority && { priority: args.priority }),
      ...(args.labels && { labels: args.labels }),
      ...(args.dueString && {
        due: {
          string: args.dueString,
          date: args.dueString,
          isRecurring: false,
          datetime: null,
          timezone: null,
        },
      }),
      updatedAt: new Date().toISOString(),
      __dryRun: true,
    };

    return updatedTask;
  }

  async deleteTask(id: string, requestId?: string): Promise<boolean> {
    if (!this.isDryRun) {
      if (requestId) {
        return this.client.deleteTask(id, requestId);
      } else {
        return this.client.deleteTask(id);
      }
    }

    // Validate task exists
    const existingTask = await this.validateTaskExists(id);

    this.logDryRunAction(
      "delete",
      "task",
      `ID ${id} - "${existingTask.content}"`
    );

    return true;
  }

  async closeTask(id: string, requestId?: string): Promise<boolean> {
    if (!this.isDryRun) {
      if (requestId) {
        return this.client.closeTask(id, requestId);
      } else {
        return this.client.closeTask(id);
      }
    }

    // Validate task exists
    const existingTask = await this.validateTaskExists(id);

    this.logDryRunAction(
      "complete",
      "task",
      `ID ${id} - "${existingTask.content}"`
    );

    return true;
  }

  async reopenTask(id: string, requestId?: string): Promise<boolean> {
    if (!this.isDryRun) {
      if (requestId) {
        return this.client.reopenTask(id, requestId);
      } else {
        return this.client.reopenTask(id);
      }
    }

    // Validate task exists
    const existingTask = await this.validateTaskExists(id);

    this.logDryRunAction(
      "reopen",
      "task",
      `ID ${id} - "${existingTask.content}"`
    );

    return true;
  }

  // Project methods
  async addProject(
    args: AddProjectArgs,
    requestId?: string
  ): Promise<PersonalProject | WorkspaceProject> {
    if (!this.isDryRun) {
      return this.client.addProject(args, requestId);
    }

    this.logDryRunAction(
      "create",
      "project",
      `"${args.name}" with color ${args.color || "default"}, favorite: ${args.isFavorite || false}`
    );

    // Return mock project
    const projectId = this.generateId("project");
    const mockProject: PersonalProject = {
      url: `https://todoist.com/app/project/${projectId}`,
      id: projectId,
      canAssignTasks: false,
      childOrder: 1,
      color: typeof args.color === "string" ? args.color : "grey",
      createdAt: new Date().toISOString(),
      isArchived: false,
      isDeleted: false,
      isFavorite: args.isFavorite || false,
      isFrozen: false,
      name: args.name,
      updatedAt: null,
      viewStyle: args.viewStyle || "list",
      defaultOrder: 1,
      description: "",
      isCollapsed: false,
      isShared: false,
      parentId: args.parentId || null,
      inboxProject: false,
    };

    return mockProject;
  }

  async updateProject(
    id: string,
    args: UpdateProjectArgs,
    requestId?: string
  ): Promise<PersonalProject | WorkspaceProject> {
    if (!this.isDryRun) {
      return this.client.updateProject(id, args, requestId);
    }

    // Validate project exists
    const existingProject = await this.client.getProject(id);

    this.logDryRunAction(
      "update",
      "project",
      `ID ${id} - "${existingProject.name}" → changes: ${JSON.stringify(args)}`
    );

    // Return merged project
    const updatedProject = {
      ...existingProject,
      ...args,
    };

    return updatedProject;
  }

  async deleteProject(id: string, requestId?: string): Promise<boolean> {
    if (!this.isDryRun) {
      return this.client.deleteProject(id, requestId);
    }

    // Validate project exists
    const existingProject = await this.client.getProject(id);

    this.logDryRunAction(
      "delete",
      "project",
      `ID ${id} - "${existingProject.name}"`
    );

    return true;
  }

  // Section methods
  async addSection(args: AddSectionArgs, requestId?: string): Promise<Section> {
    if (!this.isDryRun) {
      return this.client.addSection(args, requestId);
    }

    // Validate project exists
    await this.validateProjectExists(args.projectId);

    this.logDryRunAction(
      "create",
      "section",
      `"${args.name}" in project ${args.projectId}`
    );

    // Return mock section
    const sectionId = this.generateId("section");
    const mockSection: Section = {
      url: `https://todoist.com/app/project/${args.projectId}/section/${sectionId}`,
      id: sectionId,
      userId: "mock-user",
      projectId: args.projectId,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      name: args.name,
      sectionOrder: 1,
      isArchived: false,
      isDeleted: false,
      isCollapsed: false,
    };

    return mockSection;
  }

  async updateSection(
    id: string,
    args: UpdateSectionArgs,
    requestId?: string
  ): Promise<Section> {
    if (!this.isDryRun) {
      return this.client.updateSection(id, args, requestId);
    }

    // Validate section exists
    const existingSection = await this.client.getSection(id);

    this.logDryRunAction(
      "update",
      "section",
      `ID ${id} - "${existingSection.name}" → changes: ${JSON.stringify(args)}`
    );

    // Return merged section
    const updatedSection: Section = {
      ...existingSection,
      ...args,
    };

    return updatedSection;
  }

  async deleteSection(id: string, requestId?: string): Promise<boolean> {
    if (!this.isDryRun) {
      return this.client.deleteSection(id, requestId);
    }

    // Validate section exists
    const existingSection = await this.client.getSection(id);

    this.logDryRunAction(
      "delete",
      "section",
      `ID ${id} - "${existingSection.name}"`
    );

    return true;
  }

  // Comment methods
  async addComment(args: AddCommentArgs, requestId?: string): Promise<Comment> {
    if (!this.isDryRun) {
      return this.client.addComment(args, requestId);
    }

    // Validate task or project exists
    if (args.taskId) {
      await this.validateTaskExists(args.taskId);
    }
    if (args.projectId) {
      await this.validateProjectExists(args.projectId);
    }

    this.logDryRunAction(
      "create",
      "comment",
      `"${args.content}" on ${args.taskId ? `task ${args.taskId}` : `project ${args.projectId}`}`
    );

    // Return mock comment
    const mockComment: Comment = {
      taskId: args.taskId || undefined,
      id: this.generateId("comment"),
      content: args.content,
      postedAt: new Date().toISOString(),
      fileAttachment: args.attachment
        ? {
            resourceType: "file",
            fileName: args.attachment.fileName,
            fileUrl: args.attachment.fileUrl,
            fileType: args.attachment.fileType,
          }
        : null,
      postedUid: "mock-user",
      uidsToNotify: null,
      reactions: null,
      isDeleted: false,
      projectId: args.projectId || undefined,
    };

    return mockComment;
  }

  async updateComment(
    id: string,
    args: UpdateCommentArgs,
    requestId?: string
  ): Promise<Comment> {
    if (!this.isDryRun) {
      return this.client.updateComment(id, args, requestId);
    }

    // Validate comment exists
    const existingComment = await this.client.getComment(id);

    this.logDryRunAction(
      "update",
      "comment",
      `ID ${id} - content changes: ${JSON.stringify(args)}`
    );

    // Return merged comment
    const updatedComment: Comment = {
      ...existingComment,
      ...args,
    };

    return updatedComment;
  }

  async deleteComment(id: string, requestId?: string): Promise<boolean> {
    if (!this.isDryRun) {
      return this.client.deleteComment(id, requestId);
    }

    // Validate comment exists
    const existingComment = await this.client.getComment(id);

    this.logDryRunAction(
      "delete",
      "comment",
      `ID ${id} - "${existingComment.content}"`
    );

    return true;
  }

  // Label methods
  async addLabel(args: AddLabelArgs, requestId?: string): Promise<Label> {
    if (!this.isDryRun) {
      return this.client.addLabel(args, requestId);
    }

    this.logDryRunAction(
      "create",
      "label",
      `"${args.name}" with color ${args.color || "default"}, favorite: ${args.isFavorite || false}`
    );

    // Return mock label
    const mockLabel: Label = {
      id: this.generateId("label"),
      order: args.order || 1,
      name: args.name,
      color: typeof args.color === "string" ? args.color : "grey",
      isFavorite: args.isFavorite || false,
    };

    return mockLabel;
  }

  async updateLabel(
    id: string,
    args: UpdateLabelArgs,
    requestId?: string
  ): Promise<Label> {
    if (!this.isDryRun) {
      return this.client.updateLabel(id, args, requestId);
    }

    // Validate label exists
    const existingLabel = await this.validateLabelExists(id);

    this.logDryRunAction(
      "update",
      "label",
      `ID ${id} - "${existingLabel.name}" → changes: ${JSON.stringify(args)}`
    );

    // Return merged label
    const updatedLabel: Label = {
      ...existingLabel,
      ...args,
    };

    return updatedLabel;
  }

  async deleteLabel(id: string, requestId?: string): Promise<boolean> {
    if (!this.isDryRun) {
      return this.client.deleteLabel(id, requestId);
    }

    // Validate label exists
    const existingLabel = await this.validateLabelExists(id);

    this.logDryRunAction(
      "delete",
      "label",
      `ID ${id} - "${existingLabel.name}"`
    );

    return true;
  }

  // Proxy all other methods (read operations) to the real client
  async getTask(id: string) {
    return this.client.getTask(id);
  }

  async getTasks(args?: any) {
    return this.client.getTasks(args);
  }

  async getTasksByFilter(args: any) {
    return this.client.getTasksByFilter(args);
  }

  async getCompletedTasksByCompletionDate(args: any) {
    return this.client.getCompletedTasksByCompletionDate(args);
  }

  async getCompletedTasksByDueDate(args: any) {
    return this.client.getCompletedTasksByDueDate(args);
  }

  async quickAddTask(args: any) {
    return this.client.quickAddTask(args);
  }

  async moveTasks(ids: string[], args: any, requestId?: string) {
    if (!this.isDryRun) {
      return this.client.moveTasks(ids, args, requestId);
    }

    // Validate tasks exist
    for (const id of ids) {
      await this.validateTaskExists(id);
    }

    this.logDryRunAction(
      "move",
      "tasks",
      `${ids.length} tasks to ${JSON.stringify(args)}`
    );

    // Return mock moved tasks
    const movedTasks: Task[] = [];
    for (const id of ids) {
      const task = await this.client.getTask(id);
      movedTasks.push({
        ...task,
        ...args,
      });
    }
    return movedTasks;
  }

  async getProject(id: string) {
    return this.client.getProject(id);
  }

  async getProjects(args?: any) {
    return this.client.getProjects(args);
  }

  async getArchivedProjects(args?: any) {
    return this.client.getArchivedProjects(args);
  }

  async archiveProject(id: string, requestId?: string) {
    if (!this.isDryRun) {
      return this.client.archiveProject(id, requestId);
    }

    const existingProject = await this.client.getProject(id);
    this.logDryRunAction(
      "archive",
      "project",
      `ID ${id} - "${existingProject.name}"`
    );
    return existingProject;
  }

  async unarchiveProject(id: string, requestId?: string) {
    if (!this.isDryRun) {
      return this.client.unarchiveProject(id, requestId);
    }

    const existingProject = await this.client.getProject(id);
    this.logDryRunAction(
      "unarchive",
      "project",
      `ID ${id} - "${existingProject.name}"`
    );
    return existingProject;
  }

  async getProjectCollaborators(projectId: string, args?: any) {
    return this.client.getProjectCollaborators(projectId, args);
  }

  async getSections(args: any) {
    return this.client.getSections(args);
  }

  async getSection(id: string) {
    return this.client.getSection(id);
  }

  async getLabel(id: string) {
    return this.client.getLabel(id);
  }

  async getLabels(args?: any) {
    return this.client.getLabels(args);
  }

  async getSharedLabels(args?: any) {
    return this.client.getSharedLabels(args);
  }

  async renameSharedLabel(args: any) {
    if (!this.isDryRun) {
      return this.client.renameSharedLabel(args);
    }

    this.logDryRunAction(
      "rename",
      "shared label",
      `"${args.name}" → "${args.newName}"`
    );
    return true;
  }

  async removeSharedLabel(args: any) {
    if (!this.isDryRun) {
      return this.client.removeSharedLabel(args);
    }

    this.logDryRunAction("remove", "shared label", `"${args.name}"`);
    return true;
  }

  async getComments(args: any) {
    return this.client.getComments(args);
  }

  async getComment(id: string) {
    return this.client.getComment(id);
  }

  async getUser() {
    return this.client.getUser();
  }

  async getProductivityStats() {
    return this.client.getProductivityStats();
  }
}

/**
 * Type alias for the client returned by createTodoistClient
 */
export type TodoistClient = TodoistApi | DryRunWrapper;

/**
 * Factory function that creates a TodoistApi client, optionally wrapped in dry-run functionality
 * based on the DRYRUN environment variable.
 *
 * @param token - The Todoist API token
 * @returns TodoistApi client (wrapped or unwrapped based on DRYRUN env var)
 */
export function createTodoistClient(token: string): TodoistClient {
  const client = new TodoistApi(token);

  if (process.env.DRYRUN === "true") {
    console.error(
      "[DRY-RUN] Dry-run mode enabled - mutations will be simulated"
    );
    return new DryRunWrapper(client);
  }

  return client;
}
