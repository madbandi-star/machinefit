/**
 * Idempotent BYTEA → Supabase Storage migrator.
 *
 * Does NOT delete BYTEA. Writes storage_path + public URLs, logs to media_storage_migration_log.
 *
 * Usage (from repo root; loads backend/.env automatically):
 *   npm run media:migrate-storage
 *   npm run media:migrate-storage:dry
 *   node --import tsx scripts/migrate-bytea-to-storage.mjs --dry-run
 *   node --import tsx scripts/migrate-bytea-to-storage.mjs --kinds=covers,muscle,brands
 *
 * PowerShell env alternative:
 *   $env:DRY_RUN="1"; npm run media:migrate-storage
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, 'backend', '.env') });
dotenv.config({ path: path.join(root, '.env') });

function argFlag(name) {
  return process.argv.includes(name);
}
function argValue(prefix) {
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

const DRY_RUN =
  argFlag('--dry-run') ||
  process.env.DRY_RUN === '1' ||
  process.env.DRY_RUN === 'true';
const kindsArg = argValue('--kinds=') || process.env.KINDS;
const KINDS = new Set(
  (kindsArg || 'covers,muscle,brands,standard,gallery,photo,trade,showcase,request')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

function readEnv(name) {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  return raw.replace(/^["']|["']$/g, '').trim();
}

const DATABASE_URL = readEnv('DATABASE_URL');
const SUPABASE_URL = readEnv('SUPABASE_URL');
const SUPABASE_KEY = readEnv('SUPABASE_SERVICE_ROLE_KEY');

const BUCKETS = {
  covers: process.env.MACHINE_COVER_IMAGE_BUCKET || 'machine-cover-images',
  muscle: process.env.MUSCLE_GROUP_IMAGE_BUCKET || 'muscle-group-images',
  brands: process.env.BRAND_ASSET_IMAGE_BUCKET || 'brand-assets',
  standard: process.env.MACHINE_COVER_IMAGE_BUCKET || 'machine-cover-images',
  gallery: process.env.MACHINE_COVER_IMAGE_BUCKET || 'machine-cover-images',
  ugc: process.env.UGC_IMAGE_BUCKET || 'ugc-images',
};

function looksLikeJwt(key) {
  // Real Supabase keys are JWTs: header.payload.sig
  return Boolean(key && key.split('.').length === 3 && key.length > 80);
}

function isPlaceholder(value) {
  return !value || /^(your-|changeme|xxx|placeholder)/i.test(value);
}

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required (set env or put it in backend/.env)');
  process.exit(1);
}

if (!DRY_RUN) {
  if (!SUPABASE_URL || isPlaceholder(SUPABASE_URL)) {
    console.error(
      'SUPABASE_URL is missing or still a placeholder in backend/.env\n' +
        '  → Supabase Dashboard → Project Settings → API → Project URL'
    );
    process.exit(1);
  }
  if (!SUPABASE_KEY || isPlaceholder(SUPABASE_KEY) || !looksLikeJwt(SUPABASE_KEY)) {
    console.error(
      'SUPABASE_SERVICE_ROLE_KEY is missing, placeholder, or not a JWT.\n' +
        '  Current key length: ' +
        (SUPABASE_KEY?.length ?? 0) +
        ' (real service_role keys are long JWTs with 2 dots).\n' +
        '  → Supabase Dashboard → Project Settings → API → service_role (secret)\n' +
        '  Paste into backend/.env as SUPABASE_SERVICE_ROLE_KEY=eyJ...\n' +
        '  Do NOT use anon key or the placeholder your-service-role-key.'
    );
    process.exit(1);
  }
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: /supabase\.(co|com)/i.test(DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
});

const supabase =
  !DRY_RUN && SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const stats = { ok: 0, skip: 0, fail: 0 };

function extFromMime(mime) {
  if (/png/i.test(mime)) return 'png';
  if (/svg/i.test(mime)) return 'svg';
  if (/jpe?g/i.test(mime)) return 'jpg';
  return 'webp';
}

function isDirectUrl(url) {
  return Boolean(url && /supabase\.(co|in)\/storage\//i.test(url));
}

async function ensureBucket(name, isPublic) {
  if (DRY_RUN || !supabase) return;
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    const msg = error.message || String(error);
    if (/Invalid Compact JWS|Invalid JWT|JWT/i.test(msg)) {
      throw new Error(
        `Storage auth failed (${msg}). Fix SUPABASE_SERVICE_ROLE_KEY in backend/.env ` +
          '(use the service_role secret JWT from Supabase → Settings → API).'
      );
    }
    throw error;
  }
  if (data?.some((b) => b.name === name)) return;
  const created = await supabase.storage.createBucket(name, {
    public: isPublic,
    fileSizeLimit: 10 * 1024 * 1024,
  });
  if (created.error && !/already exists/i.test(created.error.message)) {
    throw created.error;
  }
}

async function logRow(row) {
  // Never mark dry-run as ok — that would cause real runs to skip without uploading.
  if (DRY_RUN) return;
  await pool.query(
    `INSERT INTO media_storage_migration_log
       (media_kind, source_table, source_id, variant, storage_bucket, storage_path, public_url, status, error_message, bytes, mime_type, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
     ON CONFLICT (source_table, source_id, variant) DO UPDATE SET
       storage_bucket = EXCLUDED.storage_bucket,
       storage_path = EXCLUDED.storage_path,
       public_url = EXCLUDED.public_url,
       status = EXCLUDED.status,
       error_message = EXCLUDED.error_message,
       bytes = EXCLUDED.bytes,
       mime_type = EXCLUDED.mime_type,
       updated_at = NOW()`,
    [
      row.mediaKind,
      row.sourceTable,
      row.sourceId,
      row.variant,
      row.bucket,
      row.storagePath,
      row.publicUrl,
      row.status,
      row.error ?? null,
      row.bytes ?? null,
      row.mime ?? null,
    ]
  );
}

async function uploadPublic(bucket, storagePath, buffer, mime) {
  if (DRY_RUN) {
    return `https://example.invalid/${bucket}/${storagePath}`;
  }
  if (!supabase) throw new Error('Supabase client not configured');
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: mime || 'image/webp',
    upsert: true,
    cacheControl: '31536000',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadPrivate(bucket, storagePath, buffer, mime) {
  if (DRY_RUN) {
    return `https://example.invalid/signed/${bucket}/${storagePath}`;
  }
  if (!supabase) throw new Error('Supabase client not configured');
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: mime || 'image/webp',
    upsert: true,
    cacheControl: '86400',
  });
  if (error) throw error;
  const signed = await supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 60 * 24 * 7);
  return signed.data?.signedUrl || storagePath;
}

async function clearBogusDryRunLogs() {
  const result = await pool.query(
    `DELETE FROM media_storage_migration_log
     WHERE status = 'ok'
       AND (
         public_url ILIKE '%example.invalid%'
         OR public_url IS NULL
         OR public_url NOT ILIKE '%/storage/%'
       )`
  );
  return result.rowCount ?? 0;
}

async function alreadyDone(sourceTable, sourceId, variant) {
  const r = await pool.query(
    `SELECT status, public_url FROM media_storage_migration_log
     WHERE source_table = $1 AND source_id = $2 AND variant = $3 AND status = 'ok'
     LIMIT 1`,
    [sourceTable, sourceId, variant]
  );
  const row = r.rows[0];
  if (!row) return false;
  // Ignore dry-run / fake URLs that never hit Storage.
  if (!row.public_url || /example\.invalid/i.test(row.public_url)) return false;
  if (!/supabase\.(co|in)\/storage\//i.test(row.public_url) && !/\/storage\/v1\/object\//i.test(row.public_url)) {
    return false;
  }
  return true;
}

async function migrateCovers() {
  await ensureBucket(BUCKETS.covers, true);
  const { rows } = await pool.query(`
    SELECT machine_code, COALESCE(target_muscle_group, '') AS muscle,
           version, mime_type, image_data, thumbnail_data,
           storage_path, thumbnail_storage_path, image_url, thumbnail_url
    FROM machine_cover_images
    WHERE image_data IS NOT NULL OR thumbnail_data IS NOT NULL
  `);
  for (const row of rows) {
    const base = row.muscle ? `${row.machine_code}__${row.muscle}` : row.machine_code;
    for (const variant of ['main', 'thumb']) {
      const blob = variant === 'main' ? row.image_data : row.thumbnail_data;
      if (!blob) continue;
      const sourceId = `${row.machine_code}:${row.muscle || '_'}`;
      if (await alreadyDone('machine_cover_images', sourceId, variant)) {
        stats.skip += 1;
        continue;
      }
      const existingPath = variant === 'main' ? row.storage_path : row.thumbnail_storage_path;
      const existingUrl = variant === 'main' ? row.image_url : row.thumbnail_url;
      if (existingPath && !String(existingPath).startsWith('db:') && isDirectUrl(existingUrl)) {
        stats.skip += 1;
        continue;
      }
      const mime = row.mime_type || 'image/webp';
      const storagePath = `${base}/${variant}-v${row.version || 1}.${extFromMime(mime)}`;
      try {
        const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
        const publicUrl = await uploadPublic(BUCKETS.covers, storagePath, buf, mime);
        if (!DRY_RUN) {
          if (variant === 'main') {
            await pool.query(
              `UPDATE machine_cover_images
               SET storage_path = $1, image_url = $2, updated_at = NOW()
               WHERE machine_code = $3
                 AND COALESCE(target_muscle_group, '') = $4`,
              [storagePath, publicUrl, row.machine_code, row.muscle]
            );
          } else {
            await pool.query(
              `UPDATE machine_cover_images
               SET thumbnail_storage_path = $1, thumbnail_url = $2, updated_at = NOW()
               WHERE machine_code = $3
                 AND COALESCE(target_muscle_group, '') = $4`,
              [storagePath, publicUrl, row.machine_code, row.muscle]
            );
          }
        }
        await logRow({
          mediaKind: 'machine_cover',
          sourceTable: 'machine_cover_images',
          sourceId,
          variant,
          bucket: BUCKETS.covers,
          storagePath,
          publicUrl,
          status: 'ok',
          bytes: buf.length,
          mime,
        });
        stats.ok += 1;
        console.log(`[ok] cover ${sourceId}/${variant}`);
      } catch (err) {
        stats.fail += 1;
        await logRow({
          mediaKind: 'machine_cover',
          sourceTable: 'machine_cover_images',
          sourceId,
          variant,
          bucket: BUCKETS.covers,
          storagePath: null,
          publicUrl: null,
          status: 'failed',
          error: err?.message || String(err),
        });
        console.error(`[fail] cover ${sourceId}/${variant}`, err?.message || err);
      }
    }
  }
}

async function migrateMuscle() {
  await ensureBucket(BUCKETS.muscle, true);
  const { rows } = await pool.query(`
    SELECT muscle_group, version, mime_type, image_data, thumbnail_data,
           storage_path, thumbnail_storage_path, image_url, thumbnail_url
    FROM muscle_group_images
    WHERE image_data IS NOT NULL OR thumbnail_data IS NOT NULL
  `);
  for (const row of rows) {
    for (const variant of ['main', 'thumb']) {
      const blob = variant === 'main' ? row.image_data : row.thumbnail_data;
      if (!blob) continue;
      if (await alreadyDone('muscle_group_images', row.muscle_group, variant)) {
        stats.skip += 1;
        continue;
      }
      const mime = row.mime_type || 'image/webp';
      const storagePath = `${row.muscle_group}/${variant}-v${row.version || 1}.${extFromMime(mime)}`;
      try {
        const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
        const publicUrl = await uploadPublic(BUCKETS.muscle, storagePath, buf, mime);
        if (!DRY_RUN) {
          if (variant === 'main') {
            await pool.query(
              `UPDATE muscle_group_images SET storage_path = $1, image_url = $2, updated_at = NOW()
               WHERE muscle_group = $3`,
              [storagePath, publicUrl, row.muscle_group]
            );
          } else {
            await pool.query(
              `UPDATE muscle_group_images
               SET thumbnail_storage_path = $1, thumbnail_url = $2, updated_at = NOW()
               WHERE muscle_group = $3`,
              [storagePath, publicUrl, row.muscle_group]
            );
          }
        }
        await logRow({
          mediaKind: 'muscle_group',
          sourceTable: 'muscle_group_images',
          sourceId: row.muscle_group,
          variant,
          bucket: BUCKETS.muscle,
          storagePath,
          publicUrl,
          status: 'ok',
          bytes: buf.length,
          mime,
        });
        stats.ok += 1;
      } catch (err) {
        stats.fail += 1;
        await logRow({
          mediaKind: 'muscle_group',
          sourceTable: 'muscle_group_images',
          sourceId: row.muscle_group,
          variant,
          bucket: BUCKETS.muscle,
          storagePath: null,
          publicUrl: null,
          status: 'failed',
          error: err?.message || String(err),
        });
      }
    }
  }
}

async function migrateBrands() {
  await ensureBucket(BUCKETS.brands, true);
  const { rows } = await pool.query(`
    SELECT brand_code, logo_data, image_data, logo_mime_type, image_mime_type,
           logo_version, image_version, logo_url, image_url,
           logo_storage_path, image_storage_path
    FROM brand_assets
    WHERE logo_data IS NOT NULL OR image_data IS NOT NULL
  `);
  for (const row of rows) {
    for (const kind of ['logo', 'hero']) {
      const blob = kind === 'logo' ? row.logo_data : row.image_data;
      if (!blob) continue;
      const variant = kind;
      if (await alreadyDone('brand_assets', row.brand_code, variant)) {
        stats.skip += 1;
        continue;
      }
      const mime = (kind === 'logo' ? row.logo_mime_type : row.image_mime_type) || 'image/webp';
      const version = (kind === 'logo' ? row.logo_version : row.image_version) || 1;
      const storagePath = `${row.brand_code}/${kind}-v${version}.${extFromMime(mime)}`;
      try {
        const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
        const publicUrl = await uploadPublic(BUCKETS.brands, storagePath, buf, mime);
        if (!DRY_RUN) {
          if (kind === 'logo') {
            await pool.query(
              `UPDATE brand_assets SET logo_storage_path = $1, logo_url = $2, updated_at = NOW()
               WHERE brand_code = $3`,
              [storagePath, publicUrl, row.brand_code]
            );
          } else {
            await pool.query(
              `UPDATE brand_assets SET image_storage_path = $1, image_url = $2, updated_at = NOW()
               WHERE brand_code = $3`,
              [storagePath, publicUrl, row.brand_code]
            );
          }
        }
        await logRow({
          mediaKind: 'brand_asset',
          sourceTable: 'brand_assets',
          sourceId: row.brand_code,
          variant,
          bucket: BUCKETS.brands,
          storagePath,
          publicUrl,
          status: 'ok',
          bytes: buf.length,
          mime,
        });
        stats.ok += 1;
      } catch (err) {
        stats.fail += 1;
        await logRow({
          mediaKind: 'brand_asset',
          sourceTable: 'brand_assets',
          sourceId: row.brand_code,
          variant,
          bucket: BUCKETS.brands,
          storagePath: null,
          publicUrl: null,
          status: 'failed',
          error: err?.message || String(err),
        });
      }
    }
  }
}

async function migrateUgcTable(table, kind) {
  await ensureBucket(BUCKETS.ugc, false);
  const hasCols = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = 'storage_path' LIMIT 1`,
    [table]
  );
  if (!hasCols.rows[0]) {
    console.warn(`[skip] ${table} missing storage_path (run migration 152 first)`);
    return;
  }
  const { rows } = await pool.query(
    `SELECT id, mime_type, image_data, thumbnail_data, storage_path, thumbnail_storage_path,
            COALESCE(version, 1) AS version
     FROM ${table}
     WHERE image_data IS NOT NULL OR thumbnail_data IS NOT NULL`
  );
  for (const row of rows) {
    for (const variant of ['main', 'thumb']) {
      const blob = variant === 'main' ? row.image_data : row.thumbnail_data;
      if (!blob) continue;
      if (await alreadyDone(table, row.id, variant)) {
        stats.skip += 1;
        continue;
      }
      const mime = row.mime_type || 'image/webp';
      const storagePath = `${kind}/${row.id}/${variant}-v${row.version}.${extFromMime(mime)}`;
      try {
        const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
        const publicUrl = await uploadPrivate(BUCKETS.ugc, storagePath, buf, mime);
        if (!DRY_RUN) {
          if (variant === 'main') {
            await pool.query(
              `UPDATE ${table}
               SET storage_path = $1, image_url = $2, updated_at = NOW()
               WHERE id = $3`,
              [storagePath, publicUrl, row.id]
            );
          } else {
            await pool.query(
              `UPDATE ${table}
               SET thumbnail_storage_path = $1, thumbnail_url = $2, updated_at = NOW()
               WHERE id = $3`,
              [storagePath, publicUrl, row.id]
            );
          }
        }
        await logRow({
          mediaKind: kind,
          sourceTable: table,
          sourceId: row.id,
          variant,
          bucket: BUCKETS.ugc,
          storagePath,
          publicUrl,
          status: 'ok',
          bytes: buf.length,
          mime,
        });
        stats.ok += 1;
      } catch (err) {
        stats.fail += 1;
        await logRow({
          mediaKind: kind,
          sourceTable: table,
          sourceId: row.id,
          variant,
          bucket: BUCKETS.ugc,
          storagePath: null,
          publicUrl: null,
          status: 'failed',
          error: err?.message || String(err),
        });
      }
    }
  }
}

async function main() {
  if (process.env.DRY_RUN && !argFlag('--dry-run')) {
    console.warn(
      'Note: DRY_RUN is set in the shell environment. Clear it in PowerShell with:\n' +
        '  Remove-Item Env:DRY_RUN\n' +
        'Or use: npm run media:migrate-storage:dry'
    );
  }
  console.log(`BYTEA→Storage migrator DRY_RUN=${DRY_RUN} kinds=${[...KINDS].join(',')}`);
  if (!DRY_RUN) {
    const cleared = await clearBogusDryRunLogs();
    if (cleared > 0) {
      console.log(`Cleared ${cleared} bogus dry-run log row(s) before real upload.`);
    }
  }
  if (KINDS.has('covers')) await migrateCovers();
  if (KINDS.has('muscle')) await migrateMuscle();
  if (KINDS.has('brands')) await migrateBrands();
  if (KINDS.has('photo')) await migrateUgcTable('photo_post_images', 'photo');
  if (KINDS.has('trade')) await migrateUgcTable('machine_trade_images', 'trade');
  if (KINDS.has('showcase')) await migrateUgcTable('machine_showcase_images', 'showcase');
  if (KINDS.has('request')) await migrateUgcTable('machine_request_images', 'request');
  console.log(JSON.stringify({ ...stats, dryRun: DRY_RUN }, null, 2));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
