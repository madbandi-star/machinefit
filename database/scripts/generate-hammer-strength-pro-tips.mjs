#!/usr/bin/env node
/** @deprecated Prefer: node database/scripts/generate-oem-pro-tips.mjs --brand=HAMMER_STRENGTH */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, 'generate-oem-pro-tips.mjs');
const extra = process.argv.slice(2);
const res = spawnSync(process.execPath, [script, '--brand=HAMMER_STRENGTH', ...extra], {
  stdio: 'inherit',
});
process.exit(res.status ?? 1);
