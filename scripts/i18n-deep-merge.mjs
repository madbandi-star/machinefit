#!/usr/bin/env node
/** Deep-merge overlay JSON onto locale namespace files. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function deepMerge(base, overlay) {
  if (overlay === null || overlay === undefined) return base;
  if (Array.isArray(overlay)) return overlay.slice();
  if (typeof overlay !== 'object') return overlay;
  const out = { ...(typeof base === 'object' && base && !Array.isArray(base) ? base : {}) };
  for (const [k, v] of Object.entries(overlay)) {
    out[k] = deepMerge(out[k], v);
  }
  return out;
}

const [, , locale, ns, overlayRel] = process.argv;
if (!locale || !ns || !overlayRel) {
  console.error('Usage: node scripts/i18n-deep-merge.mjs <locale> <ns> <overlay.json>');
  process.exit(1);
}

const target = path.join(ROOT, 'frontend/src/i18n/locales', locale, `${ns}.json`);
const overlayPath = path.resolve(ROOT, overlayRel);
const base = JSON.parse(fs.readFileSync(target, 'utf8'));
const overlay = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
const merged = deepMerge(base, overlay);
fs.writeFileSync(target, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`Merged ${overlayRel} → ${locale}/${ns}.json`);
