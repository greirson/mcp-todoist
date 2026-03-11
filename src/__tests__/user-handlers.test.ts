import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Must import after mocking fetch
import {
  handleGetUser,
  handleGetProductivityStats,
  handleGetUserSettings,
  clearUserCache,
} from "../handlers/user-handlers.js";
import { TodoistAPIError } from "../errors.js";

describe("User Handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockFetch.mockClear();
    clearUserCache();
    process.env = { ...originalEnv, TODOIST_API_TOKEN: "test-token" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("handleGetUser", () => {
    it("should fetch and format user info successfully", async () => {
      const mockUser = {
        id: "12345",
        full_name: "John Doe",
        email: "john@example.com",
        timezone: "America/New_York",
        lang: "en",
        is_premium: true,
        premium_until: "2025-12-31",
        joined_at: "2020-01-15",
        karma: 12500,
        karma_trend: "up",
        completed_count: 500,
        completed_today: 5,
        start_page: "inbox",
        date_format: 1,
        time_format: 1,
        start_day: 1,
        next_week: 1,
        inbox_project_id: "inbox123",
        team_inbox_id: "team456",
        default_reminder: "email",
        auto_reminder: 30,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      const result = await handleGetUser();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.todoist.com/api/v1/sync",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );

      expect(result).toContain("User: John Doe (john@example.com)");
      expect(result).toContain("ID: 12345");
      expect(result).toContain("Timezone: America/New_York");
      expect(result).toContain("Premium: Yes");
      expect(result).toContain("Karma: 12500 (up)");
      expect(result).toContain("Team Inbox ID: team456");
      expect(result).toContain("Default Reminder: email");
      expect(result).toContain("Auto Reminder: 30 minutes before");
    });

    it("should throw error when API returns error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response);

      await expect(handleGetUser()).rejects.toThrow(
        "Failed to fetch user: 401 - Unauthorized"
      );
    });

    it("should throw error when user data is missing from response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_token: "abc" }),
      } as Response);

      await expect(handleGetUser()).rejects.toThrow(
        "User data not found in response"
      );
    });

    it("should throw error when API token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetUser()).rejects.toThrow(TodoistAPIError);
      await expect(handleGetUser()).rejects.toThrow(
        "TODOIST_API_TOKEN environment variable is not set"
      );
    });

    it("should use cached user info on subsequent calls", async () => {
      const mockUser = {
        id: "12345",
        full_name: "John Doe",
        email: "john@example.com",
        timezone: "UTC",
        lang: "en",
        is_premium: false,
        joined_at: "2020-01-15",
        karma: 100,
        karma_trend: "neutral",
        completed_count: 10,
        completed_today: 1,
        start_page: "inbox",
        date_format: 0,
        time_format: 0,
        start_day: 0,
        next_week: 1,
        inbox_project_id: "inbox123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      await handleGetUser();
      await handleGetUser();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleGetProductivityStats", () => {
    it("should fetch and format productivity stats successfully", async () => {
      const mockStats = {
        karma: 15000,
        karma_trend: "up",
        karma_last_update: 1700000000,
        completed_count: 1000,
        goals: {
          daily_goal: 5,
          weekly_goal: 25,
          current_daily_streak: { count: 10 },
          max_daily_streak: { count: 30 },
          current_weekly_streak: { count: 4 },
          max_weekly_streak: { count: 12 },
        },
        days_items: [
          { date: "2024-01-15", total_completed: 8 },
          { date: "2024-01-14", total_completed: 6 },
        ],
        week_items: [
          { date: "2024-01-08", total_completed: 35 },
          { date: "2024-01-01", total_completed: 28 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response);

      const result = await handleGetProductivityStats();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.todoist.com/api/v1/tasks/completed/stats",
        expect.objectContaining({
          method: "GET",
          headers: {
            Authorization: "Bearer test-token",
          },
        })
      );

      expect(result).toContain("Productivity Statistics");
      expect(result).toContain("Current: 15000");
      expect(result).toContain("Trend: up");
      expect(result).toContain("Total Completed: 1000");
      expect(result).toContain("Daily Goal: 5 tasks");
      expect(result).toContain("Weekly Goal: 25 tasks");
      expect(result).toContain("Current Daily Streak: 10 days");
      expect(result).toContain("Max Daily Streak: 30 days");
      expect(result).toContain("Current Weekly Streak: 4 weeks");
      expect(result).toContain("Max Weekly Streak: 12 weeks");
      expect(result).toContain("2024-01-15: 8 tasks");
      expect(result).toContain("Week of 2024-01-08: 35 tasks");
    });

    it("should throw error when API returns error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as Response);

      await expect(handleGetProductivityStats()).rejects.toThrow(
        "Failed to fetch productivity stats: 500 - Internal Server Error"
      );
    });

    it("should throw error when API token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetProductivityStats()).rejects.toThrow(
        TodoistAPIError
      );
      await expect(handleGetProductivityStats()).rejects.toThrow(
        "TODOIST_API_TOKEN environment variable is not set"
      );
    });

    it("should use cached stats on subsequent calls", async () => {
      const mockStats = {
        karma: 15000,
        karma_trend: "up",
        karma_last_update: 1700000000,
        completed_count: 1000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response);

      await handleGetProductivityStats();
      await handleGetProductivityStats();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleGetUserSettings", () => {
    it("should fetch and format user settings successfully", async () => {
      const mockSettings = {
        reminder_push: true,
        reminder_desktop: true,
        reminder_email: false,
        reminder_sms: false,
        completed_sound_mobile: true,
        completed_sound_desktop: false,
        theme: "dark",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_settings: mockSettings }),
      } as Response);

      const result = await handleGetUserSettings();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.todoist.com/api/v1/sync",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );

      expect(result).toContain("User Settings");
      expect(result).toContain("Push Notifications: Enabled");
      expect(result).toContain("Desktop Notifications: Enabled");
      expect(result).toContain("Email Reminders: Disabled");
      expect(result).toContain("SMS Reminders: Disabled");
      expect(result).toContain("Completion Sound (Mobile): Enabled");
      expect(result).toContain("Completion Sound (Desktop): Disabled");
      expect(result).toContain("Theme: dark");
    });

    it("should throw error when API returns error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      } as Response);

      await expect(handleGetUserSettings()).rejects.toThrow(
        "Failed to fetch user settings: 403 - Forbidden"
      );
    });

    it("should throw error when user settings data is missing from response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sync_token: "abc" }),
      } as Response);

      await expect(handleGetUserSettings()).rejects.toThrow(
        "User settings not found in response"
      );
    });

    it("should throw error when API token is missing", async () => {
      delete process.env.TODOIST_API_TOKEN;

      await expect(handleGetUserSettings()).rejects.toThrow(TodoistAPIError);
      await expect(handleGetUserSettings()).rejects.toThrow(
        "TODOIST_API_TOKEN environment variable is not set"
      );
    });
  });

  describe("clearUserCache", () => {
    it("should clear cache and force new API calls", async () => {
      const mockUser = {
        id: "12345",
        full_name: "John Doe",
        email: "john@example.com",
        timezone: "UTC",
        lang: "en",
        is_premium: false,
        joined_at: "2020-01-15",
        karma: 100,
        karma_trend: "neutral",
        completed_count: 10,
        completed_today: 1,
        start_page: "inbox",
        date_format: 0,
        time_format: 0,
        start_day: 0,
        next_week: 1,
        inbox_project_id: "inbox123",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      await handleGetUser();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      clearUserCache();

      await handleGetUser();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
