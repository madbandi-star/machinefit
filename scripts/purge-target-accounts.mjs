/**
 * Ops: hard-remove specific demo/admin accounts and related rows.
 *
 * Usage:
 *   node scripts/purge-target-accounts.mjs           # dry-run
 *   node scripts/purge-target-accounts.mjs --execute
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXECUTE = process.argv.includes('--execute');

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('DATABASE_URL missing (env or backend/.env)');
  }
  const match = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error('DATABASE_URL missing in backend/.env');
  return match[1].trim().replace(/^["']|["']$/g, '');
}

const TARGET_EMAILS = [
  'admin@machinefit.com',
  'demo_test@gmail.com',
  'demo_test2@gmail.com',
  'demo1@gmail.com',
  'demo2@gmail.com',
  'demo3@gmail.com',
];
const TARGET_DISPLAY_NAMES = ['demo1', 'demo2', 'demo3', 'demo_test', 'demo_test2', 'Admin'];

async function tableExists(client, table) {
  const { rows } = await client.query(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [`public.${table}`]
  );
  return Boolean(rows[0]?.exists);
}

async function columnExists(client, table, column) {
  const { rows } = await client.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function del(client, sql, params, label, counts) {
  try {
    const r = await client.query(sql, params);
    const n = r.rowCount ?? 0;
    if (n > 0) counts[label] = (counts[label] ?? 0) + n;
    return n;
  } catch (err) {
    counts[`${label}:err`] = String(err.message ?? err).slice(0, 160);
    return 0;
  }
}

async function deleteByColumn(client, table, column, id, counts) {
  if (!(await tableExists(client, table))) return;
  if (!(await columnExists(client, table, column))) return;
  await del(client, `DELETE FROM ${table} WHERE ${column} = $1`, [id], `${table}.${column}`, counts);
}

async function nullByColumn(client, table, column, id, counts) {
  if (!(await tableExists(client, table))) return;
  if (!(await columnExists(client, table, column))) return;
  await del(
    client,
    `UPDATE ${table} SET ${column} = NULL WHERE ${column} = $1`,
    [id],
    `${table}.${column}:null`,
    counts
  );
}

async function purgeUser(client, user) {
  const id = user.id;
  const counts = {};

  // Break known RESTRICT / NO ACTION FKs first
  await nullByColumn(client, 'gyms', 'owner_id', id, counts);
  await nullByColumn(client, 'machine_requests', 'assignee_user_id', id, counts);
  await deleteByColumn(client, 'reports', 'reporter_id', id, counts);
  await deleteByColumn(client, 'comments', 'user_id', id, counts);
  await deleteByColumn(client, 'likes', 'user_id', id, counts);
  await deleteByColumn(client, 'posts', 'user_id', id, counts);
  await deleteByColumn(client, 'machine_requests', 'user_id', id, counts);

  const simpleDeletes = [
    ['refresh_tokens', 'user_id'],
    ['auth_providers', 'user_id'],
    ['user_locations', 'user_id'],
    ['workout_logs', 'user_id'],
    ['workout_cards', 'user_id'],
    ['favorites', 'user_id'],
    ['recent_history', 'user_id'],
    ['user_machine_preferences', 'user_id'],
    ['recommendation_feedback', 'user_id'],
    ['user_achievements', 'user_id'],
    ['user_motivation_tracks', 'user_id'],
    ['user_lifted_badges', 'user_id'],
    ['notifications', 'user_id'],
    ['user_consents', 'user_id'],
    ['payment_history', 'user_id'],
    ['subscriptions', 'user_id'],
    ['user_gyms', 'user_id'],
    ['gym_members', 'owner_user_id'],
    ['gym_members', 'linked_user_id'],
    ['gym_member_profile_requests', 'owner_user_id'],
    ['gym_member_profile_requests', 'target_user_id'],
    ['photo_posts', 'user_id'],
    ['photo_post_comments', 'user_id'],
    ['friend_privacy_settings', 'user_id'],
    ['friend_activity_logs', 'actor_id'],
    ['friend_referral_codes', 'user_id'],
    ['friend_referral_events', 'referrer_id'],
    ['friend_referral_events', 'referred_id'],
    ['machine_recommendations', 'user_id'],
    ['auth_login_events', 'user_id'],
    ['auth_provider_withdrawals', 'user_id'],
    ['online_pt_profiles', 'user_id'],
  ];

  for (const [table, col] of simpleDeletes) {
    await deleteByColumn(client, table, col, id, counts);
  }

  if (await tableExists(client, 'data_retention_records')) {
    await del(
      client,
      `DELETE FROM data_retention_records WHERE subject_id::text = $1`,
      [id],
      'data_retention_records',
      counts
    );
  }

  if (await tableExists(client, 'friendships')) {
    await del(
      client,
      `DELETE FROM friendships WHERE user_low_id = $1 OR user_high_id = $1`,
      [id],
      'friendships',
      counts
    );
  }
  if (await tableExists(client, 'friend_requests')) {
    await del(
      client,
      `DELETE FROM friend_requests WHERE from_user_id = $1 OR to_user_id = $1`,
      [id],
      'friend_requests',
      counts
    );
  }
  if (await tableExists(client, 'blocked_users')) {
    await del(
      client,
      `DELETE FROM blocked_users WHERE blocker_id = $1 OR blocked_id = $1`,
      [id],
      'blocked_users',
      counts
    );
  }
  if (await tableExists(client, 'push_delivery_logs')) {
    await del(
      client,
      `DELETE FROM push_delivery_logs WHERE recipient_id = $1 OR sender_id = $1`,
      [id],
      'push_delivery_logs',
      counts
    );
  }
  if (await tableExists(client, 'friend_reports')) {
    await del(
      client,
      `DELETE FROM friend_reports WHERE reporter_id = $1 OR reported_user_id = $1`,
      [id],
      'friend_reports',
      counts
    );
  }

  await nullByColumn(client, 'trial_identity_ledger', 'user_id', id, counts);

  // Sweep any remaining FKs to users
  const { rows: fks } = await client.query(
    `SELECT
       tc.table_name,
       kcu.column_name,
       rc.delete_rule
     FROM information_schema.table_constraints AS tc
     JOIN information_schema.key_column_usage AS kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage AS ccu
       ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
     JOIN information_schema.referential_constraints AS rc
       ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND ccu.table_name = 'users'
       AND tc.table_schema = 'public'
       AND tc.table_name <> 'users'`
  );

  for (const fk of fks) {
    const table = fk.table_name;
    const col = fk.column_name;
    if (fk.delete_rule === 'SET NULL') {
      await nullByColumn(client, table, col, id, counts);
    } else {
      await deleteByColumn(client, table, col, id, counts);
    }
  }

  const userDel = await del(client, `DELETE FROM users WHERE id = $1`, [id], 'users', counts);
  if (userDel === 0 && !counts['users:err']) {
    counts.users_missing = 1;
  }
  return counts;
}

const databaseUrl = loadDatabaseUrl();
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const client = await pool.connect();
try {
  const { rows: targets } = await client.query(
    `SELECT u.id::text AS id,
            u.email,
            u.display_name,
            u.is_active,
            u.account_status,
            r.code AS role_code
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE lower(u.email) = ANY($1::text[])
        OR lower(u.display_name) = ANY($2::text[])
     ORDER BY u.email`,
    [TARGET_EMAILS.map((e) => e.toLowerCase()), TARGET_DISPLAY_NAMES.map((d) => d.toLowerCase())]
  );

  console.log(
    JSON.stringify({ mode: EXECUTE ? 'execute' : 'dry-run', matched: targets.length, targets }, null, 2)
  );

  if (targets.length === 0) process.exit(0);
  if (!EXECUTE) {
    console.log('Dry-run only. Re-run with --execute to delete.');
    process.exit(0);
  }

  const summary = [];
  for (const user of targets) {
    await client.query('BEGIN');
    try {
      const counts = await purgeUser(client, user);
      if (counts['users:err']) {
        throw new Error(counts['users:err']);
      }
      await client.query('COMMIT');
      summary.push({ id: user.id, email: user.email, display_name: user.display_name, counts });
      console.log(`Purged ${user.email} / ${user.display_name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`FAILED ${user.email}:`, err.message ?? err);
      throw err;
    }
  }

  const { rows: leftover } = await client.query(
    `SELECT id::text AS id, email, display_name
     FROM users
     WHERE lower(email) = ANY($1::text[])
        OR lower(display_name) = ANY($2::text[])`,
    [TARGET_EMAILS.map((e) => e.toLowerCase()), TARGET_DISPLAY_NAMES.map((d) => d.toLowerCase())]
  );

  console.log(JSON.stringify({ leftover, summary }, null, 2));
} finally {
  client.release();
  await pool.end();
}
