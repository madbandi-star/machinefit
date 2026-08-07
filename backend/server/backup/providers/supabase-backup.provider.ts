import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdirSync } from 'node:fs';
import { mkdir, writeFile, readFile, unlink, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import {
  BACKUP_MAX_UPLOAD_BYTES,
  BACKUP_STORAGE_BUCKET,
} from '@machinefit/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { logger } from '../../utils/logger.js';
import { withRetry } from '../../utils/with-retry.js';
import type { BackupStorageProvider, BackupStoredObject } from './backup-storage.provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_BACKUP_ROOT = path.resolve(__dirname, '../../../uploads/backups');

try {
  mkdirSync(LOCAL_BACKUP_ROOT, { recursive: true });
} catch {
  // best-effort
}

let supabase: SupabaseClient | null | undefined;
let bucketReady: Promise<void> | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase !== undefined) return supabase;
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (
    !url ||
    !key ||
    /^your-|^changeme|^xxx|placeholder/i.test(key) ||
    /^your-|^changeme/i.test(url)
  ) {
    supabase = null;
    return null;
  }
  supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket as never },
  });
  return supabase;
}

function normalizePath(storagePath: string): string | null {
  const normalized = storagePath
    .split(/[/\\]/)
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');
  return normalized || null;
}

function isAlreadyExistsError(message: string | undefined): boolean {
  return Boolean(message && /already exists/i.test(message));
}

export class SupabaseBackupStorageProvider implements BackupStorageProvider {
  readonly id = 'supabase';

  async ensureReady(): Promise<void> {
    const client = getSupabase();
    if (!client) return;
    if (!bucketReady) {
      // Soft-fail: never block admin ZIP download if remote bucket setup fails.
      // upload() already falls back to local disk when Supabase upload errors.
      bucketReady = (async () => {
        const bucket = env.BACKUP_STORAGE_BUCKET || BACKUP_STORAGE_BUCKET;
        try {
          const { data, error } = await withRetry(() => client.storage.listBuckets(), {
            maxAttempts: 3,
            baseDelayMs: 200,
            label: 'listBuckets',
          });
          if (error) {
            logger.warn('Backup storage listBuckets failed; using local fallback', {
              message: error.message,
            });
            return;
          }
          const exists = data?.some((item) => item.name === bucket);
          if (exists) return;

          // Prefer minimal create options first — some Supabase plans reject large fileSizeLimit.
          const createAttempts: Array<{ public: boolean; fileSizeLimit?: number }> = [
            { public: false },
            { public: false, fileSizeLimit: Math.min(BACKUP_MAX_UPLOAD_BYTES, 50 * 1024 * 1024) },
            { public: false, fileSizeLimit: BACKUP_MAX_UPLOAD_BYTES },
          ];

          let lastError: string | null = null;
          for (const options of createAttempts) {
            const created = await client.storage.createBucket(bucket, options);
            if (!created.error || isAlreadyExistsError(created.error.message)) {
              return;
            }
            lastError = created.error.message;
          }

          logger.warn('Could not create backup bucket; using local fallback', {
            bucket,
            message: lastError,
          });
        } catch (err) {
          logger.warn('Backup storage ensureReady failed; using local fallback', {
            message: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    }
    await bucketReady;
  }

  async upload(params: {
    storagePath: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<BackupStoredObject> {
    const storagePath = normalizePath(params.storagePath);
    if (!storagePath) throw new AppError(400, 'VALIDATION_ERROR', 'Invalid storage path');
    await this.ensureReady();
    const client = getSupabase();
    const bucket = env.BACKUP_STORAGE_BUCKET || BACKUP_STORAGE_BUCKET;

    if (client) {
      const { error } = await client.storage.from(bucket).upload(storagePath, params.buffer, {
        contentType: params.contentType,
        upsert: true,
      });
      if (!error) {
        return { storagePath, sizeBytes: params.buffer.length, provider: 'supabase' };
      }
      logger.warn('Backup Supabase upload failed; using local fallback', {
        bucket,
        storagePath,
        message: error.message,
      });
    }

    const absolute = path.join(LOCAL_BACKUP_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return { storagePath, sizeBytes: params.buffer.length, provider: 'local' };
  }

  async download(storagePath: string): Promise<Buffer | null> {
    const normalized = normalizePath(storagePath);
    if (!normalized) return null;
    const client = getSupabase();
    const bucket = env.BACKUP_STORAGE_BUCKET || BACKUP_STORAGE_BUCKET;
    if (client) {
      const { data, error } = await client.storage.from(bucket).download(normalized);
      if (!error && data) return Buffer.from(await data.arrayBuffer());
    }
    try {
      return await readFile(path.join(LOCAL_BACKUP_ROOT, normalized));
    } catch {
      return null;
    }
  }

  async delete(storagePath: string): Promise<void> {
    const normalized = normalizePath(storagePath);
    if (!normalized) return;
    const client = getSupabase();
    const bucket = env.BACKUP_STORAGE_BUCKET || BACKUP_STORAGE_BUCKET;
    if (client) {
      await client.storage.from(bucket).remove([normalized]);
    }
    try {
      await unlink(path.join(LOCAL_BACKUP_ROOT, normalized));
    } catch {
      // ignore
    }
  }

  async list(
    prefix: string
  ): Promise<{ storagePath: string; sizeBytes: number; updatedAt?: string }[]> {
    const client = getSupabase();
    const bucket = env.BACKUP_STORAGE_BUCKET || BACKUP_STORAGE_BUCKET;
    if (client) {
      const { data, error } = await client.storage.from(bucket).list(prefix, {
        limit: 1000,
        sortBy: { column: 'updated_at', order: 'desc' },
      });
      if (!error && data) {
        return data
          .filter((f) => f.name && !f.name.endsWith('/'))
          .map((f) => ({
            storagePath: `${prefix.replace(/\/$/, '')}/${f.name}`.replace(/^\//, ''),
            sizeBytes: Number(f.metadata?.size ?? 0),
            updatedAt: f.updated_at ?? undefined,
          }));
      }
    }

    const root = path.join(LOCAL_BACKUP_ROOT, prefix);
    try {
      const names = await readdir(root);
      const out: { storagePath: string; sizeBytes: number; updatedAt?: string }[] = [];
      for (const name of names) {
        const st = await stat(path.join(root, name));
        if (!st.isFile()) continue;
        out.push({
          storagePath: `${prefix.replace(/\/$/, '')}/${name}`.replace(/^\//, ''),
          sizeBytes: st.size,
          updatedAt: st.mtime.toISOString(),
        });
      }
      return out;
    } catch {
      return [];
    }
  }

  async deleteOlderThan(prefix: string, olderThan: Date): Promise<number> {
    const items = await this.list(prefix);
    let deleted = 0;
    for (const item of items) {
      if (!item.updatedAt) continue;
      if (new Date(item.updatedAt) < olderThan) {
        await this.delete(item.storagePath);
        deleted += 1;
      }
    }
    return deleted;
  }
}

let defaultProvider: BackupStorageProvider | null = null;

export function getBackupStorageProvider(): BackupStorageProvider {
  if (!defaultProvider) {
    defaultProvider = new SupabaseBackupStorageProvider();
  }
  return defaultProvider;
}
