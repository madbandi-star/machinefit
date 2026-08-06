import type {
  BackupAction,
  BackupFormat,
  BackupRestoreMode,
  BackupRetentionDays,
  BackupStatus,
  BackupType,
} from '../constants/backup.js';

export type BackupPremiumSnapshot = {
  roleCode: string;
  planCode: string | null;
  planStatus: string | null;
  isPremium: boolean;
};

export type BackupUserProfileSafe = {
  id: string;
  loginId: string | null;
  displayName: string | null;
  email: string | null;
  gender: string | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  experienceLevel: string | null;
  workoutGoal: string | null;
  unitHeight: string | null;
  unitWeight: string | null;
  premium: BackupPremiumSnapshot;
};

/** Client-only prefs (rest timer, voice, etc.) — never auth secrets. */
export type BackupClientSettings = Record<string, unknown>;

export type BackupWorkoutLogItem = {
  id: string;
  machineId: string;
  machineCode?: string | null;
  gymId: string;
  memberId: string;
  recommendationId?: string | null;
  logDate: string;
  targetMuscleGroup: string;
  setCount: number;
  setWeightsKg: number[];
  setCompleted: boolean[];
  diary?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BackupFavoriteItem = {
  id?: string;
  machineId: string;
  machineCode?: string | null;
  gymId?: string | null;
  memberId?: string | null;
  createdAt?: string;
};

export type BackupHistoryItem = {
  id?: string;
  machineId: string;
  machineCode?: string | null;
  gymId?: string | null;
  memberId?: string | null;
  viewedAt?: string;
};

export type BackupPreferenceItem = {
  id?: string;
  machineId: string;
  machineCode?: string | null;
  gymId: string;
  memberId: string;
  customSettings: Record<string, unknown>;
  personalTipMemo?: string;
  activeSource?: string;
  updatedAt?: string;
};

export type BackupFeedbackItem = {
  id?: string;
  machineId: string;
  gymId?: string | null;
  memberId?: string | null;
  rating?: number | null;
  comment?: string | null;
  createdAt?: string;
};

export type UserBackupPayload = {
  backup_version: number;
  type: 'USER';
  exported_at: string;
  app_version: string;
  user: BackupUserProfileSafe;
  client_settings: BackupClientSettings;
  workout_logs: BackupWorkoutLogItem[];
  favorites: BackupFavoriteItem[];
  recent_history: BackupHistoryItem[];
  user_machine_preferences: BackupPreferenceItem[];
  recommendation_feedback: BackupFeedbackItem[];
};

export type SystemBackupTableChunk = {
  table: string;
  rows: Record<string, unknown>[];
};

export type SystemBackupPayload = {
  backup_version: number;
  type: 'SYSTEM';
  exported_at: string;
  app_version: string;
  tables: SystemBackupTableChunk[];
  /** Tables intentionally omitted (auth secrets, tokens, payment history). */
  excluded_tables: string[];
};

export type BackupManifest = {
  backup_version: number;
  type: BackupType;
  exported_at: string;
  app_version: string;
  payload_file: string;
  checksum_sha256?: string;
};

export type BackupLogItem = {
  id: string;
  userId: string | null;
  type: BackupType;
  action: BackupAction;
  status: BackupStatus;
  progress: number;
  format: BackupFormat;
  storagePath: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  backupVersion: number | null;
  restoreMode: BackupRestoreMode | null;
  errorMessage: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
};

export type BackupJobProgress = {
  id: string;
  status: BackupStatus;
  progress: number;
  fileName: string | null;
  downloadReady: boolean;
  errorMessage: string | null;
};

export type BackupSettings = {
  autoBackupEnabled: boolean;
  autoBackupHourUtc: number;
  retentionDays: BackupRetentionDays;
  lastAutoBackupAt: string | null;
  lastAutoBackupDate: string | null;
};

export type BackupExportRequest = {
  format?: BackupFormat;
  clientSettings?: BackupClientSettings;
};

export type BackupImportRequestMeta = {
  mode: BackupRestoreMode;
  format?: BackupFormat;
};

export type BackupImportResult = {
  mode: BackupRestoreMode;
  restored: {
    workoutLogs: number;
    favorites: number;
    recentHistory: number;
    preferences: number;
    feedback: number;
  };
  skippedDuplicates: number;
  clientSettings: BackupClientSettings | null;
};

export type SystemRestoreConfirm = {
  confirmText: string;
};
