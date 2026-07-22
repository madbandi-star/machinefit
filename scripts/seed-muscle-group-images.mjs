/**
 * Seed admin muscle-group cover images from frontend bundled PNGs into Postgres.
 * Uses the same resize/thumbnail pipeline as the admin upload API.
 *
 * Usage: node scripts/seed-muscle-group-images.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'frontend/src/assets/muscle-groups');

const GROUPS = [
  'back',
  'chest',
  'legs',
  'shoulders',
  'biceps',
  'triceps',
  'arms',
  'core',
];

function publicApiBase() {
  if (process.env.PUBLIC_API_BASE_URL?.trim()) {
    return process.env.PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://machinefit-api.onrender.com/api/v1';
  }
  return 'https://machinefit-api.onrender.com/api/v1';
}

async function processImage(input) {
  const mainBuffer = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const mainMeta = await sharp(mainBuffer).metadata();
  const thumbBuffer = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: 256, height: 256, fit: 'cover', position: 'centre' })
    .webp({ quality: 78 })
    .toBuffer();
  return {
    main: {
      buffer: mainBuffer,
      mimeType: 'image/webp',
      width: mainMeta.width ?? 1024,
      height: mainMeta.height ?? 1024,
      fileSizeBytes: mainBuffer.byteLength,
    },
    thumbnail: { buffer: thumbBuffer },
  };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  const base = publicApiBase();

  try {
    for (const group of GROUPS) {
      const filePath = path.join(assetsDir, `muscle-${group}.png`);
      const original = await readFile(filePath);
      const processed = await processImage(original);
      const existing = await client.query(
        `SELECT version FROM muscle_group_images WHERE muscle_group = $1`,
        [group]
      );
      const nextVersion = Number(existing.rows[0]?.version ?? 0) + 1;
      // Store clean URLs; API layer appends ?v= for cache busting.
      const imageUrl = `${base}/media/muscle-group-images/${group}/main`;
      const thumbnailUrl = `${base}/media/muscle-group-images/${group}/thumb`;

      await client.query(
        `INSERT INTO muscle_group_images (
           muscle_group, image_url, thumbnail_url, storage_path, thumbnail_storage_path,
           original_filename, mime_type, file_size_bytes, width, height, version,
           image_data, thumbnail_data, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9, $10, $11,
           $12, $13, NOW(), NOW()
         )
         ON CONFLICT (muscle_group) DO UPDATE SET
           image_url = EXCLUDED.image_url,
           thumbnail_url = EXCLUDED.thumbnail_url,
           storage_path = EXCLUDED.storage_path,
           thumbnail_storage_path = EXCLUDED.thumbnail_storage_path,
           original_filename = EXCLUDED.original_filename,
           mime_type = EXCLUDED.mime_type,
           file_size_bytes = EXCLUDED.file_size_bytes,
           width = EXCLUDED.width,
           height = EXCLUDED.height,
           version = EXCLUDED.version,
           image_data = EXCLUDED.image_data,
           thumbnail_data = EXCLUDED.thumbnail_data,
           updated_at = NOW()`,
        [
          group,
          imageUrl,
          thumbnailUrl,
          `db:${group}/main`,
          `db:${group}/thumb`,
          `muscle-${group}.png`,
          processed.main.mimeType,
          processed.main.fileSizeBytes,
          processed.main.width,
          processed.main.height,
          nextVersion,
          processed.main.buffer,
          processed.thumbnail.buffer,
        ]
      );
      console.log(`seeded ${group} v${nextVersion} (${processed.main.width}x${processed.main.height})`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
