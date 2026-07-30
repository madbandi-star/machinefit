import type { Pool } from 'pg';

let cached: boolean | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

/** True when migration 083 (`target_muscle_group`) has been applied. */
export async function supportsMachineCoverMuscleVariants(pool: Pool): Promise<boolean> {
  const now = Date.now();
  if (cached != null && now - cachedAt < CACHE_TTL_MS) return cached;
  try {
    const result = await pool.query<{ ok: number }>(
      `SELECT 1 AS ok
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'machine_cover_images'
         AND column_name = 'target_muscle_group'
       LIMIT 1`
    );
    cached = result.rows.length > 0;
  } catch {
    cached = false;
  }
  cachedAt = now;
  return cached;
}

/** Test helper / after migrate in same process. */
export function resetMachineCoverMuscleVariantCache(): void {
  cached = null;
  cachedAt = 0;
}
