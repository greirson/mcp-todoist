import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  DryRunWrapper,
  createTodoistClient,
} from "../utils/dry-run-wrapper.js";
import type {
  Task,
  Label,
  Section,
  Comment,
  PersonalProject,
} from "@doist/todoist-api-typescript";

// Mock the TodoistApi
jest.mock("@doist/todoist-api-typescript");

describe("DryRunWrapper", () => {
  let mockTodoistApi: jest.Mocked<TodoistApi>;
  let dryRunWrapper: DryRunWrapper;
  let originalEnv: string | undefined;

  const mockTask: Task = {
    url: "https://todoist.com/showTask?id=123",
    id: "123",
    userId: "user123",
    projectId: "456",
    sectionId: null,
    parentId: null,
    addedByUid: null,
    assignedByUid: null,
    responsibleUid: null,
    labels: [],
    deadline: null,
    duration: null,
    checked: false,
    isDeleted: false,
    addedAt: "2023-01-01T00:00:00Z",
    completedAt: null,
    updatedAt: null,
    due: null,
    priority: 4,
    childOrder: 1,
    content: "Test task",
    description: "Test description",
    noteCount: 0,
    dayOrder: 1,
    isCollapsed: false,
  };

  const mockProject: PersonalProject = {
    url: "https://todoist.com/app/project/456",
    id: "456",
    canAssignTasks: false,
    childOrder: 1,
    color: "blue",
    createdAt: "2023-01-01T00:00:00Z",
    isArchived: false,
    isDeleted: false,
    isFavorite: false,
    isFrozen: false,
    name: "Test Project",
    updatedAt: null,
    viewStyle: "list",
    defaultOrder: 1,
    description: "",
    isCollapsed: false,
    isShared: false,
    parentId: null,
    inboxProject: false,
  };

  const mockLabel: Label = {
    id: "789",
    order: 1,
    name: "Test Label",
    color: "red",
    isFavorite: false,
  };

  const mockSection: Section = {
    url: "https://todoist.com/app/project/456/section/101",
    id: "101",
    userId: "user123",
    projectId: "456",
    addedAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    archivedAt: null,
    name: "Test Section",
    sectionOrder: 1,
    isArchived: false,
    isDeleted: false,
    isCollapsed: false,
  };

  const mockComment: Comment = {
    taskId: "123",
    id: "202",
    content: "Test comment",
    postedAt: "2023-01-01T00:00:00Z",
    fileAttachment: null,
    postedUid: "user123",
    uidsToNotify: null,
    reactions: null,
    isDeleted: false,
    projectId: undefined,
  };

  beforeEach(() => {
    originalEnv = process.env.DRYRUN;
    process.env.DRYRUN = "true";

    // Create a fresh mock for each test
    mockTodoistApi = new TodoistApi("fake-token") as jest.Mocked<TodoistApi>;
    dryRunWrapper = new DryRunWrapper(mockTodoistApi);

    // Setup common mocks
    mockTodoistApi.getTask.mockResolvedValue(mockTask);
    mockTodoistApi.getProject.mockResolvedValue(mockProject);
    mockTodoistApi.getLabel.mockResolvedValue(mockLabel);
    mockTodoistApi.getSection.mockResolvedValue(mockSection);
    mockTodoistApi.getComment.mockResolvedValue(mockComment);

    // Mock console.error to capture dry-run messages
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    process.env.DRYRUN = originalEnv;
    jest.restoreAllMocks();
  });

  describe("Task operations", () => {
    describe("addTask", () => {
      it("should pass through to real API when dry-run is disabled", async () => {
        process.env.DRYRUN = "false";
        const wrapper = new DryRunWrapper(mockTodoistApi);
        mockTodoistApi.addTask.mockResolvedValue(mockTask);

        const result = await wrapper.addTask({ content: "New task" });

        expect(mockTodoistApi.addTask).toHaveBeenCalledWith({
          content: "New task",
        });
        expect(result).toEqual(mockTask);
        expect(console.error).not.toHaveBeenCalled();
      });

      it("should simulate task creation in dry-run mode", async () => {
        const result = await dryRunWrapper.addTask({
          content: "New task",
          projectId: "456",
          priority: 2,
        });

        expect(mockTodoistApi.addTask).not.toHaveBeenCalled();
        expect(mockTodoistApi.getProject).toHaveBeenCalledWith("456");
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            '[DRY-RUN] Would create task: "New task" in project 456'
          )
        );
        expect(result.content).toBe("New task");
        expect(result.priority).toBe(2);
        expect(result.id).toBeDefined();
      });

      it("should validate project exists in dry-run mode", async () => {
        mockTodoistApi.getProject.mockRejectedValue(
          new Error("Project not found")
        );

        await expect(
          dryRunWrapper.addTask({
            content: "New task",
            projectId: "nonexistent",
          })
        ).rejects.toThrow("Project with ID nonexistent does not exist");
      });

      it("should validate parent task exists in dry-run mode", async () => {
        mockTodoistApi.getTask.mockRejectedValue(new Error("Task not found"));

        await expect(
          dryRunWrapper.addTask({
            content: "New subtask",
            parentId: "nonexistent",
          })
        ).rejects.toThrow("Task with ID nonexistent does not exist");
      });
    });

    describe("updateTask", () => {
      it("should pass through to real API when dry-run is disabled", async () => {
        process.env.DRYRUN = "false";
        const wrapper = new DryRunWrapper(mockTodoistApi);
        const updatedTask = { ...mockTask, content: "Updated task" };
        mockTodoistApi.updateTask.mockResolvedValue(updatedTask);

        const result = await wrapper.updateTask("123", {
          content: "Updated task",
        });

        expect(mockTodoistApi.updateTask).toHaveBeenCalledWith("123", {
          content: "Updated task",
        });
        expect(result).toEqual(updatedTask);
      });

      it("should simulate task update in dry-run mode", async () => {
        const result = await dryRunWrapper.updateTask("123", {
          content: "Updated task",
          priority: 1,
        });

        expect(mockTodoistApi.updateTask).not.toHaveBeenCalled();
        expect(mockTodoistApi.getTask).toHaveBeenCalledWith("123");
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining("[DRY-RUN] Would update task: ID 123")
        );
        expect(result.content).toBe("Updated task");
        expect(result.priority).toBe(1);
        expect(result.id).toBe("123");
      });

      it("should validate task exists in dry-run mode", async () => {
        mockTodoistApi.getTask.mockRejectedValue(new Error("Task not found"));

        await expect(
          dryRunWrapper.updateTask("nonexistent", { content: "Updated task" })
        ).rejects.toThrow("Task with ID nonexistent does not exist");
      });
    });

    describe("deleteTask", () => {
      it("should pass through to real API when dry-run is disabled", async () => {
        process.env.DRYRUN = "false";
        const wrapper = new DryRunWrapper(mockTodoistApi);
        mockTodoistApi.deleteTask.mockResolvedValue(true);

        const result = await wrapper.deleteTask("123");

        expect(mockTodoistApi.deleteTask).toHaveBeenCalledWith("123");
        expect(result).toBe(true);
      });

      it("should simulate task deletion in dry-run mode", async () => {
        const result = await dryRunWrapper.deleteTask("123");

        expect(mockTodoistApi.deleteTask).not.toHaveBeenCalled();
        expect(mockTodoistApi.getTask).toHaveBeenCalledWith("123");
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining("[DRY-RUN] Would delete task: ID 123")
        );
        expect(result).toBe(true);
      });
    });

    describe("closeTask", () => {
      it("should simulate task completion in dry-run mode", async () => {
        const result = await dryRunWrapper.closeTask("123");

        expect(mockTodoistApi.closeTask).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining("[DRY-RUN] Would complete task: ID 123")
        );
        expect(result).toBe(true);
      });
    });

    describe("reopenTask", () => {
      it("should simulate task reopening in dry-run mode", async () => {
        const result = await dryRunWrapper.reopenTask("123");

        expect(mockTodoistApi.reopenTask).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining("[DRY-RUN] Would reopen task: ID 123")
        );
        expect(result).toBe(true);
      });
    });
  });

  describe("Project operations", () => {
    describe("addProject", () => {
      it("should simulate project creation in dry-run mode", async () => {
        const result = await dryRunWrapper.addProject({
          name: "New Project",
          color: "green",
          isFavorite: true,
        });

        expect(mockTodoistApi.addProject).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            '[DRY-RUN] Would create project: "New Project" with color green, favorite: true'
          )
        );
        expect(result.name).toBe("New Project");
        expect(result.color).toBe("green");
        expect(result.isFavorite).toBe(true);
        expect(result.id).toBeDefined();
      });
    });

    describe("updateProject", () => {
      it("should simulate project update in dry-run mode", async () => {
        const result = await dryRunWrapper.updateProject("456", {
          name: "Updated Project",
        });

        expect(mockTodoistApi.updateProject).not.toHaveBeenCalled();
        expect(mockTodoistApi.getProject).toHaveBeenCalledWith("456");
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining("[DRY-RUN] Would update project: ID 456")
        );
        expect(result.name).toBe("Updated Project");
      });
    });

    describe("deleteProject", () => {
      it("should simulate project deletion in dry-run mode", async () => {
        const result = await dryRunWrapper.deleteProject("456");

        expect(mockTodoistApi.deleteProject).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining("[DRY-RUN] Would delete project: ID 456")
        );
        expect(result).toBe(true);
      });
    });
  });

  describe("Label operations", () => {
    describe("addLabel", () => {
      it("should simulate label creation in dry-run mode", async () => {
        const result = await dryRunWrapper.addLabel({
          name: "New Label",
          color: "purple",
          isFavorite: true,
        });

        expect(mockTodoistApi.addLabel).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            '[DRY-RUN] Would create label: "New Label" with color purple, favorite: true'
          )
        );
        expect(result.name).toBe("New Label");
        expect(result.color).toBe("purple");
        expect(result.isFavorite).toBe(true);
      });
    });

    describe("updateLabel", () => {
      it("should simulate label update in dry-run mode", async () => {
        const result = await dryRunWrapper.updateLabel("789", {
          name: "Updated Label",
        });

        expect(mockTodoistApi.updateLabel).not.toHaveBeenCalled();
        expect(mockTodoistApi.getLabel).toHaveBeenCalledWith("789");
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining("[DRY-RUN] Would update label: ID 789")
        );
        expect(result.name).toBe("Updated Label");
      });
    });

    describe("deleteLabel", () => {
      it("should simulate label deletion in dry-run mode", async () => {
        const result = await dryRunWrapper.deleteLabel("789");

        expect(mockTodoistApi.deleteLabel).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining("[DRY-RUN] Would delete label: ID 789")
        );
        expect(result).toBe(true);
      });
    });
  });

  describe("Read operations", () => {
    it("should pass through all read operations to the real API", async () => {
      mockTodoistApi.getTasks.mockResolvedValue([mockTask] as any);
      mockTodoistApi.getProjects.mockResolvedValue([mockProject] as any);
      mockTodoistApi.getLabels.mockResolvedValue([mockLabel] as any);

      const tasks = await dryRunWrapper.getTasks();
      const projects = await dryRunWrapper.getProjects();
      const labels = await dryRunWrapper.getLabels();

      expect(mockTodoistApi.getTasks).toHaveBeenCalled();
      expect(mockTodoistApi.getProjects).toHaveBeenCalled();
      expect(mockTodoistApi.getLabels).toHaveBeenCalled();
      expect(tasks).toEqual([mockTask]);
      expect(projects).toEqual([mockProject]);
      expect(labels).toEqual([mockLabel]);
    });
  });
});

describe("createTodoistClient", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.DRYRUN;
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    process.env.DRYRUN = originalEnv;
    jest.restoreAllMocks();
  });

  it("should return unwrapped TodoistApi when dry-run is disabled", () => {
    process.env.DRYRUN = "false";

    const client = createTodoistClient("test-token");

    expect(client).toBeInstanceOf(TodoistApi);
    expect(client).not.toBeInstanceOf(DryRunWrapper);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should return unwrapped TodoistApi when DRYRUN is not set", () => {
    delete process.env.DRYRUN;

    const client = createTodoistClient("test-token");

    expect(client).toBeInstanceOf(TodoistApi);
    expect(client).not.toBeInstanceOf(DryRunWrapper);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should return wrapped DryRunWrapper when dry-run is enabled", () => {
    process.env.DRYRUN = "true";

    const client = createTodoistClient("test-token");

    expect(client).toBeInstanceOf(DryRunWrapper);
    expect(console.error).toHaveBeenCalledWith(
      "[DRY-RUN] Dry-run mode enabled - mutations will be simulated"
    );
  });
});
