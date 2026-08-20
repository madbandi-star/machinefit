import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../catalog/pro-tips');
const hr = /(^|\n)\s*-{3,}\s*(?=\r?\n|$)/g;

let files = 0;
let hits = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.csv')) continue;
  const p = path.join(dir, name);
  const raw = fs.readFileSync(p, 'utf8');
  const matches = raw.match(hr);
  const next = raw.replace(hr, '$1');
  if (next !== raw) {
    fs.writeFileSync(p, next, 'utf8');
    files += 1;
    hits += matches?.length ?? 0;
  }
}
console.log(`cleaned ${files} csv files, ${hits} hr lines`);
