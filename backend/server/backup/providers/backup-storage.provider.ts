/**
 * Extensible backup storage interface.
 * Future: Google Drive, iCloud, Dropbox, OneDrive, NAS adapters.
 */

export type BackupStoredObject = {
  storagePath: string;
  sizeBytes: number;
  provider: 'supabase' | 'local';
};

export interface BackupStorageProvider {
  readonly id: string;
  ensureReady(): Promise<void>;
  upload(params: {
    storagePath: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<BackupStoredObject>;
  download(storagePath: string): Promise<Buffer | null>;
  delete(storagePath: string): Promise<void>;
  list(prefix: string): Promise<{ storagePath: string; sizeBytes: number; updatedAt?: string }[]>;
  deleteOlderThan(prefix: string, olderThan: Date): Promise<number>;
}
