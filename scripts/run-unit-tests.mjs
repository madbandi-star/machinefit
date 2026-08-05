#!/usr/bin/env node
/**
 * Run Node assert-based unit tests (no DB required).
 * Discover *.test.ts under shared/ and backend/, execute with tsx.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

const files = [
  ...walk(path.join(root, 'shared')),
  ...walk(path.join(root, 'backend')),
].sort();

if (files.length === 0) {
  console.error('No *.test.ts files found');
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const rel = path.relative(root, file);
  console.log(`\n--- ${rel} ---`);
  const result = spawnSync('npx', ['tsx', file], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    failed += 1;
    console.error(`FAILED: ${rel}`);
  }
}

console.log(`\nUnit tests: ${files.length - failed}/${files.length} passed`);
process.exit(failed ? 1 : 0);
