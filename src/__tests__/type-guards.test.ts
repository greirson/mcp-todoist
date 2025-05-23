import {
  isCreateTaskArgs,
  isGetTasksArgs,
  isUpdateTaskArgs,
  isTaskNameArgs,
  isGetProjectsArgs,
  isGetSectionsArgs,
  isCreateProjectArgs,
  isCreateSectionArgs,
} from "../type-guards";

describe("Type Guards", () => {
  describe("isCreateTaskArgs", () => {
    it("should return true for valid CreateTaskArgs", () => {
      expect(isCreateTaskArgs({ content: "Test task" })).toBe(true);
      expect(
        isCreateTaskArgs({
          content: "Test task",
          description: "Description",
          due_string: "tomorrow",
          priority: 2,
          labels: ["label1"],
          deadline: "2024-12-31",
          project_id: "123",
          section_id: "456",
        })
      ).toBe(true);
    });

    it("should return false for invalid CreateTaskArgs", () => {
      expect(isCreateTaskArgs({})).toBe(false);
      expect(isCreateTaskArgs({ content: 123 })).toBe(false);
      expect(isCreateTaskArgs(null)).toBe(false);
      expect(isCreateTaskArgs(undefined)).toBe(false);
    });
  });

  describe("isGetTasksArgs", () => {
    it("should return true for valid GetTasksArgs", () => {
      expect(isGetTasksArgs({})).toBe(true);
      expect(
        isGetTasksArgs({
          project_id: "123",
          filter: "today",
          priority: 1,
          limit: 10,
        })
      ).toBe(true);
    });

    it("should return false for invalid GetTasksArgs", () => {
      expect(isGetTasksArgs({ priority: "high" })).toBe(false);
      expect(isGetTasksArgs({ limit: "10" })).toBe(false);
      expect(isGetTasksArgs(null)).toBe(false);
    });
  });

  describe("isUpdateTaskArgs", () => {
    it("should return true for valid UpdateTaskArgs", () => {
      expect(isUpdateTaskArgs({ task_name: "Test task" })).toBe(true);
      expect(
        isUpdateTaskArgs({
          task_name: "Test task",
          content: "Updated content",
        })
      ).toBe(true);
    });

    it("should return false for invalid UpdateTaskArgs", () => {
      expect(isUpdateTaskArgs({})).toBe(false);
      expect(isUpdateTaskArgs({ task_name: 123 })).toBe(false);
      expect(isUpdateTaskArgs(null)).toBe(false);
    });
  });

  describe("isTaskNameArgs", () => {
    it("should return true for valid TaskNameArgs", () => {
      expect(isTaskNameArgs({ task_name: "Test task" })).toBe(true);
    });

    it("should return false for invalid TaskNameArgs", () => {
      expect(isTaskNameArgs({})).toBe(false);
      expect(isTaskNameArgs({ task_name: 123 })).toBe(false);
      expect(isTaskNameArgs(null)).toBe(false);
    });
  });

  describe("isCreateProjectArgs", () => {
    it("should return true for valid CreateProjectArgs", () => {
      expect(isCreateProjectArgs({ name: "Test project" })).toBe(true);
      expect(
        isCreateProjectArgs({
          name: "Test project",
          color: "red",
          is_favorite: true,
        })
      ).toBe(true);
    });

    it("should return false for invalid CreateProjectArgs", () => {
      expect(isCreateProjectArgs({})).toBe(false);
      expect(isCreateProjectArgs({ name: 123 })).toBe(false);
      expect(isCreateProjectArgs(null)).toBe(false);
    });
  });

  describe("isCreateSectionArgs", () => {
    it("should return true for valid CreateSectionArgs", () => {
      expect(
        isCreateSectionArgs({ name: "Test section", project_id: "123" })
      ).toBe(true);
    });

    it("should return false for invalid CreateSectionArgs", () => {
      expect(isCreateSectionArgs({ name: "Test section" })).toBe(false);
      expect(isCreateSectionArgs({ project_id: "123" })).toBe(false);
      expect(isCreateSectionArgs({})).toBe(false);
      expect(isCreateSectionArgs(null)).toBe(false);
    });
  });
});