import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdirSync } from 'node:fs';
import { mkdir, writeFile, unlink, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';
import { publicApiBase } from '../utils/public-api-base.js';
import { withRetry } from '../utils/with-retry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOAD_ROOT = path.resolve(__dirname, '../../uploads/motivation-audio');
const LOCAL_MOTIVATION_COVER_ROOT = path.resolve(__dirname, '../../uploads/motivation-covers');
const LOCAL_MUSCLE_UPLOAD_ROOT = path.resolve(__dirname, '../../uploads/muscle-group-images');
const LOCAL_MACHINE_COVER_ROOT = path.resolve(__dirname, '../../uploads/machine-covers');
const LOCAL_NOTICE_ROOT = path.resolve(__dirname, '../../uploads/notice-attachments');
const LOCAL_BANNER_ROOT = path.resolve(__dirname, '../../uploads/banner-images');

try {
  mkdirSync(LOCAL_MUSCLE_UPLOAD_ROOT, { recursive: true });
  mkdirSync(LOCAL_MACHINE_COVER_ROOT, { recursive: true });
  mkdirSync(LOCAL_MOTIVATION_COVER_ROOT, { recursive: true });
  mkdirSync(LOCAL_NOTICE_ROOT, { recursive: true });
  mkdirSync(LOCAL_BANNER_ROOT, { recursive: true });
} catch {
  // Best-effort for local/static fallback roots.
}

let noticeBucketReady: Promise<void> | null = null;
let bannerBucketReady: Promise<void> | null = null;

let supabase: SupabaseClient | null | undefined;
let audioBucketReady: Promise<void> | null = null;
let motivationCoverBucketReady: Promise<void> | null = null;
let muscleBucketReady: Promise<void> | null = null;
let machineCoverBucketReady: Promise<void> | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase !== undefined) return supabase;
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  // Reject dotenv placeholders so we don't pretend Storage is configured.
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
    // Render/Node <22 has no global WebSocket; supabase-js realtime needs one at init.
    realtime: {
      // ws types don't match browser WebSocket DOM types exactly.
      transport: WebSocket as never,
    },
  });
  return supabase;
}

function requireMotivationAudioStorage(): SupabaseClient | null {
  const client = getSupabase();
  if (client) return client;
  if (env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    throw new AppError(
      503,
      'STORAGE_ERROR',
      'Motivation audio storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the API host, then re-upload tracks.'
    );
  }
  return null;
}

async function ensureAudioBucket(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  if (!audioBucketReady) {
    audioBucketReady = (async () => {
      const bucket = env.MOTIVATION_AUDIO_BUCKET;
      const { data, error } = await withRetry(
        () => client.storage.listBuckets(),
        { maxAttempts: 3, baseDelayMs: 200, label: 'listBuckets' }
      );
      if (error) {
        throw new AppError(
          500,
          'STORAGE_ERROR',
          'Could not list storage buckets (check SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)',
          error.message
        );
      }
      const exists = data?.some((item) => item.name === bucket);
      if (!exists) {
        // Keep create options minimal — strict MIME allowlists break on some Supabase projects.
        const created = await client.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: env.MOTIVATION_AUDIO_MAX_BYTES,
        });
        if (created.error && !/already exists/i.test(created.error.message)) {
          throw new AppError(
            500,
            'STORAGE_ERROR',
            `Could not create audio storage bucket "${bucket}"`,
            created.error.message
          );
        }
      } else {
        // Best-effort public flag — do not fail boot if update is denied.
        const updated = await client.storage.updateBucket(bucket, { public: true });
        if (updated.error && !/not allowed|forbidden|policy/i.test(updated.error.message)) {
          // Non-fatal for private buckets: API proxy still streams via service role.
        }
      }
    })().catch((err) => {
      audioBucketReady = null;
      throw err;
    });
  }
  await audioBucketReady;
}

