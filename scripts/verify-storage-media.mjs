/**
 * Verify Storage migration: URL existence, HTTP reachability, MIME, size.
 * Does NOT delete BYTEA. Loads backend/.env.
 *
 *   npm run media:verify-storage
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL?.trim();
if (!DATABASE_URL) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: /supabase\.(co|com)/i.test(DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
});

const results = {
  checked: 0,
  ok: 0,
  missingUrl: 0,
  httpFail: [],
  okSamples: [],
};

function isStorageUrl(url) {
  return Boolean(url && /\/storage\/v1\/object\//i.test(url));
}

function stripBust(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete('v');
    return u.toString();
  } catch {
    return url;
  }
}

async function headCheck(label, url) {
  results.checked += 1;
  if (!url) {
    results.missingUrl += 1;
    results.httpFail.push({ label, url: null, reason: 'missing_url' });
    return;
  }
  const target = stripBust(url);
  try {
    const res = await fetch(target, { method: 'HEAD', redirect: 'follow' });
    const mime = res.headers.get('content-type') || '';
    const len = res.headers.get('content-length');
    const cache = res.headers.get('cache-control') || '';
    if (!res.ok) {
      results.httpFail.push({
        label,
        url: target,
        status: res.status,
        reason: res.status === 404 ? '404' : res.status === 403 ? '403' : `http_${res.status}`,
        storage: isStorageUrl(target),
      });
      return;
    }
    results.ok += 1;
    if (results.okSamples.length < 8) {
      results.okSamples.push({
        label,
        status: res.status,
        mime,
        bytes: len ? Number(len) : null,
        cache,
        storage: isStorageUrl(target),
      });
    }
  } catch (err) {
    results.httpFail.push({
      label,
      url: target,
      reason: 'network_error',
      error: err?.message || String(err),
      storage: isStorageUrl(target),
    });
  }
}

async function collect() {
  const rows = [];

  const covers = await pool.query(`
    SELECT machine_code, COALESCE(target_muscle_group,'') AS muscle,
           image_url, thumbnail_url, storage_path, thumbnail_storage_path,
           (image_data IS NOT NULL) AS has_bytea
    FROM machine_cover_images
  `);
  for (const r of covers.rows) {
    rows.push({
      kind: 'cover',
      id: `${r.machine_code}:${r.muscle || '_'}`,
      url: r.image_url,
      thumb: r.thumbnail_url,
      hasBytea: r.has_bytea,
      storagePath: r.storage_path,
    });
  }

  const muscle = await pool.query(`
    SELECT muscle_group, image_url, thumbnail_url, storage_path,
           (image_data IS NOT NULL) AS has_bytea
    FROM muscle_group_images
  `);
  for (const r of muscle.rows) {
    rows.push({
      kind: 'muscle',
      id: r.muscle_group,
      url: r.image_url,
      thumb: r.thumbnail_url,
      hasBytea: r.has_bytea,
      storagePath: r.storage_path,
    });
  }

  const brands = await pool.query(`
    SELECT brand_code, logo_url, image_url, logo_storage_path, image_storage_path,
           (logo_data IS NOT NULL OR image_data IS NOT NULL) AS has_bytea
    FROM brand_assets
  `);
  for (const r of brands.rows) {
    rows.push({
      kind: 'brand_logo',
      id: r.brand_code,
      url: r.logo_url,
      thumb: null,
      hasBytea: r.has_bytea,
      storagePath: r.logo_storage_path,
    });
    if (r.image_url) {
      rows.push({
        kind: 'brand_hero',
        id: r.brand_code,
        url: r.image_url,
        thumb: null,
        hasBytea: r.has_bytea,
        storagePath: r.image_storage_path,
      });
    }
  }

  try {
    const banners = await pool.query(`
      SELECT id, image_url, mobile_image_url, image_storage_path, mobile_image_storage_path
      FROM banners
      WHERE image_url IS NOT NULL OR mobile_image_url IS NOT NULL
    `);
    for (const r of banners.rows) {
      if (r.image_url) rows.push({ kind: 'banner', id: r.id, url: r.image_url, thumb: null });
      if (r.mobile_image_url) {
        rows.push({ kind: 'banner_mobile', id: r.id, url: r.mobile_image_url, thumb: null });
      }
    }
  } catch {
    /* table optional */
  }

  try {
    const notices = await pool.query(`
      SELECT id, public_url, storage_path FROM notice_attachments
      WHERE public_url IS NOT NULL OR storage_path IS NOT NULL
    `);
    for (const r of notices.rows) {
      rows.push({ kind: 'notice', id: r.id, url: r.public_url, thumb: null, storagePath: r.storage_path });
    }
  } catch {
    /* optional */
  }

  try {
    const mot = await pool.query(`
      SELECT id, cover_image_url FROM motivation_media
      WHERE cover_image_url IS NOT NULL
    `);
    for (const r of mot.rows) {
      rows.push({ kind: 'motivation_cover', id: r.id, url: r.cover_image_url, thumb: null });
    }
  } catch {
    /* optional */
  }

  for (const table of [
    ['photo_post_images', 'photo'],
    ['machine_trade_images', 'trade'],
    ['machine_showcase_images', 'showcase'],
    ['machine_request_images', 'request'],
  ]) {
    try {
      const ugc = await pool.query(`
        SELECT id, image_url, thumbnail_url, storage_path, thumbnail_storage_path,
               (image_data IS NOT NULL) AS has_bytea
        FROM ${table[0]}
      `);
      for (const r of ugc.rows) {
        rows.push({
          kind: table[1],
          id: r.id,
          url: r.image_url,
          thumb: r.thumbnail_url,
          hasBytea: r.has_bytea,
          storagePath: r.storage_path,
        });
      }
    } catch {
      /* optional */
    }
  }

  return rows;
}

