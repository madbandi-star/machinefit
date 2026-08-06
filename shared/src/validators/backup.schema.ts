import { z } from 'zod';
import {
  BACKUP_FORMATS,
  BACKUP_RESTORE_MODES,
  BACKUP_RETENTION_DAYS,
  BACKUP_VERSION,
  BACKUP_VERSION_MIN,
} from '../constants/backup.js';

export const backupExportSchema = z.object({
  format: z.enum(BACKUP_FORMATS).default('zip'),
  clientSettings: z.record(z.unknown()).optional(),
});

export const backupImportMetaSchema = z.object({
  mode: z.enum(BACKUP_RESTORE_MODES).optional().default('merge'),
});

export const backupSettingsUpdateSchema = z.object({
  autoBackupEnabled: z.boolean().optional(),
  autoBackupHourUtc: z.number().int().min(0).max(23).optional(),
  retentionDays: z.union([
    z.literal(BACKUP_RETENTION_DAYS[0]),
    z.literal(BACKUP_RETENTION_DAYS[1]),
    z.literal(BACKUP_RETENTION_DAYS[2]),
  ]).optional(),
});

export const systemRestoreConfirmSchema = z.object({
  confirmText: z.string().min(1),
});

const premiumSchema = z.object({
  roleCode: z.string(),
  planCode: z.string().nullable(),
  planStatus: z.string().nullable(),
  isPremium: z.boolean(),
});

const userSafeSchema = z.object({
  id: z.string().uuid(),
  loginId: z.string().nullable(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  gender: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  weightKg: z.number().nullable().optional(),
  experienceLevel: z.string().nullable().optional(),
  workoutGoal: z.string().nullable().optional(),
  unitHeight: z.string().nullable().optional(),
  unitWeight: z.string().nullable().optional(),
  premium: premiumSchema,
});

const workoutLogSchema = z.object({
  id: z.string().uuid(),
  machineId: z.string().uuid(),
  machineCode: z.string().nullable().optional(),
  gymId: z.string().uuid(),
  memberId: z.string().uuid(),
  recommendationId: z.string().uuid().nullable().optional(),
  logDate: z.string().min(8),
  targetMuscleGroup: z.string().default(''),
  setCount: z.number().int().min(1).max(20),
  setWeightsKg: z.array(z.number()),
  setCompleted: z.array(z.boolean()).default([]),
  diary: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const favoriteSchema = z.object({
  id: z.string().uuid().optional(),
  machineId: z.string().uuid(),
  machineCode: z.string().nullable().optional(),
  gymId: z.string().uuid().nullable().optional(),
  memberId: z.string().uuid().nullable().optional(),
  createdAt: z.string().optional(),
});

const historySchema = z.object({
  id: z.string().uuid().optional(),
  machineId: z.string().uuid(),
  machineCode: z.string().nullable().optional(),
  gymId: z.string().uuid().nullable().optional(),
  memberId: z.string().uuid().nullable().optional(),
  viewedAt: z.string().optional(),
});

const preferenceSchema = z.object({
  id: z.string().uuid().optional(),
  machineId: z.string().uuid(),
  machineCode: z.string().nullable().optional(),
  gymId: z.string().uuid(),
  memberId: z.string().uuid(),
  customSettings: z.record(z.unknown()).default({}),
  personalTipMemo: z.string().optional(),
  activeSource: z.string().optional(),
  updatedAt: z.string().optional(),
});

const feedbackSchema = z.object({
  id: z.string().uuid().optional(),
  machineId: z.string().uuid(),
  gymId: z.string().uuid().nullable().optional(),
  memberId: z.string().uuid().nullable().optional(),
  rating: z.number().nullable().optional(),
  comment: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export const userBackupPayloadSchema = z.object({
  backup_version: z.number().int().min(BACKUP_VERSION_MIN).max(BACKUP_VERSION + 10),
  type: z.literal('USER'),
  exported_at: z.string().min(1),
  app_version: z.string().min(1),
  user: userSafeSchema,
  client_settings: z.record(z.unknown()).default({}),
  workout_logs: z.array(workoutLogSchema).default([]),
  favorites: z.array(favoriteSchema).default([]),
  recent_history: z.array(historySchema).default([]),
  user_machine_preferences: z.array(preferenceSchema).default([]),
  recommendation_feedback: z.array(feedbackSchema).default([]),
});

export const systemBackupPayloadSchema = z.object({
  backup_version: z.number().int().min(BACKUP_VERSION_MIN).max(BACKUP_VERSION + 10),
  type: z.literal('SYSTEM'),
  exported_at: z.string().min(1),
  app_version: z.string().min(1),
  tables: z.array(
    z.object({
      table: z.string().min(1),
      rows: z.array(z.record(z.unknown())),
    })
  ),
  excluded_tables: z.array(z.string()).default([]),
});

export const backupManifestSchema = z.object({
  backup_version: z.number().int(),
  type: z.enum(['USER', 'SYSTEM']),
  exported_at: z.string(),
  app_version: z.string(),
  payload_file: z.string().default('backup.json'),
  checksum_sha256: z.string().optional(),
});

export type BackupExportInput = z.infer<typeof backupExportSchema>;
export type BackupImportMetaInput = z.infer<typeof backupImportMetaSchema>;
export type BackupSettingsUpdateInput = z.infer<typeof backupSettingsUpdateSchema>;
export type SystemRestoreConfirmInput = z.infer<typeof systemRestoreConfirmSchema>;
