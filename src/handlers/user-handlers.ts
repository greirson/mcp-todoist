import { UserInfo, ProductivityStats, SyncApiResponse } from "../types.js";
import { TodoistAPIError } from "../errors.js";
import { SimpleCache } from "../cache.js";

const SYNC_API_URL = "https://api.todoist.com/sync/v9";

const userCache = new SimpleCache<UserInfo>(30000);
const statsCache = new SimpleCache<ProductivityStats>(30000);

function getApiToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new TodoistAPIError(
      "TODOIST_API_TOKEN environment variable is not set"
    );
  }
  return token;
}

interface SyncUserResponse extends SyncApiResponse {
  user?: UserInfo;
}

export async function handleGetUser(): Promise<string> {
  const cacheKey = "user:current";
  const cached = userCache.get(cacheKey);

  if (cached) {
    return formatUserInfo(cached);
  }

  const token = getApiToken();

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sync_token: "*",
      resource_types: JSON.stringify(["user"]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Failed to fetch user: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncUserResponse;

  if (!data.user) {
    throw new TodoistAPIError("User data not found in response");
  }

  userCache.set(cacheKey, data.user);

  return formatUserInfo(data.user);
}

function formatUserInfo(user: UserInfo): string {
  const parts: string[] = [
    `User: ${user.full_name} (${user.email})`,
    `ID: ${user.id}`,
    `Timezone: ${user.timezone}`,
    `Language: ${user.lang}`,
    ``,
    `Account Status:`,
    `- Premium: ${user.is_premium ? "Yes" : "No"}${user.premium_until ? ` (until ${user.premium_until})` : ""}`,
    `- Joined: ${user.joined_at}`,
    ``,
    `Productivity:`,
    `- Karma: ${user.karma} (${user.karma_trend})`,
    `- Completed Tasks: ${user.completed_count}`,
    `- Completed Today: ${user.completed_today}`,
    ``,
    `Settings:`,
    `- Start Page: ${user.start_page}`,
    `- Date Format: ${user.date_format === 0 ? "DD/MM/YYYY" : "MM/DD/YYYY"}`,
    `- Time Format: ${user.time_format === 0 ? "24-hour" : "12-hour"}`,
    `- Week Start: ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][user.start_day] || user.start_day}`,
    `- Next Week Day: ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][user.next_week] || user.next_week}`,
    ``,
    `Projects:`,
    `- Inbox Project ID: ${user.inbox_project_id}`,
  ];

  if (user.team_inbox_id) {
    parts.push(`- Team Inbox ID: ${user.team_inbox_id}`);
  }

  if (user.default_reminder) {
    parts.push(`- Default Reminder: ${user.default_reminder}`);
  }

  if (user.auto_reminder !== undefined) {
    parts.push(`- Auto Reminder: ${user.auto_reminder} minutes before`);
  }

  return parts.join("\n");
}

export async function handleGetProductivityStats(): Promise<string> {
  const cacheKey = "stats:productivity";
  const cached = statsCache.get(cacheKey);

  if (cached) {
    return formatProductivityStats(cached);
  }

  const token = getApiToken();

  const response = await fetch(
    "https://api.todoist.com/sync/v9/completed/get_stats",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Failed to fetch productivity stats: ${response.status} - ${errorText}`
    );
  }

  const stats = (await response.json()) as ProductivityStats;
  statsCache.set(cacheKey, stats);

  return formatProductivityStats(stats);
}

function formatProductivityStats(stats: ProductivityStats): string {
  const parts: string[] = [
    `Productivity Statistics`,
    `======================`,
    ``,
    `Karma:`,
    `- Current: ${stats.karma}`,
    `- Trend: ${stats.karma_trend}`,
    `- Last Update: ${new Date(stats.karma_last_update * 1000).toISOString()}`,
    ``,
    `Task Completion:`,
    `- Total Completed: ${stats.completed_count}`,
  ];

  if (stats.goals) {
    parts.push(``, `Goals:`);
    parts.push(`- Daily Goal: ${stats.goals.daily_goal} tasks`);
    parts.push(`- Weekly Goal: ${stats.goals.weekly_goal} tasks`);

    if (stats.goals.current_daily_streak) {
      parts.push(
        `- Current Daily Streak: ${stats.goals.current_daily_streak.count} days`
      );
    }
    if (stats.goals.max_daily_streak) {
      parts.push(
        `- Max Daily Streak: ${stats.goals.max_daily_streak.count} days`
      );
    }
    if (stats.goals.current_weekly_streak) {
      parts.push(
        `- Current Weekly Streak: ${stats.goals.current_weekly_streak.count} weeks`
      );
    }
    if (stats.goals.max_weekly_streak) {
      parts.push(
        `- Max Weekly Streak: ${stats.goals.max_weekly_streak.count} weeks`
      );
    }
  }

  if (stats.days_items && stats.days_items.length > 0) {
    parts.push(``, `Recent Daily Activity:`);
    const recentDays = stats.days_items.slice(0, 7);
    for (const day of recentDays) {
      parts.push(`- ${day.date}: ${day.total_completed} tasks`);
    }
  }

  if (stats.week_items && stats.week_items.length > 0) {
    parts.push(``, `Recent Weekly Activity:`);
    const recentWeeks = stats.week_items.slice(0, 4);
    for (const week of recentWeeks) {
      parts.push(`- Week of ${week.date}: ${week.total_completed} tasks`);
    }
  }

  return parts.join("\n");
}

interface UserSettings {
  reminder_push: boolean;
  reminder_desktop: boolean;
  reminder_email: boolean;
  reminder_sms: boolean;
  completed_sound_mobile: boolean;
  completed_sound_desktop: boolean;
  theme: string;
}

interface SyncSettingsResponse extends SyncApiResponse {
  user_settings?: UserSettings;
}

export async function handleGetUserSettings(): Promise<string> {
  const token = getApiToken();

  const response = await fetch(SYNC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sync_token: "*",
      resource_types: JSON.stringify(["user_settings"]),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Failed to fetch user settings: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as SyncSettingsResponse;

  if (!data.user_settings) {
    throw new TodoistAPIError("User settings not found in response");
  }

  return formatUserSettings(data.user_settings);
}

function formatUserSettings(settings: UserSettings): string {
  const parts: string[] = [
    `User Settings`,
    `=============`,
    ``,
    `Reminders:`,
    `- Push Notifications: ${settings.reminder_push ? "Enabled" : "Disabled"}`,
    `- Desktop Notifications: ${settings.reminder_desktop ? "Enabled" : "Disabled"}`,
    `- Email Reminders: ${settings.reminder_email ? "Enabled" : "Disabled"}`,
    `- SMS Reminders: ${settings.reminder_sms ? "Enabled" : "Disabled"}`,
    ``,
    `Sounds:`,
    `- Completion Sound (Mobile): ${settings.completed_sound_mobile ? "Enabled" : "Disabled"}`,
    `- Completion Sound (Desktop): ${settings.completed_sound_desktop ? "Enabled" : "Disabled"}`,
    ``,
    `Appearance:`,
    `- Theme: ${settings.theme}`,
  ];

  return parts.join("\n");
}

export function clearUserCache(): void {
  userCache.clear();
  statsCache.clear();
}
