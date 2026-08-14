/**
 * Fail CI/local if known-leaked OAuth keys (or similar hardcodes) reappear in source.
 * Does not print match context beyond file:line to avoid amplifying secrets in logs.
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Patterns that must never re-enter the repo (previously committed). */
const FORBIDDEN = [
  'ec1d5c905cdad5a5e273e3d78423ca35',
  '600013402579-oc4q1psgohjpk3ab3enc10ohb110clmg',
];

const ALLOWLIST = new Set([
  'docs/SECRET_ROTATION.md',
  'scripts/check-no-hardcoded-secrets.mjs',
]);

function gitGrep(pattern) {
  try {
    const out = execSync(
      `git grep -n -F -- '${pattern.replace(/'/g, `'\\''`)}' -- . ':(exclude)node_modules' ':(exclude)*.lock'`,
      { cwd: root, encoding: 'utf8' }
    );
    return out.trim().split('\n').filter(Boolean);
  } catch (err) {
    if (err && err.status === 1) return [];
    throw err;
  }
}

let failed = false;
for (const pattern of FORBIDDEN) {
  const hits = gitGrep(pattern).filter((line) => {
    const file = line.split(':', 1)[0];
    return !ALLOWLIST.has(file);
  });
  if (hits.length) {
    failed = true;
    console.error(`[secrets] forbidden pattern still present (${hits.length} hit(s)):`);
    for (const h of hits.slice(0, 20)) console.error(`  ${h.split(':').slice(0, 2).join(':')}`);
  }
}

if (failed) {
  console.error('[secrets] Remove hardcoded keys; serve OAuth config from Render via /auth/oauth/client-config.');
  process.exit(1);
}

console.log('[secrets] OK — no known-leaked OAuth hardcodes in tracked files');
