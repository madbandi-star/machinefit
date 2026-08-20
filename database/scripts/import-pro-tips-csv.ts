#!/usr/bin/env node
/**
 * Import MachineFit PRO tips from CSV into machines.pro_tips + machines.pro_tips_meta.
 *
 * CSV columns (minimum): brand_code, machine_name_ko|machine_name, exercise_tip, exercise_tip_en
 * Optional meta: verification_status, verified_model, manufacturer, product_series,
 *   source_url, verified_structure, verified_adjustments
 *
 * Usage:
 *   tsx database/scripts/import-pro-tips-csv.ts <csv-path> [--dry-run]
 *     [--clear-first] [--clear-brand] [--brand=CODE]
 */
import './load-env.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { createPoolConfig } from './db-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MAX_BYTES = 5000;
const REQUIRED_TIP_HEADERS = ['brand_code', 'exercise_tip', 'exercise_tip_en'];
const MACHINE_NAME_HEADERS = ['machine_name', 'machine_name_ko'];
const EXCLUDED_BRANDS = new Set(['BODYWEIGHT', 'FREE_WEIGHT']);

function parseFlagValue(prefix: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function resolveMachineName(row: Record<string, string>): string {
  return (row.machine_name_ko ?? row.machine_name ?? '').trim();
}

function assertCsvHeaders(headers: string[]): void {
  for (const h of REQUIRED_TIP_HEADERS) {
    if (!headers.includes(h)) {
      console.error(`Missing column: ${h}`);
      process.exit(1);
    }
  }
  if (!MACHINE_NAME_HEADERS.some((h) => headers.includes(h))) {
    console.error('Missing column: machine_name or machine_name_ko');
    process.exit(1);
  }
}

function utf8Len(text: string): number {
  return Buffer.byteLength(text ?? '', 'utf8');
}

/** RFC4180-ish CSV parser with multiline quoted fields. */
function parseCsv(content: string): { headers: string[]; records: Record<string, string>[] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      continue;
    }
    if (ch === '\r') continue;
    field += ch;
  }
  row.push(field);
  if (row.some((c) => c.length > 0)) rows.push(row);
  if (!rows.length) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? '').trim();
    });
    return obj;
  });
  return { headers, records };
}

