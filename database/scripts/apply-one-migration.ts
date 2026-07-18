import './load-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createPoolConfig } from './db-config.js';

const filename = process.argv[2];
if (!filename) {
  console.error('Usage: tsx database/scripts/apply-one-migration.ts <filename.sql>');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new pg.Pool(createPoolConfig(connectionString));

try {
  const { rows } = await pool.query(
    'SELECT 1 FROM schema_migrations WHERE filename = $1',
    [filename]
  );
  if (rows.length > 0) {
    console.log(`skip  ${filename}`);
    process.exit(0);
  }

  const sql = fs.readFileSync(path.join(__dirname, '../migrations', filename), 'utf-8');
  console.log(`apply ${filename}`);
  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await pool.query('COMMIT');
    console.log(`${filename} applied.`);
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
} finally {
  await pool.end();
}
