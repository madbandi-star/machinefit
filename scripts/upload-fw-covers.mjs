/**
 * Free Weight ONLY — stage ~300KB covers and upload via machineCoverImageService.
 *
 * Usage (repo root):
 *   node --import tsx scripts/upload-fw-covers.mjs
 *   node --import tsx scripts/upload-fw-covers.mjs --dry-run
 *   node --import tsx scripts/upload-fw-covers.mjs --stage-only
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import sharp from 'sharp';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, 'backend', '.env') });
dotenv.config({ path: path.join(root, '.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const STAGE_ONLY = process.argv.includes('--stage-only');

const SRC =
  'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/after_change_300kb';
const NEW_ASSETS =
  'C:/Users/Human/.cursor/projects/c-Users-Human-Desktop-project-1-machinefit/assets';
const STAGING =
  'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/fw_covers_staging';

const TARGET_BYTES = 300 * 1024;
const MIN_BYTES = 220 * 1024;
const MAX_BYTES = 380 * 1024;

/** @type {Array<{machineCode:string, targetMuscle:string|null, source:string, origin:'existing'|'new', label:string}>} */
const SLOTS = [
  // Barbell
  { machineCode: 'FW_BARBELL', targetMuscle: null, source: path.join(SRC, 'mf_39_barbell_deadlift_after_change_300kb.png'), origin: 'existing', label: '대표' },
  { machineCode: 'FW_BARBELL', targetMuscle: 'back', source: path.join(SRC, 'mf_36_barbell_bent_over_row_after_change_300kb.png'), origin: 'existing', label: '등' },
  { machineCode: 'FW_BARBELL', targetMuscle: 'chest', source: path.join(SRC, 'mf_14_barbell_bench_press_after_change_300kb.png'), origin: 'existing', label: '가슴' },
  { machineCode: 'FW_BARBELL', targetMuscle: 'legs', source: path.join(SRC, 'mf_11_barbell_back_squat_after_change_300kb.png'), origin: 'existing', label: '하체' },
  { machineCode: 'FW_BARBELL', targetMuscle: 'shoulders', source: path.join(SRC, 'mf_17_barbell_overhead_press_after_change_300kb.png'), origin: 'existing', label: '어깨' },
  { machineCode: 'FW_BARBELL', targetMuscle: 'biceps', source: path.join(SRC, 'mf_05_barbell_bicep_curl_after_change_300kb.png'), origin: 'existing', label: '이두' },
  { machineCode: 'FW_BARBELL', targetMuscle: 'triceps', source: path.join(SRC, 'mf_46_barbell_skullcrusher_after_change_300kb.png'), origin: 'existing', label: '삼두' },
  { machineCode: 'FW_BARBELL', targetMuscle: 'arms', source: path.join(NEW_ASSETS, 'fw_new_barbell_arms_reverse_curl.png'), origin: 'new', label: '팔' },
  { machineCode: 'FW_BARBELL', targetMuscle: 'core', source: path.join(SRC, 'mf_31_barbell_ab_rollout_after_change_300kb.png'), origin: 'existing', label: '코어' },

  // Cable
  { machineCode: 'FW_CABLE', targetMuscle: null, source: path.join(SRC, 'mf_12_lat_pulldown_after_change_300kb.png'), origin: 'existing', label: '대표' },
  { machineCode: 'FW_CABLE', targetMuscle: 'back', source: path.join(SRC, 'mf_13_seated_cable_row_after_change_300kb.png'), origin: 'existing', label: '등' },
  { machineCode: 'FW_CABLE', targetMuscle: 'chest', source: path.join(SRC, 'mf_09_cable_chest_fly_after_change_300kb.png'), origin: 'existing', label: '가슴' },
  { machineCode: 'FW_CABLE', targetMuscle: 'legs', source: path.join(NEW_ASSETS, 'fw_new_cable_legs_kickback.png'), origin: 'new', label: '하체' },
  { machineCode: 'FW_CABLE', targetMuscle: 'shoulders', source: path.join(SRC, 'mf_23_cable_lateral_raise_after_change_300kb.png'), origin: 'existing', label: '어깨' },
  { machineCode: 'FW_CABLE', targetMuscle: 'biceps', source: path.join(SRC, 'mf_24_cable_bicep_curl_after_change_300kb.png'), origin: 'existing', label: '이두' },
  { machineCode: 'FW_CABLE', targetMuscle: 'triceps', source: path.join(SRC, 'mf_06_cable_tricep_rope_pushdown_after_change_300kb.png'), origin: 'existing', label: '삼두' },
  { machineCode: 'FW_CABLE', targetMuscle: 'arms', source: path.join(NEW_ASSETS, 'fw_new_cable_arms_reverse_curl.png'), origin: 'new', label: '팔' },
  { machineCode: 'FW_CABLE', targetMuscle: 'core', source: path.join(SRC, 'mf_44_cable_crunch_after_change_300kb.png'), origin: 'existing', label: '코어' },

  // Dumbbell
  { machineCode: 'FW_DUMBBELL', targetMuscle: null, source: path.join(SRC, 'mf_08_seated_dumbbell_shoulder_press_after_change_300kb.png'), origin: 'existing', label: '대표' },
  { machineCode: 'FW_DUMBBELL', targetMuscle: 'back', source: path.join(SRC, 'mf_07_one_arm_dumbbell_row_after_change_300kb.png'), origin: 'existing', label: '등' },
  { machineCode: 'FW_DUMBBELL', targetMuscle: 'chest', source: path.join(SRC, 'mf_51_dumbbell_flat_bench_press_after_change_300kb.png'), origin: 'existing', label: '가슴' },
  { machineCode: 'FW_DUMBBELL', targetMuscle: 'legs', source: path.join(SRC, 'mf_50_dumbbell_goblet_squat_after_change_300kb.png'), origin: 'existing', label: '하체' },
  { machineCode: 'FW_DUMBBELL', targetMuscle: 'shoulders', source: path.join(SRC, 'mf_16_dumbbell_lateral_raise_after_change_300kb.png'), origin: 'existing', label: '어깨' },
  { machineCode: 'FW_DUMBBELL', targetMuscle: 'biceps', source: path.join(SRC, 'mf_32_dumbbell_concentration_curl_after_change_300kb.png'), origin: 'existing', label: '이두' },
  { machineCode: 'FW_DUMBBELL', targetMuscle: 'triceps', source: path.join(SRC, 'mf_40_dumbbell_seated_overhead_tricep_extension_after_change_300kb.png'), origin: 'existing', label: '삼두' },
  { machineCode: 'FW_DUMBBELL', targetMuscle: 'arms', source: path.join(SRC, 'mf_42_standing_dumbbell_hammer_curl_after_change_300kb.png'), origin: 'existing', label: '팔' },
  { machineCode: 'FW_DUMBBELL', targetMuscle: 'core', source: path.join(NEW_ASSETS, 'fw_new_dumbbell_core_russian_twist.png'), origin: 'new', label: '코어' },

  // Kettlebell
  { machineCode: 'FW_KETTLEBELL', targetMuscle: null, source: path.join(SRC, 'mf_04_kettlebell_swing_after_change_300kb.png'), origin: 'existing', label: '대표' },
  { machineCode: 'FW_KETTLEBELL', targetMuscle: 'back', source: path.join(NEW_ASSETS, 'fw_new_kettlebell_back_row.png'), origin: 'new', label: '등' },
  { machineCode: 'FW_KETTLEBELL', targetMuscle: 'chest', source: path.join(NEW_ASSETS, 'fw_new_kettlebell_chest_floor_press.png'), origin: 'new', label: '가슴' },
  { machineCode: 'FW_KETTLEBELL', targetMuscle: 'legs', source: path.join(SRC, 'mf_52_kettlebell_sumo_deadlift_after_change_300kb.png'), origin: 'existing', label: '하체' },
  { machineCode: 'FW_KETTLEBELL', targetMuscle: 'shoulders', source: path.join(SRC, 'mf_17_seated_kettlebell_press_after_change_300kb.png'), origin: 'existing', label: '어깨' },
  { machineCode: 'FW_KETTLEBELL', targetMuscle: 'biceps', source: path.join(NEW_ASSETS, 'fw_new_kettlebell_biceps_curl.png'), origin: 'new', label: '이두' },
  { machineCode: 'FW_KETTLEBELL', targetMuscle: 'triceps', source: path.join(SRC, 'mf_37_standing_kettlebell_triceps_ext_after_change_300kb.png'), origin: 'existing', label: '삼두' },
  { machineCode: 'FW_KETTLEBELL', targetMuscle: 'arms', source: path.join(NEW_ASSETS, 'fw_new_kettlebell_arms_farmer.png'), origin: 'new', label: '팔' },
  { machineCode: 'FW_KETTLEBELL', targetMuscle: 'core', source: path.join(NEW_ASSETS, 'fw_new_kettlebell_core_windmill.png'), origin: 'new', label: '코어' },

  // Smith — hero shows machine clearly (squat); body slots unique
  { machineCode: 'FW_SMITH', targetMuscle: null, source: path.join(SRC, 'mf_33_smith_machine_back_squat_after_change_300kb.png'), origin: 'existing', label: '대표' },
  { machineCode: 'FW_SMITH', targetMuscle: 'back', source: path.join(NEW_ASSETS, 'fw_new_smith_back_row.png'), origin: 'new', label: '등' },
  { machineCode: 'FW_SMITH', targetMuscle: 'chest', source: path.join(SRC, 'mf_10_smith_flat_bench_press_after_change_300kb.png'), origin: 'existing', label: '가슴' },
  { machineCode: 'FW_SMITH', targetMuscle: 'legs', source: path.join(NEW_ASSETS, 'fw_new_smith_legs_lunge.png'), origin: 'new', label: '하체' },
  { machineCode: 'FW_SMITH', targetMuscle: 'shoulders', source: path.join(SRC, 'mf_16_smith_seated_shoulder_press_after_change_300kb.png'), origin: 'existing', label: '어깨' },
  { machineCode: 'FW_SMITH', targetMuscle: 'biceps', source: path.join(NEW_ASSETS, 'fw_new_smith_biceps_curl.png'), origin: 'new', label: '이두' },
  { machineCode: 'FW_SMITH', targetMuscle: 'triceps', source: path.join(SRC, 'mf_02_smith_close_grip_bench_after_change_300kb.png'), origin: 'existing', label: '삼두' },
  { machineCode: 'FW_SMITH', targetMuscle: 'arms', source: path.join(NEW_ASSETS, 'fw_new_smith_arms_reverse_curl.png'), origin: 'new', label: '팔' },
  { machineCode: 'FW_SMITH', targetMuscle: 'core', source: path.join(NEW_ASSETS, 'fw_new_smith_core_situp.png'), origin: 'new', label: '코어' },
];

