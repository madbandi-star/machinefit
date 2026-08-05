/**
 * Filesystem integrity check for SQL migrations (no DATABASE_URL required).
 * CI uses this as the always-on migrate verify gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'migrations');

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.error('No migration SQL files found');
  process.exit(1);
}

const numbers = new Map<string, string[]>();
const badNames: string[] = [];

for (const file of files) {
  const m = file.match(/^(\d{3})_(.+)\.sql$/);
  if (!m) {
    badNames.push(file);
    continue;
  }
  const num = m[1]!;
  const list = numbers.get(num) ?? [];
  list.push(file);
  numbers.set(num, list);
}

if (badNames.length) {
  console.error('Invalid migration filenames (expected NNN_name.sql):', badNames.join(', '));
  process.exit(2);
}

const dupes = [...numbers.entries()].filter(([, list]) => list.length > 1);
if (dupes.length) {
  console.error(
    'Duplicate migration numbers:',
    dupes.map(([n, list]) => `${n}: ${list.join(' | ')}`).join('; ')
  );
  process.exit(2);
}

const sortedNums = [...numbers.keys()].sort();
const latest = sortedNums[sortedNums.length - 1];
console.log(`migration files: ${files.length}`);
console.log(`  range: ${sortedNums[0]} … ${latest}`);
console.log(`  latest: ${numbers.get(latest)![0]}`);
console.log('Migration file integrity OK.');
