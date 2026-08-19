#!/usr/bin/env node
/**
 * Audit MachineFit PRO tips quality (DB + optional CSV).
 * Usage: node database/scripts/audit-pro-tips-quality.mjs [--csv path]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

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
  if (!rows.length) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  return {
    headers,
    records: rows.slice(1).map((cells) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (cells[idx] ?? '').trim();
      });
      return obj;
    }),
  };
}

function normalizeTip(text) {
  return (text ?? '')
    .replace(/🏋️\s*[A-Z0-9_]+\s+/g, '🏋️ BRAND ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tipFingerprint(text) {
  return normalizeTip(text).slice(0, 500);
}

async function auditDb() {
  const envPath = path.join(ROOT, 'backend/.env');
  if (!fs.existsSync(envPath)) return null;
  const m = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.+)$/m);
  if (!m) return null;
  const dbUrl = m[1].trim().replace(/^["']|["']$/g, '');
  let pg;
  try {
    pg = await import('pg');
  } catch {
    return null;
  }
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT b.code AS brand_code,
           COALESCE(st.name->>'ko', '') AS machine_name_ko,
           m.pro_tips->'ko'->>0 AS tip_ko,
           m.pro_tips->'en'->>0 AS tip_en
    FROM machines m
    JOIN brands b ON b.id = m.brand_id
    LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
    WHERE b.code NOT IN ('BODYWEIGHT', 'FREE_WEIGHT')
      AND m.is_active = TRUE
    ORDER BY b.code, st.sort_order NULLS LAST, m.code
  `);
  await client.end();
  return res.rows;
}

function auditRecords(records, source) {
  const byMachine = new Map();
  const statusCounts = {};
  const emptyModel = [];
  const genericOnly = [];
  const overBytes = [];

  for (const r of records) {
    const brand = (r.brand_code ?? '').trim();
    const machine = (r.machine_name_ko ?? r.machine_name ?? '').trim();
    const tipKo = r.tip_ko ?? r.exercise_tip ?? '';
    const status = r.verification_status ?? 'UNKNOWN';
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    if (!r.verified_model && !tipKo.includes('미확인')) {
      /* may still have model section */
    }
    if (!r.verified_model && (status === 'exercise_guidance_only' || status === 'VERIFIED')) {
      emptyModel.push({ brand, machine, status });
    }
    if (tipKo.includes('정확한 세부 모델 미확인') || tipKo.includes('브랜드 고유 구조를 추정하지 않습니다')) {
      genericOnly.push({ brand, machine });
    }
    const bytes = Buffer.byteLength(tipKo, 'utf8');
    if (bytes > 5000) overBytes.push({ brand, machine, bytes });

    const fp = tipFingerprint(tipKo);
    if (!byMachine.has(machine)) byMachine.set(machine, new Map());
    const m = byMachine.get(machine);
    m.set(fp, (m.get(fp) ?? 0) + 1);
  }

  let duplicateAcrossBrands = 0;
  const worstMachines = [];
  for (const [machine, fps] of byMachine) {
    const unique = fps.size;
    const total = [...fps.values()].reduce((a, b) => a + b, 0);
    if (unique === 1 && total > 1) duplicateAcrossBrands++;
    if (unique <= 3 && total >= 20) {
      worstMachines.push({ machine, uniqueFingerprints: unique, rows: total });
    }
  }

  return {
    source,
    rowCount: records.length,
    statusCounts,
    emptyVerifiedModel: emptyModel.length,
    genericTemplateRows: genericOnly.length,
    overBytes: overBytes.length,
    machinesWithIdenticalTipsAcrossAllBrands: duplicateAcrossBrands,
    worstCopyPasteMachines: worstMachines.slice(0, 15),
    sampleGeneric: genericOnly.slice(0, 5),
  };
}

async function main() {
  const csvArg = process.argv.find((a) => a.startsWith('--csv='))?.slice(6);
  const report = { auditedAt: new Date().toISOString(), db: null, csv: null };

  const dbRows = await auditDb();
  if (dbRows) {
    const backupPath = path.join(ROOT, '.cursor/handoff/pro-tips-backup-db.json');
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(dbRows, null, 0), 'utf8');
    report.db = auditRecords(
      dbRows.map((r) => ({ ...r, verification_status: 'IN_DB_ONLY' })),
      'database'
    );
    report.dbBackup = backupPath;
  }

  const csvPath =
    csvArg ??
    'c:\\Users\\Human\\Downloads\\MachineFit_29brands_80machines_2320_tips.csv';
  if (fs.existsSync(csvPath)) {
    const { records } = parseCsv(fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''));
    report.csv = auditRecords(records, path.basename(csvPath));
  }

  const out = path.join(ROOT, '.cursor/handoff/pro-tips-quality-audit.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