function slotKey(machineCode, targetMuscle) {
  return `${machineCode}__${targetMuscle ?? 'DEFAULT'}`;
}

function stagedName(machineCode, targetMuscle) {
  return `${slotKey(machineCode, targetMuscle)}.webp`;
}

async function optimizeToWebp(inputPath, outputPath) {
  let quality = 82;
  let best = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const buf = await sharp(inputPath)
      .rotate()
      .resize(1024, 1024, { fit: 'cover', position: 'centre' })
      .webp({ quality, effort: 6 })
      .toBuffer();
    best = buf;
    if (buf.length > MAX_BYTES) {
      quality = Math.max(55, quality - 6);
      continue;
    }
    if (buf.length < MIN_BYTES && quality < 92) {
      quality = Math.min(92, quality + 4);
      continue;
    }
    break;
  }
  fs.writeFileSync(outputPath, best);
  return { bytes: best.length, quality };
}

async function snapshotNonFw(client) {
  const count = await client.query(
    `SELECT count(*)::int AS c FROM machine_cover_images WHERE machine_code NOT LIKE 'FW_%'`
  );
  const brands = await client.query(`SELECT code FROM brands ORDER BY code`);
  const machines = await client.query(
    `SELECT count(*)::int AS c FROM machines m JOIN brands b ON b.id=m.brand_id WHERE b.code <> 'FREE_WEIGHT'`
  );
  const fwMachines = await client.query(
    `SELECT count(*)::int AS c FROM machines m JOIN brands b ON b.id=m.brand_id WHERE b.code = 'FREE_WEIGHT'`
  );
  const digests = await client.query(`
    SELECT machine_code, target_muscle_group, version,
           md5(COALESCE(image_url,'') || '|' || COALESCE(storage_path,'')) AS dig
    FROM machine_cover_images
    WHERE machine_code NOT LIKE 'FW_%'
    ORDER BY machine_code, target_muscle_group NULLS FIRST
  `);
  return {
    nonFwCoverCount: count.rows[0].c,
    brandCodes: brands.rows.map((r) => r.code),
    nonFwMachineCount: machines.rows[0].c,
    fwMachineCount: fwMachines.rows[0].c,
    digests: digests.rows,
  };
}

