#!/usr/bin/env node
/**
 * Export OEM brand PRO tips CSV → SQL migration UPDATEs.
 * Usage:
 *   node database/scripts/export-oem-pro-tips-migration.mjs --brand=LIFE_FITNESS --migration=156_life_fitness_pro_tips.sql
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function parseArg(prefix) {
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const BRAND = parseArg('--brand=') || 'HAMMER_STRENGTH';
const brandSlug = BRAND.toLowerCase();
const CSV = path.join(ROOT, `database/catalog/pro-tips/${brandSlug}_pro_tips.csv`);
const OUT = path.join(
  ROOT,
  'database/migrations',
  parseArg('--migration=') || `156_${brandSlug}_pro_tips.sql`
);
const BACKUP = `_backup_${brandSlug}_pro_tips_20260820`;

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
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
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? '').trim();
    });
    return obj;
  });
}

function dollarQuote(tag, text) {
  let t = tag;
  let n = 0;
  while (text.includes(`$${t}$`)) {
    n += 1;
    t = `${tag}${n}`;
  }
  return `$${t}$${text}$${t}$`;
}

function sqlString(text) {
  if (text == null || text === '') return 'NULL';
  return `'${String(text).replace(/'/g, "''")}'`;
}

function buildMeta(row) {
  const status = row.verification_status || null;
  if (!status) return 'NULL';
  const meta = {
    verificationStatus: status,
    verifiedModel: row.verified_model || null,
    manufacturer: row.manufacturer || null,
    productSeries: row.product_series || null,
    sourceUrl: row.source_url || null,
    verifiedStructure: row.verified_structure || null,
    verifiedAdjustments: row.verified_adjustments || null,
    importedAt: new Date().toISOString(),
  };
  return `${dollarQuote('meta', JSON.stringify(meta))}::jsonb`;
}

if (!fs.existsSync(CSV)) {
  console.error(`CSV not found: ${CSV}`);
  process.exit(1);
}

const records = parseCsv(fs.readFileSync(CSV, 'utf8').replace(/^\uFEFF/, ''));
if (records.length !== 80) {
  console.error(`Expected 80 CSV rows, got ${records.length}`);
  process.exit(1);
}

const parts = [];
parts.push(`-- Import ${BRAND} MachineFit PRO tips (trainer coaching style).
-- Source: database/catalog/pro-tips/${brandSlug}_pro_tips.csv
-- Backup previous pro_tips / pro_tips_meta before UPDATE.

CREATE TABLE IF NOT EXISTS ${BACKUP} (
  machine_id UUID PRIMARY KEY,
  code TEXT,
  machine_name_ko TEXT,
  pro_tips JSONB,
  pro_tips_meta JSONB,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ${BACKUP} (machine_id, code, machine_name_ko, pro_tips, pro_tips_meta)
SELECT m.id,
       m.code,
       COALESCE(st.name->>'ko', m.name->>'ko'),
       m.pro_tips,
       m.pro_tips_meta
FROM machines m
JOIN brands b ON b.id = m.brand_id
LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
WHERE b.code = '${BRAND}'
  AND m.is_active = TRUE
ON CONFLICT (machine_id) DO NOTHING;
`);

for (const row of records) {
  const nameKo = row.machine_name_ko;
  const tipKo = row.exercise_tip;
  const tipEn = row.exercise_tip_en;
  parts.push(`
UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array(${dollarQuote('k', tipKo)}),
    'en', jsonb_build_array(${dollarQuote('e', tipEn)})
  ),
  pro_tips_meta = ${buildMeta(row)},
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = '${BRAND}'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = ${sqlString(nameKo)};
`);
}

parts.push(`
DO $$
DECLARE
  updated_count INT;
BEGIN
  SELECT COUNT(*)::int INTO updated_count
  FROM machines m
  JOIN brands b ON b.id = m.brand_id
  WHERE b.code = '${BRAND}'
    AND m.is_active = TRUE
    AND m.pro_tips IS NOT NULL
    AND m.pro_tips_meta IS NOT NULL
    AND m.pro_tips_meta->>'verificationStatus' IS NOT NULL
    AND (m.pro_tips->'ko'->>0) LIKE '%ONE KEY CUE%'
    AND (m.pro_tips->'ko'->>0) LIKE '%MACHINE FIT PRO TIP%'
    AND (m.pro_tips->'ko'->>0) NOT LIKE '%📋 검증 상태%';

  IF updated_count < 80 THEN
    RAISE EXCEPTION '${BRAND} trainer PRO tips import incomplete: % / 80', updated_count;
  END IF;
END $$;
`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, parts.join('\n'), 'utf8');
console.log(JSON.stringify({ brand: BRAND, out: OUT, rows: records.length, bytes: fs.statSync(OUT).size }, null, 2));