async function probeApiMediaRedirect() {
  const samples = await pool.query(`
    SELECT machine_code FROM machine_cover_images
    WHERE image_url ILIKE '%/storage/%'
    LIMIT 3
  `);
  const probes = [];
  for (const r of samples.rows) {
    const apiUrl = `https://machinefit.onrender.com/api/v1/media/machine-covers/${encodeURIComponent(r.machine_code)}/main`;
    const t0 = Date.now();
    const res = await fetch(apiUrl, { method: 'GET', redirect: 'manual' });
    probes.push({
      machineCode: r.machine_code,
      apiStatus: res.status,
      location: res.headers.get('location'),
      ms: Date.now() - t0,
      is302: res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308,
    });
  }
  return probes;
}

async function probeDirectStorageLatency() {
  const samples = await pool.query(`
    SELECT machine_code, image_url FROM machine_cover_images
    WHERE image_url ILIKE '%/storage/%'
    LIMIT 5
  `);
  const out = [];
  for (const r of samples.rows) {
    const url = stripBust(r.image_url);
    const t0 = Date.now();
    const res = await fetch(url, { method: 'HEAD' });
    out.push({
      machineCode: r.machine_code,
      status: res.status,
      ms: Date.now() - t0,
      bytes: res.headers.get('content-length'),
      cache: res.headers.get('cache-control'),
    });
  }
  return out;
}

async function summaryCounts() {
  return {
    covers: {
      total: Number((await pool.query('select count(*)::int c from machine_cover_images')).rows[0].c),
      storageUrl: Number(
        (
          await pool.query(
            `select count(*)::int c from machine_cover_images where image_url ilike '%/storage/%'`
          )
        ).rows[0].c
      ),
      byteaStillPresent: Number(
        (
          await pool.query(
            'select count(*)::int c from machine_cover_images where image_data is not null'
          )
        ).rows[0].c
      ),
      apiMediaUrl: Number(
        (
          await pool.query(
            `select count(*)::int c from machine_cover_images where image_url ilike '%/media/machine-covers/%'`
          )
        ).rows[0].c
      ),
    },
    muscle: {
      total: Number((await pool.query('select count(*)::int c from muscle_group_images')).rows[0].c),
      storageUrl: Number(
        (
          await pool.query(
            `select count(*)::int c from muscle_group_images where image_url ilike '%/storage/%'`
          )
        ).rows[0].c
      ),
      byteaStillPresent: Number(
        (
          await pool.query(
            'select count(*)::int c from muscle_group_images where image_data is not null'
          )
        ).rows[0].c
      ),
    },
    migrationLog: (
      await pool.query(`
        SELECT status, count(*)::int AS c
        FROM media_storage_migration_log
        GROUP BY status
        ORDER BY status
      `)
    ).rows,
  };
}

async function main() {
  const counts = await summaryCounts();
  const rows = await collect();

  for (const row of rows) {
    if (row.url) await headCheck(`${row.kind}:${row.id}:main`, row.url);
    if (row.thumb) await headCheck(`${row.kind}:${row.id}:thumb`, row.thumb);
  }

  const redirects = await probeApiMediaRedirect();
  const storageLatency = await probeDirectStorageLatency();

  const report = {
    migrationClaim: { ok: 30, skip: 94, fail: 0, total: 124 },
    counts,
    http: {
      checked: results.checked,
      ok: results.ok,
      missingUrl: results.missingUrl,
      failCount: results.httpFail.length,
      fails: results.httpFail,
      okSamples: results.okSamples,
    },
    api302: redirects,
    storageHeadLatencyMs: storageLatency,
  };

  console.log(JSON.stringify(report, null, 2));
  await pool.end();

  if (results.httpFail.length > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
