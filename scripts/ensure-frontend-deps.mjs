/**
 * Frontend is intentionally outside npm workspaces so Render `npm ci`
 * stays small (shared+backend only). Locally / on GitHub Pages we still
 * want frontend deps; skip that install on Render.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = path.join(root, 'frontend');

if (
  process.env.RENDER ||
  process.env.SKIP_FRONTEND_INSTALL === '1' ||
  process.env.NODE_ENV === 'production'
) {
  console.log('skip frontend install (production/Render)');
  process.exit(0);
}

if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
  process.exit(0);
}

const result = spawnSync('npm', ['install', '--no-fund', '--no-audit'], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
