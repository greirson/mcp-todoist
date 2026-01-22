/**
 * Backup Router - Routes todoist_backup actions to existing handlers
 */

import { ValidationError } from "../../errors.js";
import { handleGetBackups, handleDownloadBackup } from "../backup-handlers.js";
import { DownloadBackupArgs } from "../../types.js";

export async function handleBackupAction(
  args: Record<string, unknown>
): Promise<string> {
  const action = args.action as string;

  switch (action) {
    case "get":
      return handleGetBackups();
    case "download":
      return handleDownloadBackup(args as unknown as DownloadBackupArgs);
    default:
      throw new ValidationError(`Unknown backup action: ${action}`);
  }
}
