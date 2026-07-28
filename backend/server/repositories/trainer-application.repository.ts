import type {
  ReviewTrainerApplicationInput,
  TrainerApplication,
  TrainerApplicationInput,
  TrainerApplicationStatus,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

interface TrainerApplicationRow {
  id: string;
  user_id: string;
  applicant_name: string;
  phone: string;
  email: string;
  specialties: string | null;
  career: string | null;
  certifications: string | null;
  message: string | null;
  status: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string | null;
  user_display_name?: string | null;
}

function mapRow(row: TrainerApplicationRow): TrainerApplication {
  return {
    id: row.id,
    userId: row.user_id,
    applicantName: row.applicant_name,
    phone: row.phone,
    email: row.email,
    specialties: row.specialties ?? undefined,
    career: row.career ?? undefined,
    certifications: row.certifications ?? undefined,
    message: row.message ?? undefined,
    status: row.status as TrainerApplicationStatus,
    adminNote: row.admin_note ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userEmail: row.user_email ?? undefined,
    userDisplayName: row.user_display_name ?? undefined,
  };
}

export const trainerApplicationRepository = {
  async create(userId: string, input: TrainerApplicationInput): Promise<TrainerApplication> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<TrainerApplicationRow>(
      `INSERT INTO trainer_applications (
         user_id, applicant_name, phone, email,
         specialties, career, certifications, message, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
       RETURNING *`,
      [
        userId,
        input.applicantName,
        input.phone,
        input.email,
        input.specialties?.trim() || null,
        input.career?.trim() || null,
        input.certifications?.trim() || null,
        input.message?.trim() || null,
      ]
    );
    return mapRow(result.rows[0]);
  },

  async findPendingByUser(userId: string): Promise<TrainerApplication | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<TrainerApplicationRow>(
      `SELECT * FROM trainer_applications
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async list(status?: TrainerApplicationStatus): Promise<TrainerApplication[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [];
    let filter = '';
    if (status) {
      params.push(status);
      filter = ` WHERE ta.status = $1`;
    }

    const result = await pool.query<TrainerApplicationRow>(
      `SELECT ta.*, u.email AS user_email, u.display_name AS user_display_name
       FROM trainer_applications ta
       JOIN users u ON u.id = ta.user_id
       ${filter}
       ORDER BY
         CASE ta.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         ta.created_at DESC`,
      params
    );
    return result.rows.map(mapRow);
  },

  async findById(id: string): Promise<TrainerApplication | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<TrainerApplicationRow>(
      `SELECT ta.*, u.email AS user_email, u.display_name AS user_display_name
       FROM trainer_applications ta
       JOIN users u ON u.id = ta.user_id
       WHERE ta.id = $1`,
      [id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async review(
    id: string,
    reviewerId: string,
    input: ReviewTrainerApplicationInput
  ): Promise<TrainerApplication | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<TrainerApplicationRow>(
      `UPDATE trainer_applications
       SET status = $2,
           admin_note = $3,
           reviewed_by = $4,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id, input.status, input.adminNote ?? null, reviewerId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  /** Promote to trainer only when current role is below trainer (never demote owner/admin). */
  async grantTrainerRole(userId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    const roleResult = await pool.query<{ id: string }>(
      "SELECT id FROM roles WHERE code = 'trainer'"
    );
    if (!roleResult.rows[0]) return;
    await pool.query(
      `UPDATE users u
       SET role_id = $1, updated_at = NOW()
       FROM roles r
       WHERE u.id = $2
         AND u.role_id = r.id
         AND r.code IN ('guest', 'member', 'premium_member', 'vip_member')`,
      [roleResult.rows[0].id, userId]
    );
  },
};