async function ensureMuscleBucket(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  if (!muscleBucketReady) {
    muscleBucketReady = (async () => {
      const bucket = env.MUSCLE_GROUP_IMAGE_BUCKET;
      const { data, error } = await withRetry(
        () => client.storage.listBuckets(),
        { maxAttempts: 3, baseDelayMs: 200, label: 'listBuckets' }
      );
      if (error) {
        throw new AppError(500, 'STORAGE_ERROR', 'Could not list storage buckets', error.message);
      }
      const exists = data?.some((item) => item.name === bucket);
      if (!exists) {
        const created = await client.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: env.MUSCLE_GROUP_IMAGE_MAX_BYTES,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        });
        if (created.error && !/already exists/i.test(created.error.message)) {
          throw new AppError(
            500,
            'STORAGE_ERROR',
            'Could not create muscle-group image storage bucket',
            created.error.message
          );
        }
      }
    })().catch((err) => {
      muscleBucketReady = null;
      throw err;
    });
  }
  await muscleBucketReady;
}

export type StoredAudioObject = {
  storagePath: string;
  publicUrl: string;
  provider: 'supabase' | 'local';
};

export type StoredImageObject = {
  storagePath: string;
  publicUrl: string;
  provider: 'supabase' | 'local';
};

function mimeFromAudioPath(storagePath: string): string {
  const ext = path.extname(storagePath).toLowerCase();
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg';
    case '.m4a':
      return 'audio/mp4';
    case '.aac':
      return 'audio/aac';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    default:
      return 'application/octet-stream';
  }
}

/** Always serve uploads through the API so GitHub Pages can play them (CORS + private buckets). */
export function motivationAudioPublicUrl(storagePath: string): string {
  const encoded = storagePath
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
  return `${publicApiBase()}/media/motivation-audio/${encoded}`;
}

export function motivationCoverPublicUrl(storagePath: string): string {
  const encoded = storagePath
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
  return `${publicApiBase()}/media/motivation-covers/${encoded}`;
}

export type MotivationAudioPayload = {
  buffer: Buffer;
  mimeType: string;
};

async function ensureMotivationCoverBucket(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  if (!motivationCoverBucketReady) {
    motivationCoverBucketReady = (async () => {
      const bucket = env.MOTIVATION_COVER_IMAGE_BUCKET;
      const { data, error } = await withRetry(() => client.storage.listBuckets(), {
        maxAttempts: 3,
        baseDelayMs: 200,
        label: 'listBuckets',
      });
      if (error) {
        throw new AppError(500, 'STORAGE_ERROR', 'Could not list storage buckets', error.message);
      }
      const exists = data?.some((item) => item.name === bucket);
      if (!exists) {
        const created = await client.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: env.MUSCLE_GROUP_IMAGE_MAX_BYTES,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        });
        if (created.error && !/already exists/i.test(created.error.message)) {
          throw new AppError(
            500,
            'STORAGE_ERROR',
            'Could not create motivation-cover storage bucket',
            created.error.message
          );
        }
      }
    })().catch((err) => {
      motivationCoverBucketReady = null;
      throw err;
    });
  }
  await motivationCoverBucketReady;
}

