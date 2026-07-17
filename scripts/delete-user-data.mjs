import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', 'backend', '.env');
const env = fs.readFileSync(envPath, 'utf8');
const match = env.match(/^DATABASE_URL=(.*)$/m);

if (!match) {
  throw new Error('DATABASE_URL missing in backend/.env');
}

const email = process.argv[2];
if (!email) {
  throw new Error('Usage: node scripts/delete-user-data.mjs <email>');
}

const pool = new pg.Pool({
  connectionString: match[1].trim(),
  ssl: { rejectUnauthorized: false },
});

const client = await pool.connect();

try {
  const userRes = await client.query(
    'SELECT id, email, display_name FROM users WHERE email = $1',
    [email]
  );

  if (!userRes.rows[0]) {
    console.log(`User not found: ${email}`);
    process.exit(0);
  }

  const userId = userRes.rows[0].id;
  console.log(`Deleting data for ${userRes.rows[0].email} (${userRes.rows[0].display_name})`);

  await client.query('BEGIN');

  const tables = [
    ['workout_logs', 'DELETE FROM workout_logs WHERE user_id = $1'],
    ['recent_history', 'DELETE FROM recent_history WHERE user_id = $1'],
    ['favorites', 'DELETE FROM favorites WHERE user_id = $1'],
    ['machine_recommendations', 'DELETE FROM machine_recommendations WHERE user_id = $1'],
  ];

  const counts = {};
  for (const [label, sql] of tables) {
    const res = await client.query(sql, [userId]);
    counts[label] = res.rowCount ?? 0;
  }

  await client.query('COMMIT');
  console.log('Deleted rows:', counts);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