function stripHorizontalRuleSeparators(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !/^\s*-{3,}\s*$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildProTips(ko: string, en: string): Record<string, string[]> {
  const koTrim = stripHorizontalRuleSeparators(ko);
  const enTrim = stripHorizontalRuleSeparators(en);
  const enFinal = enTrim || koTrim;
  return {
    ko: koTrim ? [koTrim] : [],
    en: enFinal ? [enFinal] : [],
  };
}

function buildProTipsMeta(row: Record<string, string>): Record<string, unknown> | null {
  const status = (row.verification_status ?? '').trim();
  if (!status) return null;

  const meta: Record<string, unknown> = {
    verification_status: status,
    imported_at: new Date().toISOString(),
  };
  const verifiedModel = (row.verified_model ?? '').trim();
  if (verifiedModel) meta.verified_model = verifiedModel;
  const manufacturer = (row.manufacturer ?? '').trim();
  if (manufacturer) meta.manufacturer = manufacturer;
  const series = (row.product_series ?? '').trim();
  if (series) meta.product_series = series;
  const sourceUrl = (row.source_url ?? '').trim();
  if (sourceUrl) meta.source_url = sourceUrl;
  const structure = (row.verified_structure ?? '').trim();
  if (structure) meta.verified_structure = structure;
  const adjustments = (row.verified_adjustments ?? '').trim();
  if (adjustments) meta.verified_adjustments = adjustments;

  return meta;
}

function validateMetaRow(rowNum: number, row: Record<string, string>): string[] {
  const errors: string[] = [];
  const status = (row.verification_status ?? '').trim();
  if (!status) return errors;

  const allowed = new Set([
    'VERIFIED',
    'PARTIALLY_VERIFIED',
    'BRAND_MODEL_NOT_FOUND',
    'exercise_guidance_only',
  ]);
  if (!allowed.has(status)) {
    errors.push(`Row ${rowNum}: invalid verification_status "${status}"`);
  }
  if (status === 'VERIFIED' && !(row.source_url ?? '').trim()) {
    errors.push(`Row ${rowNum}: VERIFIED requires source_url`);
  }
  if (status === 'VERIFIED' && !(row.verified_model ?? '').trim()) {
    errors.push(`Row ${rowNum}: VERIFIED requires verified_model`);
  }
  if (status === 'BRAND_MODEL_NOT_FOUND' && (row.verified_model ?? '').trim()) {
    errors.push(`Row ${rowNum}: BRAND_MODEL_NOT_FOUND must not set verified_model`);
  }
  return errors;
}

function validateRow(
  rowNum: number,
  brand: string,
  machine: string,
  tipKo: string,
  tipEn: string
): string[] {
  const errors: string[] = [];
  if (!brand) errors.push(`Row ${rowNum}: empty brand_code`);
  if (!machine) errors.push(`Row ${rowNum}: empty machine_name`);
  if (!tipKo.trim()) errors.push(`Row ${rowNum}: empty exercise_tip`);
  const koBytes = utf8Len(tipKo);
  const enBytes = utf8Len(tipEn.trim() || tipKo);
  if (koBytes > MAX_BYTES) {
    errors.push(`Row ${rowNum}: exercise_tip ${koBytes} bytes > ${MAX_BYTES}`);
  }
  if (enBytes > MAX_BYTES) {
    errors.push(`Row ${rowNum}: exercise_tip_en ${enBytes} bytes > ${MAX_BYTES}`);
  }
  return errors;
}

async function loadMachineLookup(client: pg.Client): Promise<Map<string, string>> {
  const res = await client.query<{
    id: string;
    brand_code: string;
    std_ko: string | null;
    machine_name_ko: string | null;
  }>(`
    SELECT m.id,
           b.code AS brand_code,
           st.name->>'ko' AS std_ko,
           m.name->>'ko' AS machine_name_ko
    FROM machines m
    JOIN brands b ON b.id = m.brand_id
    LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
    WHERE b.code NOT IN ('BODYWEIGHT', 'FREE_WEIGHT')
      AND m.is_active = TRUE
  `);
  const map = new Map<string, string>();
  for (const row of res.rows) {
    if (row.std_ko) map.set(`${row.brand_code}\0${row.std_ko}`, row.id);
    if (row.machine_name_ko) map.set(`${row.brand_code}\0${row.machine_name_ko}`, row.id);
  }
  return map;
}

async function clearOemProTips(client: pg.Client): Promise<number> {
  const res = await client.query(`
    UPDATE machines m
    SET pro_tips = NULL, pro_tips_meta = NULL, updated_at = NOW()
    FROM brands b
    WHERE b.id = m.brand_id
      AND b.code NOT IN ('BODYWEIGHT', 'FREE_WEIGHT')
      AND m.is_active = TRUE
      AND (m.pro_tips IS NOT NULL OR m.pro_tips_meta IS NOT NULL)
  `);
  return res.rowCount ?? 0;
}

async function clearBrandProTips(client: pg.Client, brandCode: string): Promise<number> {
  const res = await client.query(
    `
    UPDATE machines m
    SET pro_tips = NULL, pro_tips_meta = NULL, updated_at = NOW()
    FROM brands b
    WHERE b.id = m.brand_id
      AND b.code = $1
      AND m.is_active = TRUE
      AND (m.pro_tips IS NOT NULL OR m.pro_tips_meta IS NOT NULL)
    `,
    [brandCode]
  );
  return res.rowCount ?? 0;
}

async function main(): Promise<void> {
  const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const dryRun = flags.has('--dry-run');
  const clearFirst = flags.has('--clear-first');
  const clearBrand = flags.has('--clear-brand');
  const brandFilter = parseFlagValue('--brand=')?.trim().toUpperCase();
  const csvPath = args[0];
  if (!csvPath) {
    console.error(
      'Usage: tsx database/scripts/import-pro-tips-csv.ts <csv-path> [--dry-run] [--clear-first] [--clear-brand] [--brand=CODE]'
    );
    process.exit(2);
  }
  if (clearFirst && clearBrand) {
    console.error('Use either --clear-first or --clear-brand, not both.');
    process.exit(2);
  }
  if (clearBrand && !brandFilter) {
    console.error('--clear-brand requires --brand=CODE');
    process.exit(2);
  }

  const resolved = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(2);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required (backend/.env)');
    process.exit(1);
  }

  const raw = fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, '');
  const { headers, records: allRecords } = parseCsv(raw);

  assertCsvHeaders(headers);

  const records = brandFilter
    ? allRecords.filter((r) => (r.brand_code ?? '').trim().toUpperCase() === brandFilter)
    : allRecords;

  const preErrors: string[] = [];
  const updates: {
    machineId: string;
    proTips: Record<string, string[]>;
    proTipsMeta: Record<string, unknown> | null;
    brand: string;
    machine: string;
  }[] = [];

  const client = new pg.Client(createPoolConfig(connectionString));
  await client.connect();
  const lookup = await loadMachineLookup(client);

  for (let i = 0; i < records.length; i++) {
    const rowNum = i + 2;
    const row = records[i];
    const brand = (row.brand_code ?? '').trim().toUpperCase();
    const machine = resolveMachineName(row);
    const tipKo = stripHorizontalRuleSeparators(row.exercise_tip ?? '');
    const tipEn = stripHorizontalRuleSeparators(row.exercise_tip_en ?? '');

    if (EXCLUDED_BRANDS.has(brand)) {
      preErrors.push(`Row ${rowNum}: excluded brand ${brand}`);
      continue;
    }

    preErrors.push(...validateRow(rowNum, brand, machine, tipKo, tipEn));
    preErrors.push(...validateMetaRow(rowNum, row));

    const key = `${brand}\0${machine}`;
    const machineId = lookup.get(key);
    if (!machineId) {
      preErrors.push(`Row ${rowNum}: no DB machine for ${brand} / ${machine}`);
      continue;
    }

    updates.push({
      machineId,
      proTips: buildProTips(tipKo, tipEn),
      proTipsMeta: buildProTipsMeta(row),
      brand,
      machine,
    });
  }

  if (preErrors.length) {
    console.error(`Validation failed (${preErrors.length} issues):`);
    for (const e of preErrors.slice(0, 30)) console.error(`  ${e}`);
    if (preErrors.length > 30) console.error(`  ... and ${preErrors.length - 30} more`);
    await client.end();
    process.exit(1);
  }

  const metaStats = updates.reduce(
    (acc, u) => {
      const s = (u.proTipsMeta?.verification_status as string) ?? 'none';
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`Ready to import ${updates.length} PRO tips from ${path.basename(resolved)}`);
  if (brandFilter) console.log(`Brand filter: ${brandFilter}`);
  if (Object.keys(metaStats).length) console.log('Meta breakdown:', metaStats);

  if (dryRun) {
    console.log('Dry run — no DB writes.');
    if (clearFirst) console.log('Would clear all OEM pro_tips first (--clear-first).');
    if (clearBrand) console.log(`Would clear ${brandFilter} pro_tips first (--clear-brand).`);
    console.log(
      JSON.stringify(
        {
          rowCount: updates.length,
          metaStats,
          sample: updates.slice(0, 2).map((u) => ({
            brand: u.brand,
            machine: u.machine,
            koBytes: utf8Len(u.proTips.ko[0] ?? ''),
            enBytes: utf8Len(u.proTips.en[0] ?? ''),
            meta: u.proTipsMeta,
          })),
        },
        null,
        2
      )
    );
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    if (clearFirst) {
      const cleared = await clearOemProTips(client);
      console.log(`Cleared pro_tips on ${cleared} OEM machines.`);
    } else if (clearBrand && brandFilter) {
      const cleared = await clearBrandProTips(client, brandFilter);
      console.log(`Cleared pro_tips on ${cleared} ${brandFilter} machines.`);
    }

    let updated = 0;
    for (const u of updates) {
      const res = await client.query(
        `UPDATE machines
         SET pro_tips = $2::jsonb,
             pro_tips_meta = $3::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [u.machineId, JSON.stringify(u.proTips), u.proTipsMeta ? JSON.stringify(u.proTipsMeta) : null]
      );
      if ((res.rowCount ?? 0) > 0) updated++;
    }
    await client.query('COMMIT');
    console.log(`Imported PRO tips for ${updated} machines.`);

    const verify = await client.query<{ with_pro: string; with_meta: string; total: string }>(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE pro_tips IS NOT NULL
            AND pro_tips != '{}'::jsonb
            AND jsonb_array_length(COALESCE(pro_tips->'ko', '[]'::jsonb)) > 0
        )::text AS with_pro,
        COUNT(*) FILTER (
          WHERE pro_tips_meta IS NOT NULL
            AND pro_tips_meta->>'verification_status' IS NOT NULL
        )::text AS with_meta,
        COUNT(*)::text AS total
      FROM machines m
      JOIN brands b ON b.id = m.brand_id
      WHERE b.code NOT IN ('BODYWEIGHT', 'FREE_WEIGHT')
        AND m.is_active = TRUE
        AND ($1::text IS NULL OR b.code = $1)
    `,
      [brandFilter ?? null]
    );
    console.log(
      `DB verify: ${verify.rows[0]?.with_pro ?? '?'} / ${verify.rows[0]?.total ?? '?'} have pro_tips.ko; ${verify.rows[0]?.with_meta ?? '?'} have pro_tips_meta`
    );

    const reportPath = path.join(ROOT, '.cursor/handoff/pro-tips-import-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          importedAt: new Date().toISOString(),
          csv: resolved,
          brandFilter,
          clearFirst,
          clearBrand,
          updated,
          metaStats,
          verify: verify.rows[0],
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
