#!/usr/bin/env node
/**
 * Fast smoke for 프로그램테스트 agent — reads .cursor/handoff/latest.json
 * Prefer this over waiting for GitHub Pages.
 *
 * Usage: npm run test:smoke:changed
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const handoffPath = path.join(root, '.cursor/handoff/latest.json');

if (!existsSync(handoffPath)) {
  console.error('❌ Missing .cursor/handoff/latest.json');
  process.exit(1);
}

const handoff = JSON.parse(readFileSync(handoffPath, 'utf8'));
console.log(`\n📋 Handoff: ${handoff.title}`);
console.log(`   ${handoff.summary ?? ''}\n`);

const results = [];

function pass(id, detail = '') {
  results.push({ id, ok: true, detail });
  console.log(`✅ ${id}${detail ? ` — ${detail}` : ''}`);
}

function fail(id, detail = '') {
  results.push({ id, ok: false, detail });
  console.log(`❌ ${id}${detail ? ` — ${detail}` : ''}`);
}

function runNpm(command) {
  const r = spawnSync(command, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    env: process.env,
  });
  return r;
}

const checks = Array.isArray(handoff.fastChecks) ? handoff.fastChecks : [];

for (const check of checks) {
  const id = check.id ?? check.type;
  try {
    if (check.type === 'file_absent') {
      const file = path.join(root, check.path);
      if (!existsSync(file)) {
        fail(id, `file missing: ${check.path}`);
        continue;
      }
      const text = readFileSync(file, 'utf8');
      if (text.includes(check.pattern)) {
        fail(id, `pattern still present: ${check.pattern}`);
      } else {
        pass(id, `absent in ${check.path}`);
      }
    } else if (check.type === 'file_contains') {
      const file = path.join(root, check.path);
      const text = readFileSync(file, 'utf8');
      if (text.includes(check.pattern)) {
        pass(id, `found in ${check.path}`);
      } else {
        fail(id, `pattern missing: ${check.pattern}`);
      }
    } else if (check.type === 'npm') {
      const r = runNpm(check.command);
      if (r.status === 0) pass(id, check.command);
      else fail(id, (r.stderr || r.stdout || '').slice(-400));
    } else if (check.type === 'note') {
      pass(id, check.detail ?? 'note');
    } else {
      fail(id, `unknown check type: ${check.type}`);
    }
  } catch (e) {
    fail(id, e.message);
  }
}

if (checks.length === 0) {
  console.log('⚠️ No fastChecks in handoff — running default typecheck');
  const r = runNpm('npm run typecheck');
  if (r.status === 0) pass('default-typecheck');
  else fail('default-typecheck', (r.stderr || r.stdout || '').slice(-400));
}

const failed = results.filter((x) => !x.ok);
console.log(`\n--- smoke:changed — ${results.length - failed.length}/${results.length} passed ---`);
if (failed.length) {
  process.exit(1);
}
