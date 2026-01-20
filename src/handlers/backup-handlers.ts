import { TodoistBackup, DownloadBackupArgs } from "../types.js";
import { TodoistAPIError, ValidationError } from "../errors.js";
import { SimpleCache } from "../cache.js";

const SYNC_API_URL = "https://api.todoist.com/sync/v9";

const backupsCache = new SimpleCache<TodoistBackup[]>(30000);

function getApiToken(): string {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new TodoistAPIError(
      "TODOIST_API_TOKEN environment variable is not set"
    );
  }
  return token;
}

export async function handleGetBackups(): Promise<string> {
  const cacheKey = "backups:all";
  const cached = backupsCache.get(cacheKey);

  if (cached) {
    return formatBackups(cached);
  }

  const token = getApiToken();

  const response = await fetch(`${SYNC_API_URL}/backups/get`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TodoistAPIError(
      `Failed to fetch backups: ${response.status} - ${errorText}`
    );
  }

  const backups = (await response.json()) as TodoistBackup[];
  backupsCache.set(cacheKey, backups);

  return formatBackups(backups);
}

function formatBackups(backups: TodoistBackup[]): string {
  if (backups.length === 0) {
    return "No backups found. Todoist creates automatic backups of your data.";
  }

  const backupList = backups
    .map((backup, index) => {
      const date = new Date(backup.version);
      const formattedDate = date.toLocaleString();
      return `${index + 1}. ${formattedDate}\n   Version: ${backup.version}`;
    })
    .join("\n\n");

  return `Found ${backups.length} backups:\n\n${backupList}\n\nUse todoist_backup_download with the version string to download a specific backup.`;
}

export async function handleDownloadBackup(
  args: DownloadBackupArgs
): Promise<string> {
  if (!args.version || !args.version.trim()) {
    throw new ValidationError(
      "Backup version is required. Use todoist_backups_get to list available versions."
    );
  }

  const token = getApiToken();

  const cacheKey = "backups:all";
  const cached = backupsCache.get(cacheKey);
  let backups = cached;

  if (!backups) {
    const response = await fetch(`${SYNC_API_URL}/backups/get`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new TodoistAPIError(
        `Failed to fetch backups: ${response.status} - ${errorText}`
      );
    }

    backups = (await response.json()) as TodoistBackup[];
    backupsCache.set(cacheKey, backups);
  }

  const backup = backups.find((b) => b.version === args.version);
  if (!backup) {
    throw new ValidationError(
      `Backup version "${args.version}" not found. Use todoist_backups_get to list available versions.`
    );
  }

  return `Backup Download URL for version ${args.version}:\n\n${backup.url}\n\nThis URL is time-limited. Download the backup promptly.\nThe backup is a ZIP file containing your Todoist data in CSV format.`;
}

export function clearBackupsCache(): void {
  backupsCache.clear();
}
