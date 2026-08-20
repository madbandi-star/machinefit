#!/usr/bin/env node
/**
 * Validate MachineFit PRO tips CSV before import.
 * Usage: node database/scripts/validate-pro-tips-csv.mjs <csv-path>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const MIGRATION = path.join(ROOT, 'database/migrations/133_seed_foundation_brands_standard_types.sql');

const MAX_BYTES = 5000;
const MAX_LINES = 30;
const EXCLUDED_BRANDS = new Set(['BODYWEIGHT', 'FREE_WEIGHT']);
const EXPECTED_BRANDS = 29;
const EXPECTED_MACHINES_PER_BRAND = 80;
const EXPECTED_ROWS = EXPECTED_BRANDS * EXPECTED_MACHINES_PER_BRAND;
const REQUIRED_TIP_HEADERS = ['brand_code', 'exercise_tip', 'exercise_tip_en'];
const MACHINE_NAME_HEADERS = ['machine_name', 'machine_name_ko'];
const GENERIC_PHRASES = [
  '정확한 세부 모델 미확인',
  '브랜드명만 변경',
  'exercise_guidance_only',
];
const META_STATUSES = new Set([
  'VERIFIED',
  'PARTIALLY_VERIFIED',
  'BRAND_MODEL_NOT_FOUND',
  'exercise_guidance_only',
]);

function parseFlagValue(prefix) {
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function resolveMachineName(row) {
  return (row.machine_name_ko ?? row.machine_name ?? '').trim();
}

function assertCsvHeaders(headers, report) {
  if (!MACHINE_NAME_HEADERS.some((h) => headers.includes(h))) {
    report.errors.push('Missing column: machine_name or machine_name_ko');
  }
}

function utf8Len(text) {
  return Buffer.byteLength(text ?? '', 'utf8');
}

function lineCount(text) {
  if (!text?.trim()) return 0;
  return text.split(/\r?\n/).filter((ln) => ln.trim()).length;
}

function loadBrandCodes() {
  const text = fs.readFileSync(MIGRATION, 'utf8');
  const codes = new Set();
  for (const m of text.matchAll(/'([A-Z0-9_]+)',\s*\n\s*'\{/g)) codes.add(m[1]);
  for (const m of text.matchAll(/WHERE code = '([A-Z0-9_]+)'/g)) codes.add(m[1]);
  for (const m of text.matchAll(
    /INSERT INTO brands \(code[^)]*\)\s*\nSELECT\s*\n\s*'([A-Z0-9_]+)'/g
  )) {
    codes.add(m[1]);
  }
  for (const c of codes) {
    if (EXCLUDED_BRANDS.has(c)) codes.delete(c);
  }
  return codes;
}

function loadStandardMachineNames() {
  const text = fs.readFileSync(MIGRATION, 'utf8');
  const names = new Set();
  for (const m of text.matchAll(/'STD_[A-Z0-9_]+',\s*'\{\"ko\":\"([^\"]+)\"/g)) {
    names.add(m[1]);
  }
  return names;
}

/** RFC4180-ish CSV parser with multiline quoted fields. */
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
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? '').trim();
    });
    return obj;
  });
  return { headers, records };
}

