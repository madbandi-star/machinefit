import type {
  OwnerApplication,
  OwnerApplicationInput,
  OwnerApplicationStatus,
  OwnerPaymentStatus,
  ReviewOwnerApplicationInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

interface OwnerApplicationRow {
  id: string;
  user_id: string;
  business_name: string;
  applicant_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  description: string | null;
  evidence_url: string | null;
  gym_id: string | null;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string | null;
  user_display_name?: string | null;
}

function mapRow(row: OwnerApplicationRow): OwnerApplication {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    applicantName: row.applicant_name ?? undefined,
    businessEmail: row.business_email ?? undefined,
    businessPhone: row.business_phone ?? undefined,
    description: row.description ?? undefined,
    evidenceUrl: row.evidence_url ?? undefined,
    gymId: row.gym_id ?? undefined,
    status: row.status as OwnerApplicationStatus,
    paymentStatus: (row.payment_status as OwnerPaymentStatus) ?? 'waived',
    paymentReference: row.payment_reference ?? undefined,
    adminNote: row.admin_note ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userEmail: row.user_email ?? undefined,
    userDisplayName: row.user_display_name ?? undefined,
  };
}

export const ownerApplicationRepository = {
  async create(userId: string, input: OwnerApplicationInput): Promise<OwnerApplication> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<OwnerApplicationRow>(
      `INSERT INTO owner_applications (
         user_id, business_name, applicant_name, business_email, business_phone,
         description, evidence_url, gym_id, status, payment_status, payment_reference
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10)
       RETURNING *`,
      [
        userId,
        input.businessName,
        input.applicantName,
        input.businessEmail,
        input.businessPhone,
        input.description ?? null,
        input.evidenceUrl || null,
        input.gymId ?? null,
        input.paymentStatus ?? 'waived',
        input.paymentReference ?? null,
      ]
    );
    return mapRow(result.rows[0]);
  },

  async findPendingByUser(userId: string): Promise<OwnerApplication | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<OwnerApplicationRow>(
      `SELECT * FROM owner_applications
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async list(status?: OwnerApplicationStatus): Promise<OwnerApplication[]> {
    const pool = getPool();
    if (!pool) return [];

    const params: unknown[] = [];
    let filter = '';
    if (status) {
      params.push(status);
      filter = ` WHERE oa.status = $1`;
    }

    const result = await pool.query<OwnerApplicationRow>(
      `SELECT oa.*, u.email AS user_email, u.display_name AS user_display_name
       FROM owner_applications oa
       JOIN users u ON u.id = oa.user_id
       ${filter}
       ORDER BY
         CASE oa.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         oa.created_at DESC`,
      params
    );
    return result.rows.map(mapRow);
  },

  async findById(id: string): Promise<OwnerApplication | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<OwnerApplicationRow>(
      `SELECT oa.*, u.email AS user_email, u.display_name AS user_display_name
       FROM owner_applications oa
       JOIN users u ON u.id = oa.user_id
       WHERE oa.id = $1`,
      [id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async review(
    id: string,
    reviewerId: string,
    input: ReviewOwnerApplicationInput
  ): Promise<OwnerApplication | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<OwnerApplicationRow>(
      `UPDATE owner_applications
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

  async grantOwnerRole(userId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    const roleResult = await pool.query<{ id: string }>(
      "SELECT id FROM roles WHERE code = 'owner'"
    );
    if (!roleResult.rows[0]) return;
    await pool.query('UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2', [
      roleResult.rows[0].id,
      userId,
    ]);
  },

  async ensureGymPermission(
    gymId: string,
    userId: string,
    permissionRole: 'owner' | 'operator' = 'owner'
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO gym_owner_permissions (gym_id, user_id, permission_role, status, granted_by)
       VALUES ($1, $2, $3, 'active', $2)
       ON CONFLICT (gym_id, user_id)
       DO UPDATE SET permission_role = EXCLUDED.permission_role,
                     status = 'active',
                     updated_at = NOW()`,
      [gymId, userId, permissionRole]
    );
  },
};
