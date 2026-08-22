/**
 * Apply migration 185 against DATABASE_URL (Free Weight-safe: only 3 STD codes).
 * Usage: node scripts/apply-185-sync-std.cjs
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Client } = require('pg');

const SQL_PATH = path.join(
  __dirname,
  '../database/migrations/185_sync_std_assist_pullover_cable.sql'
);

(async () => {
  const sql = fs.readFileSync(SQL_PATH, 'utf8');
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  await c.query('BEGIN');
  try {
    await c.query(sql);

    const check = await c.query(`
      SELECT t.code, t.name->>'ko' AS std_name, t.primary_muscle_group AS std_muscle,
             count(*)::int AS machines,
             array_agg(DISTINCT m.muscle_group) AS brand_muscles,
             (array_agg(DISTINCT m.name->>'ko'))[1] AS sample_name
      FROM standard_machine_types t
      JOIN machines m ON m.standard_type_id = t.id
      WHERE t.code IN (
        'STD_ASSISTED_PULLUP_DIP',
        'STD_MACHINE_PULLOVER',
        'STD_SEATED_CABLE'
      )
      GROUP BY t.code, t.name->>'ko', t.primary_muscle_group
      ORDER BY t.code
    `);
    console.log(check.rows);

    // Ensure no brand still on full_body for these
    const leftover = await c.query(`
      SELECT m.code, m.muscle_group, t.code AS std
      FROM machines m
      JOIN standard_machine_types t ON t.id = m.standard_type_id
      WHERE t.code IN (
        'STD_ASSISTED_PULLUP_DIP',
        'STD_MACHINE_PULLOVER',
        'STD_SEATED_CABLE'
      )
        AND m.muscle_group = 'full_body'
    `);
    if (leftover.rows.length) {
      throw new Error('Still full_body: ' + JSON.stringify(leftover.rows));
    }

    await c.query('COMMIT');
    console.log('OK');
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
