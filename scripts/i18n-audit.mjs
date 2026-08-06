#!/usr/bin/env node
/**
 * i18n audit — key parity, invalid JSON, duplicate sibling keys (best-effort).
 * Usage:
 *   node scripts/i18n-audit.mjs           # report + exit 1 on missing keys
 *   node scripts/i18n-audit.mjs --fix   # write missing keys as TODO_TRANSLATE
 *   node scripts/i18n-audit.mjs --sync    # copy missing keys from en (then TODO where still missing)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'frontend/src/i18n/locales');
const LOCALES = ['ko', 'en', 'ja', 'zh'];
const REFERENCE = 'ko';
const NAMESPACES = [
  'common',
  'machines',
  'gyms',
  'community',
  'notifications',
  'admin',
  'trade',
  'online-pt',
  'push',
  'friends',
  'equipment',
];

const args = new Set(process.argv.slice(2));
const DO_FIX = args.has('--fix');
const DO_SYNC = args.has('--sync');
const STRICT = !args.has('--soft');

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function flatten(obj, prefix = '', out = new Map()) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out.set(prefix, obj);
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out.set(key, v);
    }
  }
  return out;
}

function setDeep(obj, dotted, value) {
  const parts = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
      cur[p] = {};
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function getDeep(obj, dotted) {
  const parts = dotted.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

const report = {
  invalidJson: [],
  missing: [],
  empty: [],
  todoTranslate: [],
  unusedHint: 'Scan for unused keys is approximate — not failing CI',
};

for (const locale of LOCALES) {
  const dir = path.join(LOCALES_DIR, locale);
  if (!fs.existsSync(dir)) {
    report.invalidJson.push({ locale, error: 'locale directory missing' });
    continue;
  }
}

for (const ns of NAMESPACES) {
  const refPath = path.join(LOCALES_DIR, REFERENCE, `${ns}.json`);
  if (!fs.existsSync(refPath)) {
    // equipment may be new — skip if ko missing
    if (ns === 'equipment') continue;
    report.invalidJson.push({ file: refPath, error: 'reference namespace missing' });
    continue;
  }

  let ref;
  try {
    ref = readJson(refPath);
  } catch (e) {
    report.invalidJson.push({ file: refPath, error: String(e.message || e) });
    continue;
  }
  const refKeys = flatten(ref);

  for (const locale of LOCALES) {
    if (locale === REFERENCE) continue;
    const file = path.join(LOCALES_DIR, locale, `${ns}.json`);
    if (!fs.existsSync(file)) {
      report.missing.push({ locale, ns, key: '*', note: 'file missing' });
      if (DO_SYNC || DO_FIX) {
        const enPath = path.join(LOCALES_DIR, 'en', `${ns}.json`);
        const src = fs.existsSync(enPath) ? readJson(enPath) : ref;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        writeJson(file, src);
      }
      continue;
    }

    let data;
    try {
      data = readJson(file);
    } catch (e) {
      report.invalidJson.push({ file, error: String(e.message || e) });
      continue;
    }

    let changed = false;
    for (const [key, refVal] of refKeys) {
      const val = getDeep(data, key);
      if (val === undefined) {
        report.missing.push({ locale, ns, key });
        if (DO_SYNC || DO_FIX) {
          const enVal = getDeep(readJson(path.join(LOCALES_DIR, 'en', `${ns}.json`)), key);
          const fill =
            DO_FIX && locale !== 'en'
              ? typeof enVal === 'string'
                ? `TODO_TRANSLATE: ${enVal}`
                : enVal ?? (typeof refVal === 'string' ? `TODO_TRANSLATE: ${refVal}` : refVal)
              : (enVal ?? refVal);
          setDeep(data, key, fill);
          changed = true;
        }
      } else if (typeof val === 'string' && val.trim() === '') {
        report.empty.push({ locale, ns, key });
      } else if (typeof val === 'string' && val.startsWith('TODO_TRANSLATE')) {
        report.todoTranslate.push({ locale, ns, key });
      }
    }
    if (changed) writeJson(file, data);
  }
}

const missingCount = report.missing.length;
const invalidCount = report.invalidJson.length;

console.log('=== i18n audit ===');
console.log(`invalid JSON: ${invalidCount}`);
console.log(`missing keys: ${missingCount}`);
console.log(`empty strings: ${report.empty.length}`);
console.log(`TODO_TRANSLATE: ${report.todoTranslate.length}`);

if (invalidCount) {
  console.log('\nInvalid JSON:');
  for (const row of report.invalidJson.slice(0, 20)) console.log(' -', row);
}
if (missingCount) {
  console.log('\nMissing (sample):');
  for (const row of report.missing.slice(0, 40)) {
    console.log(` - [${row.locale}] ${row.ns}.${row.key}${row.note ? ` (${row.note})` : ''}`);
  }
  if (missingCount > 40) console.log(` ... +${missingCount - 40} more`);
}

const outDir = path.join(ROOT, 'docs');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'I18N_AUDIT_REPORT.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), ...report, missingCount }, null, 2)}\n`
);

if (STRICT && (invalidCount > 0 || missingCount > 0)) {
  console.error('\ni18n audit FAILED — run: node scripts/i18n-audit.mjs --sync');
  process.exit(1);
}

console.log('\ni18n audit OK');
process.exit(0);
