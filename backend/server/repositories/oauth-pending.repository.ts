import { getPool } from '../config/database.js';

/** In-process fallback when DB table is unavailable (dev / pre-migrate). */
const memoryPending = new Map<string, { expiresAt: number; consumed: boolean }>();

function pruneMemory(now = Date.now()) {
  for (const [jti, row] of memoryPending) {
    if (row.expiresAt <= now || row.consumed) memoryPending.delete(jti);
  }
}

export const oauthPendingRepository = {
  async register(jti: string, expiresAt: Date): Promise<void> {
    const pool = getPool();
    if (!pool) {
      memoryPending.set(jti, { expiresAt: expiresAt.getTime(), consumed: false });
      return;
    }
    try {
      await pool.query(
        `INSERT INTO oauth_pending_jtis (jti, expires_at)
         VALUES ($1::uuid, $2)
         ON CONFLICT (jti) DO NOTHING`,
        [jti, expiresAt.toISOString()]
      );
    } catch {
      // Table may not exist yet — fall back to memory for this process.
      memoryPending.set(jti, { expiresAt: expiresAt.getTime(), consumed: false });
    }
  },

  /**
   * Atomically consume a pending jti. Returns false if missing, expired, or already used.
   */
  async consume(jti: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) {
      pruneMemory();
      const row = memoryPending.get(jti);
      if (!row || row.consumed || row.expiresAt <= Date.now()) return false;
      row.consumed = true;
      return true;
    }
    try {
      const result = await pool.query(
        `UPDATE oauth_pending_jtis
         SET consumed_at = NOW()
         WHERE jti = $1::uuid
           AND consumed_at IS NULL
           AND expires_at > NOW()
         RETURNING jti`,
        [jti]
      );
      if ((result.rowCount ?? 0) > 0) return true;

      // Pre-migration / missing row: do not allow silent success.
      const exists = await pool.query(
        `SELECT 1 FROM oauth_pending_jtis WHERE jti = $1::uuid LIMIT 1`,
        [jti]
      );
      if ((exists.rowCount ?? 0) === 0) {
        // Legacy pending JWT without jti ledger row — reject once table exists.
        return false;
      }
      return false;
    } catch {
      pruneMemory();
      const row = memoryPending.get(jti);
      if (!row || row.consumed || row.expiresAt <= Date.now()) return false;
      row.consumed = true;
      return true;
    }
  },
};
