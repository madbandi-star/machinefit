/**
 * Apply migration 186 against DATABASE_URL.
 * Usage: node scripts/apply-186-rename-assisted-pullup.cjs
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Client } = require('pg');

const SQL_PATH = path.join(
  __dirname,
  '../database/migrations/186_rename_assisted_pullup.sql'
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
      SELECT t.name->>'ko' AS std_name,
             t.name->>'en' AS std_en,
             count(*)::int AS machines,
             (array_agg(DISTINCT m.name->>'ko'))[1] AS sample_name,
             array_agg(DISTINCT m.muscle_group) AS muscles
      FROM standard_machine_types t
      JOIN machines m ON m.standard_type_id = t.id
      WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
      GROUP BY t.name->>'ko', t.name->>'en'
    `);
    console.log(check.rows);
    if (check.rows[0]?.std_name !== '어시스트 풀업') {
      throw new Error('std name mismatch: ' + JSON.stringify(check.rows));
    }
    const bad = await c.query(`
      SELECT m.code, m.name->>'ko' AS n
      FROM machines m
      JOIN standard_machine_types t ON t.id = m.standard_type_id
      WHERE t.code = 'STD_ASSISTED_PULLUP_DIP'
        AND (m.name->>'ko') LIKE '%/ 딥%'
    `);
    if (bad.rows.length) {
      throw new Error('still has / 딥: ' + JSON.stringify(bad.rows));
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
