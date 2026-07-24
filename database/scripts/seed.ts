import './load-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createPoolConfig } from './db-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.join(__dirname, '../seeds');

const { Pool } = pg;

const SEED_ORDER = [
  'roles.sql',
  'languages.sql',
  'countries.sql',
  'brands.sql',
  'machines.sql',
  'machine_settings.sql',
  'catalog_brands.sql',
  'catalog_machines.sql',
  'catalog_machine_images.sql',
  'catalog_machine_settings.sql',
  'future_features.sql',
  'gyms.sql',
  'kr_gym_directory.sql',
];

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool(createPoolConfig(connectionString));

  for (const file of SEED_ORDER) {
    const filePath = path.join(seedsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`skip  ${file} (not found)`);
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`seed  ${file}`);
    await pool.query(sql);
  }

  await pool.end();
  console.log('Seeding complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
