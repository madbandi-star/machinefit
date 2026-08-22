/**
 * Apply migration 187 against DATABASE_URL.
 * Usage: node scripts/apply-187-45-leg-press.cjs
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Client } = require('pg');

const SQL_PATH = path.join(
  __dirname,
  '../database/migrations/187_rename_45_leg_press_degree.sql'
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
      SELECT t.name->>'ko' AS std,
             count(*)::int AS n,
             (array_agg(DISTINCT m.name->>'ko'))[1] AS sample,
             count(*) FILTER (WHERE m.name->>'ko' LIKE '%45도%')::int AS still_do
      FROM standard_machine_types t
      JOIN machines m ON m.standard_type_id = t.id
      WHERE t.code = 'STD_45_LEG_PRESS'
      GROUP BY t.name->>'ko'
    `);
    console.log(check.rows);
    if (check.rows[0]?.still_do > 0) {
      throw new Error('still 45도: ' + JSON.stringify(check.rows));
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