async function tryLoadDbCatalog() {
  const envPath = path.join(ROOT, 'backend/.env');
  if (!fs.existsSync(envPath)) return null;
  const envText = fs.readFileSync(envPath, 'utf8');
  const match = envText.match(/^DATABASE_URL=(.+)$/m);
  if (!match) return null;
  const dbUrl = match[1].trim().replace(/^["']|["']$/g, '');
  let pg;
  try {
    pg = await import('pg');
  } catch {
    return null;
  }
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
  } catch {
    return null;
  }
  const res = await client.query(`
    SELECT b.code,
           COALESCE(st.name->>'ko', m.name->>'ko') AS std_ko,
           m.code AS machine_code,
           m.name->>'ko' AS machine_name_ko
    FROM machines m
    JOIN brands b ON b.id = m.brand_id
    LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
    WHERE b.code NOT IN ('BODYWEIGHT', 'FREE_WEIGHT')
      AND m.is_active = TRUE
  `);
  await client.end();
  const std = new Map();
  const full = new Map();
  for (const row of res.rows) {
    const brand = row.code;
    if (row.std_ko) std.set(`${brand}\0${row.std_ko}`, row.machine_code);
    if (row.machine_name_ko) full.set(`${brand}\0${row.machine_name_ko}`, row.machine_code);
  }
  return { std, full };
}

function main() {
  const csvPath = process.argv.find((a) => !a.startsWith('--') && a.endsWith('.csv')) ?? process.argv[2];
  const brandFilter = parseFlagValue('--brand=')?.trim().toUpperCase();
  const singleBrand = process.argv.includes('--single-brand') || Boolean(brandFilter);
  const expectedRows = singleBrand ? EXPECTED_MACHINES_PER_BRAND : EXPECTED_ROWS;

  if (!csvPath) {
    console.error('Usage: node validate-pro-tips-csv.mjs <csv-path> [--single-brand] [--brand=CODE]');
    process.exit(2);
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(2);
  }

  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
  const { headers, records: allRecords } = parseCsv(raw);
  const records = brandFilter
    ? allRecords.filter((r) => (r.brand_code ?? '').trim().toUpperCase() === brandFilter)
    : allRecords;
  const report = {
    file: csvPath,
    headers,
    rowCount: records.length,
    singleBrand,
    brandFilter,
    expectedRows,
    errors: [],
    warnings: [],
    stats: {},
  };

  for (const h of REQUIRED_TIP_HEADERS) {
    if (!headers.includes(h)) report.errors.push(`Missing column: ${h}`);
  }
  assertCsvHeaders(headers, report);

  const knownBrands = loadBrandCodes();
  const knownStdNames = loadStandardMachineNames();

  const dup = new Map();
  const brandCounts = new Map();
  const unknownBrands = new Map();
  const unknownMachineNames = new Set();
  const overBytesKo = [];
  const overBytesEn = [];
  const overLinesKo = [];
  const overLinesEn = [];
  let emptyKo = 0;
  let emptyEn = 0;
  let maxKoBytes = 0;
  let maxEnBytes = 0;
  let sumKoBytes = 0;
  let sumEnBytes = 0;
  const metaStatusCounts = {};
  let metaInvalid = 0;
  let verifiedMissingSource = 0;
  let verifiedMissingModel = 0;
  let notFoundWithModel = 0;
  const genericPhraseHits = [];

  for (let i = 0; i < records.length; i++) {
    const rowNum = i + 2;
    const row = records[i];
    const brand = (row.brand_code ?? '').trim().toUpperCase();
    const machine = resolveMachineName(row);
    const tipKo = row.exercise_tip ?? '';
    const tipEn = row.exercise_tip_en ?? '';

    if (!brand) report.errors.push(`Row ${rowNum}: empty brand_code`);
    if (!machine) report.errors.push(`Row ${rowNum}: empty machine_name`);

    const key = `${brand}\0${machine}`;
    dup.set(key, (dup.get(key) ?? 0) + 1);
    brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);

    if (EXCLUDED_BRANDS.has(brand)) report.errors.push(`Row ${rowNum}: excluded brand ${brand}`);
    else if (brand && !knownBrands.has(brand)) unknownBrands.set(brand, (unknownBrands.get(brand) ?? 0) + 1);

    if (machine && !knownStdNames.has(machine)) unknownMachineNames.add(machine);

    if (!tipKo.trim()) emptyKo++;
    if (!tipEn.trim()) emptyEn++;

    const koBytes = utf8Len(tipKo);
    const enBytes = utf8Len(tipEn);
    const koLines = lineCount(tipKo);
    const enLines = lineCount(tipEn);
    maxKoBytes = Math.max(maxKoBytes, koBytes);
    maxEnBytes = Math.max(maxEnBytes, enBytes);
    sumKoBytes += koBytes;
    sumEnBytes += enBytes;

    if (koBytes > MAX_BYTES) overBytesKo.push({ row: rowNum, brand, machine, bytes: koBytes });
    if (tipEn.trim() && enBytes > MAX_BYTES) overBytesEn.push({ row: rowNum, brand, machine, bytes: enBytes });
    if (koLines > MAX_LINES) overLinesKo.push({ row: rowNum, brand, machine, lines: koLines });
    if (enLines > MAX_LINES) overLinesEn.push({ row: rowNum, brand, machine, lines: enLines });

    const status = (row.verification_status ?? '').trim();
    if (status) {
      if (!META_STATUSES.has(status)) metaInvalid++;
      metaStatusCounts[status] = (metaStatusCounts[status] ?? 0) + 1;
      if (status === 'VERIFIED' && !(row.source_url ?? '').trim()) verifiedMissingSource++;
      if (status === 'VERIFIED' && !(row.verified_model ?? '').trim()) verifiedMissingModel++;
      if (status === 'BRAND_MODEL_NOT_FOUND' && (row.verified_model ?? '').trim()) notFoundWithModel++;
    }

    for (const phrase of GENERIC_PHRASES) {
      if (tipKo.includes(phrase) || tipEn.includes(phrase)) {
        genericPhraseHits.push({ row: rowNum, brand, machine, phrase });
      }
    }
  }

  const duplicates = [...dup.entries()].filter(([, c]) => c > 1);
  if (duplicates.length) {
    report.errors.push(`Duplicate brand+machine pairs: ${duplicates.length}`);
    report.stats.duplicateExamples = duplicates.slice(0, 20).map(([k, c]) => {
      const [brand, machine] = k.split('\0');
      return { brand, machine, count: c };
    });
  }

  const wrongBrandCounts = Object.fromEntries(
    [...brandCounts.entries()].filter(
      ([b, c]) => !EXCLUDED_BRANDS.has(b) && c !== EXPECTED_MACHINES_PER_BRAND
    )
  );

  report.stats = {
    ...report.stats,
    expectedRows,
    brandCount: brandCounts.size,
    brandsWithWrongRowCount: wrongBrandCounts,
    unknownBrands: Object.fromEntries(unknownBrands),
    unknownMachineNameCount: unknownMachineNames.size,
    unknownMachineNameExamples: [...unknownMachineNames].slice(0, 20),
    emptyKoRows: emptyKo,
    emptyEnRows: emptyEn,
    overBytesKo: overBytesKo.length,
    overBytesEn: overBytesEn.length,
    overLinesKo: overLinesKo.length,
    overLinesEn: overLinesEn.length,
    maxKoBytes,
    maxEnBytes,
    avgKoBytes: records.length ? Math.round(sumKoBytes / records.length) : 0,
    avgEnBytes: records.length ? Math.round(sumEnBytes / records.length) : 0,
    overBytesKoExamples: overBytesKo.slice(0, 10),
    overBytesEnExamples: overBytesEn.slice(0, 10),
    overLinesKoExamples: overLinesKo.slice(0, 5),
    overLinesEnExamples: overLinesEn.slice(0, 5),
    metaStatusCounts,
    metaInvalid,
    verifiedMissingSource,
    verifiedMissingModel,
    notFoundWithModel,
    genericPhraseHits: genericPhraseHits.slice(0, 20),
    genericPhraseHitCount: genericPhraseHits.length,
  };

  if (records.length !== expectedRows) {
    report.errors.push(`Row count ${records.length} != expected ${expectedRows}`);
  }
  if (!singleBrand && Object.keys(wrongBrandCounts).length) {
    report.errors.push(
      `Brands not exactly ${EXPECTED_MACHINES_PER_BRAND} rows: ${Object.keys(wrongBrandCounts).length}`
    );
  }
  if (unknownBrands.size) report.errors.push(`Unknown brand codes: ${unknownBrands.size}`);
  if (emptyKo) report.errors.push(`Empty exercise_tip rows: ${emptyKo}`);
  if (overBytesKo.length) report.errors.push(`exercise_tip exceeds ${MAX_BYTES} bytes: ${overBytesKo.length} rows`);
  if (overBytesEn.length) report.errors.push(`exercise_tip_en exceeds ${MAX_BYTES} bytes: ${overBytesEn.length} rows`);
  if (overLinesKo.length) report.warnings.push(`exercise_tip exceeds ${MAX_LINES} lines: ${overLinesKo.length} rows`);
  if (overLinesEn.length) report.warnings.push(`exercise_tip_en exceeds ${MAX_LINES} lines: ${overLinesEn.length} rows`);
  if (metaInvalid) report.errors.push(`Invalid verification_status values: ${metaInvalid}`);
  if (verifiedMissingSource) {
    report.errors.push(`VERIFIED rows missing source_url: ${verifiedMissingSource}`);
  }
  if (verifiedMissingModel) {
    report.errors.push(`VERIFIED rows missing verified_model: ${verifiedMissingModel}`);
  }
  if (notFoundWithModel) {
    report.errors.push(`BRAND_MODEL_NOT_FOUND rows with verified_model set: ${notFoundWithModel}`);
  }
  if (genericPhraseHits.length) {
    report.errors.push(`Generic/template phrase detected in tips: ${genericPhraseHits.length} hits`);
  }
  if (emptyEn) report.warnings.push(`Empty exercise_tip_en rows: ${emptyEn} (will copy ko on import)`);
  if (unknownMachineNames.size) {
    report.warnings.push(
      `machine_name not in standard 80-type catalog: ${unknownMachineNames.size} unique names`
    );
  }

  return (async () => {
    const dbMaps = await tryLoadDbCatalog();
    if (!dbMaps) {
      report.warnings.push('Live DB match skipped (no DATABASE_URL/pg)');
    } else {
      const unmatched = [];
      for (let i = 0; i < records.length; i++) {
        const rowNum = i + 2;
        const brand = (records[i].brand_code ?? '').trim().toUpperCase();
        const machine = resolveMachineName(records[i]);
        const key = `${brand}\0${machine}`;
        if (!dbMaps.std.has(key) && !dbMaps.full.has(key)) {
          unmatched.push({ row: rowNum, brand, machine });
        }
      }
      report.stats.dbMatchChecked = true;
      report.stats.dbUnmatchedRows = unmatched.length;
      report.stats.dbUnmatchedExamples = unmatched.slice(0, 20);
      if (unmatched.length) report.errors.push(`Could not match to DB machines: ${unmatched.length} rows`);
    }

    const outPath = path.join(ROOT, '.cursor/handoff/pro-tips-csv-validation.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.errors.length ? 1 : 0);
  })();
}

main();