async function main() {
  fs.mkdirSync(STAGING, { recursive: true });

  // Validate mapping uniqueness + source existence
  if (SLOTS.length !== 45) {
    throw new Error(`Expected 45 slots (5 hero + 40 muscle), got ${SLOTS.length}`);
  }
  const seen = new Set();
  for (const s of SLOTS) {
    const k = slotKey(s.machineCode, s.targetMuscle);
    if (seen.has(k)) throw new Error(`Duplicate slot ${k}`);
    seen.add(k);
    if (!fs.existsSync(s.source)) throw new Error(`Missing source: ${s.source}`);
    if (!s.machineCode.startsWith('FW_')) throw new Error(`Non-FW code blocked: ${s.machineCode}`);
  }

  const report = [];
  console.log('Staging', SLOTS.length, 'images →', STAGING);
  for (const s of SLOTS) {
    const out = path.join(STAGING, stagedName(s.machineCode, s.targetMuscle));
    const { bytes, quality } = await optimizeToWebp(s.source, out);
    const kb = (bytes / 1024).toFixed(1);
    report.push({
      ...s,
      staged: out,
      kb: Number(kb),
      quality,
      sourceFile: path.basename(s.source),
    });
    console.log(
      `${s.machineCode} ${s.targetMuscle ?? 'DEFAULT'} ← ${path.basename(s.source)} → ${kb}KB q${quality} [${s.origin}]`
    );
  }

  fs.writeFileSync(
    path.join(STAGING, 'mapping-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  if (STAGE_ONLY) {
    console.log('Stage-only done.');
    return;
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const before = await snapshotNonFw(client);
  console.log('BEFORE non-FW covers:', before.nonFwCoverCount, 'brands:', before.brandCodes.length);

  if (DRY_RUN) {
    console.log('Dry-run: skipping upload');
    await client.end();
    return;
  }

  const { machineCoverImageService } = await import(
    '../backend/server/services/machine-cover-image.service.ts'
  );

  let ok = 0;
  for (const row of report) {
    const buf = fs.readFileSync(row.staged);
    const asset = await machineCoverImageService.upload({
      machineCode: row.machineCode,
      targetMuscle: row.targetMuscle,
      file: {
        originalname: path.basename(row.staged),
        mimetype: 'image/webp',
        size: buf.length,
        buffer: buf,
      },
    });
    ok++;
    console.log(
      `UPLOADED ${row.machineCode} ${row.targetMuscle ?? 'DEFAULT'} v${asset.version} ${asset.imageUrl?.slice(0, 80)}`
    );
  }

  const after = await snapshotNonFw(client);
  const digestChanged = JSON.stringify(before.digests) !== JSON.stringify(after.digests);
  const brandChanged =
    JSON.stringify(before.brandCodes) !== JSON.stringify(after.brandCodes);
  const nonFwCountChanged = before.nonFwCoverCount !== after.nonFwCoverCount;
  const nonFwMachineChanged = before.nonFwMachineCount !== after.nonFwMachineCount;
  const fwMachineChanged = before.fwMachineCount !== after.fwMachineCount;

  console.log('—— Protection check ——');
  console.log('non-FW cover count:', before.nonFwCoverCount, '→', after.nonFwCoverCount, nonFwCountChanged ? 'CHANGED!' : 'OK');
  console.log('non-FW machines:', before.nonFwMachineCount, '→', after.nonFwMachineCount, nonFwMachineChanged ? 'CHANGED!' : 'OK');
  console.log('FW machines:', before.fwMachineCount, '→', after.fwMachineCount, fwMachineChanged ? 'CHANGED!' : 'OK');
  console.log('brands:', brandChanged ? 'CHANGED!' : 'OK');
  console.log('non-FW cover digests:', digestChanged ? 'CHANGED!' : 'OK');
  console.log('Uploaded slots:', ok);

  if (nonFwCountChanged || nonFwMachineChanged || brandChanged || digestChanged || fwMachineChanged) {
    throw new Error('Protection check FAILED — unexpected non-FW or catalog change');
  }

  const fwAfter = await client.query(`
    SELECT machine_code, target_muscle_group, version, file_size_bytes,
           LEFT(image_url, 90) AS url
    FROM machine_cover_images
    WHERE machine_code LIKE 'FW_%'
    ORDER BY machine_code, target_muscle_group NULLS FIRST
  `);
  console.log('FW covers now:', fwAfter.rows.length);
  fs.writeFileSync(
    path.join(STAGING, 'upload-verify.json'),
    JSON.stringify({ before, after: { ...after, digests: undefined }, fwCovers: fwAfter.rows, report }, null, 2)
  );

  await client.end();
  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
