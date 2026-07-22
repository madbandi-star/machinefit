import pg from 'pg';

const BUCKET = process.env.MUSCLE_GROUP_IMAGE_BUCKET || 'muscle-group-images';
const MAX_BYTES = Number(process.env.MUSCLE_GROUP_IMAGE_MAX_BYTES || 10 * 1024 * 1024);

function createPool() {
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Avoid PgBouncer prepared-statement reuse issues on pooler connections.
    max: 1,
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = createPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      {
        text: `SELECT id, name, public, file_size_limit, allowed_mime_types
               FROM storage.buckets
               WHERE id = $1 OR name = $1
               LIMIT 1`,
        values: [BUCKET],
        name: undefined,
      }
    );

    if (existing.rows[0]) {
      console.log('Bucket already exists:', existing.rows[0]);
      const updated = await client.query({
        text: `UPDATE storage.buckets
               SET public = TRUE,
                   file_size_limit = $2,
                   allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp']::text[]
               WHERE id = $1
               RETURNING id, name, public, file_size_limit, allowed_mime_types`,
        values: [existing.rows[0].id, MAX_BYTES],
      });
      console.log('Bucket updated:', updated.rows[0]);
    } else {
      const created = await client.query({
        text: `INSERT INTO storage.buckets (
                 id, name, public, file_size_limit, allowed_mime_types
               ) VALUES (
                 $1, $1, TRUE, $2,
                 ARRAY['image/jpeg','image/jpg','image/png','image/webp']::text[]
               )
               RETURNING id, name, public, file_size_limit, allowed_mime_types`,
        values: [BUCKET, MAX_BYTES],
      });
      console.log('Bucket created:', created.rows[0]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  // Separate connection for policy DDL (pooler can be picky about param reuse).
  const policyPool = createPool();
  const policyClient = await policyPool.connect();
  try {
    const policyName = `Public read ${BUCKET}`;
    const escapedName = policyName.replace(/'/g, "''");
    const check = await policyClient.query(
      `SELECT 1 FROM pg_policies
       WHERE schemaname = 'storage'
         AND tablename = 'objects'
         AND policyname = '${escapedName}'
       LIMIT 1`
    );
    if (check.rowCount === 0) {
      await policyClient.query(
        `CREATE POLICY "${policyName.replace(/"/g, '')}"
           ON storage.objects
           FOR SELECT
           TO public
           USING (bucket_id = '${BUCKET.replace(/'/g, "''")}')`
      );
      console.log(`Public read policy created for ${BUCKET}`);
    } else {
      console.log(`Public read policy already exists for ${BUCKET}`);
    }

    const all = await policyClient.query(
      `SELECT id, name, public, file_size_limit, allowed_mime_types
       FROM storage.buckets
       ORDER BY name`
    );
    console.log('All buckets:');
    for (const row of all.rows) console.log('-', row);
  } finally {
    policyClient.release();
    await policyPool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
