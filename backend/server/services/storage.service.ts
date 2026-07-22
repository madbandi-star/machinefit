import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';
import { publicApiBase } from '../utils/public-api-base.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOAD_ROOT = path.resolve(__dirname, '../../uploads/motivation-audio');
const LOCAL_MUSCLE_UPLOAD_ROOT = path.resolve(__dirname, '../../uploads/muscle-group-images');

let supabase: SupabaseClient | null | undefined;
let audioBucketReady: Promise<void> | null = null;
let muscleBucketReady: Promise<void> | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase !== undefined) return supabase;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = null;
    return null;
  }
  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabase;
}

async function ensureAudioBucket(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  if (!audioBucketReady) {
    audioBucketReady = (async () => {
      const bucket = env.MOTIVATION_AUDIO_BUCKET;
      const { data, error } = await client.storage.listBuckets();
      if (error) {
        throw new AppError(500, 'STORAGE_ERROR', 'Could not list storage buckets', error.message);
      }
      const exists = data?.some((item) => item.name === bucket);
      if (!exists) {
        const created = await client.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: env.MOTIVATION_AUDIO_MAX_BYTES,
          allowedMimeTypes: [
            'audio/mpeg',
            'audio/mp3',
            'audio/mp4',
            'audio/x-m4a',
            'audio/m4a',
            'audio/aac',
            'audio/x-aac',
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/ogg',
            'audio/vorbis',
            'application/ogg',
            'application/octet-stream',
          ],
        });
        if (created.error && !/already exists/i.test(created.error.message)) {
          throw new AppError(500, 'STORAGE_ERROR', 'Could not create audio storage bucket', created.error.message);
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
      const { data, error } = await client.storage.listBuckets();
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

export const storageService = {
  localUploadRoot: LOCAL_UPLOAD_ROOT,
  localMuscleUploadRoot: LOCAL_MUSCLE_UPLOAD_ROOT,

  async saveMotivationAudio(params: {
    userId: string;
    trackId: string;
    extension: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredAudioObject> {
    const storagePath = `${params.userId}/${params.trackId}.${params.extension}`;
    const client = getSupabase();

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
      const { data } = client.storage.from(env.MOTIVATION_AUDIO_BUCKET).getPublicUrl(storagePath);
      return {
        storagePath,
        publicUrl: data.publicUrl,
        provider: 'supabase',
      };
    }

    const absolute = path.join(LOCAL_UPLOAD_ROOT, storagePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.buffer);
    return {
      storagePath,
      publicUrl: `${publicApiBase()}/media/motivation-audio/${storagePath.split('/').map(encodeURIComponent).join('/')}`,
      provider: 'local',
    };
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
};
