import type { Request, Response } from 'express';
import type {
  BackupExportInput,
  BackupImportMetaInput,
  BackupSettingsUpdateInput,
  SystemRestoreConfirmInput,
} from '@machinefit/shared';
import { Role, hasMinRole } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { backupService } from '../services/backup.service.js';
import { systemBackupService } from '../services/system-backup.service.js';

function requireUser(req: Request): { userId: string; roleCode: string } {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return { userId: req.user.userId, roleCode: req.user.roleCode };
}

export async function exportBackup(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const body = (req.body ?? {}) as BackupExportInput;
  const result = await backupService.exportUser(userId, body);
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
  res.setHeader('X-Backup-Job-Id', result.jobId);
  res.setHeader('X-Backup-Progress', '100');
  res.status(200).send(result.buffer);
}

export async function importBackup(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const file = req.file;
  if (!file?.buffer?.length) {
    throw new AppError(400, 'FILE_REQUIRED', 'Upload a ZIP or JSON backup file');
  }
  const meta = (req.body ?? {}) as BackupImportMetaInput;
  const mode = meta.mode === 'replace' ? 'replace' : 'merge';
  const { jobId, result } = await backupService.importUser(
    userId,
    { buffer: file.buffer, originalname: file.originalname },
    mode
  );
  res.json({ success: true, data: { jobId, ...result } });
}

export async function backupHistory(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const items = await backupService.history(userId, limit);
  res.json({ success: true, data: { items } });
}

export async function backupJobStatus(req: Request, res: Response): Promise<void> {
  const { userId, roleCode } = requireUser(req);
  const id = String(req.params.jobId ?? '');
  const job = await backupService.getJob(userId, id);
  // Admins may inspect any job via system history; getJob already scopes USER jobs.
  if (!hasMinRole(roleCode as never, Role.ADMIN) && job.id !== id) {
    throw new AppError(403, 'FORBIDDEN', 'Not allowed');
  }
  res.json({ success: true, data: job });
}

export async function downloadUserBackup(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const id = String(req.params.jobId ?? '');
  const file = await backupService.downloadUserBackup(userId, id);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
  res.status(200).send(file.buffer);
}

export async function systemBackup(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const format = req.body?.format === 'json' ? 'json' : 'zip';
  const result = await systemBackupService.exportSystem(userId, format);
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
  res.setHeader('X-Backup-Job-Id', result.jobId);
  res.setHeader('X-Backup-Progress', '100');
  res.status(200).send(result.buffer);
}

export async function systemRestore(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const file = req.file;
  if (!file?.buffer?.length) {
    throw new AppError(400, 'FILE_REQUIRED', 'Upload a system backup ZIP or JSON');
  }
  const body = (req.body ?? {}) as SystemRestoreConfirmInput;
  const result = await systemBackupService.restoreSystem(
    userId,
    { buffer: file.buffer, originalname: file.originalname },
    body.confirmText ?? ''
  );
  res.json({ success: true, data: result });
}

export async function systemBackupHistory(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const items = await systemBackupService.history(50);
  res.json({ success: true, data: { items } });
}

export async function downloadSystemBackup(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const id = String(req.params.jobId ?? '');
  const file = await systemBackupService.download(id);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
  res.status(200).send(file.buffer);
}

export async function getBackupSettings(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await systemBackupService.getSettings();
  res.json({ success: true, data });
}

export async function updateBackupSettings(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const body = req.body as BackupSettingsUpdateInput;
  const data = await systemBackupService.updateSettings(userId, body);
  res.json({ success: true, data });
}
