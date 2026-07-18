import { getPool } from '../config/database.js';

export const feedbackRepository = {
  async upsert(
    userId: string,
    recommendationId: string,
    machineId: string,
    fitRating: 'good' | 'bad'
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO recommendation_feedback (user_id, recommendation_id, machine_id, fit_rating)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, recommendation_id)
       DO UPDATE SET fit_rating = EXCLUDED.fit_rating, created_at = NOW()`,
      [userId, recommendationId, machineId, fitRating]
    );
  },

  async findByUserRecommendation(
    userId: string,
    recommendationId: string
  ): Promise<'good' | 'bad' | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<{ fit_rating: 'good' | 'bad' }>(
      `SELECT fit_rating FROM recommendation_feedback
       WHERE user_id = $1 AND recommendation_id = $2`,
      [userId, recommendationId]
    );

    return result.rows[0]?.fit_rating ?? null;
  },
};
