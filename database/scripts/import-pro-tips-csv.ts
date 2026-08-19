#!/usr/bin/env node
/**
 * Import MachineFit PRO tips from CSV into machines.pro_tips.
 *
 * CSV columns: brand_code, machine_name, exercise_tip, exercise_tip_en
 * Each cell is stored as ONE array element (internal newlines preserved).
 *
 * Usage:
 *   tsx database/scripts/import-pro-tips-csv.ts <csv-path> [--dry-run] [--clear-first]
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

function buildProTips(ko: string, en: string): Record<string, string[]> {
  const koTrim = ko.trim();
  const enTrim = en.trim();
  const enFinal = enTrim || koTrim;
  return {
    ko: koTrim ? [koTrim] : [],
    en: enFinal ? [enFinal] : [],
  };
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
    SET pro_tips = NULL, updated_at = NOW()
    FROM brands b
    WHERE b.id = m.brand_id
      AND b.code NOT IN ('BODYWEIGHT', 'FREE_WEIGHT')
      AND m.is_active = TRUE
      AND m.pro_tips IS NOT NULL
  `);
  return res.rowCount ?? 0;
}

async function main(): Promise<void> {
  const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const dryRun = flags.has('--dry-run');
  const clearFirst = flags.has('--clear-first');
  const csvPath = args[0];
  if (!csvPath) {
    console.error('Usage: tsx database/scripts/import-pro-tips-csv.ts <csv-path> [--dry-run]');
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
  const { headers, records } = parseCsv(raw);

  assertCsvHeaders(headers);

  const preErrors: string[] = [];
  const updates: { machineId: string; proTips: Record<string, string[]>; brand: string; machine: string }[] =
    [];

  const client = new pg.Client(createPoolConfig(connectionString));
  await client.connect();
  const lookup = await loadMachineLookup(client);

  for (let i = 0; i < records.length; i++) {
    const rowNum = i + 2;
    const row = records[i];
    const brand = (row.brand_code ?? '').trim().toUpperCase();
    const machine = resolveMachineName(row);
    const tipKo = row.exercise_tip ?? '';
    const tipEn = row.exercise_tip_en ?? '';

    preErrors.push(...validateRow(rowNum, brand, machine, tipKo, tipEn));

    const key = `${brand}\0${machine}`;
    const machineId = lookup.get(key);
    if (!machineId) {
      preErrors.push(`Row ${rowNum}: no DB machine for ${brand} / ${machine}`);
      continue;
    }

    updates.push({
      machineId,
      proTips: buildProTips(tipKo, tipEn),
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

  console.log(`Ready to import ${updates.length} PRO tips from ${path.basename(resolved)}`);
  if (dryRun) {
    console.log('Dry run — no DB writes.');
    if (clearFirst) console.log('Would clear existing OEM pro_tips first (--clear-first).');
    console.log(
      JSON.stringify(
        {
          rowCount: updates.length,
          sample: updates.slice(0, 2).map((u) => ({
            brand: u.brand,
            machine: u.machine,
            koBytes: utf8Len(u.proTips.ko[0] ?? ''),
            enBytes: utf8Len(u.proTips.en[0] ?? ''),
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
    }
    let updated = 0;
    for (const u of updates) {
      const res = await client.query(
        `UPDATE machines
         SET pro_tips = $2::jsonb, updated_at = NOW()
         WHERE id = $1`,
        [u.machineId, JSON.stringify(u.proTips)]
      );
      if ((res.rowCount ?? 0) > 0) updated++;
    }
    await client.query('COMMIT');
    console.log(`Imported PRO tips for ${updated} machines.`);

    const verify = await client.query<{ with_pro: string; total: string }>(`
      SELECT
        COUNT(*) FILTER (
          WHERE pro_tips IS NOT NULL
            AND pro_tips != '{}'::jsonb
            AND jsonb_array_length(COALESCE(pro_tips->'ko', '[]'::jsonb)) > 0
        )::text AS with_pro,
        COUNT(*)::text AS total
      FROM machines m
      JOIN brands b ON b.id = m.brand_id
      WHERE b.code NOT IN ('BODYWEIGHT', 'FREE_WEIGHT')
        AND m.is_active = TRUE
    `);
    console.log(
      `DB verify: ${verify.rows[0]?.with_pro ?? '?'} / ${verify.rows[0]?.total ?? '?'} OEM machines have pro_tips.ko`
    );

    const reportPath = path.join(ROOT, '.cursor/handoff/pro-tips-import-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          importedAt: new Date().toISOString(),
          csv: resolved,
          clearFirst,
          cleared: clearFirst ? 'see log' : undefined,
          updated,
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
