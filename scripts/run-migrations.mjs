import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadDatabaseUrl() {
  const envPath = join(root, 'backend', '.env');
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      return trimmed.slice('DATABASE_URL='.length).trim();
    }
  }
  throw new Error('DATABASE_URL not found in backend/.env');
}

const MIGRATIONS = [
  '021_user_profile_extended.sql',
  '022_workout_log_sets_completed.sql',
  '023_recommendation_feedback_prefs.sql',
  '024_smith_all_muscle.sql',
  '025_recommendation_target_muscle.sql',
  '026_workout_log_target_muscle.sql',
];

const pool = new pg.Pool({ connectionString: loadDatabaseUrl() });

try {
  for (const file of MIGRATIONS) {
    const sql = readFileSync(join(root, 'database', 'migrations', file), 'utf8');
    console.log(`Running ${file}...`);
    await pool.query(sql);
    console.log(`  OK`);
  }
  console.log('All migrations completed.');
} finally {
  await pool.end();
}
