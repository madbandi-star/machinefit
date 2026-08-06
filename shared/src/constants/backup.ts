/** Current user/system backup payload schema version. */
export const BACKUP_VERSION = 1 as const;

/** Oldest backup_version this app can import (with adapters). */
export const BACKUP_VERSION_MIN = 1 as const;

export const BACKUP_TYPES = ['USER', 'SYSTEM'] as const;
export type BackupType = (typeof BACKUP_TYPES)[number];

export const BACKUP_ACTIONS = ['BACKUP', 'RESTORE'] as const;
export type BackupAction = (typeof BACKUP_ACTIONS)[number];

export const BACKUP_STATUSES = ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'] as const;
export type BackupStatus = (typeof BACKUP_STATUSES)[number];

export const BACKUP_FORMATS = ['zip', 'json'] as const;
export type BackupFormat = (typeof BACKUP_FORMATS)[number];

export const BACKUP_RESTORE_MODES = ['merge', 'replace'] as const;
export type BackupRestoreMode = (typeof BACKUP_RESTORE_MODES)[number];

export const BACKUP_RETENTION_DAYS = [7, 30, 90] as const;
export type BackupRetentionDays = (typeof BACKUP_RETENTION_DAYS)[number];

/** Supabase Storage bucket (private). */
export const BACKUP_STORAGE_BUCKET = 'backup';

export const BACKUP_STORAGE_PREFIX = {
  USER: 'user',
  SYSTEM: 'system',
} as const;

/** Manifest file inside ZIP archives. */
export const BACKUP_MANIFEST_NAME = 'manifest.json';

/** Primary payload file inside ZIP archives. */
export const BACKUP_PAYLOAD_NAME = 'backup.json';

export const BACKUP_MAX_UPLOAD_BYTES = 80 * 1024 * 1024;

/** Filename helper: machinefit_backup_YYYYMMDD_HHMMSS.zip */
export function buildBackupFileName(format: BackupFormat, at: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}` +
    `_${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}${pad(at.getUTCSeconds())}`;
  return `machinefit_backup_${stamp}.${format}`;
}