export const storageService = {
  localUploadRoot: LOCAL_UPLOAD_ROOT,
  localMotivationCoverRoot: LOCAL_MOTIVATION_COVER_ROOT,
  localMuscleUploadRoot: LOCAL_MUSCLE_UPLOAD_ROOT,

  async saveMotivationAudio(params: {
    userId: string;
    trackId: string;
    extension: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredAudioObject> {
    const storagePath = `${params.userId}/${params.trackId}.${params.extension}`;
    const client = requireMotivationAudioStorage();

    if (client) {
      await ensureAudioBucket();
      const { error } = await client.storage
        .from(env.MOTIVATION_AUDIO_BUCKET)
        .upload(storagePath, params.buffer, {
          contentType: params.mimeType || 'application/octet-stream',
          upsert: true,
        });
      if (error) {
        throw new AppError(500, 'UPLOAD_FAILED', 'Could not save the audio file', error.message);
      }
      return {
        storagePath,
        publicUrl: motivationAudioPublicUrl(storagePath),
        provider: 'supabase',
      };
    }

    const absolute = path.join(LOCAL_UPLOAD_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return {
      storagePath,
      publicUrl: motivationAudioPublicUrl(storagePath),
      provider: 'local',
    };
  },

  /** Create/publicize the motivation-audio bucket when Storage credentials are present. */
  async ensureMotivationAudioReady(): Promise<{
    status: 'ok' | 'skipped' | 'error';
    detail?: string;
  }> {
    try {
      const client = getSupabase();
      if (!client) {
        return {
          status: 'skipped',
          detail: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing or placeholder',
        };
      }
      await ensureAudioBucket();
      return { status: 'ok' };
    } catch (error) {
      const detail =
        error instanceof AppError
          ? `${error.message}${error.details != null ? ` | ${String(error.details)}` : ''}`
          : error instanceof Error
            ? error.message
            : String(error);
      return { status: 'error', detail };
    }
  },

  /**
   * Resolve uploaded audio for streaming (local disk first, then Supabase with service role).
   * Prevents browser 403s when the storage bucket is private or lacks public SELECT policies.
   */
  async readMotivationAudio(storagePath: string): Promise<MotivationAudioPayload | null> {
    const normalized = storagePath
      .split(/[/\\]/)
      .filter((part) => part && part !== '.' && part !== '..')
      .join('/');
    if (!normalized) return null;

    const absolute = path.join(LOCAL_UPLOAD_ROOT, normalized);
    const resolvedRoot = path.resolve(LOCAL_UPLOAD_ROOT);
    const resolvedFile = path.resolve(absolute);
    if (
      resolvedFile !== resolvedRoot &&
      !resolvedFile.startsWith(resolvedRoot + path.sep)
    ) {
      return null;
    }

    try {
      const buffer = await readFile(resolvedFile);
      return { buffer, mimeType: mimeFromAudioPath(normalized) };
    } catch {
      // fall through to Supabase
    }

    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.storage
      .from(env.MOTIVATION_AUDIO_BUCKET)
      .download(normalized);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    return {
      buffer,
      mimeType: data.type || mimeFromAudioPath(normalized),
    };
  },

  /** Best-effort delete of user-prefixed motivation audio (withdraw purge). */
  async removeUserOwnedObjects(userId: string): Promise<number> {
    const prefix = userId.replace(/[^a-zA-Z0-9-]/g, '');
    if (!prefix || prefix !== userId) return 0;
    let removed = 0;
    const client = getSupabase();
    if (client) {
      try {
        await ensureAudioBucket();
        const { data } = await client.storage
          .from(env.MOTIVATION_AUDIO_BUCKET)
          .list(prefix, { limit: 1000 });
        const paths = (data ?? [])
          .map((f) => f.name)
          .filter(Boolean)
          .map((name) => `${prefix}/${name}`);
        if (paths.length > 0) {
          await client.storage.from(env.MOTIVATION_AUDIO_BUCKET).remove(paths);
          removed += paths.length;
        }
      } catch {
        /* ignore storage failures during purge */
      }
    }
    try {
      const dir = path.join(LOCAL_UPLOAD_ROOT, prefix);
      const names = await readdir(dir);
      for (const name of names) {
        try {
          await unlink(path.join(dir, name));
          removed += 1;
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* missing local dir */
    }
    return removed;
  },

  async deleteMotivationAudio(storagePath: string | null | undefined): Promise<void> {
    if (!storagePath) return;
    const client = getSupabase();
    if (client) {
      await client.storage.from(env.MOTIVATION_AUDIO_BUCKET).remove([storagePath]);
      return;
    }
    try {
      await unlink(path.join(LOCAL_UPLOAD_ROOT, storagePath));
    } catch {
      // ignore missing local files
    }
  },

  async saveMotivationCoverImage(params: {
    ownerKey: string;
    assetId: string;
    extension: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredImageObject> {
    const storagePath = `${params.ownerKey}/${params.assetId}.${params.extension}`;
    const client = getSupabase();

    if (client) {
      await ensureMotivationCoverBucket();
      const { error } = await client.storage
        .from(env.MOTIVATION_COVER_IMAGE_BUCKET)
        .upload(storagePath, params.buffer, {
          contentType: params.mimeType || 'image/webp',
          upsert: true,
          cacheControl: '31536000',
        });
      if (error) {
        throw new AppError(500, 'UPLOAD_FAILED', 'Could not save the cover image', error.message);
      }
      return {
        storagePath,
        publicUrl: motivationCoverPublicUrl(storagePath),
        provider: 'supabase',
      };
    }

    const absolute = path.join(LOCAL_MOTIVATION_COVER_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return {
      storagePath,
      publicUrl: motivationCoverPublicUrl(storagePath),
      provider: 'local',
    };
  },

  async readMotivationCoverImage(storagePath: string): Promise<{
    buffer: Buffer;
    mimeType: string;
  } | null> {
    const normalized = storagePath
      .split(/[/\\]/)
      .filter((part) => part && part !== '.' && part !== '..')
      .join('/');
    if (!normalized) return null;

    const absolute = path.join(LOCAL_MOTIVATION_COVER_ROOT, normalized);
    const resolvedRoot = path.resolve(LOCAL_MOTIVATION_COVER_ROOT);
    const resolvedFile = path.resolve(absolute);
    if (
      resolvedFile !== resolvedRoot &&
      !resolvedFile.startsWith(resolvedRoot + path.sep)
    ) {
      return null;
    }

    try {
      const buffer = await readFile(resolvedFile);
      return { buffer, mimeType: 'image/webp' };
    } catch {
      // fall through
    }

    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.storage
      .from(env.MOTIVATION_COVER_IMAGE_BUCKET)
      .download(normalized);
    if (error || !data) return null;
    return {
      buffer: Buffer.from(await data.arrayBuffer()),
      mimeType: data.type || 'image/webp',
    };
  },

  async saveMuscleGroupImage(params: {
    muscleGroup: string;
    kind: 'main' | 'thumb';
    extension: string;
    mimeType: string;
    buffer: Buffer;
    version: number;
  }): Promise<StoredImageObject> {
    const storagePath = `${params.muscleGroup}/${params.kind}-v${params.version}.${params.extension}`;
    const client = getSupabase();

    if (client) {
      await ensureMuscleBucket();
      const { error } = await client.storage
        .from(env.MUSCLE_GROUP_IMAGE_BUCKET)
        .upload(storagePath, params.buffer, {
          contentType: params.mimeType || 'image/webp',
          upsert: true,
          cacheControl: '31536000',
        });
      if (error) {
        throw new AppError(500, 'UPLOAD_FAILED', 'Could not save the image file', error.message);
      }
      const { data } = client.storage.from(env.MUSCLE_GROUP_IMAGE_BUCKET).getPublicUrl(storagePath);
      return {
        storagePath,
        publicUrl: data.publicUrl,
        provider: 'supabase',
      };
    }

    const absolute = path.join(LOCAL_MUSCLE_UPLOAD_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return {
      storagePath,
      publicUrl: `${publicApiBase()}/media/muscle-group-images/${storagePath
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`,
      provider: 'local',
    };
  },

  async deleteMuscleGroupImage(storagePath: string | null | undefined): Promise<void> {
    if (!storagePath) return;
    const client = getSupabase();
    if (client) {
      await client.storage.from(env.MUSCLE_GROUP_IMAGE_BUCKET).remove([storagePath]);
      return;
    }
    try {
      await unlink(path.join(LOCAL_MUSCLE_UPLOAD_ROOT, storagePath));
    } catch {
      // ignore missing local files
    }
  },

  localMachineCoverRoot: LOCAL_MACHINE_COVER_ROOT,

  async saveMachineCoverImage(params: {
    machineCode: string;
    kind: 'main' | 'thumb';
    extension: string;
    mimeType: string;
    buffer: Buffer;
    version: number;
  }): Promise<StoredImageObject> {
    const storagePath = `${params.machineCode}/${params.kind}-v${params.version}.${params.extension}`;
    const client = getSupabase();

    if (client) {
      if (!machineCoverBucketReady) {
        machineCoverBucketReady = (async () => {
          const bucket = env.MACHINE_COVER_IMAGE_BUCKET;
          const { data, error } = await withRetry(
            () => client.storage.listBuckets(),
            { maxAttempts: 3, baseDelayMs: 200, label: 'listBuckets' }
          );
          if (error) {
            throw new AppError(500, 'STORAGE_ERROR', 'Could not list storage buckets', error.message);
          }
          const exists = data?.some((item) => item.name === bucket);
          if (!exists) {
            const created = await client.storage.createBucket(bucket, {
              public: true,
              fileSizeLimit: env.MUSCLE_GROUP_IMAGE_MAX_BYTES,
              allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            });
            if (created.error && !/already exists/i.test(created.error.message)) {
              throw new AppError(
                500,
                'STORAGE_ERROR',
                'Could not create machine-cover storage bucket',
                created.error.message
              );
            }
          }
        })().catch((err) => {
          machineCoverBucketReady = null;
          throw err;
        });
      }
      await machineCoverBucketReady;

      const { error } = await client.storage
        .from(env.MACHINE_COVER_IMAGE_BUCKET)
        .upload(storagePath, params.buffer, {
          contentType: params.mimeType || 'image/webp',
          upsert: true,
          cacheControl: '31536000',
        });
      if (error) {
        throw new AppError(500, 'UPLOAD_FAILED', 'Could not save the image file', error.message);
      }
      const { data } = client.storage.from(env.MACHINE_COVER_IMAGE_BUCKET).getPublicUrl(storagePath);
      return {
        storagePath,
        publicUrl: data.publicUrl,
        provider: 'supabase',
      };
    }

    const absolute = path.join(LOCAL_MACHINE_COVER_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return {
      storagePath,
      publicUrl: `${publicApiBase()}/media/machine-covers/${storagePath
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`,
      provider: 'local',
    };
  },

  async deleteMachineCoverImage(storagePath: string | null | undefined): Promise<void> {
    if (!storagePath) return;
    const client = getSupabase();
    if (client) {
      await client.storage.from(env.MACHINE_COVER_IMAGE_BUCKET).remove([storagePath]);
      return;
    }
    try {
      await unlink(path.join(LOCAL_MACHINE_COVER_ROOT, storagePath));
    } catch {
      // ignore missing local files
    }
  },

  /** Gym asset / inspection photos — reuse machine-cover bucket under gym-machines/ prefix. */
  async saveGymMachinePhoto(params: {
    gymMachineId: string;
    photoId: string;
    extension: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredImageObject> {
    const storagePath = `gym-machines/${params.gymMachineId}/${params.photoId}.${params.extension}`;
    const client = getSupabase();
    if (client) {
      const { error } = await client.storage
        .from(env.MACHINE_COVER_IMAGE_BUCKET)
        .upload(storagePath, params.buffer, {
          contentType: params.mimeType || 'image/jpeg',
          upsert: true,
          cacheControl: '31536000',
        });
      if (error) {
        // Local fallback when bucket missing
        const absolute = path.join(LOCAL_MACHINE_COVER_ROOT, storagePath);
        await mkdir(path.dirname(absolute), { recursive: true });
        await writeFile(absolute, params.buffer);
        return {
          storagePath,
          publicUrl: `${publicApiBase()}/media/machine-covers/${storagePath
            .split('/')
            .map(encodeURIComponent)
            .join('/')}`,
          provider: 'local',
        };
      }
      const { data } = client.storage.from(env.MACHINE_COVER_IMAGE_BUCKET).getPublicUrl(storagePath);
      return { storagePath, publicUrl: data.publicUrl, provider: 'supabase' };
    }

    const absolute = path.join(LOCAL_MACHINE_COVER_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return {
      storagePath,
      publicUrl: `${publicApiBase()}/media/machine-covers/${storagePath
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`,
      provider: 'local',
    };
  },

  localNoticeUploadRoot: LOCAL_NOTICE_ROOT,

  async ensureNoticeBucket(): Promise<void> {
    const client = getSupabase();
    if (!client) return;
    if (!noticeBucketReady) {
      noticeBucketReady = (async () => {
        const bucket = env.NOTICE_ATTACHMENT_BUCKET;
        const { data, error } = await withRetry(
          () => client.storage.listBuckets(),
          { maxAttempts: 3, baseDelayMs: 200, label: 'listBuckets' }
        );
        if (error) {
          throw new AppError(500, 'STORAGE_ERROR', 'Could not list storage buckets', error.message);
        }
        const exists = data?.some((item) => item.name === bucket);
        if (!exists) {
          const created = await client.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: env.NOTICE_ATTACHMENT_MAX_BYTES,
          });
          if (created.error && !/already exists/i.test(created.error.message)) {
            throw new AppError(
              500,
              'STORAGE_ERROR',
              `Could not create notice attachment bucket "${bucket}"`,
              created.error.message
            );
          }
        }
      })().catch((err) => {
        noticeBucketReady = null;
        throw err;
      });
    }
    await noticeBucketReady;
  },

  noticeAttachmentPublicUrl(storagePath: string): string {
    const encoded = storagePath
      .split('/')
      .filter(Boolean)
      .map(encodeURIComponent)
      .join('/');
    return `${publicApiBase()}/media/notice-attachments/${encoded}`;
  },

  async uploadNoticeAttachment(params: {
    noticeId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredImageObject> {
    const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const storagePath = `${params.noticeId}/${Date.now()}-${safeName}`;
    await this.ensureNoticeBucket();
    const client = getSupabase();

    if (client) {
      const { error } = await client.storage
        .from(env.NOTICE_ATTACHMENT_BUCKET)
        .upload(storagePath, params.buffer, {
          contentType: params.mimeType,
          upsert: false,
        });
      if (error) {
        // Fall back to local disk when Supabase rejects the upload.
        const absolute = path.join(LOCAL_NOTICE_ROOT, storagePath);
        await mkdir(path.dirname(absolute), { recursive: true });
        await writeFile(absolute, params.buffer);
        return {
          storagePath,
          publicUrl: this.noticeAttachmentPublicUrl(storagePath),
          provider: 'local',
        };
      }
      return {
        storagePath,
        publicUrl: this.noticeAttachmentPublicUrl(storagePath),
        provider: 'supabase',
      };
    }

    const absolute = path.join(LOCAL_NOTICE_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return {
      storagePath,
      publicUrl: this.noticeAttachmentPublicUrl(storagePath),
      provider: 'local',
    };
  },

  async readNoticeAttachment(storagePath: string): Promise<{ buffer: Buffer; mimeType?: string } | null> {
    const client = getSupabase();
    if (client) {
      const { data, error } = await client.storage
        .from(env.NOTICE_ATTACHMENT_BUCKET)
        .download(storagePath);
      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        return { buffer };
      }
    }
    try {
      const buffer = await readFile(path.join(LOCAL_NOTICE_ROOT, storagePath));
      return { buffer };
    } catch {
      return null;
    }
  },

  async deleteNoticeAttachment(storagePath: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      await client.storage.from(env.NOTICE_ATTACHMENT_BUCKET).remove([storagePath]);
    }
    try {
      await unlink(path.join(LOCAL_NOTICE_ROOT, storagePath));
    } catch {
      // ignore missing local file
    }
  },

  localBannerUploadRoot: LOCAL_BANNER_ROOT,

  async ensureBannerBucket(): Promise<void> {
    const client = getSupabase();
    if (!client) return;
    if (!bannerBucketReady) {
      bannerBucketReady = (async () => {
        const bucket = env.BANNER_IMAGE_BUCKET;
        const { data, error } = await withRetry(
          () => client.storage.listBuckets(),
          { maxAttempts: 3, baseDelayMs: 200, label: 'listBuckets' }
        );
        if (error) {
          throw new AppError(500, 'STORAGE_ERROR', 'Could not list storage buckets', error.message);
        }
        const exists = data?.some((item) => item.name === bucket);
        if (!exists) {
          const created = await client.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: env.BANNER_IMAGE_MAX_BYTES,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          });
          if (created.error && !/already exists/i.test(created.error.message)) {
            throw new AppError(
              500,
              'STORAGE_ERROR',
              `Could not create banner image bucket "${bucket}"`,
              created.error.message
            );
          }
        }
      })().catch((err) => {
        bannerBucketReady = null;
        throw err;
      });
    }
    await bannerBucketReady;
  },

  bannerImagePublicUrl(storagePath: string): string {
    const encoded = storagePath
      .split('/')
      .filter(Boolean)
      .map(encodeURIComponent)
      .join('/');
    return `${publicApiBase()}/media/banner-images/${encoded}`;
  },

  async uploadBannerImage(params: {
    bannerId: string;
    kind: 'desktop' | 'mobile';
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredImageObject> {
    const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const storagePath = `${params.bannerId}/${params.kind}/${Date.now()}-${safeName}`;
    await this.ensureBannerBucket();
    const client = getSupabase();

    if (client) {
      const { error } = await client.storage
        .from(env.BANNER_IMAGE_BUCKET)
        .upload(storagePath, params.buffer, {
          contentType: params.mimeType,
          upsert: false,
        });
      if (error) {
        const absolute = path.join(LOCAL_BANNER_ROOT, storagePath);
        await mkdir(path.dirname(absolute), { recursive: true });
        await writeFile(absolute, params.buffer);
        return {
          storagePath,
          publicUrl: this.bannerImagePublicUrl(storagePath),
          provider: 'local',
        };
      }
      return {
        storagePath,
        publicUrl: this.bannerImagePublicUrl(storagePath),
        provider: 'supabase',
      };
    }

    const absolute = path.join(LOCAL_BANNER_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return {
      storagePath,
      publicUrl: this.bannerImagePublicUrl(storagePath),
      provider: 'local',
    };
  },

  async readBannerImage(storagePath: string): Promise<{ buffer: Buffer; mimeType?: string } | null> {
    const client = getSupabase();
    if (client) {
      const { data, error } = await client.storage
        .from(env.BANNER_IMAGE_BUCKET)
        .download(storagePath);
      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        return { buffer };
      }
    }
    try {
      const buffer = await readFile(path.join(LOCAL_BANNER_ROOT, storagePath));
      return { buffer };
    } catch {
      return null;
    }
  },

  async deleteBannerImage(storagePath: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      await client.storage.from(env.BANNER_IMAGE_BUCKET).remove([storagePath]);
    }
    try {
      await unlink(path.join(LOCAL_BANNER_ROOT, storagePath));
    } catch {
      // ignore missing local file
    }
  },

  /**
   * Lightweight storage readiness probe (DR /ready).
   * Returns true when Supabase Storage responds or local disk is usable.
   */
  async probeConnection(timeoutMs = 2_500): Promise<boolean> {
    const client = getSupabase();
    if (!client) {
      try {
        mkdirSync(LOCAL_UPLOAD_ROOT, { recursive: true });
        return true;
      } catch {
        return false;
      }
    }
    try {
      const result = await Promise.race([
        client.storage.listBuckets().then((r) => !r.error),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
      ]);
      return result;
    } catch {
      return false;
    }
  },
};
